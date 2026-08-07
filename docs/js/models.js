/* The middle pane: one card per microphone, paged. */

import { $, cap, el, money } from "./dom.js";
import { PAGE } from "./config.js";
import { visibleModels } from "./filters.js";
import { go } from "./hash.js";
import { state } from "./state.js";

export function modelCard(m, brand, showBrand) {
  const card = el("div", "card");
  card.dataset.slug = m.slug;
  if (state.brand === brand.slug && state.model === m.slug) card.classList.add("sel");

  const thumb = el("div", "thumb");
  if (m.thumb) {
    const img = el("img");
    img.loading = "lazy";
    img.src = m.thumb;
    img.alt = "";
    img.addEventListener("error", () => img.remove());
    thumb.appendChild(img);
  }

  const info = el("div", "info");
  if (showBrand) info.appendChild(el("div", "brandline", brand.name));
  info.appendChild(el("div", "title", m.model || m.slug));
  if (m.subtitle) info.appendChild(el("div", "desc", m.subtitle));

  const meta = el("div", "meta");
  meta.appendChild(el("span", "tag type t-" + (m.type || "unknown"), cap(m.type || "unknown")));
  if (m.msrp != null) meta.appendChild(el("span", "tag price", money(m.msrp)));
  if (m.avail === "discontinued") meta.appendChild(el("span", "tag disc", "Discontinued"));
  if (m.tube) meta.appendChild(el("span", "tag", "Tube"));
  if (m.multi) meta.appendChild(el("span", "tag", "Multipattern"));
  if (m.stereo) meta.appendChild(el("span", "tag", "Stereo"));
  if (m.set) meta.appendChild(el("span", "tag", "Set"));
  if (m.year) meta.appendChild(el("span", "tag", String(m.year)));
  /* How much of the AES-X230 profile this record can fill in. Banded by tenths
     so the colour reads as "how well documented" without needing a legend. */
  if (m.x230 != null) {
    const chip = el("span", "tag x230pct q" + Math.min(9, Math.floor(m.x230 / 10)),
      "X230 " + m.x230 + "%");
    chip.title = "AES-X230: the catalogue fills in " + m.x230 +
      "% of the profile parameters that apply to this device";
    meta.appendChild(chip);
  }
  info.appendChild(meta);

  card.append(thumb, info);
  card.addEventListener("click", () => go(brand.slug, m.slug));
  return card;
}

export function renderModels() {
  const host = $("models");
  const brand = state.byBrand.get(state.scope) || null;
  const page = PAGE();
  host.innerHTML = "";

  $("filters").hidden = false;
  $("modelHead").textContent = brand ? brand.name : "All microphones";

  const rows = visibleModels(brand);
  const total = brand ? brand.count : state.index.total_models;
  $("modelCount").textContent = rows.length === total
    ? total.toLocaleString() + " models"
    : rows.length.toLocaleString() + " of " + total.toLocaleString();

  if (!rows.length) {
    host.appendChild(el("div", "empty", "No models match the filters"));
    return;
  }

  /* The all-brands sweep can be 1,700 cards — hand them out a page at a time,
     appending in place so the scroll position survives "show more". */
  let drawn = 0;
  const more = el("button", "showmore");
  more.type = "button";

  const draw = () => {
    const stop = Math.min(drawn + page, rows.length);
    const frag = document.createDocumentFragment();
    for (; drawn < stop; drawn++) {
      frag.appendChild(modelCard(rows[drawn].m, rows[drawn].b, !brand));
    }
    host.insertBefore(frag, more.isConnected ? more : null);
    state.limit = drawn;
    const left = rows.length - drawn;
    if (left) {
      more.textContent =
        "Show " + Math.min(page, left) + " more · " + left.toLocaleString() + " left";
      if (!more.isConnected) host.appendChild(more);
    } else {
      more.remove();
    }
  };

  more.addEventListener("click", draw);
  const target = Math.min(Math.max(state.limit, page), rows.length);
  while (drawn < target) draw();
}
