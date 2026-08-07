/* View switching, routing, and the one place that says "the filters changed,
 * redraw". Leaf modules call into here rather than into each other. */

import { $ } from "./dom.js";
import { PAGE } from "./config.js";
import { filtersActive } from "./filters.js";
import { go, hashParts } from "./hash.js";
import { renderDetail } from "./detail.js";
import { renderModels } from "./models.js";
import { state } from "./state.js";
import { renderStats } from "./stats.js";
import { renderTagView, openTag } from "./tagview.js";
import { renderTree, syncTreeSelection } from "./tree.js";

let statsBuilt = false;
let routed = false;      // has route() run once? distinguishes deep links from clicks

export function showView(name) {
  const stats = name === "stats";
  const tags = name === "tags";
  const wireless = name === "wireless";
  const browse = !stats && !tags && !wireless;
  document.querySelector("main").hidden = !browse;
  $("stats").hidden = !stats;
  $("tags").hidden = !tags;
  $("wireless").hidden = !wireless;
  // Search and the pattern buttons drive the browse panes only; the other
  // views carry their own filters.
  $("search").hidden = !browse;
  $("patbar").hidden = !browse;
  $("navBrowse").classList.toggle("on", browse);
  $("navWireless").classList.toggle("on", wireless);
  $("navTags").classList.toggle("on", tags);
  $("navStats").classList.toggle("on", stats);
  if (stats && !statsBuilt) { renderStats(); statsBuilt = true; }
  if (tags) renderTagView();
  if (wireless) { renderRfControls(); renderRfView(); }
}

/* Point the middle pane at one brand, or at the whole catalogue when null. */
export function openScope(slug) {
  state.scope = slug;
  state.limit = PAGE();
  if (slug) go(slug);
  renderTree();
  renderModels();
}

export function route() {
  const parts = hashParts();

  if (parts[0] === "stats") { showView("stats"); return; }
  if (parts[0] === "tags") { showView("tags"); return; }
  /* #/tag/<name> is the shareable form of "browse everything tagged X". */
  if (parts[0] === "tag" && parts[1]) { showView("browse"); openTag(parts[1]); return; }
  showView("browse");

  const [brand, model] = parts;
  const next = state.byBrand.has(brand) ? brand : null;
  const brandChanged = next !== state.brand;
  state.brand = next;
  state.model = state.brand && model ? model : null;

  /* A single-brand scope follows the hash; the all-brands sweep stays put, so
     clicking a result doesn't throw away the list you just filtered down to.
     A brand named in the hash at load time is a deep link, not a click, so it
     scopes the pane even though the sweep is where we start. */
  const deepLink = !routed && state.brand;
  routed = true;
  if (brandChanged && (state.scope !== null || deepLink)) {
    state.scope = state.brand;
    state.limit = PAGE();
    renderTree();
  }
  syncChips();
  renderModels();
  syncTreeSelection();
  const card = document.querySelector("#models .card.sel");
  if (card) card.scrollIntoView({ block: "nearest" });
  renderDetail();
}

/* Push state back onto the controls — called after any programmatic change. */
export function syncChips() {
  document.querySelectorAll("#filters .chip[data-type]").forEach((c) =>
    c.classList.toggle("on", c.dataset.type === state.type));
  document.querySelectorAll("#filters .chip[data-trait]").forEach((c) =>
    c.classList.toggle("on", state.traits.has(c.dataset.trait)));
  document.querySelectorAll("#filters .chip[data-avail]").forEach((c) =>
    c.classList.toggle("on", state.currentOnly));
  $("form").value = state.form;
  $("form").classList.toggle("on", state.form !== "all");
  $("price").value = state.price;
  $("price").classList.toggle("on", state.price !== "any");
  const tagChip = $("tagChip");
  tagChip.hidden = !state.tag;
  if (state.tag) tagChip.textContent = "tag: " + state.tag + "  ✕";
  $("reset").hidden = !filtersActive();
  document.querySelectorAll("#patbar .pat").forEach((b) => {
    const on = state.patterns.has(b.dataset.key);
    b.classList.toggle("on", on);
    b.setAttribute("aria-pressed", String(on));
  });
}

/* Any facet change re-filters both panes and rewinds the paged list. */
export function applyFilters() {
  state.limit = PAGE();
  syncChips();
  renderTree();   /* already re-applies the tree's selection classes */
  renderModels();
}
