/* The URL is the app's address book: #/<brand>/<model>, plus #/tags, #/stats
 * and #/tag/<name>. Everything that needs to name a place uses these. */

import { state } from "./state.js";

export function hashFor(brand, model) {
  return brand
    ? "#/" + encodeURIComponent(brand) + (model ? "/" + encodeURIComponent(model) : "")
    : "#/";
}

export function go(brand, model) {
  location.hash = hashFor(brand, model);
}

export const hashParts = () =>
  location.hash.replace(/^#\/?/, "").split("/").filter(Boolean).map(decodeURIComponent);

/* A recordinghacks permalink, but only if we hold that microphone — otherwise
   the detail pane would route to something it cannot load. */
export function parsePermalink(url) {
  if (!url) return null;
  const m = /\/microphones\/([^\/?#]+)\/([^\/?#]+)\/?$/.exec(url);
  if (!m) return null;
  const brand = decodeURIComponent(m[1]);
  const model = decodeURIComponent(m[2]);
  const rec = state.byBrand.get(brand);
  return rec && rec.models.some((x) => x.slug === model) ? { brand, model } : null;
}
