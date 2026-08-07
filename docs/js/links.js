/* Link construction and the sanitiser for scraped markup. */

import { el } from "./dom.js";
import { hashFor, parsePermalink } from "./hash.js";

export function extLink(url, text) {
  const a = el("a", null, text || url);
  a.href = url;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  return a;
}

/* recordinghacks permalinks we also hold locally become in-app navigation;
   anything else opens in a new tab. */
export function appLink(url, text) {
  const target = parsePermalink(url);
  if (!target) return extLink(url, text);
  const a = el("a", "inapp", text || url);
  a.href = hashFor(target.brand, target.model);
  return a;
}

/* Scraped HTML: keep the markup, drop anything executable. */
export function sanitize(html) {
  const tpl = document.createElement("template");
  tpl.innerHTML = html;
  tpl.content.querySelectorAll("script, style, iframe, object, embed, link, form")
    .forEach((n) => n.remove());
  tpl.content.querySelectorAll("*").forEach((n) => {
    [...n.attributes].forEach((a) => {
      const name = a.name.toLowerCase();
      if (name.startsWith("on") || (/^(href|src)$/.test(name) && /^\s*javascript:/i.test(a.value))) {
        n.removeAttribute(a.name);
      }
    });
    if (n.tagName !== "A") return;
    /* Prose links to other mics in the corpus stay inside the browser; the
       rest leave for recordinghacks and the manufacturers. */
    const target = parsePermalink(n.getAttribute("href"));
    if (target) {
      n.setAttribute("href", hashFor(target.brand, target.model));
      n.className = "inapp";
      n.removeAttribute("target");
      n.removeAttribute("rel");
    } else {
      n.target = "_blank";
      n.rel = "noopener noreferrer";
    }
  });
  return tpl.content;
}
