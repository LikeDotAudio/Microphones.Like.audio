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
    b.title = p.label + " · " + p.count.toLocaleString() + " mics";
    b.setAttribute("aria-label", p.label);
    b.setAttribute("aria-pressed", "false");
    b.innerHTML = iconSvg(p.icon);
    bar.appendChild(b);
  }
}

/* A mic passes if it offers ANY of the selected patterns. */
export function patternPass(m) {
  if (!state.patterns.size) return true;
  for (const key of state.patterns) {
    const p = patternByKey(key);
    if (!p) continue;
    if (p.multi && m.multi) return true;
    if ((m.patterns || []).some((n) => p.match.includes(n))) return true;
  }
  return false;
}
