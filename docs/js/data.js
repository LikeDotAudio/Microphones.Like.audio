/* Every fetch the browser makes, and the caches behind them.
 *
 * index.json boots the whole UI; brand files and the tag vocabulary are pulled
 * only when something on screen needs them. */

import { state } from "./state.js";

export async function loadIndex() {
  const res = await fetch("data/index.json");
  if (!res.ok) throw new Error("HTTP " + res.status);
  state.index = await res.json();
  state.byBrand.clear();
  state.index.brands.forEach((b) => state.byBrand.set(b.slug, b));
  return state.index;
}

export async function loadBrand(slug) {
  if (state.brandData.has(slug)) return state.brandData.get(slug);
  const file = state.byBrand.get(slug).file;
  const res = await fetch("data/brands/" + encodeURIComponent(file) + ".json");
  if (!res.ok) throw new Error("HTTP " + res.status + " loading " + file);
  const data = await res.json();
  state.brandData.set(slug, data);
  return data;
}

/* tags.json is ~190 KB of membership lists that only the tag view and an active
   tag filter need, so it loads on first use rather than at boot. */
let tagsPromise = null;

export function ensureTags() {
  if (!tagsPromise) {
    tagsPromise = fetch("data/tags.json")
      .then((r) => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then((data) => {
        state.tagList = data.tags;
        state.tagMembers = new Map(data.tags.map((t) => [t.name, new Set(t.mics)]));
        return data;
      })
      .catch((err) => { tagsPromise = null; throw err; });
  }
  return tagsPromise;
}

/* Every model row in the corpus, flattened and tagged with its brand. Built
   once — the index never changes after boot. */
let flatCache = null;

export function allModels() {
  if (flatCache) return flatCache;
  flatCache = [];
  for (const b of state.index.brands) {
    for (const m of b.models) {
      flatCache.push(Object.assign({ brand: b.name, brandSlug: b.slug }, m));
    }
  }
  return flatCache;
}
