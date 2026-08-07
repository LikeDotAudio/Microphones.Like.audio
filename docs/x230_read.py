#!/usr/bin/env python3
"""Reading a catalogue record as an AES-X230 profile instance.

X230 describes a microphone as a set of AES70 control objects. This catalogue
describes microphones as specification sheets. The two are not the same kind of
thing, and the value of this reading is in saying so precisely: for every
parameter the profile defines, either the catalogue can populate it, or it
positively records the function missing, or it cannot answer — and that last
case is a null, carried as one.

The reading happens here, at build time, rather than in the browser, because the
score it produces is a facet: the model list filters and sorts on it, and that
means every one of the 1,831 rows needs it before the first card is drawn. The
browser then renders the report it is handed (js/x230.js) instead of deriving a
second, drifting copy.

Output is described by Research/aes_x230_device.schema.json. The profile, its
enumerations and the crosswalk from catalogue vocabulary are all in
Research/aes_x230_profile.json.

A word on what "mapped" does not mean. No record in this catalogue publishes an
AES70 device model, so a mapped parameter says the catalogue knows the value,
not that the device exposes the object. `access` carries that distinction: a pad
the source marks "(Via Switch)" is a function you can put your thumb on, not a
control point a network can reach.

Imported by build_data.py; run that, not this.
"""

import re

RF_BLOCKS = ["transmitter", "receiver", "analyzer", "manager", "xmit_antenna", "rcv_antenna"]

# Wire codes for the compact report. A full report is 15 KB of which most is
# prose and profile metadata the browser already holds, so what ships is the
# per-record part only: statuses, values, evidence, and indices into a wordbook
# of the strings every record shares.
STATUS_CODE = {"mapped": "m", "absent": "a", "unknown": "u", "undefined-in-profile": "o",
               "runtime": "r"}

# The caveat every report carries lives in the profile's crosswalk, so the
# reader and the page cannot end up wording it differently.
CONTROL_NOTE_FALLBACK = "This catalogue does not publish AES70 device models."


def num(value, unit=""):
    """Match the browser's number formatting: grouped, at most two decimals."""
    if value is None:
        return None
    text = "{:,.2f}".format(float(value))
    if text.endswith(".00"):
        text = text[:-3]
    elif text.endswith("0"):
        text = text[:-1]
    return text + unit


class Reader:
    """One profile, ready to read records against."""

    def __init__(self, profile):
        self.profile = profile
        cross = profile.get("crosswalk") or {}
        self.patterns = {row["corpus"]: row for row in cross.get("pattern_positions") or []}
        self.digital = [s.lower() for s in (cross.get("digital_connectors") or {}).get("match") or []]
        self.control_note = cross.get("control_note") or CONTROL_NOTE_FALLBACK
        self.not_scorable = {row["key"]: row["why"]
                             for row in (cross.get("not_scorable") or {}).get("keys") or []}

    # ---------------------------------------------------------------- helpers

    def digital_connector(self, rec):
        """The connector is the only thing in the record that says a microphone
        converts on board — and therefore that it has an ADC block at all."""
        for iface in (rec.get("specifications") or {}).get("interfaces") or []:
            conn = (iface.get("connector") or "").lower()
            if any(w in conn for w in self.digital):
                return iface["connector"]
        return None

    @staticmethod
    def pattern_names(rec):
        """Distinct pattern names, preferring the normalised form."""
        out = []
        for row in (rec.get("specifications") or {}).get("pickup_patterns") or []:
            name = row.get("pattern_base") or row.get("pattern")
            if name and name != "None" and name not in out:
                out.append(name)
        return out

    @staticmethod
    def switched_list(rec, field, label, fmt):
        """Pads and filters share a shape, and the same three-way answer: the
        column is missing (unknown), present and empty (absent), or has rows."""
        spec = rec.get("specifications") or {}
        if field not in spec:
            return {"status": "unknown", "why": "This page carries no pads-and-filters column."}
        rows = spec.get(field) or []
        if not rows:
            return {
                "status": "absent",
                "why": "The pads-and-filters column is present and lists no %s." % label,
                "evidence": [("specifications." + field, "[]")],
            }
        local = any(re.search(r"switch", (r.get("mechanism") or r.get("raw") or ""), re.I)
                    for r in rows)
        return {
            "values": [fmt(r) for r in rows],
            "access": "local" if local else None,
            "why": ("The source marks this “Via Switch”: a function on the microphone, "
                    "not an object a controller can reach.") if local else None,
            "evidence": [("specifications." + field + "[].raw", r.get("raw")) for r in rows],
        }

    # ------------------------------------------------------ block instantiation

    def block_states(self, rec, kind):
        """Decided once per device. Every parameter inside a block that is not
        instantiated is not-applicable, so the reasoning is stated once instead
        of thirty times down the table."""
        out = {}

        def put(keys, status, why):
            for key in keys:
                out[key] = {"status": status, "why": why}

        if kind == "rf":
            put(["preamp", "processor", "adc", "utility"], "unknown",
                "The wireless dataset covers tuning and coordination. The audio chain inside the "
                "system is not described either way.")
            put(["device"], "instantiated", "Manufacturer and model name the device.")
            put(["transmitter", "receiver"], "instantiated",
                "A wireless system is a transmitter and a receiver; the tuning ranges belong to both.")
            put(["analyzer", "manager"], "not-instantiated",
                "The dataset describes a system, not the coordination hardware around it.")
            put(["xmit_antenna", "rcv_antenna"], "unknown",
                "Antennas are not itemised in the dataset, and the profile marks them optional anyway.")
            return out

        conn = self.digital_connector(rec)
        put(["preamp"], "instantiated",
            "Every microphone has an analog front end: pattern, pad, low-cut and rated sensitivity "
            "all sit here.")
        put(["device"], "instantiated", "Manufacturer and model name the device.")
        if conn:
            put(["adc"], "instantiated", "Converts on board — the interface is %s." % conn)
            put(["processor", "utility"], "unknown",
                "A microphone that converts on board may process and may carry utility objects; "
                "the catalogue does not say.")
        else:
            ifaces = (rec.get("specifications") or {}).get("interfaces") or []
            first = ifaces[0].get("connector") if ifaces else None
            put(["adc"], "not-instantiated",
                "Analog output only" + (" — %s." % first if first else "."))
            put(["processor", "utility"], "not-instantiated",
                "An analog microphone with no converter has nothing downstream to process and no "
                "utility objects to expose.")
        put(RF_BLOCKS, "not-instantiated", "A wired microphone carries no radio blocks.")
        return out

    # ------------------------------------------------------------- extractors
    # Each returns the fields of one report row, or {"status", "why"} to
    # override. Returning None leaves the parameter unknown with a generic
    # reason — which is the correct answer far more often than not.

    # ---- shared: device identity is the one part both record kinds can answer

    @staticmethod
    def _manufacturer(rec):
        name = rec["identity"].get("manufacturer")
        return {"value": name, "access": "read-only",
                "evidence": [("identity.manufacturer", name)]}

    @staticmethod
    def _serial_number(rec):
        return {"status": "unknown",
                "why": "A per-unit value. This catalogue describes models, so there is nothing "
                       "that could fill it."}

    @staticmethod
    def _user_label(rec):
        return {"status": "unknown",
                "why": "Set by whoever installs the device. Not a catalogue fact at all."}

    @staticmethod
    def _type(rec):
        subtitle = rec["classification"].get("subtitle")
        return {
            "value": subtitle,
            "evidence": [("classification.subtitle", subtitle or "—")],
            "why": "X230 never settled what Type means — its class cell reads “?”. "
                   "The nearest thing the catalogue has is the record's own descriptor, shown "
                   "here for comparison.",
        }

    # ---- microphone

    def _pad(self, rec):
        return self.switched_list(rec, "pads", "pad", lambda p: (
            num(p["value_db"], " dB") if p.get("value_db") is not None else p.get("raw")))

    def _low_cut(self, rec):
        def fmt(f):
            bits = [num(f["frequency_hz"], " Hz") if f.get("frequency_hz") is not None else None,
                    f.get("slope")]
            return ", ".join(b for b in bits if b) or f.get("raw")
        return self.switched_list(rec, "filters", "filter", fmt)

    def _polar_pattern(self, rec):
        names = self.pattern_names(rec)
        if not names:
            return {"status": "unknown", "why": "This page lists no pickup pattern."}
        multi = bool(rec["classification"].get("is_multipattern"))
        rows, unplaced = [], []
        for name in names:
            cross = self.patterns.get(name)
            if cross and cross.get("position") is not None:
                rows.append("Position %s · %s" % (cross["position"], cross["position_name"]))
            else:
                rows.append("%s — no profile position" % name)
                unplaced.append(name)
        if unplaced:
            why = ("X230 leaves stereo unassigned, so %s has no PatternType position."
                   % " and ".join(unplaced))
        elif multi:
            why = ("Selected by a switch on the microphone, so the positions are real but the "
                   "control point is not.")
        else:
            why = "A fixed pattern: reported rather than selected."
        return {
            "values": rows,
            "access": "local" if multi else "read-only",
            "evidence": [("specifications.pickup_patterns[].pattern_base", n) for n in names],
            "why": why,
        }

    def _pattern_parameter(self, rec):
        """The profile publishes a gradient coefficient for exactly three
        patterns. Deriving the other seven would be inventing numbers the
        standard withheld."""
        placed = [self.patterns.get(n) for n in self.pattern_names(rec)]
        placed = [c for c in placed if c and c.get("gradient") is not None]
        if not placed:
            return {
                "status": "unknown",
                "why": "The profile gives a coefficient only for omni (0), cardioid (0.5) and "
                       "figure-8 (1). None of this microphone's patterns is one of them.",
            }
        return {
            "values": ["%s → [1, %s]" % (c["position_name"], num(c["gradient"])) for c in placed],
            "access": "read-only",
            "evidence": [("specifications.pickup_patterns[].pattern_base", c["corpus"]) for c in placed],
            "why": "Derived from the pattern rather than published: Value[1] is the order, "
                   "Value[2] the first-order coefficient.",
        }

    @staticmethod
    def _sensitivity(rec):
        rows = [p for p in (rec.get("specifications") or {}).get("pickup_patterns") or []
                if p.get("sensitivity_mv_pa") is not None]
        if not rows:
            return {"status": "unknown", "why": "No sensitivity figure is published for this microphone."}
        many = len(rows) > 1
        return {
            "values": [("%s: " % (p.get("pattern_base") or p.get("pattern")) if many else "") +
                       num(p["sensitivity_mv_pa"], " mV/Pa") for p in rows],
            "access": "read-only",
            "evidence": [("specifications.pickup_patterns[].sensitivity_mv_pa",
                          num(p["sensitivity_mv_pa"], " mV/Pa")) for p in rows],
            "why": "Rated sensitivity — which the profile notes is quoted relative to 0 dB gain.",
        }

    @staticmethod
    def _unknown(why):
        return lambda rec: {"status": "unknown", "why": why}

    # ---- wireless

    @staticmethod
    def _rf_frequency(rec):
        cov = rec["rf"]["coverage"]
        if cov.get("start_mhz") is None or cov.get("end_mhz") is None:
            return {"status": "unknown", "why": "No usable coverage figures in the dataset."}
        tunable = cov.get("tunable_mhz")
        return {
            "value": "%s – %s MHz%s" % (
                num(cov["start_mhz"]), num(cov["end_mhz"]),
                " · %s MHz tunable" % num(tunable) if tunable is not None else ""),
            "access": "local",
            "evidence": [
                ("rf.coverage.start_mhz", num(cov["start_mhz"], " MHz")),
                ("rf.coverage.end_mhz", num(cov["end_mhz"], " MHz")),
                ("rf.coverage.tunable_mhz", num(tunable, " MHz") if tunable is not None else "—"),
            ],
            "why": "What the system can tune to. How it is tuned is not in the dataset.",
        }

    @staticmethod
    def _rf_band(rec):
        """The profile models band select as a switch whose position names are
        the band names, which is exactly the shape of these tuning ranges."""
        ranges = rec["rf"].get("ranges") or []
        if not ranges:
            return {"status": "unknown", "why": "The system lists no tuning ranges."}
        return {
            "values": ["Position %d · %s (%s–%s MHz)"
                       % (i, r["name"], num(r["start_mhz"]), num(r["end_mhz"]))
                       for i, r in enumerate(ranges)],
            "access": "local",
            "evidence": [("rf.ranges[].name", r["name"]) for r in ranges],
            "why": "The profile's OcaSwitch position names are band names, so the tuning ranges "
                   "drop straight in.",
        }

    @staticmethod
    def _rf_device_name(rec):
        return {
            "value": rec["identity"]["full_name"],
            "access": "read-only",
            "evidence": [("identity.full_name", rec["identity"]["full_name"])],
            "why": "The profile fixes the class as OcaDeviceManager but leaves the property “tbd”.",
        }

    def tables(self):
        common = {
            "manufacturer": self._manufacturer,
            "serial_number": self._serial_number,
            "user_label": self._user_label,
            "type": self._type,
        }
        mic = {
            "pad": self._pad,
            "low_cut": self._low_cut,
            "polar_pattern": self._polar_pattern,
            "pattern_parameter": self._pattern_parameter,
            "sensitivity": self._sensitivity,
            "gain": self._unknown(
                "The catalogue describes the microphone, not a gain stage in it. The profile is "
                "specific here: 0 dB must be inside the range, because rated sensitivity is "
                "quoted against it."),
            "polarity": self._unknown("Polarity inversion is not a field the catalogue carries."),
            "mute": self._unknown("Mute is not a field the catalogue carries."),
            "sample_rate": self._unknown("The converter's sample rate is not published on these pages."),
            "resolution": self._unknown("Word length is not published on these pages."),
            "latency": self._unknown("Conversion latency is not published on these pages."),
        }
        rf = {
            "rf_frequency": self._rf_frequency,
            "rf_band": self._rf_band,
            "rf_device_name": self._rf_device_name,
            "rf_device_id": self._unknown("The dataset carries no device identifier."),
            "rf_status": self._unknown("A runtime reading. Nothing static could supply it."),
            "rf_swr": self._unknown("A runtime measurement. Nothing static could supply it."),
            "rf_mute": self._unknown("A control state, not a published specification."),
            "rf_power": self._unknown("Output power levels are not in this dataset."),
            "rf_transmission_mode": self._unknown("Transmission modes are not in this dataset."),
            "rf_booster_gain": self._unknown("External boosters are not part of the system record."),
        }
        mic.update(common)
        rf.update(common)
        return mic, rf

    # ----------------------------------------------------------------- reading

    def read(self, rec):
        kind = "rf" if (rec.get("classification") or {}).get("kind") == "rf" else "microphone"
        blocks = self.block_states(rec, kind)
        mic_table, rf_table = self.tables()
        table = rf_table if kind == "rf" else mic_table
        rows = []

        for param in self.profile["parameters"]:
            oca = param["oca"]
            row = {
                "key": param["key"],
                "profile_name": param["profile_name"],
                "section": param["section"],
                "block": param.get("block"),
                "oca_class": oca["class"],
                "role_name": oca.get("role_name"),
                "property": oca.get("property") or [],
                "unit": param.get("unit"),
                "status": "unknown",
                "value": None,
                "values": [],
                "access": None,
                "evidence": [],
                "why": None,
            }

            # Which blocks could carry this parameter, and what the device did
            # with them. The audio half names one block; the RF half a grid.
            if param["section"] == "rf":
                owners = list((param.get("applicability") or {}).keys())
            else:
                owners = [param["block"]] if param.get("block") else []
            states = [blocks[k] for k in owners if k in blocks]
            live = [s for s in states if s["status"] != "not-instantiated"]

            # A block the device does not have settles the question before the
            # draft's own gaps do. R-F link test and external filter band are
            # both unbound placeholders, but on a wired microphone that is beside
            # the point — they belong out of scope, not in the report body under
            # a Radio heading the device has no radio for.
            if owners and not live:
                row["status"] = "not-applicable"
                row["why"] = states[0]["why"]
            elif not oca["resolved"]:
                row["status"] = "undefined-in-profile"
                row["why"] = param.get("notes") or "The draft names this parameter but binds it to nothing."

            fn = table.get(param["key"])
            got = fn(rec) if fn else None

            if got:
                if row["status"] == "undefined-in-profile":
                    # The binding is open, but showing what the catalogue *would*
                    # have said is more useful than an empty cell — as long as
                    # the status still says there is nothing to conform to.
                    if got.get("value") is not None:
                        row["value"] = got["value"]
                    row["values"] = got.get("values") or []
                    row["evidence"] = got.get("evidence") or []
                    row["why"] = got.get("why") or row["why"]
                elif row["status"] != "not-applicable":
                    row["status"] = got.get("status") or "mapped"
                    row["value"] = got.get("value")
                    row["values"] = got.get("values") or []
                    row["access"] = got.get("access")
                    row["evidence"] = got.get("evidence") or []
                    row["why"] = got.get("why")
            elif row["status"] == "unknown" and not row["why"]:
                unclear = next((s for s in states if s["status"] == "unknown"), None)
                row["why"] = (unclear["why"] if unclear
                              else "No field in the catalogue record carries this parameter.")

            if row["status"] == "mapped" and not row["values"] and row["value"] is None:
                row["status"] = "unknown"
                row["why"] = row["why"] or "The extractor found nothing to report."

            # A serial number or a user's label belongs to a unit, not to a
            # model. Leaving them in the denominator would mark every record
            # down for missing something no record can carry — so they are
            # reported and not scored. If a record ever does supply one, the
            # mapped status stands and it counts.
            if row["status"] == "unknown" and param["key"] in self.not_scorable:
                row["status"] = "runtime"
                row["why"] = row["why"] or self.not_scorable[param["key"]]

            row["evidence"] = [{"path": p, "value": "" if v is None else str(v)}
                               for p, v in row["evidence"]]
            rows.append(row)

        def count(status):
            return sum(1 for r in rows if r["status"] == status)

        na = count("not-applicable")
        undefined = count("undefined-in-profile")
        runtime = count("runtime")
        applicable = len(rows) - na - undefined - runtime
        mapped = count("mapped")

        return {
            "profile_id": self.profile["profile"]["id"],
            "profile_revision": self.profile["profile"].get("revision"),
            "subject": {
                "kind": kind,
                "brand_slug": rec["source"].get("brand_slug"),
                "model_slug": rec["source"].get("model_slug"),
                "full_name": rec["identity"]["full_name"],
            },
            "control": {
                "aes70_declared": False,
                "remote_control_points": sum(1 for r in rows if r["access"] == "aes70"),
                "note": self.control_note,
            },
            "coverage": {
                "total": len(rows),
                "mapped": mapped,
                "absent": count("absent"),
                "unknown": count("unknown"),
                "not_applicable": na,
                "undefined_in_profile": undefined,
                "runtime": runtime,
                "applicable": applicable,
                "mapped_pct": round(mapped / applicable * 100) if applicable else None,
            },
            "blocks": [
                {
                    "key": b["key"],
                    "name": b["name"],
                    "domain": b["domain"],
                    "status": blocks.get(b["key"], {}).get("status", "unknown"),
                    "why": blocks.get(b["key"], {}).get("why", ""),
                }
                for b in self.profile["blocks"]
            ],
            "parameters": rows,
        }


class Wordbook:
    """Strings every record repeats — reasons, evidence paths, access terms —
    interned once and shipped with the profile instead of 1,831 times."""

    def __init__(self):
        self.words = []
        self._index = {}

    def intern(self, text):
        """Index of `text`, or -1 for nothing. Indices are stable per build."""
        if text is None or text == "":
            return -1
        if text not in self._index:
            self._index[text] = len(self.words)
            self.words.append(text)
        return self._index[text]


def compact(report, book):
    """The report as it ships: see js/x230.js expand() for the other half.

    Not-applicable parameters are the majority for an analog microphone and all
    share their block's reason, so they travel grouped by reason rather than as
    thirty near-identical rows.
    """
    cov = report["coverage"]
    rows, skipped = [], {}

    for row in report["parameters"]:
        if row["status"] == "not-applicable":
            skipped.setdefault(book.intern(row["why"]), []).append(row["key"])
            continue
        values = row["values"] or ([row["value"]] if row["value"] is not None else [])
        rows.append([
            row["key"],
            STATUS_CODE[row["status"]],
            values,
            book.intern(row["access"]),
            book.intern(row["why"]),
            [[book.intern(e["path"]), e["value"]] for e in row["evidence"]],
        ])

    return {
        "p": cov["mapped_pct"],
        "c": [cov["total"], cov["mapped"], cov["absent"], cov["unknown"],
              cov["not_applicable"], cov["undefined_in_profile"], cov["applicable"],
              cov["runtime"]],
        "b": [[b["status"][0], book.intern(b["why"])] for b in report["blocks"]],
        "r": rows,
        "n": [[why, keys] for why, keys in skipped.items()],
    }


class Summary:
    """Corpus-wide coverage, accumulated one report at a time.

    The per-device score answers "how much of the profile does this record
    fill?". This answers the more useful question for a standards draft: which
    parameters can a specification sheet answer at all, and which can none of
    them answer? A parameter's denominator is the records where it was actually
    asked — mapped, absent or unknown — so blocks a device never instantiates
    and parameters the draft left unbound do not dilute the figure.
    """

    def __init__(self, profile):
        self.profile = profile
        self.names = {p["key"]: p for p in profile["parameters"]}
        self.per_param = {p["key"]: dict.fromkeys(
            ("mapped", "absent", "unknown", "not-applicable", "undefined-in-profile", "runtime"), 0)
            for p in profile["parameters"]}
        self.per_block = {b["key"]: dict.fromkeys(
            ("instantiated", "not-instantiated", "unknown"), 0) for b in profile["blocks"]}
        self.scores = []
        self.kinds = {"microphone": 0, "rf": 0}

    def add(self, report):
        self.kinds[report["subject"]["kind"]] = self.kinds.get(report["subject"]["kind"], 0) + 1
        if report["coverage"]["mapped_pct"] is not None:
            self.scores.append(report["coverage"]["mapped_pct"])
        for row in report["parameters"]:
            self.per_param[row["key"]][row["status"]] += 1
        for block in report["blocks"]:
            self.per_block[block["key"]][block["status"]] += 1

    @staticmethod
    def _median(values):
        if not values:
            return None
        ordered = sorted(values)
        mid = len(ordered) // 2
        if len(ordered) % 2:
            return ordered[mid]
        return round((ordered[mid - 1] + ordered[mid]) / 2, 1)

    def _parameters(self):
        rows = []
        for key, counts in self.per_param.items():
            spec = self.names[key]
            asked = counts["mapped"] + counts["absent"] + counts["unknown"]
            rows.append({
                "key": key,
                "profile_name": spec["profile_name"],
                "section": spec["section"],
                "block": spec.get("block"),
                "oca_class": spec["oca"]["class"],
                "mapped": counts["mapped"],
                "absent": counts["absent"],
                "unknown": counts["unknown"],
                "not_applicable": counts["not-applicable"],
                "undefined_in_profile": counts["undefined-in-profile"],
                "runtime": counts["runtime"],
                "asked": asked,
                "fill_pct": round(counts["mapped"] / asked * 100) if asked else None,
            })
        # Best filled first; parameters nothing ever asks fall to the bottom.
        rows.sort(key=lambda r: (r["fill_pct"] is None, -(r["fill_pct"] or 0), r["profile_name"]))
        return rows

    def _notes(self, params):
        """The reading of the table, written where the numbers are, so the page
        cannot describe a distribution it is not showing."""
        total = len(self.scores)
        answered = [p for p in params if p["fill_pct"] is not None and p["mapped"]]
        silent = [p for p in params if p["fill_pct"] == 0]
        never = [p for p in params if p["fill_pct"] is None]
        full = [p for p in answered if p["fill_pct"] == 100]
        partial = [p for p in answered if p["fill_pct"] < 100]
        listing = lambda rows, n=4: ", ".join("%s (%d%%)" % (r["profile_name"], r["fill_pct"])
                                              for r in rows[:n])
        notes = []

        if total:
            notes.append(
                "Across %s records the catalogue answers a median of %s%% of the profile "
                "parameters that apply to each one — a mean of %s%%, from %d%% to %d%%."
                % (format(total, ","), self._median(self.scores),
                   round(sum(self.scores) / total, 1), min(self.scores), max(self.scores)))

        notes.append(
            "%d of the profile's %d parameters are answered by at least one record. %d are "
            "answered by none, and %d are never even asked — their block is never instantiated, "
            "or the draft never bound them."
            % (len(answered), len(params), len(silent), len(never)))

        if full:
            notes.append(
                "Answered every time they are asked: %s. These are identity and tuning — what a "
                "catalogue exists to publish."
                % ", ".join(p["profile_name"] for p in full))
        if partial:
            notes.append("Best covered after those: %s." % listing(partial, 3))
            # Only the genuinely sparse ones — otherwise a parameter answered
            # seven times in ten gets listed as thin next to one answered twice.
            thin = sorted([p for p in partial if 0 < p["fill_pct"] < 50],
                          key=lambda r: r["fill_pct"])[:3]
            if thin:
                notes.append(
                    "Sparsest of the ones that do get answers: %s. The source has a column for "
                    "each; on most pages it is empty." % listing(thin, 3))
        if silent:
            big = max(silent, key=lambda r: r["asked"])
            notes.append(
                "The %d silent parameters are the profile's control surface — gain, polarity, "
                "mute, dynamics, EQ, clocking, radio state. %s is asked of %s records and "
                "answered by none of them. A specification sheet describes what a microphone is; "
                "X230 describes what a controller can do to it, and this is the width of the gap."
                % (len(silent), big["profile_name"], format(big["asked"], ",")))
        return notes

    def result(self):
        params = self._parameters()
        buckets = []
        for low in range(0, 100, 10):
            count = sum(1 for s in self.scores if low <= s < low + 10 or (low == 90 and s == 100))
            buckets.append({"label": "%d–%d%%" % (low, low + 9), "min": low, "max": low + 10,
                            "count": count})
        blocks = []
        for spec in self.profile["blocks"]:
            counts = self.per_block[spec["key"]]
            blocks.append(dict(spec, **counts))
        return {
            "records": {"total": sum(self.kinds.values()), **self.kinds},
            "score": {
                "mean": round(sum(self.scores) / len(self.scores), 1) if self.scores else None,
                "median": self._median(self.scores),
                "min": min(self.scores) if self.scores else None,
                "max": max(self.scores) if self.scores else None,
                "histogram": buckets,
            },
            "blocks": blocks,
            "parameters": params,
            "notes": self._notes(params),
        }
