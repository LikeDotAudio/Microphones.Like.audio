/* Which microphones survive the current facets, and in what order.
 *
 * Both panes filter through here: the brand tree so its counts agree with the
 * list, and the model list itself. */

import { cfg } from "./config.js";
import { patternPass } from "./patterns.js";
import { state } from "./state.js";

export const micKey = (m, brand) => brand.slug + "/" + m.slug;

export const textPass = (m) => {
  const q = state.query;
  return !q ||
    (m.model || "").toLowerCase().includes(q) ||
    (m.subtitle || "").toLowerCase().includes(q);
};

export function tagPass(m, brand) {
  if (!state.tag) return true;
  const members = state.tagMembers.get(state.tag);
  return !!members && members.has(micKey(m, brand));
}

export function pricePass(m) {
  if (state.price === "any") return true;
  const band = (cfg().priceBands || []).find((b) => b.key === state.price);
  if (!band) return true;
  if (band.none) return m.msrp == null;
  if (m.msrp == null) return false;
  return m.msrp >= band.min && (band.max == null || m.msrp < band.max);
}

/* Everything the facet controls ask of a model, AND-ed together. */
export function facetPass(m, brand) {
  if (state.type !== "all" && (m.type || "unknown") !== state.type) return false;
  if (state.form !== "all" && m.form !== state.form) return false;
  if (state.currentOnly && m.avail !== "current") return false;
  for (const t of state.traits) if (!m[t]) return false;
  return pricePass(m) && tagPass(m, brand);
}

export function filtersActive() {
  return state.type !== "all" || state.form !== "all" || state.price !== "any" ||
    state.traits.size > 0 || state.currentOnly || state.patterns.size > 0 || !!state.tag;
}

export function clearFilters() {
  state.type = "all";
  state.form = "all";
  state.price = "any";
  state.traits.clear();
  state.currentOnly = false;
  state.patterns.clear();
  state.tag = null;
}

/* Which models of a brand survive the search box, the pattern buttons and the
   facet controls — null means the brand itself drops out of the tree. */
export function brandView(brand) {
  const q = state.query;
  const brandHit = !q ||
    brand.name.toLowerCase().includes(q) || brand.slug.toLowerCase().includes(q);
  const models = brand.models.filter((m) =>
    patternPass(m) && facetPass(m, brand) && (brandHit || textPass(m)));
  return models.length ? { brandHit, models } : null;
}

/* Rows that survive search + patterns + facets, sorted. `brand` null sweeps the
   whole catalogue. Rows are {m, b} so the all-brands list can label its cards. */
export function visibleModels(brand) {
  const q = state.query;
  const groups = brand ? [brand] : state.index.brands;
  const rows = [];
  for (const b of groups) {
    const brandHit = !q ||
      b.name.toLowerCase().includes(q) || b.slug.toLowerCase().includes(q);
    for (const m of b.models) {
      if (!patternPass(m) || !facetPass(m, b)) continue;
      if (!brandHit && !textPass(m)) continue;
      rows.push({ m, b });
    }
  }
  const byName = (x, y) =>
    (x.m.model || "").localeCompare(y.m.model || "", undefined, { numeric: true });
  const byBrandName = (x, y) => x.b.name.localeCompare(y.b.name) || byName(x, y);
  const sorters = {
    name: brand ? byName : byBrandName,
    price: (x, y) => (x.m.msrp ?? Infinity) - (y.m.msrp ?? Infinity) || byName(x, y),
    "price-desc": (x, y) => (y.m.msrp ?? -1) - (x.m.msrp ?? -1) || byName(x, y),
    year: (x, y) => (y.m.year ?? -1) - (x.m.year ?? -1) || byName(x, y),
  };
  return rows.sort(sorters[state.sort] || byName);
}
