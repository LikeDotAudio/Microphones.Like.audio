/* The Tags view: the whole site vocabulary, searchable and sortable, and the
 * bridge back into Browse with one of them applied. */

import { $, el } from "./dom.js";
import { PAGE } from "./config.js";
import { ensureTags } from "./data.js";
import { state } from "./state.js";
import { applyFilters, showView } from "./views.js";

export function renderTagView() {
  const grid = $("tagGrid");
  grid.innerHTML = "";

  if (!state.tagList) {
    $("tagStat").textContent = "";
    grid.appendChild(el("div", "empty", "Loading tags…"));
    ensureTags().then(renderTagView).catch((err) => {
      grid.innerHTML = "";
      grid.appendChild(el("div", "empty", "Could not load data/tags.json — " + err.message));
    });
    return;
  }

  const q = state.tagQuery;
  const rows = state.tagList.filter((t) => !q || t.name.toLowerCase().includes(q));
  const byName = (a, b) => a.name.localeCompare(b.name);
  const sorters = {
    count: (a, b) => b.count - a.count || byName(a, b),
    "count-asc": (a, b) => a.count - b.count || byName(a, b),
    name: byName,
    "name-desc": (a, b) => byName(b, a),
  };
  rows.sort(sorters[state.tagSort] || sorters.count);

  $("tagStat").textContent = q
    ? rows.length + " of " + state.tagList.length + " tags"
    : state.tagList.length + " tags · " +
      state.tagList.reduce((n, t) => n + t.count, 0).toLocaleString() + " assignments";

  if (!rows.length) {
    grid.appendChild(el("div", "empty", "No tag matches “" + q + "”"));
    return;
  }

  /* Bar widths are relative to the most-used tag in the *whole* vocabulary, so
     filtering the list doesn't silently rescale what a bar means. */
  const max = state.tagList[0] ? Math.max(...state.tagList.map((t) => t.count)) : 1;
  const frag = document.createDocumentFragment();
  for (const t of rows) {
    const cell = el("button", "tagcell");
    cell.type = "button";
    cell.dataset.tag = t.name;
    if (state.tag === t.name) cell.classList.add("on");
    cell.append(el("span", "n", t.name), el("span", "c", t.count.toLocaleString()));
    const bar = el("span", "bar");
    bar.style.width = Math.max(2, Math.round((t.count / max) * 100)) + "%";
    cell.appendChild(bar);
    cell.title = t.name + " · " + t.count + " microphone" + (t.count === 1 ? "" : "s");
    frag.appendChild(cell);
  }
  grid.appendChild(frag);
}

/* Selecting a tag hands you back to the browse panes with it applied. */
export function openTag(name) {
  return ensureTags().then(() => {
    state.tag = state.tagMembers.has(name) ? name : null;
    state.limit = PAGE();
    state.scope = null;      // a tag spans brands, so widen to the whole catalogue
    if (location.hash !== "#/") location.hash = "#/";
    showView("browse");
    applyFilters();
  });
}
