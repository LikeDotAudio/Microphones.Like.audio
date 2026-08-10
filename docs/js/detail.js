/* The right-hand pane: one microphone, rendered in full. */

import { $, cap, el, has, num, money } from "./dom.js";
import { kitTag, typeTags } from "./models.js";
import { buildChain } from "./chain.js";
import { cfg } from "./config.js";
import { drawDetails, drawDiagram, drawLegend } from "./diagram.js";
import { loadBrand } from "./data.js";
import { go, parsePermalink } from "./hash.js";
import { appLink, extLink, sanitize } from "./links.js";
import { state } from "./state.js";
import { openTag } from "./tagview.js";
import { x230Section } from "./x230.js";

export async function renderDetail() {
  const host = $("detail");
  $("detailSub").textContent = "";
  if (!state.brand || !state.model) {
    host.innerHTML = "";
    host.appendChild(el("div", "empty", "Pick a microphone"));
    return;
  }
  host.innerHTML = "";
  host.appendChild(el("div", "empty", "Loading…"));

  let mic, bundle;
  try {
    /* The whole brand file, not just this record: a kit draws the chain of each
       microphone it contains, and those records are in here beside it. */
    bundle = await loadBrand(state.brand);
    mic = bundle[state.model];
  } catch (err) {
    host.innerHTML = "";
    host.appendChild(el("div", "empty", "Failed to load: " + err.message));
    return;
  }
  if (!mic) {                                        // hand-typed or stale hash
    host.innerHTML = "";
    host.appendChild(el("div", "empty", "No model “" + state.model + "” in " + state.brand));
    return;
  }
  if (state.model !== mic.source.model_slug) return; // superseded by a newer click
  host.innerHTML = "";
  const isRf = mic.classification.kind === "rf";
  host.appendChild(isRf ? buildRfDetail(mic) : buildDetail(mic, bundle));
  host.scrollTop = 0;
  $("detailSub").textContent = isRf
    ? mic.rf.range_count + " tuning range" + (mic.rf.range_count === 1 ? "" : "s")
    : "";
}

/* The drawing, its legend, and the fields every box came from. */
function diagramSection(rec) {
  const chain = buildChain(rec);
  if (!chain.blocks.length) return null;
  const wrap = el("div", "dgblock");
  wrap.append(drawDiagram(chain), drawLegend(chain));
  wrap.appendChild(el("div", "note",
    "Drawn from this record — a block only appears when the data calls for it."));
  wrap.appendChild(drawDetails(chain));
  return section("Signal chain", wrap);
}

/* A kit has no signal chain of its own — it has as many as it has microphones,
   so each one is drawn from its own record rather than from the kit's inherited
   summary. Two of the same microphone still get one drawing, headed with the
   quantity: it is one chain, supplied twice. */
function kitDiagrams(kit, bundle) {
  const wrap = el("div");
  let drawn = 0;
  for (const m of kit.members) {
    const rec = bundle && bundle[m.slug];
    if (!rec) continue;                      // member outside this brand file
    const chain = buildChain(rec);
    if (!chain.blocks.length) continue;

    const block = el("div", "dgblock kitchain");
    const head = el("div", "kithead");
    const name = el("button", "kitlink", (m.quantity > 1 ? m.quantity + " × " : "") +
      (m.name || m.model || m.slug));
    name.type = "button";
    name.title = "Open " + (m.name || m.model);
    name.addEventListener("click", () => go(m.brand, m.slug));
    head.appendChild(name);
    if (m.subtitle) head.appendChild(el("span", "sub", m.subtitle));
    block.append(head, drawDiagram(chain), drawLegend(chain), drawDetails(chain));
    wrap.appendChild(block);
    drawn++;
  }
  if (!drawn) return null;
  wrap.insertBefore(el("div", "note",
    "One chain per microphone in the kit, each drawn from that microphone's own " +
    "record — the kit itself has no capsule to describe."), wrap.firstChild);
  return section(drawn === 1 ? "Signal chain" : "Signal chain of each microphone", wrap);
}

/* Wireless systems carry none of the microphone spec fields, so they get their
   own layout rather than a mic page with most of it missing. */
function buildRfDetail(rec) {
  const root = el("div", "detail");
  const id = rec.identity, cls = rec.classification, cov = rec.rf.coverage;

  root.appendChild(el("h1", null, id.full_name));
  root.appendChild(el("div", "sub", cls.subtitle));

  const badges = el("div", "badges");
  badges.appendChild(el("span", "tag type t-wireless", "Wireless"));
  cls.bands.forEach((b) => badges.appendChild(el("span", "tag", b)));
  badges.appendChild(el("span", "tag", rec.rf.range_count + " ranges"));
  root.appendChild(badges);

  const facts = dl([
    ["Manufacturer", id.manufacturer],
    ["Model", id.model],
    ["Coverage", cov.start_mhz != null
      ? num(cov.start_mhz, " MHz") + " – " + num(cov.end_mhz, " MHz") : null],
    ["Envelope", num(cov.span_mhz, " MHz")],
    ["Tunable", num(cov.tunable_mhz, " MHz")],
    ["Presets", rec.rf.presets.max != null
      ? (rec.rf.presets.min === rec.rf.presets.max
        ? String(rec.rf.presets.max)
        : rec.rf.presets.min + " – " + rec.rf.presets.max) : null],
    ["Source", rec.source.dataset],
  ]);
  if (facts) root.appendChild(section("System", facts));

  const diag = diagramSection(rec);
  if (diag) root.appendChild(diag);

  /* ---- the per-range table, columns from config ---- */
  const cols = cfg().rfRangeColumns;
  const table = el("table", "data");
  const htr = el("tr");
  cols.forEach((c) => htr.appendChild(el("th", null, c.label)));
  table.appendChild(htr);
  for (const r of rec.rf.ranges) {
    const tr = el("tr");
    for (const c of cols) {
      const v = r[c.path];
      if (c.kind === "setting") {
        const td = el("td");
        if (!v) td.textContent = "—";
        else if (v.mode === "value") td.textContent = num(v.mhz, " MHz");
        else { td.textContent = v.raw; td.className = "dim"; }
        tr.appendChild(td);
      } else if (c.num) {
        tr.appendChild(el("td", "num", v == null ? "—" : num(v) + (c.unit || "")));
      } else {
        tr.appendChild(el("td", null, v == null || v === "" ? "—" : String(v)));
      }
    }
    table.appendChild(tr);
  }
  const wrap = el("div", "tablewrap");
  wrap.appendChild(table);
  root.appendChild(section("Tuning ranges", wrap));

  root.appendChild(x230Section(rec));
  return root;
}

function section(title, body) {
  const s = el("section", "block");
  s.appendChild(el("h3", null, title));
  s.appendChild(body);
  return s;
}

function dl(pairs) {
  const d = el("dl", "kv");
  let n = 0;
  for (const [k, v] of pairs) {
    if (!has(v)) continue;
    d.appendChild(el("dt", null, k));
    if (v instanceof Node) { const dd = el("dd"); dd.appendChild(v); d.appendChild(dd); }
    else d.appendChild(el("dd", null, v));
    n++;
  }
  return n ? d : null;
}

function boxed(title, node) {
  if (!node) return null;
  const b = el("div", "box");
  b.appendChild(el("h3", null, title));
  b.lastChild.style.cssText = "margin:0 0 7px;font-size:11.5px;text-transform:uppercase;letter-spacing:.07em;color:var(--faint);font-weight:600";
  b.appendChild(node);
  return b;
}

/* A bare anchor with no text of its own — for wrapping an image. */
function linkWrap(url) {
  const a = el("a");
  a.href = url; a.target = "_blank"; a.rel = "noopener noreferrer";
  return a;
}

function buildDetail(mic, bundle) {
  const root = el("div", "detail");
  const id = mic.identity, cls = mic.classification, spec = mic.specifications || {};
  const price = mic.pricing || {}, content = mic.content || {}, media = mic.media || {}, links = mic.links || {};
  const kit = mic.kit || null;

  /* --- header + hero --- */
  root.appendChild(el("h1", null, id.full_name || id.model));
  if (cls.subtitle) root.appendChild(el("div", "sub", cls.subtitle));

  const hero = el("div", "hero");
  const photo = media.primary_photo;
  if (photo && (photo.full_url || photo.thumb_url)) {
    const box = el("div", "photo");
    const img = el("img");
    img.src = photo.thumb_url || photo.full_url;
    img.alt = photo.alt || id.full_name || "";
    img.addEventListener("error", () => box.remove());
    if (photo.full_url) { const a = linkWrap(photo.full_url); a.appendChild(img); box.appendChild(a); }
    else box.appendChild(img);
    hero.appendChild(box);
  }

  const facts = el("div", "facts");
  const badges = el("div", "badges");
  typeTags(cls.transducer_type, cls.transducer_types).forEach((t) => badges.appendChild(t));
  if (cls.form_factor) badges.appendChild(el("span", "tag", cls.form_factor));
  if (cls.is_tube) badges.appendChild(el("span", "tag", "Tube"));
  if (cls.is_multipattern) badges.appendChild(el("span", "tag", "Multipattern"));
  if (cls.is_stereo) badges.appendChild(el("span", "tag", "Stereo"));
  if (kit) badges.appendChild(kitTag({ n: kit.mic_count, models: kit.model_count }));
  else if (cls.product_type === "set") badges.appendChild(el("span", "tag", "Set"));
  if (price.availability === "discontinued") badges.appendChild(el("span", "tag disc", "Discontinued"));
  (cls.pattern_icons || []).forEach((p) => badges.appendChild(el("span", "tag", p)));
  facts.appendChild(badges);

  if (price.msrp_amount != null) {
    const p = el("div", "price", money(price.msrp_amount));
    p.appendChild(el("small", null, " " + (price.currency || "") + (price.msrp_raw ? " · " + price.msrp_raw : "")));
    facts.appendChild(p);
  } else if (price.msrp_raw) {
    facts.appendChild(el("div", "price", price.msrp_raw));
  }

  const manuf = id.manufacturer_url ? extLink(id.manufacturer_url, id.manufacturer) : id.manufacturer;
  const head = dl([
    ["Manufacturer", manuf],
    ["Model", id.model],
    ["Released", content.release_year],
    ["Availability", cap(price.availability)],
    ["Source", mic.source.permalink ? extLink(mic.source.permalink, "recordinghacks.com") : null],
  ]);
  if (head) { head.style.marginTop = "10px"; facts.appendChild(head); }
  hero.appendChild(facts);
  root.appendChild(hero);

  /* --- tags --- */
  if (has(cls.tags)) {
    const wrap = el("div", "badges");
    for (const t of cls.tags) {
      const name = typeof t === "string" ? t : t.name;
      const chip = el("button", "tag tagbtn", name);
      chip.type = "button";
      chip.title = "Browse everything tagged “" + name + "”";
      chip.addEventListener("click", () => openTag(name));
      wrap.appendChild(chip);
    }
    root.appendChild(section("Tags", wrap));
  }

  /* --- signal chain --- */
  const diagram = (kit && kitDiagrams(kit, bundle)) || diagramSection(mic);
  if (diagram) root.appendChild(diagram);

  /* --- pickup patterns --- */
  if (has(spec.pickup_patterns)) {
    const wrap = el("div", "grid2");
    for (const p of spec.pickup_patterns) {
      const fr = p.frequency_response || {};
      const range = fr.low_hz != null && fr.high_hz != null
        ? num(fr.low_hz, " Hz") + " – " + num(fr.high_hz, " Hz")
        : fr.raw;
      const body = dl([
        ["Sensitivity", num(p.sensitivity_mv_pa, " mV/Pa")],
        ["Frequency", range],
        ["Variant", p.pattern_variant],
      ]) || el("div", "sub", p.raw || "—");
      const b = boxed(p.pattern || p.pattern_base || "Pattern", body);
      wrap.appendChild(b);
    }
    root.appendChild(section("Pickup patterns", wrap));
  }

  /* --- specifications --- */
  const specCards = el("div", "grid2");
  const push = (t, node) => { const b = boxed(t, node); if (b) specCards.appendChild(b); };

  if (spec.capsule) push("Capsule", dl([
    ["Diaphragm Ø", num(spec.capsule.diaphragm_diameter_mm, " mm")],
    ["Capsule Ø", num(spec.capsule.capsule_diameter_mm, " mm")],
    ["Gauge", num(spec.capsule.diaphragm_gauge_microns, " µm")],
    ["Raw", spec.capsule.raw],
  ]));
  if (spec.ribbon) push("Ribbon", dl([
    ["Material", spec.ribbon.material],
    ["Length", num(spec.ribbon.length_mm, " mm")],
    ["Width", num(spec.ribbon.width_mm, " mm")],
    ["Gauge", num(spec.ribbon.gauge_microns, " µm")],
    ["Detail", spec.ribbon.description || spec.ribbon.raw],
  ]));
  if (spec.coil) push("Voice coil", dl([
    ["Diameter", num(spec.coil.diameter_mm, " mm")],
    ["Raw", spec.coil.raw !== "n/a" ? spec.coil.raw : null],
  ]));
  if (spec.spl_noise) push("SPL & noise", dl([
    ["Max SPL", num(spec.spl_noise.max_spl_db, " dB")],
    ["SPL note", spec.spl_noise.max_spl_note],
    ["Self noise", num(spec.spl_noise.self_noise_dba, " dB-A")],
    ["Noise note", spec.spl_noise.self_noise_note],
  ]));
  if (spec.impedance) push("Impedance", dl([
    ["Output Z", num(spec.impedance.ohms, " Ω")],
    ["Category", spec.impedance.category],
    ["Raw", spec.impedance.ohms == null && spec.impedance.raw !== "n/a" ? spec.impedance.raw : null],
  ]));
  if (spec.physical) push("Physical", dl([
    ["Weight", spec.physical.weight && spec.physical.weight.raw !== "n/a" ? spec.physical.weight.raw : null],
    ["Length", spec.physical.length && spec.physical.length.raw !== "n/a" ? spec.physical.length.raw : null],
    ["Max Ø", spec.physical.max_diameter && spec.physical.max_diameter.raw !== "n/a" ? spec.physical.max_diameter.raw : null],
  ]));
  if (spec.power) {
    const v = spec.power.phantom_voltage_v;
    push("Power", dl([
      ["Phantom", spec.power.requires_phantom_power ? "Required" : (spec.power.requires_phantom_power === false ? "Not required" : null)],
      ["Voltage", Array.isArray(v) && v.length ? v.map((x) => x + "V").join(", ") : null],
      ["PSU", spec.power.includes_tube_power_supply ? "Tube PSU included" : null],
      ["Battery", spec.power.has_battery_compartment ? (spec.power.battery_type || "Yes") : null],
      ["Other", (spec.power.other || []).join("; ")],
    ]));
  }
  if (has(spec.interfaces)) {
    const ul = el("div");
    spec.interfaces.forEach((i) =>
      ul.appendChild(el("div", null, i.connector + (i.count > 1 ? " ×" + i.count : ""))));
    push("Connectors", ul);
  }
  if (has(spec.pads) || has(spec.filters)) {
    const ul = el("div");
    (spec.pads || []).forEach((p) => ul.appendChild(el("div", null, p.raw)));
    (spec.filters || []).forEach((f) => ul.appendChild(el("div", null, f.raw)));
    push("Pads & filters", ul);
  }
  if (has(spec.compatible_capsules)) {
    const ul = el("div");
    spec.compatible_capsules.forEach((c) => {
      const line = el("div", null, c.name || c.raw);
      if (c.url) { line.textContent = ""; line.appendChild(extLink(c.url, c.name || c.raw)); }
      ul.appendChild(line);
    });
    push("Compatible capsules", ul);
  }
  if (specCards.children.length) root.appendChild(section("Specifications", specCards));

  /* --- description --- */
  if (content.description_html) {
    const p = el("div", "prose");
    p.appendChild(sanitize(content.description_html));
    root.appendChild(section("Description", p));
  } else if (content.description_text) {
    root.appendChild(section("Description", el("div", "prose", content.description_text)));
  }

  /* --- frequency graphs --- */
  if (has(mic.frequency_graphs)) {
    const wrap = el("div", "graphs");
    for (const g of mic.frequency_graphs) {
      const box = el("div", "graph");
      const img = el("img");
      img.loading = "lazy";
      img.src = g.image_url;
      img.alt = g.alt || "";
      img.addEventListener("error", () => box.remove());
      box.appendChild(g.compare_url ? (() => { const a = linkWrap(g.compare_url); a.appendChild(img); return a; })() : img);
      box.appendChild(el("div", "cap", g.pattern || g.alt || ""));
      wrap.appendChild(box);
    }
    root.appendChild(section("Frequency response", wrap));
  }

  /* --- kit contents ---
     The microphones first, because they are what the kit is; the case and the
     clamps after. Each card opens that microphone's own record, where the specs
     this page inherited came from. */
  if (mic.set) {
    const wrap = el("div");
    if (kit && has(kit.members)) {
      const rel = el("div", "rel");
      for (const m of kit.members) rel.appendChild(kitCard(m));
      wrap.appendChild(rel);
      const sum = dl([
        ["Microphones", kit.mic_count + " in " + kit.model_count +
          (kit.model_count === 1 ? " model" : " models")],
        ["Bought separately", kit.parts_msrp != null ? money(kit.parts_msrp) : null],
        ["Kit price", price.msrp_amount != null ? money(price.msrp_amount) : null],
        ["Difference", kit.parts_msrp != null && price.msrp_amount != null
          ? (price.msrp_amount <= kit.parts_msrp ? "−" : "+") +
            money(Math.abs(price.msrp_amount - kit.parts_msrp)) +
            " against the parts" : null],
      ]);
      if (sum) { sum.style.marginTop = "10px"; wrap.appendChild(sum); }
    } else if (has(mic.set.included_microphones)) {
      const rel = el("div", "rel");
      for (const m of mic.set.included_microphones) rel.appendChild(relCard(m, m.quantity_in_set));
      wrap.appendChild(rel);
    }
    const acc = mic.set.included_accessories || {};
    const accList = dl(Object.entries(acc).map(([k, v]) => [k.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase()), v]));
    if (accList) { accList.style.marginTop = "10px"; wrap.appendChild(accList); }
    if (kit) {
      wrap.appendChild(el("div", "note",
        "This kit has no specification of its own. Everything above — type, " +
        "patterns, tags and specs — is inherited from these microphones, and " +
        "only where every one of them agrees (" + kit.inherited.length +
        " fields filled in this way)."));
    }
    if (wrap.children.length) {
      root.appendChild(section(kit ? "Microphones in this kit" : "Included in this set", wrap));
    }
  }

  /* --- quotes --- */
  if (has(content.quotes)) {
    const wrap = el("div");
    for (const q of content.quotes) {
      const bq = el("blockquote", null, q.text);
      if (q.cite) bq.appendChild(el("cite", null, "— " + q.cite));
      wrap.appendChild(bq);
    }
    root.appendChild(section("Quotes", wrap));
  }

  /* --- related --- */
  if (has(mic.related_microphones)) {
    const rel = el("div", "rel");
    for (const r of mic.related_microphones) rel.appendChild(relCard(r));
    root.appendChild(section("Related microphones", rel));
  }

  /* --- links --- */
  const linkGroups = [
    ["Documentation", links.documentation],
    ["Reviews & news", links.reviews_news],
    ["Awards", links.awards],
    ["Related products", links.related_products],
    ["Capsules", media.capsule_links],
    ["Other", links.other],
  ].filter(([, v]) => has(v));
  if (linkGroups.length) {
    const wrap = el("div", "grid2");
    for (const [title, items] of linkGroups) {
      const ul = el("ul", "linklist");
      for (const l of items) {
        const li = el("li");
        const inApp = parsePermalink(l.url);
        li.appendChild(appLink(l.url, l.title || l.url));
        /* "internal" only ever meant "back to recordinghacks" — once the link
           lands in this browser instead, the label is noise. */
        if (!inApp && l.link_type && l.link_type !== "www") {
          li.appendChild(el("span", "lt", l.link_type));
        }
        ul.appendChild(li);
      }
      wrap.appendChild(boxed(title, ul));
    }
    root.appendChild(section("Links", wrap));
  }


  /* --- raw source tables --- */
  if (has(spec.raw_tables)) {
    const det = el("details", "rawdump");
    det.appendChild(el("summary", null, "Raw spec tables (" + spec.raw_tables.length + ")"));
    for (const t of spec.raw_tables) {
      const table = el("table", "raw");
      if (has(t.headers)) {
        const tr = el("tr");
        t.headers.forEach((h) => tr.appendChild(el("th", null, h)));
        table.appendChild(tr);
      }
      const cells = t.cells || [];
      const cols = (t.headers && t.headers.length) || cells.length || 1;
      for (let i = 0; i < cells.length; i += cols) {
        const tr = el("tr");
        for (let c = 0; c < cols; c++) tr.appendChild(el("td", null, cells[i + c] || ""));
        table.appendChild(tr);
      }
      table.style.marginTop = "8px";
      det.appendChild(table);
    }
    root.appendChild(section("Source data", det));
  }

  root.appendChild(x230Section(mic));
  return root;
}

/* One microphone of a kit: how many, what it is, and a way into its record.
   Unlike relCard it navigates by (brand, slug) rather than by parsing a
   permalink — the build already resolved which record this is. */
function kitCard(m) {
  const card = el("div", "rel-item");
  if (m.thumb) {
    const img = el("img");
    img.loading = "lazy";
    img.src = m.thumb;
    img.alt = "";
    img.addEventListener("error", () => img.remove());
    card.appendChild(img);
  }
  const n = el("div", "n", (m.quantity > 1 ? m.quantity + " × " : "") + (m.name || m.model || m.slug));
  if (m.subtitle) n.appendChild(el("span", null, m.subtitle));
  card.appendChild(n);
  card.appendChild(el("span", "dot t-" + (m.type || "unknown")));
  card.title = [m.name, m.msrp != null ? money(m.msrp) + " each" : null]
    .filter(Boolean).join(" · ");
  card.addEventListener("click", () => go(m.brand, m.slug));
  return card;
}

function relCard(item, qty) {
  const card = el("div", "rel-item");
  const img = el("img");
  const thumb = item.image && item.image.thumb_url;
  if (thumb) { img.loading = "lazy"; img.src = thumb; img.alt = ""; img.addEventListener("error", () => img.remove()); card.appendChild(img); }
  const n = el("div", "n", (qty && qty > 1 ? qty + "× " : "") + (item.name || item.title || ""));
  const note = item.relationship_note || item.subtitle;
  if (note) n.appendChild(el("span", null, note));
  card.appendChild(n);

  const target = parsePermalink(item.url);
  if (target) card.addEventListener("click", () => go(target.brand, target.model));
  else if (item.url) card.addEventListener("click", () => window.open(item.url, "_blank", "noopener"));
  return card;
}
