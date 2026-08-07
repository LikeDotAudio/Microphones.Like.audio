/* Entry point: load the sidecar data, build the controls from it, wire events. */

import { $, el, esc } from "./dom.js";
import { PAGE, loadConfig } from "./config.js";
import { renderControls } from "./controls.js";
import { loadIndex } from "./data.js";
import { clearFilters } from "./filters.js";
import { renderGallery } from "./gallery.js";
import { renderModels } from "./models.js";
import { renderPatternBar } from "./patterns.js";
import { state } from "./state.js";
import { openTag, renderTagView } from "./tagview.js";
import { renderTree, stepTree } from "./tree.js";
import { applyFilters, route } from "./views.js";

/* ------------------------------------------------------------------- boot */
async function boot() {
  try {
    await loadConfig();
    renderControls();
    renderPatternBar();
    await loadIndex();
  } catch (err) {
    showLoadError(err);
    return;
  }
  state.limit = PAGE();
  const idx = state.index;
  $("stat").textContent = [
    idx.total_microphones.toLocaleString() + " mics",
    idx.total_rf ? idx.total_rf + " wireless" : null,
    idx.total_brands + " brands",
  ].filter(Boolean).join(" · ");
  wireFilterBar();
  renderTree();
  route();
}

function showLoadError(err) {
  const local = location.protocol === "file:";
  $("tree").innerHTML = "";
  const box = el("div", "notice");
  box.innerHTML = local
    ? "<b>Open this over HTTP.</b><p>Browsers block <code>fetch()</code> and ES modules from " +
      "<code>file://</code>, so the data files can't load. From the repository root run:</p>" +
      "<code>python3 -m http.server -d docs 8000</code>" +
      "<p>then visit <a href='http://localhost:8000/'>http://localhost:8000/</a></p>"
    : "<b>Could not load the data files.</b><p>" + esc(err.message) +
      "</p><p>Generate them first:</p><code>python3 docs/build_data.py</code>";
  $("tree").appendChild(box);
}

/* -------------------------------------------------------- filter bar events
   The controls are built at boot, so these bind after renderControls(). */
function wireFilterBar() {
  $("form").addEventListener("change", (e) => { state.form = e.target.value; applyFilters(); });
  $("price").addEventListener("change", (e) => { state.price = e.target.value; applyFilters(); });
  $("x230Band").addEventListener("change", (e) => { state.x230 = e.target.value; applyFilters(); });
  $("sort").addEventListener("change", (e) => {
    state.sort = e.target.value;
    state.limit = PAGE();
    renderModels();
  });
}

/* ------------------------------------------------------------------ events */
let searchTimer;
$("search").addEventListener("input", (e) => {
  clearTimeout(searchTimer);
  const v = e.target.value.trim().toLowerCase();
  searchTimer = setTimeout(() => {
    state.query = v;
    applyFilters();
  }, 120);
});

$("patbar").addEventListener("click", (e) => {
  const btn = e.target.closest(".pat");
  if (!btn) return;
  const key = btn.dataset.key;
  if (state.patterns.has(key)) state.patterns.delete(key);
  else state.patterns.add(key);
  applyFilters();
});

$("filters").addEventListener("click", (e) => {
  const chip = e.target.closest(".chip");
  if (!chip) return;
  if (chip.id === "reset") clearFilters();
  else if (chip.id === "tagChip") state.tag = null;
  else if (chip.dataset.type) state.type = chip.dataset.type;
  else if (chip.dataset.trait) {
    if (state.traits.has(chip.dataset.trait)) state.traits.delete(chip.dataset.trait);
    else state.traits.add(chip.dataset.trait);
  } else if (chip.dataset.avail) state.currentOnly = !state.currentOnly;
  applyFilters();
});

let tagSearchTimer;
$("tagSearch").addEventListener("input", (e) => {
  clearTimeout(tagSearchTimer);
  const v = e.target.value.trim().toLowerCase();
  tagSearchTimer = setTimeout(() => { state.tagQuery = v; renderTagView(); }, 120);
});
$("tagSort").addEventListener("change", (e) => {
  state.tagSort = e.target.value;
  renderTagView();
});
let galSearchTimer;
$("galSearch").addEventListener("input", (e) => {
  clearTimeout(galSearchTimer);
  const v = e.target.value.trim().toLowerCase();
  galSearchTimer = setTimeout(() => {
    state.galQuery = v;
    renderGallery();
  }, 120);
});

$("tagGrid").addEventListener("click", (e) => {
  const cell = e.target.closest(".tagcell");
  if (cell) openTag(cell.dataset.tag);
});

$("theme").addEventListener("click", () => {
  const now = document.documentElement.getAttribute("data-theme");
  const next = now === "dark" ? "light" : now === "light" ? "" : "dark";
  if (next) document.documentElement.setAttribute("data-theme", next);
  else document.documentElement.removeAttribute("data-theme");
  try {
    next ? localStorage.setItem("mic-theme", next) : localStorage.removeItem("mic-theme");
  } catch (e) { /* private mode */ }
});

window.addEventListener("hashchange", route);

document.addEventListener("keydown", (e) => {
  if (e.key === "/" && e.target !== $("search")) { e.preventDefault(); $("search").focus(); }
  if (e.key === "Escape" && e.target === $("search")) {
    $("search").value = "";
    $("search").dispatchEvent(new Event("input"));
    $("search").blur();
  }

  if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
  if (document.querySelector("main").hidden) return;          // not on the browse view
  const t = e.target;
  // Arrows belong to the field the user is actually editing, except the search
  // box — typing a query then arrowing into the hits is the point.
  if (t !== $("search") &&
      (t.tagName === "INPUT" || t.tagName === "SELECT" || t.tagName === "TEXTAREA")) return;
  e.preventDefault();
  stepTree(e.key === "ArrowDown" ? 1 : -1);
});

boot();
