#!/usr/bin/env python3
"""Kits: records that are a box of microphones rather than a microphone.

105 of the 1,761 source records are sets — a drum pack, a matched stereo pair, a
"5-Mic Set". The scrape gives them a price, a photo and a list of what is in the
box, but no capsule, no pattern and no connector, because a kit has none of its
own. Every one of them therefore arrived classified "unknown", which is both the
whole of that bucket and a lie: an AKG C 414 XL II/ST is two C 414 XL IIs, and
the corpus already holds the C 414 XL II.

This pass resolves `set.included_microphones[].url` back to the records it names
and lets the kit inherit from them, under one rule:

    a kit inherits a fact only when every microphone in it agrees on that fact.

So a two-of-the-same-mic kit inherits essentially the whole specification, while
a mixed drum kit inherits only what its mics have in common — an XLR output,
say — and stays silent about diaphragm size. Traits and vocabulary (patterns,
tags, tube, multipattern) are unioned instead of intersected, because those ask
"is any of this in the box?", which is how the filters read them.

The transducer type is the one field that always resolves: unanimous among the
members, or "mixed" when they disagree. Nothing is guessed and nothing is
averaged; `kit.inherited` lists exactly which fields were filled in, and
`kit.members` carries the records they came from so the page can show its work.
"""

import json
import re
from collections import Counter

# recordinghacks permalinks: /microphones/<brand-slug>/<model-slug>
MIC_URL = re.compile(r"/microphones/([^/]+)/([^/?#]+)")

# Facts that answer "is any of this in the box?" — unioned across the members
# rather than required unanimous, because that is the question the chips, the
# pattern buttons and the tag view are asking of a kit.
UNION_TRAITS = ["is_tube", "is_multipattern"]

# specifications.raw_tables is the scraped HTML of one product page; a kit's own
# is empty and the members' are theirs, so it is never inherited.
NEVER_INHERIT = {"raw_tables"}


def _ref(url):
    m = MIC_URL.search(url or "")
    return (m.group(1), m.group(2)) if m else None


def _meaningful(v):
    """Whether a value says anything — "n/a" and all-null blocks do not."""
    if v is None or v is False:
        return False
    if isinstance(v, str):
        return v.strip().lower() not in ("", "n/a")
    if isinstance(v, dict):
        return any(_meaningful(x) for x in v.values())
    if isinstance(v, (list, tuple)):
        return any(_meaningful(x) for x in v)
    return True


def _canon(v):
    return json.dumps(v, sort_keys=True, ensure_ascii=False)


def _unanimous(values):
    """The one value every member gave, or None if they disagree or gave none."""
    if not values:
        return None
    first = _canon(values[0])
    if any(_canon(v) != first for v in values[1:]):
        return None
    return values[0] if _meaningful(values[0]) else None


def _union(lists):
    """Every distinct entry across the members, in the order first seen."""
    out, seen = [], set()
    for lst in lists:
        for item in lst or []:
            key = _canon(item)
            if key not in seen:
                seen.add(key)
                out.append(item)
    return out


def _quantity(entry):
    q = entry.get("quantity_in_set")
    return q if isinstance(q, int) and q > 0 else 1


def _member_row(entry, part, qty):
    """What the page needs to show one line of the kit's contents."""
    cls = part["classification"]
    photo = part["media"].get("primary_photo") or {}
    return {
        "brand": part["source"]["brand_slug"],
        "slug": part["source"]["model_slug"],
        "name": part["identity"].get("full_name") or entry.get("name"),
        "model": part["identity"].get("model"),
        "subtitle": cls.get("subtitle") or entry.get("subtitle"),
        "quantity": qty,
        "type": cls.get("transducer_type") or "unknown",
        "form": cls.get("form_factor"),
        "patterns": list(cls.get("pattern_icons") or []),
        "msrp": part["pricing"].get("msrp_amount"),
        "thumb": (photo.get("thumb_url")
                  or ((entry.get("image") or {}).get("thumb_url"))),
        "url": part["source"].get("permalink") or entry.get("url"),
        "mounts": {
            "hard": entry.get("includes_hard_mounts"),
            "shock": entry.get("includes_shockmounts"),
            "windscreen": entry.get("includes_foam_windscreens"),
        },
    }


def _inherit(rec, members):
    """Fill a kit record in from the microphones it contains."""
    cls = rec["classification"]
    parts = [p for _, p in members]
    inherited = []

    # ---- transducer type: unanimous, or "mixed" ----------------------------
    weight = Counter()
    for entry, part in members:
        weight[part["classification"].get("transducer_type") or "unknown"] += _quantity(entry)
    types = [t for t, _ in sorted(weight.items(), key=lambda kv: (-kv[1], kv[0]))]
    cls["transducer_type"] = types[0] if len(types) == 1 else "mixed"
    cls["transducer_types"] = types
    inherited.append("classification.transducer_type")

    # ---- vocabulary and traits: union --------------------------------------
    icons = _union([p["classification"].get("pattern_icons") for p in parts])
    if icons:
        cls["pattern_icons"] = icons
        inherited.append("classification.pattern_icons")
    tags = _union([p["classification"].get("tags") for p in parts])
    if tags:
        cls["tags"] = tags
        inherited.append("classification.tags")
    for flag in UNION_TRAITS:
        if any(p["classification"].get(flag) for p in parts):
            cls[flag] = True
            inherited.append("classification." + flag)

    # ---- form factor: only if they agree -----------------------------------
    form = _unanimous([p["classification"].get("form_factor") for p in parts])
    if form:
        cls["form_factor"] = form
        inherited.append("classification.form_factor")

    # ---- specifications: only the blocks every member agrees on ------------
    spec = rec.setdefault("specifications", {})
    keys = []
    for p in parts:
        for k in p.get("specifications") or {}:
            if k not in NEVER_INHERIT and k not in keys:
                keys.append(k)
    for k in keys:
        agreed = _unanimous([(p.get("specifications") or {}).get(k) for p in parts])
        if agreed is not None:
            spec[k] = agreed
            inherited.append("specifications." + k)

    # ---- the kit block: what it is made of, and what that cost --------------
    rows = [_member_row(entry, part, _quantity(entry)) for entry, part in members]
    prices = [r["msrp"] for r in rows]
    rec["kit"] = {
        "mic_count": sum(r["quantity"] for r in rows),
        "model_count": len(rows),
        "types": types,
        "members": rows,
        # What the same microphones cost bought separately — only when every one
        # of them has a price, otherwise the comparison would be a partial sum.
        "parts_msrp": (round(sum(r["msrp"] * r["quantity"] for r in rows), 2)
                       if all(p is not None for p in prices) and prices else None),
        "inherited": inherited,
    }
    cls["is_kit"] = True
    return rec["kit"]


def apply(mics, warn):
    """Resolve every set record against the corpus and let it inherit. In place."""
    by_ref = {(m["source"]["brand_slug"], m["source"]["model_slug"]): m for m in mics}
    kits = 0
    unresolved = 0
    mixed = 0

    for rec in mics:
        if rec["classification"].get("product_type") != "set":
            continue
        entries = (rec.get("set") or {}).get("included_microphones") or []
        members = []
        for entry in entries:
            ref = _ref(entry.get("url"))
            part = by_ref.get(ref) if ref else None
            if part is None:
                unresolved += 1
                warn("kit %r lists %r, which is not a record in the corpus"
                     % (rec["identity"].get("full_name"), entry.get("url")))
                continue
            if part is rec:                       # a set citing itself has no parts
                continue
            members.append((entry, part))
        if not members:
            warn("kit %r lists no microphones this corpus holds — nothing to inherit"
                 % rec["identity"].get("full_name"))
            continue
        kits += 1
        if len(_inherit(rec, members)["types"]) > 1:
            mixed += 1

    return {"kits": kits, "mixed": mixed, "unresolved": unresolved}
