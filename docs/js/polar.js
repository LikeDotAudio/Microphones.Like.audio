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

/* `curves` comes straight from config: [{shape, rot, scale, stroke}, …]. */
export function iconSvg(curves) {
  const paths = (curves || [])
    .filter((c) => SHAPES[c.shape])
    .map((c) => '<path class="' + (c.stroke ? "strokep" : "fillp") + '" d="' +
      polarPath(SHAPES[c.shape], c) + '"/>')
    .join("");
  return '<svg viewBox="0 0 24 24" aria-hidden="true">' + paths + "</svg>";
}
