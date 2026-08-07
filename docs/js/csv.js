/* Full-dataset CSV export.
 *
 * The columns are config (data/config.json -> csvColumns), not code: each entry
 * is a label plus a dotted path into a microphone record, with a handful of
 * `kind`s for the shapes a path alone can't reach. Adding a column is an edit
 * to docs/vocabulary.py. */

import { cfg } from "./config.js";
import { dig, el } from "./dom.js";
import { loadBrand } from "./data.js";
import { hashFor } from "./hash.js";
import { state } from "./state.js";

export function csvCell(v) {
  const s = Array.isArray(v)
    ? v.filter((x) => x != null && x !== "").join("; ")
    : v == null ? "" : typeof v === "boolean" ? (v ? "yes" : "no") : String(v);
  return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

/* Per-pattern figures are prefixed with the pattern name when a mic has more
   than one, so a multipattern record keeps all its numbers in a single row. */
function perPattern(mic, fn) {
  const rows = dig(mic, "specifications.pickup_patterns") || [];
  return rows
    .map((p) => {
      const v = fn(p);
      return v == null || v === "" ? null : (rows.length > 1 ? p.pattern + ": " + v : String(v));
    })
    .filter(Boolean);
}

export function csvValue(col, mic, row) {
  switch (col.kind) {
    case "link":
      return location.origin + location.pathname + hashFor(row.brandSlug, row.slug);
    case "bool":
      return !!dig(mic, col.path);
    case "list": {
      const list = dig(mic, col.path) || [];
      return list.map((x) => (col.field ? x && x[col.field] : x));
    }
    case "perPattern":
      return perPattern(mic, (p) => p[col.field]);
    case "freqPerPattern":
      return perPattern(mic, (p) => {
        const f = p.frequency_response || {};
        return f.low_hz != null && f.high_hz != null ? f.low_hz + "–" + f.high_hz : f.raw;
      });
    default:
      return dig(mic, col.path);
  }
}

/* The index rows a caller passes in are deliberately thin, so a full export
   pulls the per-brand detail files for whatever is on screen first. */
export async function exportCsv(rows, button) {
  const cols = cfg().csvColumns;
  const slugs = [...new Set(rows.map((r) => r.brandSlug))];
  const label = button && button.textContent;
  if (button) button.disabled = true;
  try {
    for (let i = 0; i < slugs.length; i += 12) {
      if (button) {
        button.textContent = "Loading " + Math.min(i + 12, slugs.length) + "/" + slugs.length + "…";
      }
      await Promise.all(slugs.slice(i, i + 12).map((s) => loadBrand(s).catch(() => null)));
    }
    if (button) button.textContent = "Building CSV…";

    const lines = [cols.map((c) => csvCell(c.label)).join(",")];
    for (const r of rows) {
      const mic = (state.brandData.get(r.brandSlug) || {})[r.slug];
      lines.push(cols.map((c) => csvCell(mic ? csvValue(c, mic, r) : "")).join(","));
    }

    const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const a = el("a");
    a.href = URL.createObjectURL(blob);
    a.download = "microphones-" + rows.length + ".csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  } finally {
    if (button) { button.textContent = label; button.disabled = false; }
  }
}
