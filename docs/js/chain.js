/* Turning a record into a signal chain.
 *
 * The blocks and their order are config (vocabulary.MIC_CHAIN / RF_CHAIN); this
 * module holds the extractors those blocks name. An extractor reads one record
 * and returns:
 *
 *   { lines:  captions to draw inside the block
 *     detail: [[field, value], …] — the record fields it actually read }
 *
 * `detail` is what the table under the drawing lists, so every box on screen
 * can be traced back to the data that put it there. Returning null means the
 * block has nothing to show and an optional block is dropped, which is what
 * makes each drawing specific: a mic with no pad gets no attenuator. */

import { cfg } from "./config.js";
import { cap, num } from "./dom.js";

const first = (v) => (Array.isArray(v) ? v[0] : v);
const clean = (s) => (s == null || s === "" || s === "n/a" ? null : String(s));

/* Tags carry the construction details the spec tables don't: tube types,
   transformer coupling, capsule lineage. */
const tagList = (mic) =>
  (mic.classification.tags || []).map((t) => (typeof t === "string" ? t : t.name));

const hasTag = (mic, name) => tagList(mic).includes(name);

/* Valve part numbers appear as bare tags — 12ax7, ef86, vf14, 6072… */
const TUBE_TAG = /^(\d{1,2}[a-z]{1,3}\d{0,2}[a-z]?|ef\d+|vf\d+|ac\d+|k\d+[a-z]?)$/i;
const KNOWN_NON_TUBE = new Set(["k47", "k67", "k87", "k48", "m7", "m8", "603s", "5840", "6072"]);

function tubeTypes(mic) {
  return tagList(mic).filter((t) => TUBE_TAG.test(t) && !KNOWN_NON_TUBE.has(t.toLowerCase()));
}

/* ------------------------------------------------------- more than one path

   Two records in the corpus need more than a single row of boxes, and one
   needs both at once:

   - a stereo mic is two capsules and two amplifier chains in one body, so it
     is drawn as two chains meeting at the connector;
   - a mic offering omni *and* figure-8 cannot be doing it with one diaphragm.
     That pair is the signature of a dual-backplate capsule: two cardioid
     elements whose outputs are summed with variable polarity, which is the
     pattern matrix. Front and rear are drawn separately, feeding it.

   A multipattern stereo mic — the C700S — is both, so each channel gets its
   own pair of diaphragms and its own matrix. */

/* Patterns that describe how a pair of capsules is being combined, not what
   one diaphragm hears. They belong to the array, so they are kept out of the
   element list and cited against the stereo split instead. */
const ARRAY_PATTERN = /stereo|blumlein|binaural|ambisonic|surround/i;

const patternsOf = (mic) => (mic.specifications.pickup_patterns || [])
  .map((p) => p.pattern_base || p.pattern).filter(Boolean);

const uniq = (list) => [...new Set(list)];

const elementPatterns = (mic) => uniq(patternsOf(mic).filter((p) => !ARRAY_PATTERN.test(p)));

const arrayPatterns = (mic) => uniq(patternsOf(mic).filter((p) => ARRAY_PATTERN.test(p)));

/* Omni and figure-8 from one capsule means two diaphragms — no single element
   does both. Three or more selectable patterns says the same thing the long
   way round, and catches the omni/cardioid/figure-8 classic. */
function dualDiaphragm(mic) {
  const el = elementPatterns(mic);
  const has = (re) => el.some((p) => re.test(p));
  return (has(/^omni/i) && has(/bidirectional|figure/i)) ||
    (mic.classification.is_multipattern && el.length >= 3);
}

/* What splits this chain, if anything: channels across, diaphragms within. */
export function splitOf(mic) {
  if (mic.classification.kind === "rf") return null;
  const stereo = !!mic.classification.is_stereo;
  const dual = dualDiaphragm(mic);
  if (!stereo && !dual) return null;

  const modes = arrayPatterns(mic);
  const el = elementPatterns(mic);
  const split = { channels: null, elements: null, notes: [] };

  if (stereo) {
    /* Mid-side is the one array whose two paths are not a left and a right;
       calling them so would misname what the drawing shows. */
    const midSide = modes.some((p) => /mid-side/i.test(p));
    split.channels = midSide && modes.length === 1 ? "mid-side" : "stereo";
    split.notes.push({
      key: split.channels,
      detail: [["classification.is_stereo", "true"]].concat(
        modes.length ? [["specifications.pickup_patterns[].pattern", modes.join(", ")]] : []),
    });
  }
  if (dual) {
    split.elements = "dual";
    split.notes.push({
      key: "dual",
      detail: [
        ["specifications.pickup_patterns[].pattern", el.join(", ")],
        ["classification.is_multipattern", String(!!mic.classification.is_multipattern)],
      ],
    });
  }
  return split;
}

/* ------------------------------------------------------------ microphone */

const EXTRACTORS = {
  transducer(mic) {
    const cls = mic.classification;
    const capsule = mic.specifications.capsule || {};
    const split = splitOf(mic);
    /* What one diaphragm hears. When the chain splits, the patterns belong to
       the blocks that make them — the matrix, or the stereo pair — so the
       capsule is left saying only what it is. */
    const patterns = split
      ? (split.elements ? [] : elementPatterns(mic))
      : (mic.specifications.pickup_patterns || []).map((p) => p.pattern).filter(Boolean);
    const lines = [cap(cls.transducer_type || "unknown")];
    const dia = capsule.diaphragm_diameter_mm || capsule.capsule_diameter_mm;
    if (patterns.length) {
      lines.push(cls.is_multipattern && patterns.length > 1
        ? patterns.length + " patterns"
        : patterns[0]);
    }
    if (dia) lines.push(num(dia, " mm"));

    const detail = [["classification.transducer_type", cls.transducer_type]];
    if (patterns.length) detail.push(["specifications.pickup_patterns[].pattern", patterns.join(", ")]);
    if (capsule.diaphragm_diameter_mm) {
      detail.push(["specifications.capsule.diaphragm_diameter_mm", num(capsule.diaphragm_diameter_mm, " mm")]);
    } else if (capsule.capsule_diameter_mm) {
      detail.push(["specifications.capsule.capsule_diameter_mm", num(capsule.capsule_diameter_mm, " mm")]);
    }
    if (cls.form_factor) detail.push(["classification.form_factor", cls.form_factor]);
    return { lines, detail };
  },

  /* The network that turns two diaphragms into a chosen pattern. Only a mic
     whose data implies a dual-backplate capsule gets one. */
  patternMatrix(mic) {
    const split = splitOf(mic);
    if (!split || !split.elements) return null;
    const el = elementPatterns(mic);
    return {
      lines: el.length > 3 ? [el.length + " patterns"] : el,
      detail: el.map((p) => ["specifications.pickup_patterns[].pattern", p]),
    };
  },

  pads(mic) {
    const pads = (mic.specifications.pads || []).map((p) => clean(p.raw)).filter(Boolean);
    if (!pads.length) return null;
    return {
      lines: pads.slice(0, 3),
      detail: pads.map((p) => ["specifications.pads[].raw", p]),
    };
  },

  filters(mic) {
    const filters = (mic.specifications.filters || []).map((f) => clean(f.raw)).filter(Boolean);
    if (!filters.length) return null;
    return {
      lines: filters.slice(0, 3),
      detail: filters.map((f) => ["specifications.filters[].raw", f]),
    };
  },

  /* Ribbons and passive dynamics have no active stage; drawing one would be a
     lie, so the block drops out for them. */
  preamp(mic) {
    const cls = mic.classification;
    const power = mic.specifications.power || {};
    const tubes = tubeTypes(mic);
    const active = cls.is_tube || power.requires_phantom_power ||
      cls.transducer_type === "condenser" || power.has_battery_compartment;
    if (!active) return null;

    const lines = [];
    const detail = [];
    if (cls.is_tube) {
      lines.push("Tube");
      detail.push(["classification.is_tube", "true"]);
      if (tubes.length) {
        lines.push(tubes.join(", ").toUpperCase());
        detail.push(["classification.tags", tubes.join(", ")]);
      }
    } else {
      lines.push("FET / solid state");
      detail.push(["classification.transducer_type", cls.transducer_type]);
    }
    if (hasTag(mic, "transformerless")) {
      lines.push("transformerless");
      detail.push(["classification.tags", "transformerless"]);
    }
    return { lines, detail };
  },

  output(mic) {
    const lines = [];
    const detail = [];
    if (hasTag(mic, "transformer-coupled")) {
      lines.push("Transformer");
      detail.push(["classification.tags", "transformer-coupled"]);
    } else if (hasTag(mic, "transformerless")) {
      lines.push("Transformerless");
      detail.push(["classification.tags", "transformerless"]);
    }
    const z = mic.specifications.impedance || {};
    if (z.ohms != null) {
      lines.push(num(z.ohms, " Ω"));
      detail.push(["specifications.impedance.ohms", num(z.ohms, " Ω")]);
    } else if (clean(z.raw)) {
      lines.push(z.raw);
      detail.push(["specifications.impedance.raw", z.raw]);
    }
    return lines.length ? { lines, detail } : null;
  },

  connector(mic) {
    const ifaces = mic.specifications.interfaces || [];
    if (!ifaces.length) {
      return { lines: ["unspecified"], detail: [["specifications.interfaces", "(none listed)"]] };
    }
    return {
      lines: ifaces.map((i) => i.connector + (i.count > 1 ? " ×" + i.count : "")),
      detail: ifaces.map((i) => ["specifications.interfaces[].raw", i.raw]),
    };
  },

  power(mic) {
    const p = (mic.specifications || {}).power || {};
    const lines = [];
    const detail = [];
    if (p.requires_phantom_power) {
      const v = (p.phantom_voltage_v || []).map((x) => x + "V").join(", ");
      lines.push("Phantom" + (v ? " " + v : ""));
      detail.push(["specifications.power.requires_phantom_power", "true"]);
      if (v) detail.push(["specifications.power.phantom_voltage_v", v]);
    }
    if (p.includes_tube_power_supply) {
      lines.push("Tube PSU");
      detail.push(["specifications.power.includes_tube_power_supply", "true"]);
    }
    if (p.has_battery_compartment) {
      lines.push("Battery" + (p.battery_type ? " · " + p.battery_type : ""));
      detail.push(["specifications.power.has_battery_compartment", "true"]);
      if (p.battery_type) detail.push(["specifications.power.battery_type", p.battery_type]);
    }
    return lines.length ? { lines, detail } : null;
  },

  /* -------------------------------------------------------------- wireless */

  rfTransducer() {
    /* The RF dataset describes the radio, not the capsule feeding it. Saying so
       is more useful than inventing a transducer that isn't in the data. */
    return {
      lines: ["capsule", "not in dataset"],
      muted: true,
      detail: [["—", "the RF source describes the radio only"]],
    };
  },

  rfPreamp(rec) {
    return {
      lines: ["gain stage"],
      muted: true,
      detail: [["—", "implied by the system class, not itemised in the source"]],
    };
  },

  rfAdc(rec) {
    const presets = rec.rf.presets || {};
    const lines = ["encode"];
    const detail = [];
    if (presets.max != null) {
      lines.push(presets.max.toLocaleString() + " presets");
      detail.push(["rf.presets.max", presets.max.toLocaleString()]);
      if (presets.min != null && presets.min !== presets.max) {
        detail.push(["rf.presets.min", presets.min.toLocaleString()]);
      }
    }
    return { lines, detail };
  },

  rfTransmitter(rec) {
    const c = rec.rf.coverage;
    const lines = [rec.classification.bands.join("/") || "RF"];
    const detail = [["classification.bands", rec.classification.bands.join(", ") || "—"]];
    if (c.start_mhz != null && c.end_mhz != null) {
      lines.push(c.start_mhz + "–" + c.end_mhz);
      detail.push(["rf.coverage.start_mhz", c.start_mhz + " MHz"]);
      detail.push(["rf.coverage.end_mhz", c.end_mhz + " MHz"]);
    }
    detail.push(["rf.range_count", String(rec.rf.range_count)]);
    return { lines, detail };
  },

  rfAntenna(rec) {
    const bands = rec.classification.bands;
    return {
      lines: bands.length ? bands : ["RF"],
      detail: [["classification.bands", bands.join(", ") || "—"]],
    };
  },

  rfOut(rec) {
    const c = rec.rf.coverage;
    const lines = [];
    const detail = [];
    if (c.tunable_mhz != null) {
      lines.push(c.tunable_mhz + " MHz tunable");
      detail.push(["rf.coverage.tunable_mhz", c.tunable_mhz + " MHz"]);
    }
    if (c.span_mhz != null) detail.push(["rf.coverage.span_mhz", c.span_mhz + " MHz"]);
    return { lines: lines.length ? lines : ["RF out"], detail };
  },

  rfControl(rec) {
    /* Coordination settings are the control surface this dataset does describe. */
    const seen = new Map();
    for (const r of rec.rf.ranges) {
      for (const key of ["bandwidth", "imd_3", "imd_3_tx_3rd", "imd_5"]) {
        const s = r[key];
        if (s && s.mode === "value") seen.set(key, s.mhz);
      }
    }
    if (!seen.size) return null;
    return {
      lines: [...seen.keys()].map((k) => k.replace(/_/g, "")),
      detail: [...seen.entries()].map(([k, v]) => ["rf.ranges[]." + k, v + " MHz spacing"]),
    };
  },
};

/* Which chain a record uses, and the blocks that survive its data. */
export function buildChain(rec) {
  const isRf = rec.classification && rec.classification.kind === "rf";
  const kind = isRf ? "rf" : "mic";
  const spec = isRf ? cfg().rfChain : cfg().micChain;
  const blocks = [];

  for (const def of spec) {
    const fn = EXTRACTORS[def.source];
    const got = fn ? fn(rec) : null;
    if (!got && def.optional) continue;
    blocks.push({
      ...def,
      shape: def.shape || "box",
      flow: def.flow || "audio",
      lines: got ? got.lines : [],
      muted: !!(got && got.muted),
      detail: got ? got.detail : [],
    });
  }

  const feeds = [];
  for (const def of cfg().chainFeeds) {
    if (def.kinds && !def.kinds.includes(kind)) continue;
    if (!blocks.some((b) => b.key === def.into)) continue;
    const fn = EXTRACTORS[def.source];
    const got = fn ? fn(rec) : null;
    if (!got && def.optional) continue;
    feeds.push({
      ...def,
      flow: def.flow || "control",
      lines: got ? got.lines : [],
      detail: got ? got.detail : [],
    });
  }

  return { kind, blocks, feeds, split: isRf ? null : splitFor(rec, blocks) };
}

/* The split, resolved against the blocks that survived and the words config
   gives each case. `keys` names the blocks that exist once per path — for a
   stereo mic that is the whole chain up to the connector the pair shares. */
function splitFor(mic, blocks) {
  const found = splitOf(mic);
  if (!found) return null;
  const words = (key) => (cfg().chainSplits || []).find((s) => s.key === key);
  const body = blocks.filter((b) => !b.terminal);
  if (!body.length) return null;          // nothing to run in parallel

  const chan = found.channels && words(found.channels);
  const elem = found.elements && words(found.elements);
  if (!chan && !elem) return null;

  return {
    channels: chan ? { ...chan, keys: body.map((b) => b.key) } : null,
    elements: elem ? { ...elem, keys: ["transducer"] } : null,
    notes: found.notes.map((n) => {
      const w = words(n.key) || { label: n.key.toUpperCase(), labels: [] };
      return { label: w.label, lines: [w.labels.join(" / ")], detail: n.detail, flow: "audio" };
    }),
  };
}
