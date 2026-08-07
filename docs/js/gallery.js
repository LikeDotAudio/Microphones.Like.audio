/* The Gallery tab: every microphone in the catalogue as a picture, grouped by
 * manufacturer and ordered by model inside each one.
 *
 * Browse answers "what do I know about this mic"; this answers "what does it
 * look like". It reads index.json — already in memory from boot — so nothing is
 * fetched here; the only cost is the photos, which the CDN serves and the
 * browser fetches lazily as the grid scrolls into view.
 *
 * Groups are handed out a manufacturer at a time rather than all 1,800 tiles at
 * once, so the first paint stays cheap on a phone. */

import { $, el } from "./dom.js";
import { PAGE } from "./config.js";
import { go } from "./hash.js";
import { state } from "./state.js";

/* Numeric collation so C 414 sorts before C 3000, and U 47 before U 87. */
const byModel = (a, b) =>
  (a.model || a.slug).localeCompare(b.model || b.slug, undefined, { numeric: true });

/* [{brand, models}] — manufacturer A→Z, models A→Z within, filtered by the
   search box. A manufacturer with nothing left after filtering drops out. */
export function galleryGroups() {
  const q = state.galQuery;
  const groups = [];
  for (const b of state.index.brands) {
    const brandHit = q && b.name.toLowerCase().includes(q);
    const models = b.models.filter((m) =>
      !q || brandHit || (m.model || m.slug).toLowerCase().includes(q));
    if (models.length) groups.push({ brand: b, models: models.slice().sort(byModel) });
  }
  return groups.sort((x, y) =>
    x.brand.name.localeCompare(y.brand.name, undefined, { numeric: true }));
}

function tile(m, brand) {
  const cell = el("button", "gcell");
  cell.type = "button";
  cell.title = brand.name + " " + (m.model || m.slug) + (m.subtitle ? " — " + m.subtitle : "");

  const box = el("span", "gthumb");
  if (m.thumb) {
    const img = el("img");
    img.loading = "lazy";
    img.decoding = "async";
    img.src = m.thumb;
    img.alt = brand.name + " " + (m.model || m.slug);
    /* A dead CDN link would otherwise leave a broken-image glyph in the grid;
       drop it and let the empty frame stand in. */
    img.addEventListener("error", () => { img.remove(); box.classList.add("none"); });
    box.appendChild(img);
  } else {
    box.classList.add("none");
  }

  cell.append(box, el("span", "gname", m.model || m.slug));
  cell.addEventListener("click", () => go(brand.slug, m.slug));
  return cell;
}

function groupNode(g) {
  const sec = el("section", "ggroup");
  const head = el("h3", "ghead");
  head.append(el("span", "gb", g.brand.name),
    el("span", "gc", g.models.length.toLocaleString()));
  const grid = el("div", "ggrid");
  const frag = document.createDocumentFragment();
  for (const m of g.models) frag.appendChild(tile(m, g.brand));
  grid.appendChild(frag);
  sec.append(head, grid);
  return sec;
}

export function renderGallery() {
  const host = $("galGrid");
  host.innerHTML = "";

  const groups = galleryGroups();
  const shown = groups.reduce((n, g) => n + g.models.length, 0);
  const total = state.index.total_models;
  $("galStat").textContent = state.galQuery
    ? shown.toLocaleString() + " of " + total.toLocaleString() + " models · " +
      groups.length + " brands"
    : total.toLocaleString() + " models · " + groups.length.toLocaleString() + " brands";

  if (!groups.length) {
    host.appendChild(el("div", "empty", "Nothing matches “" + state.galQuery + "”"));
    return;
  }

  const page = PAGE();
  const more = el("button", "showmore");
  more.type = "button";

  /* Whole manufacturers at a time — a group cut in half would read as two
     brands. The page size is a floor on the tiles added, not a ceiling. */
  let at = 0, tiles = 0;
  const draw = () => {
    const frag = document.createDocumentFragment();
    let added = 0;
    while (at < groups.length && added < page) {
      frag.appendChild(groupNode(groups[at]));
      added += groups[at].models.length;
      at++;
    }
    tiles += added;
    host.insertBefore(frag, more.isConnected ? more : null);
    state.galLimit = at;
    const left = groups.length - at;
    if (left) {
      more.textContent = "Show more · " + (shown - tiles).toLocaleString() + " models left";
      if (!more.isConnected) host.appendChild(more);
    } else {
      more.remove();
    }
  };

  more.addEventListener("click", draw);
  /* Coming back to the tab redraws what was on screen before, not just page one. */
  const target = Math.max(state.galLimit, 1);
  while (at < groups.length && at < target) draw();
}
