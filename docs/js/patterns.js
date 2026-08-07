/* The polar-pattern button bar. The buttons themselves — labels, which corpus
 * pattern names each one claims, which curves to draw — come from config. */

import { $, el } from "./dom.js";
import { cfg, usable } from "./config.js";
import { iconSvg } from "./polar.js";
import { state } from "./state.js";

export const patterns = () => usable(cfg().patterns);

export const patternByKey = (key) => patterns().find((p) => p.key === key);

export function renderPatternBar() {
  const bar = $("patbar");
  bar.innerHTML = "";
  for (const p of patterns()) {
    const b = el("button", "pat");
    b.type = "button";
    b.dataset.key = p.key;
    b.title = p.label + " · " + p.count.toLocaleString() + " " + (p.noun || "mics");
    b.setAttribute("aria-label", p.label);
    b.setAttribute("aria-pressed", "false");
    b.innerHTML = iconSvg(p.icon, p.glyph);
    bar.appendChild(b);
  }
}

/* A row passes if it answers ANY of the selected buttons. The bar mixes two
   kinds of question — "which polar patterns does it offer" and "is it a
   wireless system" — and OR-ing them is what lets cardioid + wireless mean
   "either", which is the only reading that returns anything at all. */
export function patternPass(m) {
  if (!state.patterns.size) return true;
  for (const key of state.patterns) {
    const p = patternByKey(key);
    if (!p) continue;
    if (p.kind) { if ((m.kind || "mic") === p.kind) return true; continue; }
    if (p.multi && m.multi) return true;
    if ((m.patterns || []).some((n) => p.match.includes(n))) return true;
  }
  return false;
}
