/* Which microphones survive the current facets, and in what order.
 *
 * Both panes filter through here: the brand tree so its counts agree with the
 * list, and the model list itself. */

import { cfg } from "./config.js";
import { patternPass } from "./patterns.js";
import { state } from "./state.js";

export const micKey = (m, brand) => brand.slug + "/" + m.slug;

/* Every transducer type a row answers to. A microphone has one; a kit is a box,
   so it answers to each type inside it as well as to its own "mixed" — a drum
   pack of dynamics and condensers belongs under both chips. docs/build_data.py
   totals the chip counts the same way, so a count always matches its list. */
export const typesOf = (m) => m.types || [m.type || "unknown"];

export const typePass = (m, key) => key === "all" || typesOf(m).includes(key);

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

/* How much of the X230 profile the catalogue can fill in for this record —
   computed at build time by docs/x230_read.py and carried on the index row. */
export function x230Pass(m) {
  if (state.x230 === "any") return true;
  const band = (cfg().x230Bands || []).find((b) => b.key === state.x230);
  if (!band) return true;
  if (band.none) return m.x230 == null;
  if (m.x230 == null) return false;
  return m.x230 >= band.min && (band.max == null || m.x230 < band.max);
}

/* Everything the facet controls ask of a model, AND-ed together. */
export function facetPass(m, brand) {
  if (!typePass(m, state.type)) return false;
  if (state.form !== "all" && m.form !== state.form) return false;
  if (state.currentOnly && m.avail !== "current") return false;
  for (const t of state.traits) if (!m[t]) return false;
  return pricePass(m) && x230Pass(m) && tagPass(m, brand);
}

export function filtersActive() {
  return state.type !== "all" || state.form !== "all" || state.price !== "any" ||
    state.x230 !== "any" ||
    state.traits.size > 0 || state.currentOnly || state.patterns.size > 0 || !!state.tag;
}

export function clearFilters() {
  state.type = "all";
  state.form = "all";
  state.price = "any";
  state.x230 = "any";
  state.traits.clear();
  state.currentOnly = false;
  state.patterns.clear();
  state.tag = null;
}

export function filterSummary() {
  const c = cfg();
  if (!c) return "Brands";
  const parts = [];

  if (state.query) {
    parts.push("“" + state.query + "”");
  }

  if (state.type && state.type !== "all") {
    const t = (c.types || []).find((x) => x.key === state.type);
    if (t) parts.push(t.label);
  }

  if (state.patterns && state.patterns.size) {
    for (const key of state.patterns) {
      const p = (c.patterns || []).find((x) => x.key === key);
      if (p) parts.push(p.label);
    }
  }

  if (state.traits && state.traits.size) {
    for (const key of state.traits) {
      const t = (c.traits || []).find((x) => x.key === key);
      if (t) parts.push(t.label);
    }
  }

  if (state.currentOnly) {
    parts.push("Current");
  }

  if (state.form && state.form !== "all") {
    const f = (c.forms || []).find((x) => x.key === state.form);
    if (f) parts.push(f.label);
    else parts.push(state.form);
  }

  if (state.price && state.price !== "any") {
    const p = (c.priceBands || []).find((x) => x.key === state.price);
    if (p) parts.push(p.label);
  }

  if (state.x230 && state.x230 !== "any") {
    const x = (c.x230Bands || []).find((x) => x.key === state.x230);
    if (x) parts.push(x.label);
  }

  if (state.tag) {
    parts.push("tag: " + state.tag);
  }

  return parts.length ? parts.join(" · ") : "Brands";
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
    x230: (x, y) => (x.m.x230 ?? Infinity) - (y.m.x230 ?? Infinity) || byName(x, y),
    "x230-desc": (x, y) => (y.m.x230 ?? -1) - (x.m.x230 ?? -1) || byName(x, y),
  };
  return rows.sort(sorters[state.sort] || byName);
}
