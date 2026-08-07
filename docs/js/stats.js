/* The Statistics view. Everything here is derived from index.json in the
 * browser — no extra fetch, and it always agrees with what the tree is showing.
 *
 * The series, colours, histogram bins and charted flags all come from config. */

import { $, cap, el, money } from "./dom.js";
import { cfg } from "./config.js";
import { allModels } from "./data.js";
import { countBy, figure, hbars, histogram, legendFor, median, stackedBars } from "./charts.js";
import { buildExplorer } from "./explorer.js";
import { patterns } from "./patterns.js";
import { state } from "./state.js";

const typeColor = (t) => (cfg().typeColors || {})[t || "unknown"] || "var(--faint)";

/* Types outside the named series fold into one "other" slot. */
const typeBucket = (t) => (cfg().typeSeriesKeys.includes(t) ? t : "other");

/* Does a model row carry the flag this attribute describes? */
function attrHit(attr, r) {
  if (attr.equals != null) return r[attr.field] === attr.equals;
  if (attr.present) return r[attr.field] != null;
  return !!r[attr.field];
}

export function renderStats() {
  const host = $("stats");
  host.innerHTML = "";
  const wrap = el("div", "statswrap");
  const rows = allModels();
  const n = rows.length;

  /* ---- headline tiles ---- */
  const priced = rows.filter((r) => r.msrp != null).map((r) => r.msrp);
  const years = rows.filter((r) => r.year).map((r) => r.year);
  const types = new Map(countBy(rows, (r) => r.type || "unknown"));
  const tile = (nVal, label, sub) => {
    const t = el("div", "tile");
    t.appendChild(el("div", "n", nVal));
    t.appendChild(el("div", "l", label));
    if (sub) t.appendChild(el("div", "sub2", sub));
    return t;
  };
  const pct = (x) => ((x / n) * 100).toFixed(1) + "%";
  const tiles = el("div", "tiles");
  tiles.append(
    tile(n.toLocaleString(), "Microphones", "across " + state.index.total_brands + " brands"),
    tile(String(state.index.total_brands), "Brands",
      "median " + median(state.index.brands.map((b) => b.count)) + " models each"),
    tile(money(median(priced)), "Median MSRP", priced.length + " priced · " +
      money(Math.min(...priced)) + "–" + money(Math.max(...priced))),
    tile(pct(types.get("condenser") || 0), "Condenser",
      (types.get("dynamic") || 0) + " dynamic · " + (types.get("ribbon") || 0) + " ribbon"),
    tile(String(rows.filter((r) => r.tube).length), "Tube mics",
      pct(rows.filter((r) => r.tube).length) + " of catalogue"),
    tile(String(rows.filter((r) => r.multi).length), "Multipattern",
      pct(rows.filter((r) => r.multi).length) + " of catalogue"),
    tile(pct(rows.filter((r) => r.avail === "discontinued").length), "Discontinued",
      rows.filter((r) => r.avail === "current").length + " still current"),
    tile(Math.min(...years) + "–" + Math.max(...years), "Release years",
      years.length + " dated models"),
  );
  wrap.append(el("h2", "vh", "The collection at a glance"), tiles);

  /* ---- charts ---- */
  const figs = el("div", "figs");

  // Transducer type — each type keeps the hue it wears everywhere else.
  const typeRows = countBy(rows, (r) => r.type || "unknown").map(([k, v]) => ({
    label: cap(k), value: v, css: typeColor(k),
    onClick: () => { location.hash = "#/"; },
  }));
  figs.appendChild(figure("Transducer types",
    "Every microphone in the dataset, by capsule technology.",
    hbars(typeRows, { total: n, labelWidth: 96 })));

  // Polar patterns — grouped exactly like the header buttons.
  const patRows = patterns().map((p) => ({
    label: p.label.replace(/ \(.*\)$/, ""),
    value: p.count,
    css: "var(--s1)",
  })).sort((a, b) => b.value - a.value);
  figs.appendChild(figure("Polar patterns",
    "A switchable mic counts once for every pattern it offers, so these sum past " + n + ".",
    hbars(patRows, { total: n, labelWidth: 148 })));

  // Form factor
  const formRows = countBy(rows, (r) => r.form || "unspecified")
    .map(([k, v]) => ({ label: cap(k), value: v, css: "var(--s1)" }));
  figs.appendChild(figure("Form factors", "Body style as catalogued by the source.",
    hbars(formRows, { total: n, labelWidth: 104 })));

  // Price distribution
  figs.appendChild(figure("Price distribution",
    priced.length + " of " + n + " models carry an MSRP.",
    histogram(cfg().priceHistogram.map((b) => ({
      label: b.label,
      value: priced.filter((p) => p >= b.min && (b.max == null || p < b.max)).length,
    })))));

  // Releases by decade
  const decades = countBy(rows.filter((r) => r.year), (r) => Math.floor(r.year / 10) * 10)
    .sort((a, b) => a[0] - b[0]);
  figs.appendChild(figure("Releases by decade", years.length + " models carry a release year.",
    histogram(decades.map(([d, v]) => ({ label: d + "s", value: v })))));

  // Attributes
  const attrs = cfg().statAttributes.map((a) => ({
    label: a.label,
    value: rows.filter((r) => attrHit(a, r)).length,
    css: "var(--s1)",
  }));
  figs.appendChild(figure("Attributes", "Share of the catalogue carrying each flag.",
    hbars(attrs, { total: n, max: n, labelWidth: 110 })));

  wrap.append(el("h2", "vh", "Distributions"), figs);

  /* ---- type by brand (the wide one) ---- */
  wrap.append(el("h2", "vh", "Type by brand"), buildTypeByBrand(rows));

  /* ---- explorer ---- */
  wrap.append(el("h2", "vh", "Data explorer"), buildExplorer());

  host.appendChild(wrap);
}

function buildTypeByBrand(rows) {
  const series = cfg().typeSeries;
  const view = { top: 25, order: "total" };
  const fig = el("figure", "fig wide");
  fig.appendChild(el("figcaption", null, "Transducer mix by brand"));
  fig.appendChild(el("div", "note",
    "Bar length is the brand's catalogue size; segments are its split by type. " +
    "Click a brand to open it."));

  const bar = el("div", "figbar");
  const mkSel = (label, options, onChange) => {
    const s = el("select");
    options.forEach((o) => {
      const n = el("option", null, o.label);
      n.value = o.key;
      s.appendChild(n);
    });
    s.addEventListener("change", () => { onChange(s.value); draw(); });
    const w = el("label", null, label + " ");
    w.style.cssText = "font-size:11.5px;color:var(--muted)";
    w.appendChild(s);
    return w;
  };
  bar.append(
    mkSel("Show", cfg().brandChartTops, (v) => { view.top = +v; }),
    mkSel("Order by", cfg().brandChartOrders, (v) => { view.order = v; }),
  );
  fig.appendChild(bar);
  fig.appendChild(legendFor(series));

  const plot = el("div");
  fig.appendChild(plot);

  function draw() {
    const byBrand = new Map();
    for (const r of rows) {
      let e = byBrand.get(r.brandSlug);
      if (!e) {
        e = { label: r.brand, slug: r.brandSlug, total: 0 };
        series.forEach((s) => { e[s.key] = 0; });
        byBrand.set(r.brandSlug, e);
      }
      e.total++;
      e[typeBucket(r.type)]++;
    }
    let list = [...byBrand.values()];
    const share = (e, k) => e[k] / e.total;
    if (view.order === "name") list.sort((a, b) => a.label.localeCompare(b.label));
    else if (view.order === "total") list.sort((a, b) => b.total - a.total);
    else list.sort((a, b) => share(b, view.order) - share(a, view.order) || b.total - a.total);
    list = list.slice(0, view.top);

    plot.innerHTML = "";
    plot.appendChild(stackedBars(list.map((e) => ({
      label: e.label,
      total: e.total,
      onClick: () => { location.hash = "#/" + encodeURIComponent(e.slug); },
      parts: series.map((s) => ({ label: s.label, value: e[s.key], css: s.css })),
    })), { labelWidth: 168 }));
    if (view.top < 999) {
      plot.appendChild(el("div", "note",
        "Showing " + list.length + " of " + byBrand.size + " brands."));
    }
  }
  draw();
  return fig;
}
