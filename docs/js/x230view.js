/* The X230 tab: what the profile is, how it works, and every parameter in it.
 *
 * Nothing on this page is written here. The prose, the blocks, the diagram
 * summaries, the parameter table and the list of things the draft left open all
 * come out of data/x230.json — so the tab cannot drift away from the profile the
 * device pages are read against. See docs/js/x230.js for that reading. */

import { $, el } from "./dom.js";
import { ensureX230, x230 } from "./x230.js";

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
function bindingExample(p) {
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
  step("Block", p.block, "where in the device it lives");
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
  const list = (label, items) => {
    if (!items || !items.length) return;
    const row = el("div", "x230port");
    row.appendChild(el("span", "k", label));
    items.forEach((p) => {
      const chip = el("span", "tag f-" + (p.flow || "audio") + (p.control_point ? " cp" : ""),
        (p.via && p.via.length ? p.via.join(" → ") + " → " : "") + p.label);
      row.appendChild(chip);
    });
    ports.appendChild(row);
  };
  list("In", d.inputs);
  list("Out", d.outputs);
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

  ensureX230().then(() => {
    built = true;
    host.innerHTML = "";
    host.appendChild(build(x230()));
  }).catch((err) => {
    host.innerHTML = "";
    host.appendChild(el("div", "empty", "Could not load data/x230.json — " + err.message));
  });
}

function build(p) {
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
  ex.appendChild(bindingExample(pad));
  ex.appendChild(el("p", "x230sum2",
    "Read left to right: “" + pad.aes42_name + "” resolves to a " + pad.oca.class +
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

  /* --- parameters --- */
  const audio = p.parameters.filter((x) => x.section === "audio");
  const rf = p.parameters.filter((x) => x.section === "rf");
  const params = el("div");
  params.appendChild(el("h4", null, "Microphone parameters (" + audio.length + ")"));
  params.appendChild(paramTable(audio, blockName));
  params.appendChild(el("h4", null, "Radio parameters (" + rf.length + ") — “?” marks a block the parameter may apply to"));
  params.appendChild(paramTable(rf, blockName));
  wrap.appendChild(card("Every parameter in the profile", params));

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
