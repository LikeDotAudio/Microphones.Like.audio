/* Draws a signal chain as inline SVG, in the manner of the AES X230
 * typical-block-diagram sheets: boxes left to right, arrows between them, feeds
 * arriving from below, and a terminal label where the signal leaves.
 *
 * Nothing here decides what a microphone contains — chain.js does that from the
 * record. This module only lays out and paints what it is handed, which is why
 * the drawing under one mic differs from the next. */

import { cfg } from "./config.js";
import { el } from "./dom.js";

const NS = "http://www.w3.org/2000/svg";

const svgEl = (tag, attrs) => {
  const n = document.createElementNS(NS, tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  return n;
};

/* Geometry. Blocks are sized from their captions so nothing overflows. */
const PAD = 14;          // canvas margin
const BOX_H = 78;
const GAP = 34;          // arrow length between blocks
const CHAR = 5.6;        // approx advance of the caption font
const MIN_W = 76;
const TITLE_H = 15;
const FEED_DROP = 62;

const flowColor = (flow) => {
  const f = (cfg().chainFlows || []).find((x) => x.key === flow);
  return f ? f.css : "var(--muted)";
};

function boxWidth(block) {
  const longest = Math.max(
    block.label.length,
    ...(block.lines.length ? block.lines.map((l) => String(l).length) : [0]));
  return Math.max(MIN_W, Math.round(longest * CHAR) + 22);
}

/* One block: the outline plus its captions. */
function drawBlock(g, block, x, y) {
  const w = block.w;
  const cx = x + w / 2;
  const stroke = flowColor(block.flow);

  if (block.shape === "circle") {
    const r = Math.min(w, BOX_H) / 2;
    g.appendChild(svgEl("ellipse", {
      cx, cy: y + BOX_H / 2, rx: w / 2, ry: r,
      class: "dg-shape", style: "stroke:" + stroke,
    }));
  } else if (block.shape === "triangle") {
    g.appendChild(svgEl("path", {
      d: `M${x} ${y} L${x + w} ${y + BOX_H / 2} L${x} ${y + BOX_H} Z`,
      class: "dg-shape", style: "stroke:" + stroke,
    }));
  } else if (block.shape === "antenna") {
    g.appendChild(svgEl("rect", {
      x, y, width: w, height: BOX_H, rx: 4, class: "dg-shape", style: "stroke:" + stroke,
    }));
    g.appendChild(svgEl("path", {
      d: `M${cx} ${y - 2} l-7 -11 M${cx} ${y - 2} l7 -11 M${cx} ${y - 2} l0 -13`,
      class: "dg-ant", style: "stroke:" + stroke,
    }));
  } else {
    g.appendChild(svgEl("rect", {
      x, y, width: w, height: BOX_H, rx: 4, class: "dg-shape", style: "stroke:" + stroke,
    }));
  }

  const labelX = block.shape === "triangle" ? x + w * 0.38 : cx;
  const title = svgEl("text", { x: labelX, y: y + 20, class: "dg-title" });
  title.textContent = block.label;
  g.appendChild(title);

  block.lines.slice(0, 3).forEach((line, i) => {
    const t = svgEl("text", {
      x: labelX,
      y: y + 20 + TITLE_H + i * 13,
      class: "dg-cap" + (block.muted ? " dg-muted" : ""),
    });
    t.textContent = String(line);
    g.appendChild(t);
  });
}

function drawArrow(g, x1, y, x2, flow) {
  const color = flowColor(flow);
  g.appendChild(svgEl("path", {
    d: `M${x1} ${y} L${x2 - 7} ${y}`, class: "dg-line", style: "stroke:" + color,
  }));
  g.appendChild(svgEl("path", {
    d: `M${x2} ${y} l-8 -4.5 l0 9 Z`, class: "dg-head", style: "fill:" + color,
  }));
}

export function drawDiagram(chain) {
  const blocks = chain.blocks.map((b) => ({ ...b, w: boxWidth(b) }));
  const terminal = blocks.length && blocks[blocks.length - 1].terminal
    ? blocks[blocks.length - 1] : null;
  const drawn = terminal ? blocks.slice(0, -1) : blocks;

  const top = PAD + (blocks.some((b) => b.shape === "antenna") ? 18 : 0);
  const midY = top + BOX_H / 2;

  let x = PAD;
  const xs = [];
  for (const b of drawn) { xs.push(x); x += b.w + GAP; }

  /* The terminal block is a label with an arrow into it, not a box. */
  const termW = terminal ? Math.max(70, terminal.label.length * 6.4 + 10) : 0;
  const width = x - GAP + (terminal ? GAP + termW : 0) + PAD;
  const height = top + BOX_H + (chain.feeds.length ? FEED_DROP + 34 : 0) + PAD;

  const svg = svgEl("svg", {
    class: "dg", viewBox: `0 0 ${width} ${height}`,
    width, height, role: "img",
    "aria-label": chain.blocks.map((b) => b.label).join(" → "),
  });

  const g = svgEl("g", {});
  svg.appendChild(g);

  drawn.forEach((b, i) => {
    if (i) drawArrow(g, xs[i] - GAP, midY, xs[i], drawn[i - 1].flow);
    drawBlock(g, b, xs[i], top);
  });

  if (terminal) {
    const tx = x - GAP + GAP;
    drawArrow(g, x - GAP, midY, tx, terminal.flow);
    const t = svgEl("text", { x: tx + 6, y: midY + 4, class: "dg-term" });
    t.textContent = terminal.label;
    g.appendChild(t);
    if (terminal.lines.length) {
      const s = svgEl("text", { x: tx + 6, y: midY + 18, class: "dg-cap dg-left" });
      s.textContent = String(terminal.lines[0]);
      g.appendChild(s);
    }
  }

  /* Feeds run along a rail under the chain and turn up into their target. */
  chain.feeds.forEach((feed, i) => {
    const target = drawn.findIndex((b) => b.key === feed.into);
    if (target < 0) return;
    const tx = xs[target] + drawn[target].w / 2;
    const railY = top + BOX_H + FEED_DROP - i * 22;
    const color = flowColor(feed.flow);
    const label = feed.label + (feed.lines.length ? " · " + feed.lines.join(" · ") : "");

    const t = svgEl("text", { x: PAD, y: railY + 4, class: "dg-feed", style: "fill:" + color });
    t.textContent = label;
    g.appendChild(t);

    const startX = PAD + label.length * CHAR + 10;
    g.appendChild(svgEl("path", {
      d: `M${startX} ${railY} L${tx} ${railY} L${tx} ${top + BOX_H + 8}`,
      class: "dg-line dg-dash", style: "stroke:" + color,
    }));
    g.appendChild(svgEl("path", {
      d: `M${tx} ${top + BOX_H} l-4.5 8 l9 0 Z`, class: "dg-head", style: "fill:" + color,
    }));
  });

  const wrap = el("div", "dgwrap");
  wrap.appendChild(svg);
  return wrap;
}

/* The legend: only the flows this particular drawing actually uses. */
export function drawLegend(chain) {
  const used = new Set([
    ...chain.blocks.map((b) => b.flow),
    ...chain.feeds.map((f) => f.flow),
  ]);
  const lg = el("div", "dglegend");
  for (const f of cfg().chainFlows || []) {
    if (!used.has(f.key)) continue;
    const item = el("span");
    const sw = el("i");
    sw.style.background = f.css;
    item.append(sw, document.createTextNode(f.label));
    lg.appendChild(item);
  }
  return lg;
}

/* Everything the drawing was built from, block by block. This is the point of
   the exercise: no box appears that can't be pointed back at a field. */
export function drawDetails(chain) {
  const table = el("table", "dgdetail");
  const head = el("tr");
  ["Block", "Shown", "From"].forEach((h) => head.appendChild(el("th", null, h)));
  table.appendChild(head);

  const rows = [...chain.blocks, ...chain.feeds];
  for (const b of rows) {
    const detail = b.detail.length ? b.detail : [["—", "—"]];
    detail.forEach(([field, value], i) => {
      const tr = el("tr");
      if (i === 0) {
        const th = el("td", "dgb", b.label);
        th.rowSpan = detail.length;
        tr.appendChild(th);
        const shown = el("td", "dgs", b.lines.join(" / ") || "—");
        shown.rowSpan = detail.length;
        tr.appendChild(shown);
      }
      const src = el("td", "dgf");
      src.appendChild(el("code", null, field));
      if (value != null && value !== field) {
        src.appendChild(document.createTextNode("  "));
        src.appendChild(el("span", "dgv", String(value)));
      }
      tr.appendChild(src);
      table.appendChild(tr);
    });
  }

  const wrap = el("div", "tablewrap");
  wrap.appendChild(table);
  return wrap;
}
