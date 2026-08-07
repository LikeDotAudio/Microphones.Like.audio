/* Every fetch the browser makes, and the caches behind them.
 *
 * index.json boots the whole UI; brand files and the tag vocabulary are pulled
 * only when something on screen needs them.
 *
 * All of them are fetched `no-cache`, which does not mean "do not cache" — it
 * means "revalidate before reuse". The host sends these files with a
 * Last-Modified and nothing else: no Cache-Control, no ETag. A browser handed
 * that guesses a freshness lifetime of its own, and the guess differs per file,
 * so index.json can sit in the cache for hours after config.json has been
 * refetched. Every one of these files is rebuilt in the same pass and has to
 * agree with the others and with the code reading it — a rebuilt config paired
 * with yesterday's index is a filter chip that returns nothing. Revalidating
 * costs one conditional request and a 304 when nothing changed; the service
 * worker still answers from its own cache when the network is gone. */

import { state } from "./state.js";

/* The data files are generated together and must arrive together. */
const FRESH = { cache: "no-cache" };

export async function loadIndex() {
  const res = await fetch("data/index.json", FRESH);
  if (!res.ok) throw new Error("HTTP " + res.status);
  state.index = await res.json();
  state.byBrand.clear();
  state.index.brands.forEach((b) => state.byBrand.set(b.slug, b));
  return state.index;
}

export async function loadBrand(slug) {
  if (state.brandData.has(slug)) return state.brandData.get(slug);
  const file = state.byBrand.get(slug).file;
  const res = await fetch("data/brands/" + encodeURIComponent(file) + ".json", FRESH);
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
    tagsPromise = fetch("data/tags.json", FRESH)
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

/* rf.json holds every wireless system in full. The Wireless tab wants them all
   at once, so it fetches this rather than reaching into 16 brand files. */
let rfPromise = null;

export function ensureRf() {
  if (!rfPromise) {
    rfPromise = fetch("data/rf.json", FRESH)
      .then((r) => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then((data) => {
        state.rf = data.systems;
        return data;
      })
      .catch((err) => { rfPromise = null; throw err; });
  }
  return rfPromise;
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
