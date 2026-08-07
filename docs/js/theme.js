/* Restores the saved theme before the first paint.
 *
 * Loaded as a classic blocking script from <head> rather than as a module:
 * module scripts are deferred, which would let the default theme paint first
 * and flash. The toggle button itself is wired in main.js, once it exists. */
(function () {
  try {
    var saved = localStorage.getItem("mic-theme");
    if (saved) document.documentElement.setAttribute("data-theme", saved);
  } catch (e) { /* private mode: fall back to the media query */ }
})();
