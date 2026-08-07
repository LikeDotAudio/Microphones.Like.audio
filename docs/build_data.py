#!/usr/bin/env python3
"""Split Research/microphones.json into a light index + per-brand detail files.

Outputs (relative to this script):
    data/index.json          brands + a compact row for every model (fast boot, global search)
    data/brands/<slug>.json  full records for one brand, loaded on demand

Run:  python3 docs/build_data.py
"""

import json
import os
import re
import sys
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SRC = os.path.join(ROOT, "Research", "microphones.json")
OUT = os.path.join(HERE, "data")


def safe_slug(value):
    """Filesystem/URL-safe filename for a brand slug."""
    return re.sub(r"[^A-Za-z0-9._-]", "_", value)


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
        "patterns": cls.get("pattern_icons") or [],
        "thumb": photo.get("thumb_url"),
    }


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

    size = os.path.getsize(index_path) / 1024
    print("%d brands / %d models" % (len(brands), len(mics)))
    print("index.json  %.0f KB" % size)
    print("brands/     %d files" % len(brands))


if __name__ == "__main__":
    main()
