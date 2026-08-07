/* The filter bar, built from config rather than written into the markup.
 *
 * index.html ships two empty rows; everything inside them — which transducer
 * chips exist, which form factors and price bands are offered, which sort
 * orders — comes from data/config.json, counted against the corpus. */

import { $, el, fillSelect } from "./dom.js";
import { cfg, usable } from "./config.js";

function chip(attr, key, label, count) {
  const b = el("button", "chip", label);
  b.type = "button";
  b.dataset[attr] = key;
  if (count != null) b.title = count.toLocaleString() + " microphones";
  return b;
}

export function renderControls() {
  const c = cfg();

  const row1 = $("frowType");
  row1.innerHTML = "";
  for (const t of usable(c.types)) {
    row1.appendChild(chip("type", t.key, t.label, t.count));
  }
  const form = el("select", "push");
  form.id = "form";
  form.title = "Form factor";
  row1.appendChild(form);
  fillSelect(form, [{ key: "all", label: "Any form factor" }].concat(usable(c.forms)),
    { showCounts: true });

  const row2 = $("frowMore");
  row2.innerHTML = "";

  const price = el("select");
  price.id = "price";
  price.title = "MSRP range";
  row2.appendChild(price);
  fillSelect(price, usable(c.priceBands), { showCounts: true });

  for (const t of usable(c.traits)) {
    row2.appendChild(chip("trait", t.key, t.label, t.count));
  }
  const current = c.availability.find((a) => a.key === "current");
  if (current && current.count) {
    row2.appendChild(chip("avail", "current", current.label, current.count));
  }

  const tagChip = el("button", "chip on tagchip");
  tagChip.type = "button";
  tagChip.id = "tagChip";
  tagChip.hidden = true;
  row2.appendChild(tagChip);

  const reset = el("button", "chip clear", "Clear filters");
  reset.type = "button";
  reset.id = "reset";
  reset.hidden = true;
  row2.appendChild(reset);

  const sort = el("select", "push");
  sort.id = "sort";
  sort.title = "Sort order";
  row2.appendChild(sort);
  fillSelect(sort, c.sorts);

  fillSelect($("tagSort"), c.tagSorts);
}
