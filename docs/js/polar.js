/* Polar-pattern icons drawn from the real equations, so a button shows the
 * shape the pattern actually has rather than a stylised stand-in.
 *
 * Which curves make up which button is data (config.json -> patterns[].icon);
 * this module only knows how to draw them. */

const TAU = Math.PI * 2;

export const SHAPES = {
  omni: () => 1,
  cardioid: (t) => 0.5 * (1 + Math.cos(t)),
  wide: (t) => 0.7 + 0.3 * Math.cos(t),
  super: (t) => Math.abs(0.37 + 0.63 * Math.cos(t)),
  hyper: (t) => Math.abs(0.25 + 0.75 * Math.cos(t)),
  fig8: (t) => Math.abs(Math.cos(t)),
  shotgun: (t) =>
    Math.pow(Math.max(Math.cos(t), 0), 5) + 0.14 * Math.pow(Math.max(-Math.cos(t), 0), 3),
};

export function polarPath(r, opt) {
  const { rot = 0, scale = 1, steps = 120 } = opt || {};
  let d = "";
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * TAU;
    const rad = Math.max(0, r(t - rot)) * 11 * scale;
    const x = 12 + rad * Math.sin(t);
    const y = 12 - rad * Math.cos(t);
    d += (i ? "L" : "M") + x.toFixed(2) + " " + y.toFixed(2);
  }
  return d + "Z";
}

/* Some buttons stand for something that has no polar pattern at all — a
   wireless system carries a radio, not a capsule, so there is no curve to plot.
   Those name a glyph in config instead of a set of curves. */
export const GLYPHS = {
  antenna:
    '<path class="strokep" d="M5.5 9.2a9 9 0 0 1 13 0"/>' +
    '<path class="strokep" d="M8.4 11.4a5.2 5.2 0 0 1 7.2 0"/>' +
    '<circle class="fillp" cx="12" cy="13.2" r="1.7"/>' +
    '<path class="strokep" d="M12 13.2V21"/>',
};

/* `curves` comes straight from config: [{shape, rot, scale, stroke}, …], or a
   glyph name when the button is not a pattern. */
export function iconSvg(curves, glyph) {
  const paths = glyph
    ? (GLYPHS[glyph] || "")
    : (curves || [])
      .filter((c) => SHAPES[c.shape])
      .map((c) => '<path class="' + (c.stroke ? "strokep" : "fillp") + '" d="' +
        polarPath(SHAPES[c.shape], c) + '"/>')
      .join("");
  return '<svg viewBox="0 0 24 24" aria-hidden="true">' + paths + "</svg>";
}
