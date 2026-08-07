/* Offering the site as an app, and registering the worker that makes it one.
 *
 * Chrome hands us the install prompt rather than showing its own: it fires
 * beforeinstallprompt, we keep the event, and spend it when someone asks. So
 * the offer has to come from us — a bar along the bottom the first time, and
 * a button in the header for ever after.
 *
 * iOS has no such event. Safari can still add the site to the home screen,
 * but only through its own share menu, so there the bar explains the two taps
 * instead of offering a button that cannot exist.
 *
 * Asked once, never nagged: dismissing the bar is remembered.
 */

import { $, el } from "./dom.js";

const DISMISSED = "mic-install-dismissed";

let deferred = null;      // the saved beforeinstallprompt event, if we have one

/* Already an app? Then there is nothing to offer. Chrome and Firefox report
   the display mode; iOS answers only through its own non-standard flag. */
const installed = () =>
  window.matchMedia("(display-mode: standalone), (display-mode: fullscreen)").matches ||
  window.navigator.standalone === true;

const isIOS = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  // iPadOS 13+ claims to be a Mac; the touch points give it away.
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

const dismissed = () => {
  try {
    return localStorage.getItem(DISMISSED) === "1";
  } catch (e) {
    return false;                       // private mode: ask again, no harm done
  }
};

function remember() {
  try {
    localStorage.setItem(DISMISSED, "1");
  } catch (e) { /* private mode */ }
}

/* ------------------------------------------------------------------- the bar */

function buildBar(ios) {
  const bar = el("div", "installbar");
  bar.id = "installbar";

  const icon = el("img", "ibicon");
  icon.src = "icon.svg";
  icon.alt = "";
  icon.width = 34;
  icon.height = 34;

  const words = el("div", "ibwords");
  words.appendChild(el("b", null, "Install Microphones.Like.Audio"));
  words.appendChild(el("span", null, ios
    ? "Tap Share, then “Add to Home Screen”."
    : "Full screen, on your home screen, and it still opens without a signal."));

  const actions = el("div", "ibacts");
  if (!ios) {
    const yes = el("button", "chip on", "Install");
    yes.type = "button";
    yes.addEventListener("click", () => { hideBar(); offer(); });
    actions.appendChild(yes);
  }
  const no = el("button", "chip", ios ? "Got it" : "Not now");
  no.type = "button";
  no.addEventListener("click", () => { remember(); hideBar(); });
  actions.appendChild(no);

  bar.append(icon, words, actions);
  document.body.appendChild(bar);
  return bar;
}

function showBar(ios) {
  if (dismissed() || $("installbar")) return;
  const bar = buildBar(ios);
  // One frame between "in the DOM" and "visible" is what the transition needs.
  requestAnimationFrame(() => bar.classList.add("up"));
}

function hideBar() {
  const bar = $("installbar");
  if (!bar) return;
  bar.classList.remove("up");
  bar.addEventListener("transitionend", () => bar.remove(), { once: true });
}

/* Spend the saved event. It is good for one use: Chrome discards it once
   prompted, so the button goes away with it either way. */
async function offer() {
  if (!deferred) return;
  const prompt = deferred;
  deferred = null;
  $("install").hidden = true;
  prompt.prompt();
  try {
    const { outcome } = await prompt.userChoice;
    if (outcome === "dismissed") remember();
  } catch (e) { /* the browser closed it for us */ }
}

/* ------------------------------------------------------------------- wiring */

export function initInstall() {
  if ("serviceWorker" in navigator) {
    // After load: the worker is for the *next* visit, and registering it
    // during boot only competes with the data the page needs now.
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch(() => { /* http://, or blocked */ });
    });
  }

  $("install").addEventListener("click", offer);

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();                 // ours to offer, not the browser's
    deferred = e;
    $("install").hidden = false;
    showBar(false);
  });

  window.addEventListener("appinstalled", () => {
    deferred = null;
    remember();
    $("install").hidden = true;
    hideBar();
  });

  // Safari never fires the event, so the iOS offer is made on sight — but only
  // to a browser that can actually do it, and only once.
  if (isIOS() && !installed()) showBar(true);
}
