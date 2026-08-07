#!/usr/bin/env python3
"""Ship the AES-X230 profile to the browser, after checking it holds together.

The profile itself is Research/aes_x230_profile.json — a transcription of the
X230 object-list workbook, described by Research/aes_x230_profile.schema.json.
Nothing is computed here: this copies it into docs/data/x230.json so the page
can fetch it, and validates it on the way through.

Validation is in two parts. If the `jsonschema` package is installed the file is
checked against its schema; CI has no such dependency, so the structural checks
below run either way. They catch the things a schema cannot: a parameter naming
a block that does not exist, a crosswalk pointing at a switch position the
profile never defines, two rows claiming the same workbook row.

Imported by build_data.py; run that, not this.
"""

import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SRC = os.path.join(ROOT, "Research", "aes_x230_profile.json")
SCHEMA = os.path.join(ROOT, "Research", "aes_x230_profile.schema.json")

# Shown in full on the X230 tab. Shipped as parsed objects rather than as
# escaped strings: the browser pretty-prints them, and a page that renders the
# schema it actually validates against cannot show a stale copy.
SCHEMAS = [
    {
        "key": "profile",
        "title": "The profile",
        "filename": "Research/aes_x230_profile.schema.json",
        "blurb": "The X230 data model itself: blocks, parameters, and the four-part AES70 "
                 "binding each parameter carries. Research/aes_x230_profile.json is an instance.",
    },
    {
        "key": "device",
        "title": "A device read against it",
        "filename": "Research/aes_x230_device.schema.json",
        "blurb": "One catalogue record scored against the profile — the object every device "
                 "page renders, and where the five states and the score are defined.",
    },
]


def _check(profile, warn):
    """Cross-references a schema can't express, checked against the profile."""
    blocks = {b["key"] for b in profile["blocks"]}
    enums = profile.get("enumerations") or {}

    seen_keys, seen_rows = set(), {}
    for p in profile["parameters"]:
        where = "parameter %r" % p["key"]
        if p["key"] in seen_keys:
            warn("%s is defined twice" % where)
        seen_keys.add(p["key"])

        row = p.get("source_row")
        if row in seen_rows:
            warn("%s and %r both claim Classes row %s" % (where, seen_rows[row], row))
        seen_rows[row] = p["key"]

        if p.get("block") and p["block"] not in blocks:
            warn("%s sits in unknown block %r" % (where, p["block"]))
        for key in (p.get("applicability") or {}):
            if key not in blocks:
                warn("%s is marked against unknown block %r" % (where, key))
        if p.get("enumeration") and p["enumeration"] not in enums:
            warn("%s refers to unknown enumeration %r" % (where, p["enumeration"]))

        # A parameter whose class is a placeholder must say so, or the device
        # view will report it as a real binding the catalogue merely failed.
        oca = p["oca"]
        if oca["resolved"] != (oca["class"] is not None):
            warn("%s marks resolved=%s but class=%r" % (where, oca["resolved"], oca["class"]))

        # The audio half names a block per row; the RF half names a grid. A row
        # carrying neither would silently vanish from every device report.
        if p["section"] == "rf" and not p.get("applicability"):
            warn("%s is in the RF section with no applicability grid" % where)
        if p["section"] == "audio" and not p.get("block") and oca["resolved"]:
            warn("%s is bound to %s but sits in no block" % (where, oca["class"]))

    cross = profile.get("crosswalk") or {}
    positions = {e["position"] for e in enums.get("polar_pattern_position", {}).get("positions", [])}
    for row in cross.get("pattern_positions") or []:
        if row["position"] is not None and row["position"] not in positions:
            warn("crosswalk maps %r to pattern position %s, which the profile does not define"
                 % (row["corpus"], row["position"]))

    if not profile.get("narrative"):
        warn("the profile carries no narrative — the X230 tab would render empty")


def load(warn):
    """The profile, validated. Returns None when the source file is absent."""
    if not os.path.exists(SRC):
        warn("X230 profile not found at %s" % os.path.relpath(SRC, ROOT))
        return None

    with open(SRC, encoding="utf-8") as fh:
        profile = json.load(fh)

    try:
        import jsonschema
    except ImportError:
        pass                                    # structural checks below still run
    else:
        with open(SCHEMA, encoding="utf-8") as fh:
            schema = json.load(fh)
        for err in sorted(jsonschema.Draft202012Validator(schema).iter_errors(profile),
                          key=lambda e: list(e.absolute_path)):
            warn("aes_x230_profile.json: %s at /%s"
                 % (err.message, "/".join(str(p) for p in err.absolute_path)))

    _check(profile, warn)
    return profile


def write(out_dir, profile, wordbook=None):
    """Emit data/x230.json: the profile, plus the wordbook the per-record reports
    index into. The two ship together because the browser needs both to expand a
    report, and one fetch is cheaper than two."""
    payload = dict(profile)
    payload["wordbook"] = list(wordbook.words) if wordbook else []
    path = os.path.join(out_dir, "x230.json")
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(payload, fh, ensure_ascii=False, separators=(",", ":"))
    return profile


def write_report(out_dir, statistics, warn):
    """Emit data/x230_report.json: the schemas in full, and how completely the
    catalogue answers the profile. Its own file because only the X230 tab wants
    it — every device page fetches x230.json, and should not pay for this."""
    schemas = []
    for spec in SCHEMAS:
        path = os.path.join(ROOT, spec["filename"])
        if not os.path.exists(path):
            warn("schema not found: %s" % spec["filename"])
            continue
        with open(path, encoding="utf-8") as fh:
            schemas.append(dict(spec, schema=json.load(fh)))

    path = os.path.join(out_dir, "x230_report.json")
    with open(path, "w", encoding="utf-8") as fh:
        json.dump({"schemas": schemas, "statistics": statistics}, fh,
                  ensure_ascii=False, separators=(",", ":"))
    return path


if __name__ == "__main__":
    warnings = []
    got = load(warnings.append)
    if got:
        write(os.path.join(HERE, "data"), got)
        print("x230.json   %d parameters / %d blocks / %d diagrams"
              % (len(got["parameters"]), len(got["blocks"]), len(got["diagrams"])))
    for w in warnings:
        print("  warning: %s" % w)
