#!/usr/bin/env python3
"""Normalise the RF wireless dataset into records the browser can file.

The source is nested Manufacturer -> Model -> Range, with every value a string.
This flattens it to one record per model, keeping the ranges as an ordered list:
a tuning range is a variant of a system, not a product of its own, so "Shure AD"
is one entry carrying eight ranges rather than eight entries called AD.

RF records keep their own shape (Research/rf_component.schema.json) — they share
no fields with a microphone beyond manufacturer and model. What lets them
intermix in the browser is the compact index row, not a shared record schema.

Imported by build_data.py; run that, not this.
"""

import json
import os
import re
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SRC = os.path.join(ROOT, "Research", "Wireless Microphone_RF_Components.json")

# Manufacturer keys in the RF source that are the same company as a microphone
# brand already in the index. Anything not listed here becomes a new brand, so
# a vendor who only makes wireless still gets a place in the tree.
BRAND_ALIASES = {
    "Audio Technica": "Audio-Technica",
    "EV": "Electro-Voice",
}


def slug_part(value):
    """URL/filesystem-safe fragment, collapsing runs of separators."""
    s = re.sub(r"[^A-Za-z0-9._-]+", "-", str(value)).strip("-")
    return s or "x"


def to_float(value):
    try:
        return float(str(value).strip())
    except (TypeError, ValueError):
        return None


def to_int(value):
    f = to_float(value)
    return int(f) if f is not None and f == int(f) else None


def setting(raw):
    """A coordination field: either a spacing in MHz or one of the source tokens."""
    text = "" if raw is None else str(raw).strip()
    low = text.lower()
    if low == "default":
        return {"mode": "default", "mhz": None, "raw": text}
    if low == "disabled":
        return {"mode": "disabled", "mhz": None, "raw": text}
    mhz = to_float(text)
    if mhz is None:
        return {"mode": "default", "mhz": None, "raw": text}
    return {"mode": "value", "mhz": mhz, "raw": text}


def mhz(value):
    """Trim float noise so 541.5 doesn't print as 541.5000000001."""
    return None if value is None else round(value, 4)


def build_ranges(model_ranges, warn, where):
    rows = []
    for key, rec in model_ranges.items():
        if not isinstance(rec, dict):
            warn("%s range %r is not an object" % (where, key))
            continue
        start = to_float(rec.get("start_freq"))
        end = to_float(rec.get("end_freq"))
        if start is None or end is None:
            warn("%s range %r has no usable start/end frequency" % (where, key))
        if start is not None and end is not None and end < start:
            warn("%s range %r ends below where it starts (%s–%s)" % (where, key, start, end))
            start, end = end, start
        band = (rec.get("vhf_uhf") or "").strip().upper() or None
        if band not in ("UHF", "VHF", None):
            warn("%s range %r has an unknown band %r" % (where, key, band))
            band = None

        # The source carries a nameless 0 Hz row as its "nothing selected"
        # placeholder. Filing that as a product would put a radio that tunes
        # nowhere in the catalogue and drag the spectrum axis down to zero.
        if not str(key).strip() and not start and not end:
            warn("%s has an empty placeholder range; dropped" % where)
            continue
        rows.append({
            "key": str(key),
            "name": str(rec.get("range") or key),
            "start_mhz": mhz(start),
            "end_mhz": mhz(end),
            "width_mhz": mhz(end - start) if start is not None and end is not None else None,
            "presets": to_int(rec.get("num_presets")),
            "prebuilt": str(rec.get("prebuilt")).strip().lower() == "true",
            "band": band,
            "bandwidth": setting(rec.get("bandwidth")),
            "imd_3": setting(rec.get("imd_3")),
            "imd_3_tx_3rd": setting(rec.get("imd_3_tx_3rd")),
            "imd_5": setting(rec.get("imd_5")),
        })
    rows.sort(key=lambda r: (r["start_mhz"] is None, r["start_mhz"] or 0, r["key"]))
    return rows


def describe(bands, ranges, start, end):
    band = "/".join(bands) if bands else "Wireless"
    bits = ["%s wireless system" % band,
            "%d tuning range%s" % (len(ranges), "" if len(ranges) == 1 else "s")]
    if start is not None and end is not None:
        bits.append("%g–%g MHz" % (start, end))
    return " · ".join(bits)


def load(warn):
    """Every RF model as a normalised record, or [] when the source is absent."""
    if not os.path.exists(SRC):
        return []

    with open(SRC, encoding="utf-8") as fh:
        raw = json.load(fh)

    records = []
    for mfr_key, models in raw.items():
        if not isinstance(models, dict):
            warn("manufacturer %r is not an object" % mfr_key)
            continue
        brand_slug = BRAND_ALIASES.get(mfr_key, slug_part(mfr_key))
        used = set()

        for model_key, model_ranges in models.items():
            where = "%s / %s" % (mfr_key, model_key)
            if not isinstance(model_ranges, dict) or not model_ranges:
                warn("%s has no ranges" % where)
                continue

            ranges = build_ranges(model_ranges, warn, where)
            if not ranges:
                warn("%s has no usable ranges; dropped" % where)
                continue

            # 'rf-' keeps these clear of any microphone model slug in the same
            # brand; the counter only fires if two model names slug alike.
            base = "rf-" + slug_part(model_key)
            model_slug = base
            n = 2
            while model_slug in used:
                model_slug = "%s-%d" % (base, n)
                n += 1
            used.add(model_slug)

            starts = [r["start_mhz"] for r in ranges if r["start_mhz"] is not None]
            ends = [r["end_mhz"] for r in ranges if r["end_mhz"] is not None]
            widths = [r["width_mhz"] for r in ranges if r["width_mhz"] is not None]
            presets = [r["presets"] for r in ranges if r["presets"] is not None]
            bands = []
            for r in ranges:
                if r["band"] and r["band"] not in bands:
                    bands.append(r["band"])

            start = min(starts) if starts else None
            end = max(ends) if ends else None

            records.append({
                "source": {
                    "dataset": os.path.basename(SRC),
                    "manufacturer_key": mfr_key,
                    "model_key": str(model_key),
                    "brand_slug": brand_slug,
                    "model_slug": model_slug,
                },
                "identity": {
                    "manufacturer": mfr_key,
                    "model": str(model_key),
                    "full_name": "%s %s" % (mfr_key, model_key),
                },
                "classification": {
                    "kind": "rf",
                    "component_type": "wireless-system",
                    "bands": bands,
                    "subtitle": describe(bands, ranges, start, end),
                },
                "rf": {
                    "range_count": len(ranges),
                    "coverage": {
                        "start_mhz": start,
                        "end_mhz": end,
                        "span_mhz": mhz(end - start) if start is not None and end is not None else None,
                        "tunable_mhz": mhz(sum(widths)) if widths else None,
                    },
                    "presets": {
                        "min": min(presets) if presets else None,
                        "max": max(presets) if presets else None,
                    },
                    "ranges": ranges,
                },
            })

    records.sort(key=lambda r: (r["source"]["brand_slug"].lower(), r["identity"]["model"].lower()))
    return records


def model_row(rec):
    """The compact index row, shaped so RF systems sit in the same lists as mics.

    `kind` is what the Wireless tab and the badges key off; `type` is set to
    "wireless" so the main tab's transducer facet has somewhere to put them.
    """
    cov = rec["rf"]["coverage"]
    return {
        "slug": rec["source"]["model_slug"],
        "kind": "rf",
        "model": rec["identity"]["model"],
        "subtitle": rec["classification"]["subtitle"],
        "type": "wireless",
        "form": None,
        "tube": False,
        "multi": False,
        "stereo": False,
        "set": False,
        "avail": None,
        "msrp": None,
        "year": None,
        "patterns": [],
        "thumb": None,
        "bands": rec["classification"]["bands"],
        "ranges": rec["rf"]["range_count"],
        "mhzLow": cov["start_mhz"],
        "mhzHigh": cov["end_mhz"],
        "presetMax": rec["rf"]["presets"]["max"],
    }


def by_brand(records):
    """Records grouped by the brand slug they file under."""
    groups = defaultdict(list)
    for rec in records:
        groups[rec["source"]["brand_slug"]].append(rec)
    return groups
