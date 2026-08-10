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
  all:
    '<circle class="fillp" cx="8" cy="8" r="2.4"/>' +
    '<circle class="fillp" cx="16" cy="8" r="2.4"/>' +
    '<circle class="fillp" cx="8" cy="16" r="2.4"/>' +
    '<circle class="fillp" cx="16" cy="16" r="2.4"/>',
  condenser:
    '<circle class="strokep" cx="12" cy="12" r="8.5"/>' +
    '<line class="strokep" x1="9" y1="8" x2="9" y2="16"/>' +
    '<line class="strokep" x1="15" y1="8" x2="15" y2="16"/>' +
    '<line class="strokep" x1="4" y1="12" x2="9" y2="12"/>' +
    '<line class="strokep" x1="15" y1="12" x2="20" y2="12"/>',
  dynamic:
    '<circle class="strokep" cx="12" cy="12" r="8.5"/>' +
    '<path class="strokep" d="M8 9.5h8M8 12h8M8 14.5h8"/>' +
    '<line class="strokep" x1="12" y1="3.5" x2="12" y2="8"/>' +
    '<line class="strokep" x1="12" y1="16" x2="12" y2="20.5"/>',
  ribbon:
    '<rect class="fillp" x="4.5" y="6" width="3.5" height="12" rx="1"/>' +
    '<rect class="fillp" x="16" y="6" width="3.5" height="12" rx="1"/>' +
    '<path class="strokep" d="M12 5.5v13M12 7.5l-1.5 2 3 2-3 2 3 2-1.5 2"/>',
  boundary:
    '<line class="strokep" x1="3" y1="18.5" x2="21" y2="18.5"/>' +
    '<path class="strokep" d="M6.5 18.5a5.5 5.5 0 0 1 11 0"/>' +
    '<circle class="fillp" cx="12" cy="15" r="1.5"/>',
  hybrid:
    '<circle class="strokep" cx="9" cy="12" r="6"/>' +
    '<circle class="strokep" cx="15" cy="12" r="6"/>' +
    '<line class="strokep" x1="9" y1="9" x2="9" y2="15"/>',
  mixed:
    '<rect class="strokep" x="4" y="8.5" width="16" height="11" rx="2"/>' +
    '<path class="strokep" d="M9.5 8.5V6a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v2.5"/>' +
    '<circle class="fillp" cx="9" cy="14" r="1.5"/>' +
    '<circle class="fillp" cx="15" cy="14" r="1.5"/>',
  wireless:
    '<path class="strokep" d="M5.5 9.2a9 9 0 0 1 13 0"/>' +
    '<path class="strokep" d="M8.4 11.4a5.2 5.2 0 0 1 7.2 0"/>' +
    '<circle class="fillp" cx="12" cy="13.2" r="1.7"/>' +
    '<path class="strokep" d="M12 13.2V21"/>',
  antenna:
    '<path class="strokep" d="M5.5 9.2a9 9 0 0 1 13 0"/>' +
    '<path class="strokep" d="M8.4 11.4a5.2 5.2 0 0 1 7.2 0"/>' +
    '<circle class="fillp" cx="12" cy="13.2" r="1.7"/>' +
    '<path class="strokep" d="M12 13.2V21"/>',
  unknown:
    '<circle class="strokep" cx="12" cy="12" r="8.5"/>' +
    '<path class="strokep" d="M9.8 9.8a2.5 2.5 0 0 1 4.4 1.4c0 1.5-2.2 2-2.2 3.3"/>' +
    '<circle class="fillp" cx="12" cy="17" r="1"/>',
  tube:
    '<path class="strokep" d="M8 20V9.5a4 4 0 0 1 8 0V20"/>' +
    '<line class="strokep" x1="6.5" y1="20" x2="17.5" y2="20"/>' +
    '<line class="strokep" x1="9" y1="20" x2="9" y2="22.5"/>' +
    '<line class="strokep" x1="12" y1="20" x2="12" y2="22.5"/>' +
    '<line class="strokep" x1="15" y1="20" x2="15" y2="22.5"/>' +
    '<rect class="strokep" x="9.5" y="9.5" width="5" height="7" rx="0.5"/>' +
    '<line class="strokep" x1="12" y1="12" x2="12" y2="14"/>',
  current:
    '<path class="strokep" d="M19 6.5L9 16.5l-4.5-4.5"/>',
  tag:
    '<path class="strokep" d="M20.5 13.5l-7 7a2 2 0 0 1-2.8 0L3 12.7V3h9.7l7.8 7.8a2 2 0 0 1 0 2.7z"/>' +
    '<circle class="fillp" cx="7.5" cy="7.5" r="1.5"/>',
  clear:
    '<path class="strokep" d="M18 6L6 18M6 6l12 12"/>',
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
