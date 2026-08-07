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

import build_rf as rf
import build_x230 as x230
import vocabulary as V
import x230_read

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


def build_config(mics, rf_records, warn):
    """The UI vocabulary, counted against the corpus it will be filtering.

    Counting here is what keeps the page honest: a facet the data can't satisfy
    ships with count 0 and the browser drops it, and any pattern name in the
    corpus that no button claims is reported rather than silently unreachable.
    """
    types = Counter(m["classification"].get("transducer_type") or "unknown" for m in mics)
    if rf_records:
        types["wireless"] = len(rf_records)
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
        if spec.get("kind") == "rf":
            # Not a pattern: this button asks what the record is, so it counts
            # against the RF catalogue rather than against any pattern name.
            entry["count"] = len(rf_records)
        elif spec.get("multi"):
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

    # X230 score bands, counted across both record kinds — a wireless system is
    # read against the profile too, just against its radio half.
    scores = [(r.get("x230") or {}).get("p") for r in mics + rf_records]
    x230_bands = []
    for band in V.X230_BANDS:
        entry = dict(band)
        if band.get("none"):
            entry["count"] = sum(1 for s in scores if s is None)
        elif "min" in band:
            hi = band.get("max")
            entry["count"] = sum(1 for s in scores
                                 if s is not None and s >= band["min"] and (hi is None or s < hi))
        else:
            entry["count"] = len(scores)
        x230_bands.append(entry)

    type_entries = []
    total = len(mics) + len(rf_records)
    for t in V.TYPES:
        entry = dict(t)
        entry["count"] = total if t["key"] == "all" else types.get(t["key"], 0)
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

    # ---- wireless facets, counted off the RF records ----
    band_counts = Counter()
    for rec in rf_records:
        for band in rec["classification"]["bands"]:
            band_counts[band] += 1
    rf_bands = [{"key": "all", "label": "Any band", "count": len(rf_records)}] + [
        {"key": b["key"], "label": b["label"], "count": band_counts.get(b["key"], 0)}
        for b in V.RF_BANDS
    ]
    for key in band_counts:
        if key not in {b["key"] for b in V.RF_BANDS}:
            warn("RF band %r has no entry in vocabulary.RF_BANDS" % key)

    rf_spectrum = []
    for seg in V.RF_SPECTRUM:
        entry = dict(seg)
        hi = seg.get("max")
        entry["count"] = sum(
            1 for r in rf_records
            if r["rf"]["coverage"]["start_mhz"] is not None
            and r["rf"]["coverage"]["end_mhz"] is not None
            # a system counts if any part of its coverage overlaps the segment
            and r["rf"]["coverage"]["end_mhz"] >= seg["min"]
            and (hi is None or r["rf"]["coverage"]["start_mhz"] < hi)
        )
        rf_spectrum.append(entry)

    return {
        "types": type_entries,
        "forms": form_entries,
        "kinds": [dict(k, count=(len(mics) if k["key"] == "mic" else
                                 len(rf_records) if k["key"] == "rf" else total))
                  for k in V.KINDS],
        "rfBands": rf_bands,
        "rfSpectrum": rf_spectrum,
        "rfSorts": V.RF_SORTS,
        "rfRangeColumns": V.RF_RANGE_COLUMNS,
        "micChain": V.MIC_CHAIN,
        "rfChain": V.RF_CHAIN,
        "chainFeeds": V.CHAIN_FEEDS,
        "chainFlows": V.CHAIN_FLOWS,
        "traits": [dict(t, count=traits.get(t["key"], 0)) for t in V.TRAITS],
        "priceBands": bands,
        "availability": [dict(a, count=len(mics) if a["key"] == "all" else avail.get(a["key"], 0))
                         for a in V.AVAILABILITY],
        "x230Bands": x230_bands,
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

    warnings = []
    rf_records = rf.load(warnings.append)
    rf_by_brand = rf.by_brand(rf_records)

    # Read every record against AES-X230 before anything is written: the score
    # is a facet the model list filters and sorts on, so it has to exist on the
    # index row, and the detail panel then renders the same report rather than
    # deriving a second one in the browser. The compact report rides along on
    # the shipped copy of each record — it is a derived view of that record, not
    # part of the source dataset Research/microphone.schema.json describes.
    profile = x230.load(warnings.append)
    wordbook = x230_read.Wordbook()
    x230_stats = None
    if profile:
        reader = x230_read.Reader(profile)
        summary = x230_read.Summary(profile)
        for rec in mics + rf_records:
            report = reader.read(rec)
            summary.add(report)
            rec["x230"] = x230_read.compact(report, wordbook)
        x230_stats = summary.result()

    by_brand = defaultdict(list)
    for mic in mics:
        by_brand[mic["source"]["brand_slug"]].append(mic)

    os.makedirs(os.path.join(OUT, "brands"), exist_ok=True)

    # A vendor who only makes wireless still earns a place in the tree.
    all_slugs = set(by_brand) | set(rf_by_brand)

    brands = []
    for slug in all_slugs:
        group = by_brand.get(slug, [])
        rf_group = rf_by_brand.get(slug, [])
        group.sort(key=lambda m: (m["identity"].get("model") or "").lower())
        file_slug = safe_slug(slug)

        # One file per brand carries both kinds, keyed by model slug — RF slugs
        # are 'rf-' prefixed, so the two can never overwrite each other.
        detail = {m["source"]["model_slug"]: m for m in group}
        detail.update({r["source"]["model_slug"]: r for r in rf_group})
        with open(os.path.join(OUT, "brands", file_slug + ".json"), "w", encoding="utf-8") as fh:
            json.dump(detail, fh, ensure_ascii=False, separators=(",", ":"))

        types = defaultdict(int)
        for mic in group:
            types[mic["classification"].get("transducer_type") or "unknown"] += 1
        if rf_group:
            types["wireless"] = len(rf_group)

        name = (group[0]["identity"].get("manufacturer") if group
                else rf_group[0]["identity"]["manufacturer"])
        rows = [model_row(m) for m in group] + [rf.model_row(r) for r in rf_group]
        for row, rec in zip(rows, group + rf_group):
            row["x230"] = (rec.get("x230") or {}).get("p")
        brands.append({
            "slug": slug,
            "file": file_slug,
            "name": name or slug,
            "url": group[0]["identity"].get("manufacturer_url") if group else None,
            "count": len(group) + len(rf_group),
            "mics": len(group),
            "rf": len(rf_group),
            "types": dict(types),
            "models": rows,
        })

    brands.sort(key=lambda b: b["name"].lower())

    index = {
        "source": "Research/microphones.json",
        "rf_source": os.path.basename(rf.SRC) if rf_records else None,
        "total_models": len(mics) + len(rf_records),
        "total_microphones": len(mics),
        "total_rf": len(rf_records),
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

    # The Wireless tab lists every RF system at once, so it gets one file rather
    # than reaching into 16 brand files. Small enough to fetch on demand.
    # The X230 reading is dropped here: the tab lists coverage bars, and a system
    # opened from it loads the brand file, which carries the report. Leaving it in
    # would near-double a file every visit to the tab fetches.
    rf_path = os.path.join(OUT, "rf.json")
    with open(rf_path, "w", encoding="utf-8") as fh:
        json.dump({
            "source": os.path.basename(rf.SRC),
            "total_systems": len(rf_records),
            "total_ranges": sum(r["rf"]["range_count"] for r in rf_records),
            "systems": [{k: v for k, v in r.items() if k != "x230"} for r in rf_records],
        }, fh, ensure_ascii=False, separators=(",", ":"))

    # The AES-X230 profile: shipped whole, because both the X230 tab and the
    # per-device conformance panel read it rather than carrying their own copy.
    # It goes out last, carrying the wordbook the reports above index into.
    if profile:
        x230.write(OUT, profile, wordbook)
        x230.write_report(OUT, x230_stats, warnings.append)

    config = build_config(mics, rf_records, warnings.append)
    config_path = os.path.join(OUT, "config.json")
    with open(config_path, "w", encoding="utf-8") as fh:
        json.dump(config, fh, ensure_ascii=False, separators=(",", ":"))

    print("%d brands / %d microphones + %d RF systems" % (len(brands), len(mics), len(rf_records)))
    print("config.json %.0f KB" % (os.path.getsize(config_path) / 1024))
    print("index.json  %.0f KB" % (os.path.getsize(index_path) / 1024))
    print("tags.json   %.0f KB / %d tags" % (os.path.getsize(tags_path) / 1024, len(tags)))
    print("rf.json     %.0f KB / %d ranges" %
          (os.path.getsize(rf_path) / 1024, sum(r["rf"]["range_count"] for r in rf_records)))
    if profile:
        print("x230.json   %.0f KB / %d parameters" %
              (os.path.getsize(os.path.join(OUT, "x230.json")) / 1024, len(profile["parameters"])))
        answered = sum(1 for p in x230_stats["parameters"] if p["mapped"])
        print("x230_report %.0f KB / %d of %d parameters ever answered, median score %s%%" %
              (os.path.getsize(os.path.join(OUT, "x230_report.json")) / 1024,
               answered, len(x230_stats["parameters"]), x230_stats["score"]["median"]))
    print("brands/     %d files" % len(brands))
    for w in warnings:
        print("  warning: %s" % w)


if __name__ == "__main__":
    main()
