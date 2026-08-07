#!/usr/bin/env python3
"""Draw the site logo and render the icon set from it.

The mark is a large-diaphragm capsule seen head-on, still in its yoke on the
mic body: a gold diaphragm inside an ivory retaining ring, screwed down all the
way round, with the lead wire dropping away to one side. It is the photograph
on the front of the catalogue reduced to the parts that still read at 16px —
a gold disc, a pale ring of screws, a dark stand.

Everything is computed rather than drawn by hand, because the parts that make
it look like a capsule are the parts a person gets wrong: sixteen screws
evenly spaced on a circle, a hood that is a true arc, a yoke whose arms meet
the ring on the tangent. Change RING_SCREWS or the geometry constants and the
drawing stays consistent.

Writes:
    docs/icon.svg                       the mark, transparent, for <link rel=icon> and the header
    docs/icons/icon-192.png             manifest icon
    docs/icons/icon-512.png             manifest icon
    docs/icons/icon-maskable-512.png    manifest icon, purpose=maskable (padded, opaque)
    docs/icons/apple-touch-icon.png     iOS home screen (opaque — iOS adds its own rounding)

Run:  python3 docs/build_logo.py            # svg + every png
      python3 docs/build_logo.py --no-png   # just the svg
"""

import argparse
import math
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))

# ------------------------------------------------------------------ palette
# Fixed, not theme-aware: a favicon has no page to inherit from, and the mark
# has to sit on a browser tab, a phone home screen and both site themes.
GOLD_LIT = "#e9bd6a"      # diaphragm, lit edge
GOLD = "#c98f2a"          # diaphragm, body
GOLD_DEEP = "#9a6612"     # diaphragm, shadowed edge
BRASS = "#e2b661"         # screw heads
IVORY = "#f4efe4"         # retaining ring and hood
IVORY_EDGE = "#cdc3ad"    # their shadowed side
# The stand has to stay visible against both site themes and a phone's black
# home screen, so it is a warm graphite rather than the near-black of the
# photograph — dark enough to read as metal on white, light enough not to
# vanish on black.
DARK = "#2a231b"          # yoke, stem, body
DARK_LIT = "#4c3f31"      # the lit face of the same
SPLASH_BG = "#14110d"     # matches the app's dark background

# ----------------------------------------------------------------- geometry
BOX = 64.0                # viewBox is square; every number below is in it
CX, CY = 32.0, 24.5       # centre of the capsule
R_RING = 19.5             # outer edge of the ivory retaining ring
R_GOLD = 13.8             # the diaphragm itself
R_SCREW = 16.7            # circle the screw heads sit on
RING_SCREWS = 16
SCREW_R = 1.2
YOKE_DEG = 34.0           # where each yoke arm meets the ring, off the vertical


def screw_ring():
    """Screw heads, evenly spaced, starting at the top and going clockwise."""
    out = []
    for i in range(RING_SCREWS):
        a = -math.pi / 2 + i * (2 * math.pi / RING_SCREWS)
        out.append((CX + R_SCREW * math.cos(a), CY + R_SCREW * math.sin(a)))
    return out


def logo_svg(bg=None, pad=0.0):
    """The mark as an SVG document.

    pad shrinks the drawing towards the centre — a maskable icon may have its
    corners cropped to a circle, so the mark has to live inside the middle
    80%. bg fills the canvas behind it, for the icons that cannot be
    transparent.
    """
    scale = 1.0 - 2.0 * pad
    parts = []
    add = parts.append

    add('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %g %g" '
        'role="img" aria-label="Microphone capsule">' % (BOX, BOX))
    add("  <title>Microphones.Like.Audio</title>")
    add("  <defs>")
    add('    <radialGradient id="d" cx="38%%" cy="32%%" r="72%%">'
        '<stop offset="0" stop-color="%s"/><stop offset=".62" stop-color="%s"/>'
        '<stop offset="1" stop-color="%s"/></radialGradient>' % (GOLD_LIT, GOLD, GOLD_DEEP))
    add('    <linearGradient id="r" x1="0" y1="0" x2=".3" y2="1">'
        '<stop offset="0" stop-color="%s"/><stop offset="1" stop-color="%s"/>'
        "</linearGradient>" % (IVORY, IVORY_EDGE))
    add('    <linearGradient id="k" x1="0" y1="0" x2=".6" y2="1">'
        '<stop offset="0" stop-color="%s"/><stop offset="1" stop-color="%s"/>'
        "</linearGradient>" % (DARK_LIT, DARK))
    add("  </defs>")

    if bg:
        add('  <rect width="%g" height="%g" fill="%s"/>' % (BOX, BOX, bg))

    add('  <g transform="translate(%.3f %.3f) scale(%.4f)">'
        % (BOX / 2 * (1 - scale), BOX / 2 * (1 - scale), scale))

    # Yoke, stem, body: everything behind the capsule, drawn before it. The
    # arms start on the ring itself, at the angle a real yoke grips it, so
    # they emerge from behind the rim rather than butting against it.
    ax = R_RING * math.sin(math.radians(YOKE_DEG))
    ay = R_RING * math.cos(math.radians(YOKE_DEG))
    add('    <path d="M%.2f %.2f L27.5 45 h9 L%.2f %.2f" fill="none" stroke="%s" '
        'stroke-width="4.6" stroke-linejoin="round" stroke-linecap="round"/>'
        % (CX - ax, CY + ay, CX + ax, CY + ay, DARK))
    # The mic body: a squat cylinder seen from the front, lit from the left.
    add('    <path d="M26 44 h12 l4.5 15.5 a2.6 2.6 0 0 1 -2.6 2.6 h-15.8 '
        'a2.6 2.6 0 0 1 -2.6 -2.6 Z" fill="url(#k)"/>')
    add('    <path d="M26 44 h4 l-3.2 18.1 h-3.7 a2.6 2.6 0 0 1 -2.6 -2.6 Z" '
        'fill="%s" opacity=".55"/>' % DARK_LIT)

    # The capsule itself.
    add('    <circle cx="%g" cy="%g" r="%g" fill="url(#r)" stroke="%s" '
        'stroke-width=".7"/>' % (CX, CY, R_RING, IVORY_EDGE))
    add('    <circle cx="%g" cy="%g" r="%g" fill="url(#d)"/>' % (CX, CY, R_GOLD))
    add('    <circle cx="%g" cy="%g" r="%g" fill="none" stroke="%s" stroke-width=".6" '
        'opacity=".55"/>' % (CX, CY, R_GOLD - 1.6, GOLD_DEEP))
    for x, y in screw_ring():
        add('    <circle cx="%.2f" cy="%.2f" r="%g" fill="%s"/>' % (x, y, SCREW_R, BRASS))
    # Centre terminal: the one bright point everything else points at.
    add('    <circle cx="%g" cy="%g" r="2.7" fill="%s"/>' % (CX, CY, BRASS))
    add('    <circle cx="%.1f" cy="%.1f" r="1" fill="%s" opacity=".9"/>'
        % (CX - 0.7, CY - 0.8, IVORY))

    add("  </g>")
    add("</svg>")
    return "\n".join(parts) + "\n"


# -------------------------------------------------------------- rasterising

def write_png(svg, path, px):
    """One PNG at one size. cairosvg does it in-process; rsvg-convert and
    Inkscape are the fallbacks for a machine that has not got it."""
    os.makedirs(os.path.dirname(path), exist_ok=True)
    try:
        import cairosvg
    except ImportError:
        return shell_png(svg, path, px)
    cairosvg.svg2png(bytestring=svg.encode(), write_to=path,
                     output_width=px, output_height=px)
    return True


def shell_png(svg, path, px):
    import shutil
    import subprocess
    import tempfile

    with tempfile.NamedTemporaryFile("w", suffix=".svg", delete=False) as fh:
        fh.write(svg)
        tmp = fh.name
    try:
        if shutil.which("rsvg-convert"):
            cmd = ["rsvg-convert", "-w", str(px), "-h", str(px), "-o", path, tmp]
        elif shutil.which("inkscape"):
            cmd = ["inkscape", tmp, "-w", str(px), "-h", str(px), "-o", path]
        else:
            print("No renderer: pip install cairosvg (or install rsvg-convert)",
                  file=sys.stderr)
            return False
        subprocess.run(cmd, check=True, capture_output=True)
        return True
    finally:
        os.unlink(tmp)


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--out", default=HERE, help="site folder (default: docs/)")
    ap.add_argument("--no-png", dest="png", action="store_false",
                    help="write the SVG only")
    opts = ap.parse_args(argv)

    svg_path = os.path.join(opts.out, "icon.svg")
    with open(svg_path, "w") as fh:
        fh.write(logo_svg())
    print("wrote %s" % os.path.relpath(svg_path))

    if not opts.png:
        return 0

    # Transparent for the manifest's "any" icons, opaque and padded for the
    # ones a platform will crop or composite itself.
    icons = [
        ("icons/icon-192.png", 192, None, 0.0),
        ("icons/icon-512.png", 512, None, 0.0),
        ("icons/icon-maskable-512.png", 512, SPLASH_BG, 0.14),
        ("icons/apple-touch-icon.png", 180, SPLASH_BG, 0.07),
    ]
    for name, px, bg, pad in icons:
        path = os.path.join(opts.out, name)
        if write_png(logo_svg(bg=bg, pad=pad), path, px):
            print("wrote %s  %dx%d" % (os.path.relpath(path), px, px))
    return 0


if __name__ == "__main__":
    sys.exit(main())
