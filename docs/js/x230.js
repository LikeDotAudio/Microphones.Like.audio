/* The AES-X230 panel on a device page.
 *
 * The reading itself is not done here. docs/x230_read.py reads every record
 * against the profile at build time, because the score it produces is a facet —
 * the model list filters and sorts on it, so it has to be on the index row
 * before the first card is drawn. Doing it a second time in the browser would
 * be two implementations of one judgement, free to disagree with each other.
 *
 * So each record ships a compact report under `x230`, and this module expands
 * it back out against data/x230.json and draws it. The compact form drops
 * everything the profile already says (parameter names, classes, roles,
 * properties) and interns the strings every record repeats into a wordbook:
 *
 *   p  mapped percentage
 *   c  [total, mapped, absent, unknown, not-applicable, open-in-draft, applicable]
 *   b  per profile block, [status initial, why index]
 *   r  rows that carry something, [key, status code, values, access, why, evidence]
 *   n  the not-applicable majority, grouped [why index, [keys]]
 *
 * See x230_read.py compact() for the other half of this contract. */

import { el } from "./dom.js";

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

/* ---------------------------------------------------------------- expanding */

const STATUS = { m: "mapped", a: "absent", u: "unknown", o: "undefined-in-profile" };
const BLOCK_STATUS = { i: "instantiated", n: "not-instantiated", u: "unknown" };

export function expand(rec) {
  const packed = rec.x230;
  if (!packed) return null;
  const words = profile.wordbook || [];
  const word = (i) => (i == null || i < 0 ? null : words[i]);

  const order = new Map(profile.parameters.map((p, i) => [p.key, i]));
  const spec = new Map(profile.parameters.map((p) => [p.key, p]));

  const shell = (key) => {
    const p = spec.get(key) || {};
    const oca = p.oca || {};
    return {
      key,
      profile_name: p.profile_name || key,
      section: p.section,
      block: p.block || null,
      oca_class: oca.class || null,
      role_name: oca.role_name || null,
      property: oca.property || [],
      unit: p.unit || null,
      status: "unknown",
      value: null,
      values: [],
      access: null,
      evidence: [],
      why: null,
    };
  };

  const rows = [];
  for (const [key, code, values, access, why, evidence] of packed.r) {
    const row = shell(key);
    row.status = STATUS[code] || "unknown";
    row.values = values || [];
    row.access = word(access);
    row.why = word(why);
    row.evidence = (evidence || []).map(([path, value]) => ({ path: word(path), value }));
    rows.push(row);
  }
  for (const [why, keys] of packed.n || []) {
    for (const key of keys) {
      const row = shell(key);
      row.status = "not-applicable";
      row.why = word(why);
      rows.push(row);
    }
  }
  rows.sort((a, b) => (order.get(a.key) ?? 0) - (order.get(b.key) ?? 0));

  const [total, mapped, absent, unknown, na, open, applicable] = packed.c;
  return {
    profile_id: profile.profile.id,
    profile_revision: profile.profile.revision || null,
    subject: {
      kind: rec.classification && rec.classification.kind === "rf" ? "rf" : "microphone",
      brand_slug: rec.source.brand_slug || null,
      model_slug: rec.source.model_slug || null,
      full_name: rec.identity.full_name,
    },
    control: {
      aes70_declared: false,
      remote_control_points: rows.filter((r) => r.access === "aes70").length,
      note: (profile.crosswalk || {}).control_note || "",
    },
    coverage: {
      total, mapped, absent, unknown,
      not_applicable: na,
      undefined_in_profile: open,
      applicable,
      mapped_pct: packed.p,
    },
    blocks: profile.blocks.map((b, i) => {
      const [code, why] = (packed.b || [])[i] || ["u", -1];
      return { key: b.key, name: b.name, domain: b.domain,
        status: BLOCK_STATUS[code] || "unknown", why: word(why) || "" };
    }),
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
    row.title = p.evidence.map((e) => e.path + " = " + e.value).join("\n");
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
      const rep = expand(rec);
      body.innerHTML = "";
      body.appendChild(rep
        ? buildReport(rep)
        : el("div", "sub", "This record carries no X230 reading — rebuild with docs/build_data.py."));
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

  const score = el("div", "x230score");
  score.appendChild(el("b", null, cov.mapped_pct == null ? "—" : cov.mapped_pct + "%"));
  score.appendChild(el("span", null, cov.mapped + " of " + cov.applicable + " applicable parameters"));
  wrap.appendChild(score);

  wrap.appendChild(meter(cov));
  wrap.appendChild(el("div", "x230sum",
    cov.unknown + " null · " + cov.absent + " not implemented · " +
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
