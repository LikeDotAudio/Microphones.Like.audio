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
const ROW_GAP = 26;      // between parallel signal paths
const SUB_GAP = 12;      // between the diaphragms stacked in one column

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

function drawArrow(g, x1, y, x2, flow, y2) {
  const color = flowColor(flow);
  const end = y2 == null ? y : y2;
  g.appendChild(svgEl("path", {
    d: `M${x1} ${y} L${x2 - 7} ${end}`, class: "dg-line", style: "stroke:" + color,
  }));
  g.appendChild(svgEl("path", {
    d: `M${x2} ${end} l-8 -4.5 l0 9 Z`, class: "dg-head", style: "fill:" + color,
  }));
}

/* Wire one column of blocks to the next. Equal counts run straight across;
   anything else meets on a vertical bus in the gap, which is how two
   diaphragms reach one matrix and two channels reach one connector. */
function connect(g, from, to, x0, x1, flow) {
  if (!from.length || !to.length) return;
  if (from.length === to.length) {
    from.forEach((f, i) => drawArrow(g, x0, f.cy, x1, flow, to[i].cy));
    return;
  }
  const color = flowColor(flow);
  const busX = x0 + (x1 - x0) / 2;
  const ys = [...from, ...to].map((b) => b.cy);
  for (const f of from) {
    g.appendChild(svgEl("path", {
      d: `M${x0} ${f.cy} L${busX} ${f.cy}`, class: "dg-line", style: "stroke:" + color,
    }));
  }
  g.appendChild(svgEl("path", {
    d: `M${busX} ${Math.min(...ys)} L${busX} ${Math.max(...ys)}`,
    class: "dg-line", style: "stroke:" + color,
  }));
  for (const t of to) drawArrow(g, busX, t.cy, x1, flow);
}

/* Rows are parallel signal paths (a stereo pair), cells are the blocks stacked
   inside one column of one row (the two diaphragms of a dual capsule). A mic
   with neither is one row of one-block cells, which is the ordinary drawing. */
function rowsOf(chain, body) {
  const split = chain.split;
  const chan = split && split.channels;
  const elem = split && split.elements;
  const inChannel = chan ? new Set(chan.keys) : null;
  const paths = chan ? body.filter((b) => inChannel.has(b.key)) : body;
  const cellOf = (b) => (elem && elem.keys.includes(b.key)
    ? elem.labels.map((label) => ({ ...b, label }))
    : [b]);

  return {
    rows: (chan ? chan.labels : [null]).map((label) => ({ label, cells: paths.map(cellOf) })),
    tail: chan ? body.filter((b) => !inChannel.has(b.key)) : [],
  };
}

export function drawDiagram(chain) {
  const blocks = chain.blocks.map((b) => ({ ...b, w: boxWidth(b) }));
  const terminal = blocks.length && blocks[blocks.length - 1].terminal
    ? blocks[blocks.length - 1] : null;
  const body = terminal ? blocks.slice(0, -1) : blocks;
  const { rows, tail } = rowsOf(chain, body);

  const top = PAD + (blocks.some((b) => b.shape === "antenna") ? 18 : 0);
  const labelW = rows[0].label ? Math.max(...rows.map((r) => r.label.length)) * 6.4 + 14 : 0;

  /* Vertical: a cell is as tall as its stack, a row as tall as its tallest
     cell, and every cell is centred on its row. */
  const cellH = (cell) => cell.length * BOX_H + (cell.length - 1) * SUB_GAP;
  const rowH = rows.map((r) => Math.max(BOX_H, ...r.cells.map(cellH)));
  const rowTop = [];
  rowH.reduce((y, h, i) => { rowTop[i] = y; return y + h + ROW_GAP; }, top);
  const stackBottom = rowTop[rows.length - 1] + rowH[rows.length - 1];
  const midY = (top + stackBottom) / 2;

  /* Horizontal: one column per stage, wide enough for the widest block in it. */
  const cols = rows[0].cells.length;
  const colW = [];
  for (let i = 0; i < cols; i++) {
    colW[i] = Math.max(...rows.map((r) => Math.max(...r.cells[i].map((b) => b.w))));
  }
  const xs = [];
  let x = PAD + labelW;
  for (let i = 0; i < cols; i++) { xs.push(x); x += colW[i] + GAP; }
  const tailXs = [];
  for (const b of tail) { tailXs.push(x); x += b.w + GAP; }

  const termW = terminal ? Math.max(70, terminal.label.length * 6.4 + 10) : 0;
  const width = x - GAP + (terminal ? GAP + termW : 0) + PAD;
  const height = stackBottom + (chain.feeds.length ? FEED_DROP + 34 : 0) + PAD;

  const svg = svgEl("svg", {
    class: "dg", viewBox: `0 0 ${width} ${height}`,
    width, height, role: "img",
    // A pane narrower than the drawing scales it down instead of scrolling —
    // but only so far. Below about three quarters the captions stop being
    // legible, so past that the wrapper takes over and scrolls.
    style: `min-width:${Math.round(width * 0.74)}px`,
    // Left-align when the canvas is narrower than the pane, rather than
    // floating the chain in the middle of an empty box.
    preserveAspectRatio: "xMinYMid meet",
    "aria-label": (rows[0].label ? rows.map((r) => r.label).join(" and ") + ": " : "") +
      chain.blocks.map((b) => b.label).join(" → "),
  });

  const g = svgEl("g", {});
  svg.appendChild(g);

  /* Draw every row, remembering where each block landed so the wiring — and
     the feeds below — can find them again. */
  const placed = [];               // {key, cx, cy, top, bottom, right}
  const columnEnds = [];           // the last cell of each row, for the join
  rows.forEach((row, r) => {
    const mid = rowTop[r] + rowH[r] / 2;
    if (row.label) {
      const t = svgEl("text", { x: PAD, y: mid + 4, class: "dg-row" });
      t.textContent = row.label;
      g.appendChild(t);
    }

    const drawnCells = row.cells.map((cell, i) => {
      const startY = mid - cellH(cell) / 2;
      return cell.map((b, j) => {
        const y = startY + j * (BOX_H + SUB_GAP);
        drawBlock(g, b, xs[i], y);
        const spot = {
          key: b.key, flow: b.flow, cx: xs[i] + b.w / 2, cy: y + BOX_H / 2,
          top: y, bottom: y + BOX_H, right: xs[i] + b.w,
        };
        placed.push(spot);
        return spot;
      });
    });

    drawnCells.forEach((cell, i) => {
      if (i) connect(g, drawnCells[i - 1], cell, xs[i] - GAP, xs[i], row.cells[i - 1][0].flow);
    });
    columnEnds.push(...drawnCells[drawnCells.length - 1]);
  });

  /* Past the split the paths share one line of blocks down the middle. */
  let last = columnEnds;
  tail.forEach((b, i) => {
    const y = midY - BOX_H / 2;
    drawBlock(g, b, tailXs[i], y);
    const spot = {
      key: b.key, flow: b.flow, cx: tailXs[i] + b.w / 2, cy: midY,
      top: y, bottom: y + BOX_H, right: tailXs[i] + b.w,
    };
    placed.push(spot);
    connect(g, last, [spot], tailXs[i] - GAP, tailXs[i], last[0].flow);
    last = [spot];
  });

  if (terminal) {
    const tx = x - GAP + GAP;
    connect(g, last, [{ cy: midY }], x - GAP, tx, terminal.flow);
    const t = svgEl("text", { x: tx + 6, y: midY + 4, class: "dg-term" });
    t.textContent = terminal.label;
    g.appendChild(t);
    if (terminal.lines.length) {
      const s = svgEl("text", { x: tx + 6, y: midY + 18, class: "dg-cap dg-left" });
      s.textContent = String(terminal.lines[0]);
      g.appendChild(s);
    }
  }

  /* Feeds run along a rail under the drawing and turn up into their target.
     A stereo mic has two preamps, so the riser carries on through the stack
     and arrives at each of them rather than picking one. */
  chain.feeds.forEach((feed, i) => {
    const targets = placed.filter((p) => p.key === feed.into).sort((a, b) => b.cy - a.cy);
    if (!targets.length) return;
    const tx = targets[0].cx;
    const railY = stackBottom + FEED_DROP - i * 22;
    const color = flowColor(feed.flow);
    const label = feed.label + (feed.lines.length ? " · " + feed.lines.join(" · ") : "");

    const t = svgEl("text", { x: PAD, y: railY + 4, class: "dg-feed", style: "fill:" + color });
    t.textContent = label;
    g.appendChild(t);

    const startX = PAD + label.length * CHAR + 10;
    g.appendChild(svgEl("path", {
      d: `M${startX} ${railY} L${tx} ${railY} L${tx} ${targets[0].bottom + 8}`,
      class: "dg-line dg-dash", style: "stroke:" + color,
    }));
    targets.forEach((target, n) => {
      g.appendChild(svgEl("path", {
        d: `M${target.cx} ${target.bottom} l-4.5 8 l9 0 Z`,
        class: "dg-head", style: "fill:" + color,
      }));
      const above = targets[n + 1];
      if (above) {
        g.appendChild(svgEl("path", {
          d: `M${target.cx} ${target.top} L${target.cx} ${above.bottom + 8}`,
          class: "dg-line dg-dash", style: "stroke:" + color,
        }));
      }
    });
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

  const rows = [...chain.blocks, ...((chain.split && chain.split.notes) || []), ...chain.feeds];
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
