/* The X230 tab: what the profile is, how it works, and every parameter in it.
 *
 * Nothing on this page is written here. The prose, the blocks, the diagram
 * summaries, the parameter table and the list of things the draft left open all
 * come out of data/x230.json — so the tab cannot drift away from the profile the
 * device pages are read against. See docs/js/x230.js for that reading. */

import { $, el } from "./dom.js";
import { ensureX230, x230 } from "./x230.js";

/* The schemas and the corpus statistics are their own fetch: every device page
   loads x230.json for its panel, and none of them needs this. */
let reportPromise = null;

function ensureReport() {
  if (!reportPromise) {
    reportPromise = fetch("data/x230_report.json")
      .then((r) => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .catch((err) => { reportPromise = null; throw err; });
  }
  return reportPromise;
}

/* JSON as nodes rather than markup — no innerHTML anywhere near a data file.
   One pass: quoted runs (a key if a colon follows), literals, numbers. */
const JSON_TOKEN = /("(?:\\.|[^"\\])*"\s*:?)|(\btrue\b|\bfalse\b|\bnull\b)|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g;

function jsonNodes(text) {
  const frag = document.createDocumentFragment();
  let last = 0, m;
  JSON_TOKEN.lastIndex = 0;
  while ((m = JSON_TOKEN.exec(text)) !== null) {
    if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
    const cls = m[1] ? (m[1].trimEnd().endsWith(":") ? "jk" : "js") : m[2] ? "jl" : "jn";
    frag.appendChild(el("span", cls, m[0]));
    last = m.index + m[0].length;
  }
  if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
  return frag;
}

function schemaCard(schemas) {
  const box = el("div", "x230card");
  box.appendChild(el("h3", null, "The schema, in JSON"));

  const bar = el("div", "x230tabs");
  const blurb = el("p", "x230sum2");
  const file = el("div", "x230no");
  const pre = el("pre", "jsoncode");

  const show = (spec, btn) => {
    bar.querySelectorAll("button").forEach((b) => b.classList.toggle("on", b === btn));
    blurb.textContent = spec.blurb;
    file.textContent = spec.filename + " · " +
      Object.keys(spec.schema.properties || {}).length + " top-level properties";
    pre.innerHTML = "";
    pre.appendChild(jsonNodes(JSON.stringify(spec.schema, null, 2)));
  };

  schemas.forEach((spec, i) => {
    const btn = el("button", "chip", spec.title);
    btn.type = "button";
    btn.addEventListener("click", () => show(spec, btn));
    bar.appendChild(btn);
    if (!i) setTimeout(() => show(spec, btn), 0);
  });

  box.append(bar, blurb, file, pre);
  return box;
}

/* How completely the catalogue answers the profile, parameter by parameter. */
function statsCard(stats) {
  const box = el("div", "x230card");
  box.appendChild(el("h3", null, "How complete the catalogue is"));

  const tiles = el("div", "x230tiles");
  const tile = (value, label) => {
    const t = el("div", "x230tile");
    t.appendChild(el("b", null, value));
    t.appendChild(el("span", null, label));
    tiles.appendChild(t);
  };
  const answered = stats.parameters.filter((p) => p.mapped > 0).length;
  const silent = stats.parameters.filter((p) => p.fill_pct === 0).length;
  tile(stats.records.total.toLocaleString(), "records read");
  tile(stats.score.median + "%", "median score");
  tile(answered + " / " + stats.parameters.length, "parameters ever answered");
  tile(String(silent), "answered by nothing");
  box.appendChild(tiles);

  for (const note of stats.notes || []) box.appendChild(el("p", "x230sum2", note));

  /* Score distribution. */
  box.appendChild(el("h4", null, "Score distribution"));
  const hist = el("div", "x230hist");
  const peak = Math.max(...stats.score.histogram.map((b) => b.count), 1);
  for (const bucket of stats.score.histogram) {
    const col = el("div", "x230bar" + (bucket.count ? "" : " zero"));
    const fill = el("i");
    fill.style.height = ((bucket.count / peak) * 100).toFixed(1) + "%";
    fill.title = bucket.count.toLocaleString() + " records scoring " + bucket.label;
    col.append(el("span", "n", bucket.count ? bucket.count.toLocaleString() : ""),
      fill, el("span", "x", bucket.label));
    hist.appendChild(col);
  }
  box.appendChild(hist);

  /* Per-parameter fill, best first. */
  box.appendChild(el("h4", null, "Fill rate, parameter by parameter"));
  box.appendChild(el("p", "x230sum2",
    "The denominator is the records the parameter was actually asked of — mapped, absent or " +
    "unknown. Records whose block never existed, and parameters the draft never bound, are " +
    "left out rather than counted as failures."));

  const table = el("table", "x230tab");
  const head = el("tr");
  ["Parameter", "Class", "Asked of", "Answered", "Fill", ""].forEach((h) =>
    head.appendChild(el("th", null, h)));
  table.appendChild(head);
  for (const p of stats.parameters) {
    const tr = el("tr", p.fill_pct === null ? "open" : null);
    tr.appendChild(el("td", "nm", p.profile_name));
    tr.appendChild(el("td", null, p.oca_class || "—"));
    tr.appendChild(el("td", "num", p.asked ? p.asked.toLocaleString() : "—"));
    tr.appendChild(el("td", "num", p.asked ? p.mapped.toLocaleString() : "—"));
    tr.appendChild(el("td", "num", p.fill_pct === null ? "never asked" : p.fill_pct + "%"));
    const barCell = el("td", "fillcell");
    if (p.fill_pct !== null) {
      const bar = el("div", "x230fill");
      const got = el("i");
      got.style.width = p.fill_pct + "%";
      bar.appendChild(got);
      barCell.appendChild(bar);
    }
    tr.appendChild(barCell);
    table.appendChild(tr);
  }
  const wrap = el("div", "tablewrap");
  wrap.appendChild(table);
  box.appendChild(wrap);
  return box;
}

/* The narrative is plain text apart from **bold** runs. */
function rich(text) {
  const frag = document.createDocumentFragment();
  String(text).split(/\*\*/).forEach((part, i) => {
    if (!part) return;
    frag.appendChild(i % 2 ? el("b", null, part) : document.createTextNode(part));
  });
  return frag;
}

function card(title, node, cls) {
  const box = el("div", "x230card" + (cls ? " " + cls : ""));
  if (title) box.appendChild(el("h3", null, title));
  if (node) box.appendChild(node);
  return box;
}

/* The four-part binding, drawn from a real row so the example cannot go stale. */
function bindingExample(p, blockName) {
  const wrap = el("div", "x230bind4");
  const step = (label, value, note) => {
    const s = el("div", "x230step");
    s.appendChild(el("span", "k", label));
    s.appendChild(el("span", "v", value || "—"));
    if (note) s.appendChild(el("span", "n", note));
    wrap.appendChild(s);
  };
  step("AES42 parameter", p.aes42_name, "what the microphone world calls it");
  step("Class", p.oca.class, "what kind of control it is");
  step("Block", blockName(p.block), "where in the device it lives");
  step("Role name", p.oca.role_name, "what a controller searches for");
  step("Property", (p.oca.property || []).join(" / "), "the field carrying the value");
  return wrap;
}

function diagramCard(d) {
  const box = el("div", "x230card x230diag");
  box.appendChild(el("h3", null, d.title));

  const chain = el("div", "x230chain");
  (d.chain || []).forEach((n, i) => {
    if (i) chain.appendChild(el("span", "arr", "→"));
    const node = el("div", "x230node" + (n.control_point ? " cp" : "") +
      (n.shape === "circle" ? " round" : ""));
    node.appendChild(el("span", "lb", n.label));
    (n.parts || []).forEach((part) => node.appendChild(el("span", "pt", part)));
    chain.appendChild(node);
  });
  box.appendChild(chain);

  if (d.boundary) {
    box.appendChild(el("div", "x230bnd",
      d.boundary.left + " │ " + d.boundary.right + " — the divide falls after " + d.boundary.after));
  }

  const ports = el("div", "x230ports");
  /* An input flows from the port inwards, an output from the chain outwards, so
     the arrows have to run opposite ways or the drawing lies. */
  const list = (label, items, inbound) => {
    if (!items || !items.length) return;
    const row = el("div", "x230port");
    row.appendChild(el("span", "k", label));
    items.forEach((p) => {
      const via = p.via || [];
      const path = inbound ? [p.label].concat(via) : via.concat([p.label]);
      const chip = el("span", "tag f-" + (p.flow || "audio") + (p.control_point ? " cp" : ""),
        path.join(" → "));
      row.appendChild(chip);
    });
    ports.appendChild(row);
  };
  list("In", d.inputs, true);
  list("Out", d.outputs, false);
  if (d.control) {
    const row = el("div", "x230port");
    row.appendChild(el("span", "k", "Control"));
    row.appendChild(el("span", "tag f-control", d.control.label + " · " + d.control.protocol +
      (d.control.transport ? " over " + d.control.transport : "")));
    ports.appendChild(row);
  }
  box.appendChild(ports);
  box.appendChild(el("p", "x230sum2", d.summary));
  return box;
}

function paramTable(params, blockName) {
  const table = el("table", "x230tab");
  const head = el("tr");
  ["Parameter", "AES42", "Class", "Block / applies to", "Role", "Property", "Unit"]
    .forEach((h) => head.appendChild(el("th", null, h)));
  table.appendChild(head);

  for (const p of params) {
    const tr = el("tr", p.oca.resolved ? null : "open");
    tr.appendChild(el("td", "nm", p.profile_name));
    tr.appendChild(el("td", null, p.aes42_name || "—"));
    const cls = el("td", null, p.oca.class || p.oca.class_raw);
    if (!p.oca.resolved) cls.className = "ph";
    tr.appendChild(cls);
    tr.appendChild(el("td", null, p.section === "rf"
      ? Object.entries(p.applicability || {}).map(([k, v]) => blockName(k) + (v === "m" ? "?" : "")).join(", ")
      : (p.block ? blockName(p.block) : "—")));
    tr.appendChild(el("td", null, p.oca.role_name || "—"));
    tr.appendChild(el("td", null, (p.oca.property || []).join(" / ") || "—"));
    tr.appendChild(el("td", null, p.unit || "—"));
    const why = [p.remarks, p.oca.remarks, p.notes].filter(Boolean).join("\n\n");
    if (why) tr.title = why;
    table.appendChild(tr);
  }
  return table;
}

let built = false;

export function renderX230View() {
  const host = $("x230");
  if (built) return;

  host.innerHTML = "";
  host.appendChild(el("div", "empty", "Loading the profile…"));

  Promise.all([ensureX230(), ensureReport()]).then(([, report]) => {
    built = true;
    host.innerHTML = "";
    host.appendChild(build(x230(), report));
  }).catch((err) => {
    host.innerHTML = "";
    host.appendChild(el("div", "empty", "Could not load the X230 data files — " + err.message));
  });
}

function build(p, report) {
  const wrap = el("div", "x230wrap");
  const blockName = (key) => (p.blocks.find((b) => b.key === key) || {}).name || key;

  /* --- masthead --- */
  const head = el("div", "x230mast");
  head.appendChild(el("h2", null, p.profile.title));
  const meta = el("div", "x230meta");
  [p.profile.id, p.profile.status, p.profile.revision, p.profile.date,
    p.profile.parameter_source + " → " + p.profile.control_protocol]
    .filter(Boolean).forEach((t) => meta.appendChild(el("span", "tag", t)));
  head.appendChild(meta);
  head.appendChild(el("p", "x230purpose", p.profile.purpose));
  head.appendChild(el("div", "x230src", "Transcribed from " + p.source.workbook +
    (p.source.diagram_document ? " and " + p.source.diagram_document : "")));
  wrap.appendChild(head);

  /* --- the binding, worked --- */
  const pad = p.parameters.find((x) => x.key === "pad") || p.parameters[0];
  const ex = el("div");
  ex.appendChild(bindingExample(pad, blockName));
  ex.appendChild(el("p", "x230sum2",
    "Read left to right: “" + pad.aes42_name + "” resolves to " + pad.oca.class +
    " at role " + pad.oca.role_name + " inside the " + blockName(pad.block) +
    " block, read and written through " + (pad.oca.property || []).join(" / ") + ". " +
    (pad.oca.remarks || "").replace(/\n/g, " ")));
  wrap.appendChild(card("How a parameter is bound", ex));

  /* --- narrative --- */
  for (const sec of p.narrative || []) {
    const body = el("div", "x230prose");
    sec.body.forEach((para) => {
      const node = el("p");
      node.appendChild(rich(para));
      body.appendChild(node);
    });
    wrap.appendChild(card(sec.heading, body));
  }

  /* --- blocks --- */
  const blocks = el("div", "x230blocks");
  for (const b of p.blocks) {
    const box = el("div", "x230bcard d-" + b.domain);
    box.appendChild(el("div", "n", b.name));
    box.appendChild(el("div", "d", b.domain));
    box.appendChild(el("div", "p", b.purpose || ""));
    if (b.notes) box.appendChild(el("div", "no", b.notes));
    blocks.appendChild(box);
  }
  wrap.appendChild(card("Blocks", blocks));

  /* --- diagrams --- */
  const diag = el("div", "x230diags");
  (p.diagrams || []).forEach((d) => diag.appendChild(diagramCard(d)));
  wrap.appendChild(card("The three typical block diagrams", diag));

  /* --- the schemas, in full --- */
  if (report && report.schemas && report.schemas.length) {
    wrap.appendChild(schemaCard(report.schemas));
  }

  /* --- parameters --- */
  const audio = p.parameters.filter((x) => x.section === "audio");
  const rf = p.parameters.filter((x) => x.section === "rf");
  const params = el("div");
  params.appendChild(el("h4", null, "Microphone parameters (" + audio.length + ")"));
  params.appendChild(paramTable(audio, blockName));
  params.appendChild(el("h4", null, "Radio parameters (" + rf.length + ") — “?” marks a block the parameter may apply to"));
  params.appendChild(paramTable(rf, blockName));
  wrap.appendChild(card("Every parameter in the profile", params));

  /* --- corpus statistics --- */
  if (report && report.statistics) wrap.appendChild(statsCard(report.statistics));

  /* --- enumerations --- */
  const en = p.enumerations && p.enumerations.polar_pattern_position;
  if (en) {
    const body = el("div");
    body.appendChild(el("p", "x230sum2", en.description));
    const t = el("table", "x230tab");
    const h = el("tr");
    ["Position", "Name", "Gradient coefficient"].forEach((x) => h.appendChild(el("th", null, x)));
    t.appendChild(h);
    for (const pos of en.positions) {
      const tr = el("tr");
      tr.appendChild(el("td", "nm", String(pos.position)));
      tr.appendChild(el("td", null, pos.name));
      tr.appendChild(el("td", null, pos.gradient == null ? "—" : String(pos.gradient)));
      t.appendChild(tr);
    }
    body.appendChild(t);
    (en.notes || []).forEach((n) => body.appendChild(el("div", "x230no", n)));
    wrap.appendChild(card("Polar pattern positions", body));
  }

  /* --- open issues --- */
  if (p.open_issues && p.open_issues.length) {
    const ul = el("ul", "x230issues");
    for (const issue of p.open_issues) {
      const li = el("li");
      li.appendChild(el("span", "s", issue.source || "—"));
      li.appendChild(document.createTextNode(issue.summary));
      ul.appendChild(li);
    }
    wrap.appendChild(card("What the draft leaves open", ul));
  }

  /* --- crosswalk --- */
  if (p.crosswalk) {
    const body = el("div");
    body.appendChild(el("p", "x230sum2", p.crosswalk.description));
    const t = el("table", "x230tab");
    const h = el("tr");
    ["Catalogue pattern", "Profile position", "Gradient", "Note"].forEach((x) => h.appendChild(el("th", null, x)));
    t.appendChild(h);
    for (const row of p.crosswalk.pattern_positions || []) {
      const tr = el("tr", row.position == null ? "open" : null);
      tr.appendChild(el("td", "nm", row.corpus));
      tr.appendChild(el("td", null, row.position == null ? "none" : row.position + " · " + row.position_name));
      tr.appendChild(el("td", null, row.gradient == null ? "—" : String(row.gradient)));
      tr.appendChild(el("td", null, row.note || ""));
      t.appendChild(tr);
    }
    body.appendChild(t);

    const legend = el("div", "x230legend");
    for (const term of p.crosswalk.statuses || []) {
      const item = el("div");
      item.appendChild(el("span", "tag x230st s-" + term.key, term.label));
      item.appendChild(el("span", null, term.description));
      legend.appendChild(item);
    }
    body.appendChild(el("h4", null, "How a device page reports each parameter"));
    body.appendChild(legend);
    wrap.appendChild(card("Reading this catalogue against the profile", body, "x230cross"));
  }

  return wrap;
}
