/* Small DOM and formatting helpers shared by every view. */

export const $ = (id) => document.getElementById(id);

export const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};

export const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export const has = (v) => v !== null && v !== undefined && v !== "" &&
  !(Array.isArray(v) && !v.length) &&
  !(typeof v === "object" && !Array.isArray(v) && !Object.keys(v).length);

export const money = (n) =>
  n == null ? null : "$" + Number(n).toLocaleString(undefined, { maximumFractionDigits: 0 });

export const num = (n, unit) =>
  n == null ? null : (+n).toLocaleString(undefined, { maximumFractionDigits: 2 }) + (unit || "");

export const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/* Follow a dotted path into a record, giving up quietly if it runs out. */
export function dig(obj, path) {
  let cur = obj;
  for (const part of path.split(".")) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = cur[part];
  }
  return cur;
}

/* Fill a <select> from a config vocabulary of {key, label, count}. */
export function fillSelect(sel, options, opt) {
  const { showCounts = false, skipEmpty = true } = opt || {};
  sel.innerHTML = "";
  for (const o of options) {
    if (skipEmpty && o.count === 0) continue;
    const n = el("option", null, showCounts && o.count != null && o.count > 0
      ? o.label + " (" + o.count.toLocaleString() + ")"
      : o.label);
    n.value = o.key;
    sel.appendChild(n);
  }
}
