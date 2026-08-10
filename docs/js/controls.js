/* The filter bar, built from config rather than written into the markup.
 *
 * index.html ships two empty rows; everything inside them — which transducer
 * chips exist, which form factors and price bands are offered, which sort
 * orders — comes from data/config.json, counted against the corpus. */

import { $, el, fillSelect } from "./dom.js";
import { cfg, usable } from "./config.js";
import { iconSvg } from "./polar.js";

function chip(attr, key, label, count, icon, glyph) {
  const b = el("button", "chip");
  b.type = "button";
  b.dataset[attr] = key;
  if (count != null) b.title = label + " · " + count.toLocaleString() + " microphones";
  else b.title = label;

  if (icon || glyph) {
    b.innerHTML = iconSvg(icon, glyph) + "<span>" + label + "</span>";
  } else {
    b.textContent = label;
  }
  return b;
}

export function renderControls() {
  const c = cfg();

  const row1 = $("frowType");
  row1.innerHTML = "";
  for (const t of usable(c.types)) {
    row1.appendChild(chip("type", t.key, t.label, t.count, t.icon, t.glyph));
  }
  const form = el("select");
  form.id = "form";
  form.title = "Form factor";
  fillSelect(form, [{ key: "all", label: "Any form factor" }].concat(usable(c.forms)),
    { showCounts: true });

  const price = el("select");
  price.id = "price";
  price.title = "MSRP range";
  fillSelect(price, usable(c.priceBands), { showCounts: true });

  /* Not id="x230" — that belongs to the X230 tab's <section>, and a duplicate
     id would hand showView() this control to hide instead. */
  const x230 = el("select");
  x230.id = "x230Band";
  x230.title = "AES-X230 score — how much of the profile this catalogue can fill in";
  fillSelect(x230, usable(c.x230Bands), { showCounts: true });

  const sort = el("select");
  sort.id = "sort";
  sort.title = "Sort order";
  fillSelect(sort, c.sorts);

  const row2 = $("frowMore");
  row2.innerHTML = "";

  for (const t of usable(c.traits)) {
    row2.appendChild(chip("trait", t.key, t.label, t.count, t.icon, t.glyph));
  }
  const current = c.availability.find((a) => a.key === "current");
  if (current && current.count) {
    row1.appendChild(chip("avail", "current", current.label, current.count, null, "current"));
  }

  const tagChip = el("button", "chip on tagchip");
  tagChip.type = "button";
  tagChip.id = "tagChip";
  tagChip.hidden = true;
  row2.appendChild(tagChip);

  const reset = el("button", "chip clear");
  reset.type = "button";
  reset.id = "reset";
  reset.hidden = true;
  reset.title = "Clear filters";
  reset.innerHTML = iconSvg(null, "clear") + "<span>Clear filters</span>";
  row2.appendChild(reset);

  const detailControls = $("detailControls");
  if (detailControls) {
    detailControls.innerHTML = "";
    detailControls.appendChild(form);
    detailControls.appendChild(price);
    detailControls.appendChild(x230);
    detailControls.appendChild(sort);
  }

  fillSelect($("tagSort"), c.tagSorts);
}
