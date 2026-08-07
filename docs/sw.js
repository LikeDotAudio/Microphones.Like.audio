/* The service worker: the thing that makes the site installable, and useful
 * on a train.
 *
 * Network first, cache second. A cache-first shell is faster by a few
 * milliseconds and wrong for weeks — a stale copy of main.js against a fresh
 * data file is a bug nobody can reproduce. So every request goes to the
 * network, the answer is filed as it passes, and the cache only speaks when
 * the network cannot.
 *
 * Only this origin is cached. The photographs come from someone else's CDN;
 * they are their bandwidth to serve and not ours to hoard.
 *
 * Bump CACHE when the shell changes shape — activate then sweeps every older
 * cache away.
 */

const CACHE = "mic-v1";

/* Enough to open the app cold with no network: the page, its stylesheet, its
   entry script and the icon. Every other module and data file joins the cache
   the first time it is fetched. */
const SHELL = [
  "./",
  "./index.html",
  "./css/app.css",
  "./js/main.js",
  "./icon.svg",
  "./manifest.webmanifest",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE)
      // addAll is all-or-nothing; one 404 would leave the worker uninstalled,
      // so each file is allowed to fail on its own.
      .then((c) => Promise.all(SHELL.map((u) => c.add(u).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  if (new URL(req.url).origin !== location.origin) return;

  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() =>
        caches.match(req).then((hit) =>
          // A navigation to any route is still the same single page, so an
          // offline deep link lands on the app rather than a browser error.
          hit || (req.mode === "navigate" ? caches.match("./index.html") : undefined)
        )
      )
  );
});
