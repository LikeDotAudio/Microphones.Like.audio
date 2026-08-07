/* Reading a catalogue record as an AES-X230 profile instance.
 *
 * X230 describes a microphone as a set of AES70 control objects. This catalogue
 * describes microphones as specification sheets. The two are not the same kind
 * of thing, and the whole value of this view is in saying so precisely: for
 * every parameter the profile defines, either the catalogue can populate it, or
 * it positively records the function missing, or it cannot answer — and that
 * last case is a null, printed as one.
 *
 * The profile, its enumerations and the crosswalk from catalogue vocabulary all
 * live in data/x230.json (built from Research/aes_x230_profile.json). What lives
 * here is the reading: block instantiation, then one extractor per parameter.
 * The report this produces is described by Research/aes_x230_device.schema.json.
 *
 * A word on what "mapped" does not mean. No record in this catalogue publishes
 * an AES70 device model, so a mapped parameter says the catalogue knows the
 * value, not that the device exposes the object. `access` carries that
 * distinction: a pad the source marks "(Via Switch)" is a function you can put
 * your thumb on, not a control point a network can reach. */

import { el, num } from "./dom.js";

/* ------------------------------------------------------------------ loading */

let promise = null;
let profile = null;

export function ensureX230() {
  if (!promise) {
    promise = fetch("data/x230.json")
      .then((r) => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then((data) => { profile = data; return data; })
      .catch((err) => { promise = null; throw err; });
  }
  return promise;
}

/* Only valid once ensureX230() has resolved. */
export const x230 = () => profile;

/* ----------------------------------------------------------------- helpers */

const clean = (v) => (v == null || v === "" || v === "n/a" ? null : String(v));
const mhz = (v) => (v == null ? "—" : num(v));

const crosswalk = () => (profile && profile.crosswalk) || {};

function patternCross(name) {
  return (crosswalk().pattern_positions || []).find((p) => p.corpus === name) || null;
}

/* The connector is the only thing in the record that says a microphone converts
   on board — and therefore that it has an ADC block to describe at all. */
function digitalConnector(rec) {
  const want = ((crosswalk().digital_connectors || {}).match || []).map((s) => s.toLowerCase());
  for (const iface of (rec.specifications || {}).interfaces || []) {
    const c = (iface.connector || "").toLowerCase();
    if (want.some((w) => c.includes(w))) return iface.connector;
  }
  return null;
}

/* Distinct pattern names, preferring the normalised form. */
function patternNames(rec) {
  const out = [];
  for (const p of (rec.specifications || {}).pickup_patterns || []) {
    const name = p.pattern_base || p.pattern;
    if (name && name !== "None" && !out.includes(name)) out.push(name);
  }
  return out;
}

/* Pads and filters share a shape, and the same three-way answer: the column is
   missing (unknown), the column is there and empty (absent), or there are rows. */
function switchedList(rec, field, label, format) {
  const spec = rec.specifications || {};
  if (!(field in spec)) {
    return { status: "unknown", why: "This page carries no pads-and-filters column." };
  }
  const rows = spec[field] || [];
  if (!rows.length) {
    return {
      status: "absent",
      why: "The pads-and-filters column is present and lists no " + label + ".",
      evidence: [["specifications." + field, "[]"]],
    };
  }
  const local = rows.some((r) => /switch/i.test(r.mechanism || r.raw || ""));
  return {
    values: rows.map(format),
    access: local ? "local" : null,
    why: local
      ? "The source marks this “Via Switch”: a function on the microphone, not an object a controller can reach."
      : null,
    evidence: rows.map((r) => ["specifications." + field + "[].raw", r.raw]),
  };
}

/* ------------------------------------------------------- block instantiation
   Decided once per device. Every parameter inside a block that is not
   instantiated is not-applicable, so the reasoning is stated once instead of
   thirty times down the table. */

function blockStates(rec, kind) {
  const out = {};
  const set = (keys, status, why) => keys.forEach((k) => { out[k] = { status, why }; });
  const RF_BLOCKS = ["transmitter", "receiver", "analyzer", "manager", "xmit_antenna", "rcv_antenna"];

  if (kind === "rf") {
    set(["preamp", "processor", "adc", "utility"], "unknown",
      "The wireless dataset covers tuning and coordination. The audio chain inside the system is not described either way.");
    set(["device"], "instantiated", "Manufacturer and model name the device.");
    set(["transmitter", "receiver"], "instantiated",
      "A wireless system is a transmitter and a receiver; the tuning ranges belong to both.");
    set(["analyzer", "manager"], "not-instantiated",
      "The dataset describes a system, not the coordination hardware around it.");
    set(["xmit_antenna", "rcv_antenna"], "unknown",
      "Antennas are not itemised in the dataset, and the profile marks them optional anyway.");
    return out;
  }

  const conn = digitalConnector(rec);
  set(["preamp"], "instantiated",
    "Every microphone has an analog front end: pattern, pad, low-cut and rated sensitivity all sit here.");
  set(["device"], "instantiated", "Manufacturer and model name the device.");

  if (conn) {
    set(["adc"], "instantiated", "Converts on board — the interface is " + conn + ".");
    set(["processor", "utility"], "unknown",
      "A microphone that converts on board may process and may carry utility objects; the catalogue does not say.");
  } else {
    const iface = ((rec.specifications || {}).interfaces || [])[0];
    set(["adc"], "not-instantiated",
      "Analog output only" + (iface && iface.connector ? " — " + iface.connector + "." : "."));
    set(["processor", "utility"], "not-instantiated",
      "An analog microphone with no converter has nothing downstream to process and no utility objects to expose.");
  }
  set(RF_BLOCKS, "not-instantiated", "A wired microphone carries no radio blocks.");
  return out;
}

/* ------------------------------------------------------------- extractors
   Each returns the fields of one report row, or {status, why} to override.
   Returning nothing at all leaves the parameter unknown with a generic reason —
   which is the correct answer far more often than not. */

/* Device-level identity is the one part of the profile both record kinds can
   answer, so it lives outside the microphone/radio split. */
const COMMON = {
  manufacturer: (rec) => ({
    value: rec.identity.manufacturer,
    access: "read-only",
    evidence: [["identity.manufacturer", rec.identity.manufacturer]],
  }),

  serial_number: () => ({
    status: "unknown",
    why: "A per-unit value. This catalogue describes models, so there is nothing that could fill it.",
  }),

  user_label: () => ({
    status: "unknown",
    why: "Set by whoever installs the device. Not a catalogue fact at all.",
  }),

  type: (rec) => ({
    value: rec.classification.subtitle || null,
    evidence: [["classification.subtitle", rec.classification.subtitle || "—"]],
    why: "X230 never settled what Type means — its class cell reads “?”. The nearest thing the " +
      "catalogue has is the record's own descriptor, shown here for comparison.",
  }),
};

const MIC = {
  pad: (rec) => switchedList(rec, "pads", "pad",
    (p) => (p.value_db != null ? num(p.value_db, " dB") : p.raw)),

  low_cut: (rec) => switchedList(rec, "filters", "filter",
    (f) => [f.frequency_hz != null ? num(f.frequency_hz, " Hz") : null, f.slope]
      .filter(Boolean).join(", ") || f.raw),

  polar_pattern(rec) {
    const names = patternNames(rec);
    if (!names.length) return { status: "unknown", why: "This page lists no pickup pattern." };
    const multi = !!rec.classification.is_multipattern;
    const rows = names.map((n) => {
      const x = patternCross(n);
      return x && x.position != null
        ? "Position " + x.position + " · " + x.position_name
        : n + " — no profile position";
    });
    const unplaced = names.filter((n) => { const x = patternCross(n); return !x || x.position == null; });
    return {
      values: rows,
      access: multi ? "local" : "read-only",
      evidence: names.map((n) => ["specifications.pickup_patterns[].pattern_base", n]),
      why: unplaced.length
        ? "X230 leaves stereo unassigned, so " + unplaced.join(" and ") + " has no PatternType position."
        : (multi
          ? "Selected by a switch on the microphone, so the positions are real but the control point is not."
          : "A fixed pattern: reported rather than selected."),
    };
  },

  /* The profile publishes a gradient coefficient for exactly three patterns.
     Deriving the other seven would be inventing numbers the standard withheld. */
  pattern_parameter(rec) {
    const placed = patternNames(rec).map(patternCross).filter((x) => x && x.gradient != null);
    if (!placed.length) {
      return {
        status: "unknown",
        why: "The profile gives a coefficient only for omni (0), cardioid (0.5) and figure-8 (1). " +
          "None of this microphone's patterns is one of them.",
      };
    }
    return {
      values: placed.map((x) => x.position_name + " → [1, " + x.gradient + "]"),
      access: "read-only",
      evidence: placed.map((x) => ["specifications.pickup_patterns[].pattern_base", x.corpus]),
      why: "Derived from the pattern rather than published: Value[1] is the order, Value[2] the first-order coefficient.",
    };
  },

  sensitivity(rec) {
    const rows = ((rec.specifications || {}).pickup_patterns || [])
      .filter((p) => p.sensitivity_mv_pa != null);
    if (!rows.length) return { status: "unknown", why: "No sensitivity figure is published for this microphone." };
    return {
      values: rows.map((p) => (rows.length > 1 ? (p.pattern_base || p.pattern) + ": " : "") +
        num(p.sensitivity_mv_pa, " mV/Pa")),
      access: "read-only",
      evidence: rows.map((p) => ["specifications.pickup_patterns[].sensitivity_mv_pa",
        num(p.sensitivity_mv_pa, " mV/Pa")]),
      why: "Rated sensitivity — which the profile notes is quoted relative to 0 dB gain.",
    };
  },

  gain: () => ({
    status: "unknown",
    why: "The catalogue describes the microphone, not a gain stage in it. The profile is specific here: " +
      "0 dB must be inside the range, because rated sensitivity is quoted against it.",
  }),

  polarity: () => ({ status: "unknown", why: "Polarity inversion is not a field the catalogue carries." }),
  mute: () => ({ status: "unknown", why: "Mute is not a field the catalogue carries." }),

  sample_rate: () => ({ status: "unknown", why: "The converter's sample rate is not published on these pages." }),
  resolution: () => ({ status: "unknown", why: "Word length is not published on these pages." }),
  latency: () => ({ status: "unknown", why: "Conversion latency is not published on these pages." }),

};

const RF = {
  rf_frequency(rec) {
    const c = rec.rf.coverage;
    if (c.start_mhz == null || c.end_mhz == null) {
      return { status: "unknown", why: "No usable coverage figures in the dataset." };
    }
    return {
      value: mhz(c.start_mhz) + " – " + mhz(c.end_mhz) + " MHz" +
        (c.tunable_mhz != null ? " · " + mhz(c.tunable_mhz) + " MHz tunable" : ""),
      access: "local",
      evidence: [
        ["rf.coverage.start_mhz", mhz(c.start_mhz) + " MHz"],
        ["rf.coverage.end_mhz", mhz(c.end_mhz) + " MHz"],
        ["rf.coverage.tunable_mhz", c.tunable_mhz == null ? "—" : mhz(c.tunable_mhz) + " MHz"],
      ],
      why: "What the system can tune to. How it is tuned is not in the dataset.",
    };
  },

  /* The profile models band select as a switch whose position names are the band
     names, which is exactly the shape of this dataset's tuning ranges. */
  rf_band(rec) {
    const ranges = rec.rf.ranges || [];
    if (!ranges.length) return { status: "unknown", why: "The system lists no tuning ranges." };
    return {
      values: ranges.map((r, i) => "Position " + i + " · " + r.name +
        " (" + mhz(r.start_mhz) + "–" + mhz(r.end_mhz) + " MHz)"),
      access: "local",
      evidence: ranges.map((r) => ["rf.ranges[].name", r.name]),
      why: "The profile's OcaSwitch position names are band names, so the tuning ranges drop straight in.",
    };
  },

  rf_device_name: (rec) => ({
    value: rec.identity.full_name,
    access: "read-only",
    evidence: [["identity.full_name", rec.identity.full_name]],
    why: "The profile fixes the class as OcaDeviceManager but leaves the property “tbd”.",
  }),

  rf_device_id: () => ({ status: "unknown", why: "The dataset carries no device identifier." }),

  rf_status: () => ({ status: "unknown", why: "A runtime reading. Nothing static could supply it." }),
  rf_swr: () => ({ status: "unknown", why: "A runtime measurement. Nothing static could supply it." }),
  rf_mute: () => ({ status: "unknown", why: "A control state, not a published specification." }),
  rf_power: () => ({ status: "unknown", why: "Output power levels are not in this dataset." }),
  rf_transmission_mode: () => ({ status: "unknown", why: "Transmission modes are not in this dataset." }),
  rf_booster_gain: () => ({ status: "unknown", why: "External boosters are not part of the system record." }),
};

/* ----------------------------------------------------------------- reading */

const rfBlocksOf = (param) => Object.keys(param.applicability || {});

export function readDevice(rec) {
  const kind = rec.classification && rec.classification.kind === "rf" ? "rf" : "microphone";
  const blocks = blockStates(rec, kind);
  const table = Object.assign({}, COMMON, kind === "rf" ? RF : MIC);
  const rows = [];

  for (const p of profile.parameters) {
    const row = {
      key: p.key,
      profile_name: p.profile_name,
      section: p.section,
      block: p.block || null,
      oca_class: p.oca.class,
      role_name: p.oca.role_name,
      property: p.oca.property || [],
      unit: p.unit || null,
      status: "unknown",
      value: null,
      values: [],
      access: null,
      evidence: [],
      why: null,
    };

    /* Which blocks could carry this parameter, and what the device did with
       them. The audio half names one block; the RF half names a grid. */
    const owners = p.section === "rf" ? rfBlocksOf(p) : (p.block ? [p.block] : []);
    const states = owners.map((k) => blocks[k]).filter(Boolean);
    const live = states.filter((s) => s.status !== "not-instantiated");

    if (!p.oca.resolved) {
      row.status = "undefined-in-profile";
      row.why = p.notes || "The draft names this parameter but binds it to nothing.";
    } else if (owners.length && !live.length) {
      row.status = "not-applicable";
      row.why = states[0].why;
    }

    const fn = table[p.key];
    const got = (fn && fn(rec)) || null;

    if (got) {
      if (row.status === "undefined-in-profile") {
        /* The binding is open, but showing what the catalogue *would* have said
           is more useful than an empty cell — as long as the status still says
           there is nothing to conform to. */
        if (got.value != null) row.value = got.value;
        if (got.values) row.values = got.values;
        row.evidence = got.evidence || [];
        row.why = got.why || row.why;
      } else if (row.status !== "not-applicable") {
        row.status = got.status || "mapped";
        row.value = got.value != null ? got.value : null;
        row.values = got.values || [];
        row.access = got.access || null;
        row.evidence = got.evidence || [];
        row.why = got.why || null;
      }
    } else if (row.status === "unknown" && !row.why) {
      const unclear = states.find((s) => s.status === "unknown");
      row.why = unclear ? unclear.why : "No field in the catalogue record carries this parameter.";
    }

    if (row.status === "mapped" && !row.values.length && row.value == null) {
      row.status = "unknown";
      row.why = row.why || "The extractor found nothing to report.";
    }
    rows.push(row);
  }

  const count = (s) => rows.filter((r) => r.status === s).length;
  const na = count("not-applicable");
  const open = count("undefined-in-profile");
  const applicable = rows.length - na - open;
  const mapped = count("mapped");

  return {
    profile_id: profile.profile.id,
    profile_revision: profile.profile.revision || null,
    subject: {
      kind,
      brand_slug: rec.source.brand_slug || null,
      model_slug: rec.source.model_slug || null,
      full_name: rec.identity.full_name,
    },
    control: {
      aes70_declared: false,
      remote_control_points: rows.filter((r) => r.access === "aes70").length,
      note: "Nothing in this catalogue publishes an AES70 device model. A mapped parameter means the " +
        "catalogue knows the value, not that the microphone exposes the object.",
    },
    coverage: {
      total: rows.length,
      mapped,
      absent: count("absent"),
      unknown: count("unknown"),
      not_applicable: na,
      undefined_in_profile: open,
      applicable,
      mapped_pct: applicable ? Math.round((mapped / applicable) * 100) : null,
    },
    blocks: profile.blocks.map((b) => ({
      key: b.key,
      name: b.name,
      domain: b.domain,
      status: (blocks[b.key] || {}).status || "unknown",
      why: (blocks[b.key] || {}).why || "",
    })),
    parameters: rows,
  };
}

/* --------------------------------------------------------------- rendering */

const STATUS_LABEL = {
  mapped: "mapped",
  absent: "not implemented",
  unknown: "unknown",       /* the value cell prints the NULL; saying it twice is noise */
  "not-applicable": "n/a",
  "undefined-in-profile": "open in draft",
};

const ACCESS_LABEL = { aes70: "AES70 control point", local: "local control only", "read-only": "reported value" };

function paramRow(p) {
  const row = el("div", "x230row s-" + p.status);

  const head = el("div", "x230head");
  head.appendChild(el("span", "x230name", p.profile_name));
  head.appendChild(el("span", "x230st", STATUS_LABEL[p.status] || p.status));
  row.appendChild(head);

  if (p.values.length) {
    const v = el("div", "x230val");
    p.values.forEach((line) => v.appendChild(el("div", null, line)));
    row.appendChild(v);
  } else if (p.value != null) {
    row.appendChild(el("div", "x230val", p.value));
  } else {
    row.appendChild(el("div", "x230val nul", p.status === "unknown" ? "NULL" : "—"));
  }

  const bind = [p.oca_class, p.role_name, (p.property || []).join(" / ")].filter(Boolean).join(" · ");
  if (bind) row.appendChild(el("div", "x230bind", bind));
  if (p.access) row.appendChild(el("div", "x230acc", ACCESS_LABEL[p.access] || p.access));
  if (p.why) row.appendChild(el("div", "x230why", p.why));
  if (p.evidence.length) {
    row.title = p.evidence.map((e) => e[0] + " = " + e[1]).join("\n");
  }
  return row;
}

function meter(cov) {
  const bar = el("div", "x230meter");
  const parts = [
    ["mapped", cov.mapped], ["absent", cov.absent], ["unknown", cov.unknown],
    ["undefined-in-profile", cov.undefined_in_profile], ["not-applicable", cov.not_applicable],
  ];
  for (const [key, n] of parts) {
    if (!n) continue;
    const seg = el("b", "s-" + key);
    seg.style.width = ((n / cov.total) * 100).toFixed(2) + "%";
    seg.title = n + " " + (STATUS_LABEL[key] || key);
    bar.appendChild(seg);
  }
  return bar;
}

/* The detail-pane section. Returns immediately with a placeholder and fills in
   once the profile lands, so the caller stays synchronous. */
export function x230Section(rec) {
  const host = el("section", "block x230");
  host.appendChild(el("h3", null, "AES-X230 profile"));
  const body = el("div");
  body.appendChild(el("div", "sub", "Reading the profile…"));
  host.appendChild(body);

  ensureX230()
    .then(() => {
      body.innerHTML = "";
      body.appendChild(buildReport(readDevice(rec)));
    })
    .catch((err) => {
      body.innerHTML = "";
      body.appendChild(el("div", "sub", "Could not load data/x230.json — " + err.message));
    });

  return host;
}

function buildReport(rep) {
  const wrap = el("div", "x230rep");
  const cov = rep.coverage;

  wrap.appendChild(meter(cov));
  wrap.appendChild(el("div", "x230sum",
    cov.mapped + " of " + cov.applicable + " applicable parameters mapped" +
    (cov.mapped_pct != null ? " (" + cov.mapped_pct + "%)" : "") +
    " · " + cov.unknown + " null · " + cov.absent + " not implemented · " +
    cov.not_applicable + " out of scope · " + cov.undefined_in_profile + " open in the draft"));
  wrap.appendChild(el("div", "x230note", rep.control.note));

  const chips = el("div", "badges");
  for (const b of rep.blocks) {
    const chip = el("span", "tag x230blk b-" + b.status, b.name);
    chip.title = b.why;
    chips.appendChild(chip);
  }
  wrap.appendChild(chips);

  /* Out-of-scope parameters are the majority for an analog microphone, and
     listing thirty greyed rows would bury the six that carry data. */
  const live = rep.parameters.filter((p) => p.status !== "not-applicable");
  const dead = rep.parameters.filter((p) => p.status === "not-applicable");

  const byBlock = new Map();
  for (const p of live) {
    const key = p.block || (p.section === "rf" ? "radio" : "unplaced");
    if (!byBlock.has(key)) byBlock.set(key, []);
    byBlock.get(key).push(p);
  }
  const blockName = new Map(rep.blocks.map((b) => [b.key, b.name]));
  for (const [key, rows] of byBlock) {
    wrap.appendChild(el("div", "x230grp",
      blockName.get(key) || (key === "radio" ? "Radio" : "Unplaced in the draft")));
    rows.forEach((p) => wrap.appendChild(paramRow(p)));
  }

  if (dead.length) {
    const det = el("details", "x230na");
    det.appendChild(el("summary", null, dead.length + " parameters out of scope for this device"));
    dead.forEach((p) => det.appendChild(paramRow(p)));
    wrap.appendChild(det);
  }
  return wrap;
}
