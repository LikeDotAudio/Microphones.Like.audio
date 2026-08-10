/* The brand pane: every brand, its surviving models, and keyboard walking. */

import { $, el } from "./dom.js";
import { brandView, filtersActive, filterSummary } from "./filters.js";
import { go } from "./hash.js";
import { state } from "./state.js";
import { openScope } from "./views.js";

export function renderTree() {
  const host = $("tree");
  host.innerHTML = "";
  const frag = document.createDocumentFragment();
  const filtering = !!state.query || filtersActive();
  let shownBrands = 0, shownModels = 0;

  const brandHead = $("brandHead");
  if (brandHead) brandHead.textContent = filterSummary();

  /* Entry point for browsing the catalogue without committing to a brand. */
  const all = el("div", "brand");
  const allRow = el("div", "brand-row");
  allRow.append(
    el("div", "twisty"),
    el("div", "brand-name", "All microphones"),
    el("div", "count", String(state.index.total_models)));
  allRow.addEventListener("click", () => openScope(null));
  all.dataset.all = "1";
  all.appendChild(allRow);
  if (!state.scope) all.classList.add("sel");
  frag.appendChild(all);

  for (const brand of state.index.brands) {
    const hit = brandView(brand);
    if (!hit) continue;
    shownBrands++;
    shownModels += hit.models.length;

    const node = el("div", "brand");
    node.dataset.slug = brand.slug;
    if (state.brand === brand.slug) node.classList.add("sel", "open");
    // A text search narrows to a handful of brands, so open them; a pattern
    // filter alone still spans most of the list, so leave those collapsed.
    if (state.query && !hit.brandHit) node.classList.add("open");

    const row = el("div", "brand-row");
    const tw = el("div", "twisty", "▶");
    tw.addEventListener("click", (e) => { e.stopPropagation(); node.classList.toggle("open"); });
    const count = filtering && hit.models.length !== brand.count
      ? hit.models.length + "/" + brand.count
      : String(brand.count);
    row.append(tw, el("div", "brand-name", brand.name), el("div", "count", count));
    row.addEventListener("click", () => { node.classList.add("open"); openScope(brand.slug); });
    node.appendChild(row);

    const kidbox = el("div", "brand-kids");
    for (const m of hit.models) {
      const leaf = el("div", "leaf");
      leaf.dataset.slug = m.slug;
      if (state.brand === brand.slug && state.model === m.slug) leaf.classList.add("sel");
      leaf.append(el("span", "dot t-" + (m.type || "unknown")), el("span", null, m.model || m.slug));
      leaf.title = [m.model, m.subtitle].filter(Boolean).join(" — ");
      leaf.addEventListener("click", () => go(brand.slug, m.slug));
      kidbox.appendChild(leaf);
    }
    node.appendChild(kidbox);
    frag.appendChild(node);
  }

  host.appendChild(frag);
  if (!shownBrands) host.appendChild(el("div", "empty", "No matches"));
  $("brandCount").textContent = filtering
    ? shownBrands + " brands · " + shownModels + " models"
    : state.index.total_brands + " brands";
}

export function syncTreeSelection() {
  document.querySelectorAll("#tree .brand").forEach((n) => {
    const on = n.dataset.all ? !state.scope : n.dataset.slug === state.brand;
    n.classList.toggle("sel", on);
    if (on) n.classList.add("open");
    n.querySelectorAll(".leaf").forEach((l) =>
      l.classList.toggle("sel", on && l.dataset.slug === state.model));
  });
  const sel = document.querySelector("#tree .leaf.sel") ||
    document.querySelector("#tree .brand.sel");
  if (sel) sel.scrollIntoView({ block: "nearest" });
}

/* ↑/↓ walk the mics currently showing in the tree, so a filtered list can be
   paged through from the keyboard without reaching for the mouse. */
export function stepTree(delta) {
  let leaves = [...document.querySelectorAll("#tree .brand.open .leaf")];
  if (!leaves.length) {
    const first = document.querySelector("#tree .brand[data-slug]");
    if (!first) return;
    first.classList.add("open");
    leaves = [...first.querySelectorAll(".leaf")];
    if (!leaves.length) return;
  }
  const at = leaves.findIndex((l) => l.classList.contains("sel"));
  const to = at < 0
    ? (delta > 0 ? 0 : leaves.length - 1)
    : Math.min(leaves.length - 1, Math.max(0, at + delta));
  if (to !== at) leaves[to].click();      // reuses the leaf's own navigation
}
