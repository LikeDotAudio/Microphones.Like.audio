#!/usr/bin/env python3
"""Split Research/microphones.json into a light index + per-brand detail files.

Outputs (relative to this script):
    data/config.json         the UI's vocabularies (facets, columns), counted against the corpus
    data/index.json          brands + a compact row for every model (fast boot, global search)
    data/brands/<slug>.json  full records for one brand, loaded on demand
    data/tags.json           every site tag with the mics carrying it, loaded on demand

The page ships no vocabulary of its own — every chip, option and column comes
from config.json, which is built from docs/vocabulary.py.

Run:  python3 docs/build_data.py
"""

import json
import os
import re
import sys
from collections import Counter, defaultdict

import vocabulary as V

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SRC = os.path.join(ROOT, "Research", "microphones.json")
OUT = os.path.join(HERE, "data")


def safe_slug(value):
    """Filesystem/URL-safe filename for a brand slug."""
    return re.sub(r"[^A-Za-z0-9._-]", "_", value)


def patterns_of(mic):
    """Every polar pattern a mic offers.

    classification.pattern_icons collapses switchable mics down to a single
    "9 polar patterns" icon, so union it with the per-pattern spec rows — that
    is what makes a C 414 answer to both Cardioid and Omnidirectional.
    """
    found = []
    for name in mic["classification"].get("pattern_icons") or []:
        if name not in found:
            found.append(name)
    for row in mic["specifications"].get("pickup_patterns") or []:
        name = row.get("pattern_base") or row.get("pattern")
        if name and name != "None" and name not in found:
            found.append(name)
    return found


def model_row(mic):
    """The compact record the index carries for every microphone."""
    ident = mic["identity"]
    cls = mic["classification"]
    price = mic["pricing"]
    photo = mic["media"].get("primary_photo") or {}
    return {
        "slug": mic["source"]["model_slug"],
        "model": ident.get("model"),
        "subtitle": cls.get("subtitle"),
        "type": cls.get("transducer_type"),
        "form": cls.get("form_factor"),
        "tube": bool(cls.get("is_tube")),
        "multi": bool(cls.get("is_multipattern")),
        "stereo": bool(cls.get("is_stereo")),
        "set": cls.get("product_type") == "set",
        "avail": price.get("availability"),
        "msrp": price.get("msrp_amount"),
        "year": mic["content"].get("release_year"),
        "patterns": patterns_of(mic),
        "thumb": photo.get("thumb_url"),
    }


def build_config(mics, warn):
    """The UI vocabulary, counted against the corpus it will be filtering.

    Counting here is what keeps the page honest: a facet the data can't satisfy
    ships with count 0 and the browser drops it, and any pattern name in the
    corpus that no button claims is reported rather than silently unreachable.
    """
    types = Counter(m["classification"].get("transducer_type") or "unknown" for m in mics)
    forms = Counter(m["classification"].get("form_factor") for m in mics if m["classification"].get("form_factor"))
    avail = Counter(m["pricing"].get("availability") for m in mics)
    traits = Counter()
    for mic in mics:
        cls = mic["classification"]
        if cls.get("is_tube"):
            traits["tube"] += 1
        if cls.get("is_multipattern"):
            traits["multi"] += 1
        if cls.get("is_stereo"):
            traits["stereo"] += 1

    pattern_names = Counter()
    for mic in mics:
        for name in patterns_of(mic):
            pattern_names[name] += 1

    patterns = []
    claimed = set()
    for spec in V.PATTERNS:
        entry = dict(spec)
        claimed.update(spec["match"])
        if spec.get("multi"):
            entry["count"] = sum(1 for m in mics if m["classification"].get("is_multipattern"))
        else:
            entry["count"] = sum(1 for m in mics if any(n in spec["match"] for n in patterns_of(m)))
        patterns.append(entry)

    for name, n in pattern_names.most_common():
        if name not in claimed:
            warn("pattern %r (%d mics) has no button in vocabulary.PATTERNS" % (name, n))

    prices = [m["pricing"].get("msrp_amount") for m in mics]
    bands = []
    for band in V.PRICE_BANDS:
        entry = dict(band)
        if band.get("none"):
            entry["count"] = sum(1 for p in prices if p is None)
        elif "min" in band:
            hi = band.get("max")
            entry["count"] = sum(1 for p in prices
                                 if p is not None and p >= band["min"] and (hi is None or p < hi))
        else:
            entry["count"] = len(mics)
        bands.append(entry)

    type_entries = []
    for t in V.TYPES:
        entry = dict(t)
        entry["count"] = len(mics) if t["key"] == "all" else types.get(t["key"], 0)
        if not entry["count"]:
            warn("transducer type %r has no microphones" % t["key"])
        type_entries.append(entry)

    for key in sorted(types):
        if key not in {t["key"] for t in V.TYPES}:
            warn("transducer type %r (%d mics) has no chip in vocabulary.TYPES" % (key, types[key]))

    form_entries = [
        {"key": k, "label": V.FORM_LABELS.get(k, k), "count": n}
        for k, n in sorted(forms.items(), key=lambda kv: (-kv[1], kv[0]))
    ]
    for k in forms:
        if k not in V.FORM_LABELS:
            warn("form factor %r has no label in vocabulary.FORM_LABELS" % k)

    # A CSV column pointing at a path no record has would export a silent blank.
    for col in V.CSV_COLUMNS:
        path = col.get("path")
        if path and not any(dig(m, path) not in (None, [], "") for m in mics):
            warn("CSV column %r (%s) is empty for every microphone" % (col["label"], path))

    return {
        "types": type_entries,
        "forms": form_entries,
        "traits": [dict(t, count=traits.get(t["key"], 0)) for t in V.TRAITS],
        "priceBands": bands,
        "availability": [dict(a, count=len(mics) if a["key"] == "all" else avail.get(a["key"], 0))
                         for a in V.AVAILABILITY],
        "sorts": V.SORTS,
        "tagSorts": V.TAG_SORTS,
        "patterns": patterns,
        "patternDisplay": V.PATTERN_DISPLAY,
        "typeSeries": V.TYPE_SERIES,
        "typeSeriesKeys": V.TYPE_SERIES_KEYS,
        "typeColors": V.TYPE_COLORS,
        "priceHistogram": V.PRICE_HISTOGRAM,
        "statAttributes": V.STAT_ATTRIBUTES,
        "brandChartTops": V.BRAND_CHART_TOPS,
        "brandChartOrders": V.BRAND_CHART_ORDERS,
        "explorerColumns": V.EXPLORER_COLUMNS,
        "csvColumns": V.CSV_COLUMNS,
        "page": 120,
    }


def dig(obj, path):
    """Follow a dotted path into a record, returning None if it runs out."""
    for part in path.split("."):
        if not isinstance(obj, dict):
            return None
        obj = obj.get(part)
    return obj


def main():
    if not os.path.exists(SRC):
        sys.exit("source not found: %s" % SRC)

    with open(SRC, encoding="utf-8") as fh:
        mics = json.load(fh)

    by_brand = defaultdict(list)
    for mic in mics:
        by_brand[mic["source"]["brand_slug"]].append(mic)

    os.makedirs(os.path.join(OUT, "brands"), exist_ok=True)

    brands = []
    for slug, group in by_brand.items():
        group.sort(key=lambda m: (m["identity"].get("model") or "").lower())
        file_slug = safe_slug(slug)

        with open(os.path.join(OUT, "brands", file_slug + ".json"), "w", encoding="utf-8") as fh:
            json.dump(
                {m["source"]["model_slug"]: m for m in group},
                fh,
                ensure_ascii=False,
                separators=(",", ":"),
            )

        types = defaultdict(int)
        for mic in group:
            types[mic["classification"].get("transducer_type") or "unknown"] += 1

        brands.append({
            "slug": slug,
            "file": file_slug,
            "name": group[0]["identity"].get("manufacturer") or slug,
            "url": group[0]["identity"].get("manufacturer_url"),
            "count": len(group),
            "types": dict(types),
            "models": [model_row(m) for m in group],
        })

    brands.sort(key=lambda b: b["name"].lower())

    index = {
        "source": "Research/microphones.json",
        "total_models": len(mics),
        "total_brands": len(brands),
        "brands": brands,
    }
    index_path = os.path.join(OUT, "index.json")
    with open(index_path, "w", encoding="utf-8") as fh:
        json.dump(index, fh, ensure_ascii=False, separators=(",", ":"))

    # The tag vocabulary is only needed once the tag view opens, so it ships as
    # its own file keyed "<brand_slug>/<model_slug>" — the same id the browser
    # builds from an index row.
    members = defaultdict(list)
    for mic in mics:
        key = mic["source"]["brand_slug"] + "/" + mic["source"]["model_slug"]
        for tag in mic["classification"].get("tags") or []:
            name = tag["name"] if isinstance(tag, dict) else tag
            if name:
                members[name].append(key)

    tags = [{"name": n, "count": len(v), "mics": v} for n, v in members.items()]
    tags.sort(key=lambda t: (-t["count"], t["name"].lower()))
    tags_path = os.path.join(OUT, "tags.json")
    with open(tags_path, "w", encoding="utf-8") as fh:
        json.dump({"total_tags": len(tags), "tags": tags}, fh,
                  ensure_ascii=False, separators=(",", ":"))

    warnings = []
    config = build_config(mics, warnings.append)
    config_path = os.path.join(OUT, "config.json")
    with open(config_path, "w", encoding="utf-8") as fh:
        json.dump(config, fh, ensure_ascii=False, separators=(",", ":"))

    print("%d brands / %d models" % (len(brands), len(mics)))
    print("config.json %.0f KB" % (os.path.getsize(config_path) / 1024))
    print("index.json  %.0f KB" % (os.path.getsize(index_path) / 1024))
    print("tags.json   %.0f KB / %d tags" % (os.path.getsize(tags_path) / 1024, len(tags)))
    print("brands/     %d files" % len(brands))
    for w in warnings:
        print("  warning: %s" % w)


if __name__ == "__main__":
    main()
