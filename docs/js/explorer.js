/* The sortable table under the statistics charts. Columns, type options and
 * pattern options all come from config. */

import { cap, el, money } from "./dom.js";
import { cfg, patternDisplay, usable } from "./config.js";
import { allModels } from "./data.js";
import { countBy } from "./charts.js";
import { exportCsv } from "./csv.js";
import { go } from "./hash.js";
import { patterns, patternByKey } from "./patterns.js";

const PAGE_ROWS = 250;

const explorer = {
  q: "", type: "all", status: "all", pattern: "all",
  sort: "brand", dir: 1, limit: PAGE_ROWS,
};

const showPatterns = (list) => (list || []).map(patternDisplay).join(", ") || "—";

const typeColor = (t) => (cfg().typeColors || {})[t || "unknown"] || "var(--faint)";

export function explorerRows() {
  const q = explorer.q.toLowerCase();
  const pat = explorer.pattern === "all" ? null : patternByKey(explorer.pattern);
  const rows = allModels().filter((r) => {
    if (explorer.type !== "all" && (r.type || "unknown") !== explorer.type) return false;
    if (explorer.status !== "all" && r.avail !== explorer.status) return false;
    if (pat && !(pat.multi ? r.multi : (r.patterns || []).some((x) => pat.match.includes(x)))) return false;
    if (q && !((r.brand + " " + r.model + " " + (r.subtitle || "")).toLowerCase().includes(q))) return false;
    return true;
  });
  const k = explorer.sort, dir = explorer.dir;
  rows.sort((a, b) => {
    let x = a[k], y = b[k];
    if (k === "patterns") { x = (x || []).length; y = (y || []).length; }
    if (x == null && y == null) return 0;
    if (x == null) return 1;              // blanks always sink
    if (y == null) return -1;
    const c = typeof x === "number"
      ? x - y
      : String(x).localeCompare(String(y), undefined, { numeric: true });
    return c * dir || String(a.model).localeCompare(String(b.model), undefined, { numeric: true });
  });
  return rows;
}

export function buildExplorer() {
  const cols = cfg().explorerColumns;
  const box = el("div");
  const bar = el("div", "expbar");

  const q = el("input");
  q.type = "search";
  q.placeholder = "Filter brand, model or subtitle…";
  q.value = explorer.q;
  q.addEventListener("input", () => {
    explorer.q = q.value.trim();
    explorer.limit = PAGE_ROWS;
    refresh();
  });

  const sel = (opts, cur, on) => {
    const s = el("select");
    opts.forEach(([v, t]) => {
      const o = el("option", null, t);
      o.value = v;
      if (v === cur) o.selected = true;
      s.appendChild(o);
    });
    s.addEventListener("change", () => { on(s.value); explorer.limit = PAGE_ROWS; refresh(); });
    return s;
  };

  const typeOpts = [["all", "All types"]].concat(
    countBy(allModels(), (r) => r.type || "unknown").map(([k, v]) => [k, cap(k) + " (" + v + ")"]));
  const patOpts = [["all", "All patterns"]].concat(
    patterns().map((p) => [p.key, p.label.replace(/ \(.*\)$/, "")]));
  const statusOpts = usable(cfg().availability).map((a) => [a.key, a.label]);

  bar.append(
    q,
    sel(typeOpts, explorer.type, (v) => { explorer.type = v; }),
    sel(patOpts, explorer.pattern, (v) => { explorer.pattern = v; }),
    sel(statusOpts, explorer.status, (v) => { explorer.status = v; }),
  );

  const count = el("span", "note");
  count.style.cssText = "font-size:12px;color:var(--muted)";
  bar.appendChild(count);
  bar.appendChild(el("div", "grow"));

  const csv = el("button", "iconbtn", "Download CSV");
  csv.addEventListener("click", () => exportCsv(explorerRows(), csv));
  bar.appendChild(csv);

  const wrap = el("div", "tablewrap");
  const table = el("table", "data");
  const thead = el("thead");
  const htr = el("tr");
  for (const c of cols) {
    const th = el("th", null, c.label);
    th.addEventListener("click", () => {
      if (explorer.sort === c.key) explorer.dir = -explorer.dir;
      else { explorer.sort = c.key; explorer.dir = 1; }
      refresh();
    });
    htr.appendChild(th);
  }
  thead.appendChild(htr);
  const tbody = el("tbody");
  table.append(thead, tbody);
  wrap.appendChild(table);

  const more = el("div", "more");
  box.append(bar, wrap, more);

  /* One cell, rendered according to what the column says it is. */
  function cell(col, r) {
    if (col.key === "model") {
      const td = el("td", "wrap");
      td.appendChild(el("strong", null, r.model || r.slug));
      if (r.subtitle) {
        td.appendChild(document.createElement("br"));
        const small = el("small", null, r.subtitle);
        small.style.color = "var(--faint)";
        td.appendChild(small);
      }
      return td;
    }
    if (col.key === "type") {
      const td = el("td");
      const sw = el("span", "swatch");
      sw.style.background = typeColor(r.type);
      td.append(sw, document.createTextNode(cap(r.type || "unknown")));
      return td;
    }
    if (col.patternNames) return el("td", "wrap", showPatterns(r.patterns));
    if (col.num) {
      const v = r[col.key];
      return el("td", "num", v == null ? "—" : (col.key === "msrp" ? money(v) : String(v)));
    }
    return el("td", null, cap(r[col.key]) || "—");
  }

  function refresh() {
    const rows = explorerRows();
    count.textContent = rows.length.toLocaleString() + " of " +
      allModels().length.toLocaleString() + " models";
    [...htr.children].forEach((th, i) => {
      th.textContent = cols[i].label;
      if (explorer.sort === cols[i].key) {
        th.appendChild(el("span", "ind", explorer.dir > 0 ? " ▲" : " ▼"));
      }
    });

    tbody.innerHTML = "";
    const shown = rows.slice(0, explorer.limit);
    const frag = document.createDocumentFragment();
    for (const r of shown) {
      const tr = el("tr");
      for (const c of cols) tr.appendChild(cell(c, r));
      tr.addEventListener("click", () => go(r.brandSlug, r.slug));
      frag.appendChild(tr);
    }
    tbody.appendChild(frag);

    more.innerHTML = "";
    if (rows.length > shown.length) {
      const btn = el("button", "iconbtn",
        "Show " + Math.min(PAGE_ROWS, rows.length - shown.length) + " more (" +
        shown.length.toLocaleString() + " of " + rows.length.toLocaleString() + " shown)");
      btn.addEventListener("click", () => { explorer.limit += PAGE_ROWS; refresh(); });
      more.appendChild(btn);
    }
  }

  refresh();
  return box;
}
