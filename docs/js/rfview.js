/* The Wireless tab: every RF system in the catalogue, filtered by band and by
 * where it sits in the spectrum.
 *
 * These records have their own schema — no capsule, no polar pattern, but a
 * tuning range, a preset count and coordination settings — so they get their
 * own view rather than being flattened into the microphone table. They still
 * appear in Browse alongside each vendor's microphones; this is the RF-shaped
 * way in. */

import { $, el } from "./dom.js";
import { cfg, usable } from "./config.js";
import { ensureRf } from "./data.js";
import { go } from "./hash.js";
import { state } from "./state.js";

const mhz = (v) => (v == null ? "—" : v.toLocaleString(undefined, { maximumFractionDigits: 3 }));

/* A system counts as being in a segment if any part of its coverage overlaps
   it, so a wideband tuner shows up under every segment it can reach. */
function inSegment(rec, seg) {
  const c = rec.rf.coverage;
  if (!seg || seg.key === "all") return true;
  if (c.start_mhz == null || c.end_mhz == null) return false;
  return c.end_mhz >= seg.min && (seg.max == null || c.start_mhz < seg.max);
}

export function rfRows() {
  const q = state.rfQuery;
  const seg = (cfg().rfSpectrum || []).find((s) => s.key === state.rfSpectrum);
  const rows = (state.rf || []).filter((r) => {
    if (state.rfBand !== "all" && !r.classification.bands.includes(state.rfBand)) return false;
    if (!inSegment(r, seg)) return false;
    if (q) {
      const hay = (r.identity.full_name + " " +
        r.rf.ranges.map((x) => x.name).join(" ")).toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const byModel = (a, b) =>
    a.identity.model.localeCompare(b.identity.model, undefined, { numeric: true });
  const sorters = {
    brand: (a, b) => a.identity.manufacturer.localeCompare(b.identity.manufacturer) || byModel(a, b),
    model: byModel,
    low: (a, b) => (a.rf.coverage.start_mhz ?? Infinity) - (b.rf.coverage.start_mhz ?? Infinity),
    span: (a, b) => (b.rf.coverage.span_mhz ?? -1) - (a.rf.coverage.span_mhz ?? -1),
    ranges: (a, b) => b.rf.range_count - a.rf.range_count || byModel(a, b),
  };
  return rows.sort(sorters[state.rfSort] || sorters.brand);
}

/* A coverage bar placing the system on the spectrum the whole dataset spans. */
function coverageBar(rec, lo, hi) {
  const track = el("div", "rftrack");
  const span = hi - lo || 1;
  for (const r of rec.rf.ranges) {
    if (r.start_mhz == null || r.end_mhz == null) continue;
    const seg = el("b");
    seg.style.left = (((r.start_mhz - lo) / span) * 100).toFixed(2) + "%";
    seg.style.width = Math.max(0.4, ((r.end_mhz - r.start_mhz) / span) * 100).toFixed(2) + "%";
    seg.title = r.name + " · " + mhz(r.start_mhz) + "–" + mhz(r.end_mhz) + " MHz";
    track.appendChild(seg);
  }
  return track;
}

export function renderRfView() {
  const host = $("rfGrid");

  if (!state.rf) {
    $("rfStat").textContent = "";
    host.innerHTML = "";
    host.appendChild(el("div", "empty", "Loading wireless systems…"));
    ensureRf().then(renderRfView).catch((err) => {
      host.innerHTML = "";
      host.appendChild(el("div", "empty", "Could not load data/rf.json — " + err.message));
    });
    return;
  }

  const rows = rfRows();
  const all = state.rf;
  const totalRanges = rows.reduce((n, r) => n + r.rf.range_count, 0);
  $("rfStat").textContent = rows.length === all.length
    ? all.length + " systems · " + totalRanges + " tuning ranges"
    : rows.length + " of " + all.length + " systems · " + totalRanges + " ranges";

  host.innerHTML = "";
  if (!rows.length) {
    host.appendChild(el("div", "empty", "No wireless system matches those filters"));
    return;
  }

  /* Every bar is drawn against the same axis so two systems can be compared by
     eye; the axis is the whole dataset, not the filtered subset. */
  const starts = all.map((r) => r.rf.coverage.start_mhz).filter((v) => v != null);
  const ends = all.map((r) => r.rf.coverage.end_mhz).filter((v) => v != null);
  const lo = Math.min(...starts), hi = Math.max(...ends);
  $("rfAxis").innerHTML = "";
  for (const t of [lo, lo + (hi - lo) / 4, lo + (hi - lo) / 2, lo + (3 * (hi - lo)) / 4, hi]) {
    $("rfAxis").appendChild(el("span", null, Math.round(t) + " MHz"));
  }

  const frag = document.createDocumentFragment();
  for (const rec of rows) {
    const card = el("div", "rfcard");
    card.dataset.brand = rec.source.brand_slug;
    card.dataset.slug = rec.source.model_slug;

    const head = el("div", "rfhead");
    head.append(
      el("span", "rfbrand", rec.identity.manufacturer),
      el("span", "rfmodel", rec.identity.model));
    for (const b of rec.classification.bands) head.appendChild(el("span", "tag", b));
    head.appendChild(el("span", "tag", rec.rf.range_count + " range" +
      (rec.rf.range_count === 1 ? "" : "s")));
    if (rec.rf.presets.max != null) {
      head.appendChild(el("span", "tag", rec.rf.presets.max.toLocaleString() + " presets"));
    }

    const cov = el("div", "rfcov", mhz(rec.rf.coverage.start_mhz) + " – " +
      mhz(rec.rf.coverage.end_mhz) + " MHz  ·  " +
      mhz(rec.rf.coverage.tunable_mhz) + " MHz tunable");

    card.append(head, coverageBar(rec, lo, hi), cov);
    card.addEventListener("click", () => go(rec.source.brand_slug, rec.source.model_slug));
    frag.appendChild(card);
  }
  host.appendChild(frag);
}

export function renderRfControls() {
  const c = cfg();
  const bar = $("rfFilters");
  if (bar.dataset.built) return;
  bar.dataset.built = "1";

  const mk = (id, options, onPick) => {
    const s = el("select");
    s.id = id;
    for (const o of usable(options)) {
      const n = el("option", null, o.count != null && o.key !== "all"
        ? o.label + " (" + o.count + ")" : o.label);
      n.value = o.key;
      s.appendChild(n);
    }
    s.addEventListener("change", () => { onPick(s.value); renderRfView(); });
    bar.appendChild(s);
    return s;
  };

  const q = el("input");
  q.type = "search";
  q.id = "rfSearch";
  q.placeholder = "Filter by make, model or range…";
  q.autocomplete = "off";
  let timer;
  q.addEventListener("input", () => {
    clearTimeout(timer);
    const v = q.value.trim().toLowerCase();
    timer = setTimeout(() => { state.rfQuery = v; renderRfView(); }, 120);
  });
  bar.appendChild(q);

  mk("rfBand", c.rfBands, (v) => { state.rfBand = v; });
  mk("rfSpectrum", c.rfSpectrum, (v) => { state.rfSpectrum = v; });
  mk("rfSort", c.rfSorts, (v) => { state.rfSort = v; });
}
