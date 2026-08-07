/* Chart primitives for the statistics view: horizontal bars, stacked bars,
 * histograms, and the shared hover tooltip. No knowledge of microphones. */

import { $, el, esc } from "./dom.js";

export const countBy = (rows, fn) => {
  const c = new Map();
  for (const r of rows) {
    for (const k of [].concat(fn(r))) {
      if (k == null) continue;
      c.set(k, (c.get(k) || 0) + 1);
    }
  }
  return [...c.entries()].sort((a, b) => b[1] - a[1]);
};

export function median(nums) {
  if (!nums.length) return null;
  const s = nums.slice().sort((a, b) => a - b);
  const mid = s.length >> 1;
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}
/* ------------------------------------------------------------ chart pieces */
export function tooltipFor(node, html) {
  node.addEventListener("mouseenter", () => {
    const tip = $("tip");
    tip.innerHTML = html;
    tip.hidden = false;
  });
  node.addEventListener("mousemove", (e) => {
    const tip = $("tip");
    const pad = 14;
    const w = tip.offsetWidth, h = tip.offsetHeight;
    tip.style.left = Math.min(e.clientX + pad, innerWidth - w - 8) + "px";
    tip.style.top = Math.max(8, e.clientY - h - pad) + "px";
  });
  node.addEventListener("mouseleave", () => { $("tip").hidden = true; });
}

/* rows: [{label, value, css?, onClick?, tip?}] */
export function hbars(rows, opt) {
  const { labelWidth = 122, total = null, max = null } = opt || {};
  const top = max != null ? max : Math.max(1, ...rows.map((r) => r.value));
  const box = el("div", "rows");
  box.style.setProperty("--labelw", labelWidth + "px");
  for (const r of rows) {
    const line = el("div", "row");
    const lab = el("div", "rl" + (r.onClick ? " link" : ""), r.label);
    lab.title = r.label;
    if (r.onClick) lab.addEventListener("click", r.onClick);

    const track = el("div", "track");
    const fill = el("b");
    fill.style.width = (r.value / top * 100).toFixed(2) + "%";
    fill.style.background = r.css || "var(--s1)";
    track.appendChild(fill);
    tooltipFor(track, r.tip || ("<b>" + esc(r.label) + "</b><br><span class='tv'>" +
      r.value.toLocaleString() + (total ? " · " + (r.value / total * 100).toFixed(1) + "%" : "") + "</span>"));

    const val = el("div", "rv", r.value.toLocaleString());
    if (total) val.appendChild(el("small", null, "  " + (r.value / total * 100).toFixed(1) + "%"));

    line.append(lab, track, val);
    box.appendChild(line);
  }
  return box;
}

/* rows: [{label, parts:[{key,label,value,css}], total, onClick?}] */
export function stackedBars(rows, opt) {
  const { labelWidth = 150 } = opt || {};
  const top = Math.max(1, ...rows.map((r) => r.total));
  const box = el("div", "rows");
  box.style.setProperty("--labelw", labelWidth + "px");
  for (const r of rows) {
    const line = el("div", "row");
    const lab = el("div", "rl link", r.label);
    lab.title = r.label;
    if (r.onClick) lab.addEventListener("click", r.onClick);

    const track = el("div", "track");
    track.style.width = (r.total / top * 100).toFixed(2) + "%";
    for (const p of r.parts) {
      if (!p.value) continue;
      const seg = el("b");
      seg.style.flex = p.value + " 0 0";
      seg.style.background = p.css;
      tooltipFor(seg, "<b>" + esc(r.label) + "</b><br><span class='tv'>" + esc(p.label) + ": " +
        p.value + " of " + r.total + " · " + (p.value / r.total * 100).toFixed(0) + "%</span>");
      track.appendChild(seg);
    }
    const wrap = el("div");
    wrap.style.cssText = "display:flex";
    wrap.appendChild(track);

    line.append(lab, wrap, el("div", "rv", String(r.total)));
    box.appendChild(line);
  }
  return box;
}

/* bins: [{label, value}] */
export function histogram(bins) {
  const top = Math.max(1, ...bins.map((b) => b.value));
  const wrap = el("div");
  const plot = el("div", "hist");
  for (const b of bins) {
    const col = el("div", "col");
    col.appendChild(el("em", null, b.value.toLocaleString()));
    const bar = el("b");
    bar.style.height = (b.value / top * 100).toFixed(1) + "%";
    col.appendChild(bar);
    tooltipFor(col, "<b>" + esc(b.label) + "</b><br><span class='tv'>" + b.value.toLocaleString() + " mics</span>");
    plot.appendChild(col);
  }
  const axis = el("div", "histx");
  bins.forEach((b) => axis.appendChild(el("span", null, b.label)));
  wrap.append(plot, axis);
  return wrap;
}

export function figure(title, note, body, wide) {
  const f = el("figure", "fig" + (wide ? " wide" : ""));
  f.appendChild(el("figcaption", null, title));
  if (note) f.appendChild(el("div", "note", note));
  f.appendChild(body);
  return f;
}

export function legendFor(series) {
  const lg = el("div", "legend");
  for (const s of series) {
    const item = el("span");
    const sw = el("i");
    sw.style.background = s.css;
    item.append(sw, document.createTextNode(s.label));
    lg.appendChild(item);
  }
  return lg;
}

