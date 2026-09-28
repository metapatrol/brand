#!/usr/bin/env python3
"""ARCHIVED. Replaced by @metapatrol/brand-kit (packages/brand-kit), which
reproduces this output (checked with `npm run parity -w @metapatrol/brand-kit`).
Kept as the reference implementation; writes to ./out, fonts from brand-kit.

Generates every metapatrol v3 brand asset from its construction.

Mark geometry
-------------
Every point of the mark lives on an isometric lattice (i, k):

    x = cx + i * u * sqrt(3)/2
    y = cy + k * u / 2          with u = hexagon height / (2 N)

so every edge is either vertical (i constant), falling at 30deg (k - i constant)
or rising at 30deg (k + i constant). The gap between two segments is always one
lattice step: 1 in i for vertical edges, 2 in c for diagonal edges, which is the
same perpendicular distance in both cases.

Wordmark
--------
Inter Medium, lowercase, tracking -0.015em, shaped with HarfBuzz and converted
to outlines, so no font is needed where the SVGs are used.

Run
---
    python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
    .venv/bin/python build.py

SVGs are always written. PNG and ICO exports additionally need `inkscape`
and ImageMagick `convert` on the PATH.
"""
import math
import pathlib
import shutil
import subprocess
import tempfile

import uharfbuzz as hb
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

HERE = pathlib.Path(__file__).parent
ASSETS = HERE / "out"
FONTS = HERE.parent.parent / "packages" / "brand-kit" / "fonts"

# --- colour tokens ------------------------------------------------------------
SIGNAL = "#00E5FF"      # signal cyan, identical on every background
GRAPHITE = "#171D25"    # mark structure on light backgrounds
STEEL = "#5B6776"       # mark structure on dark backgrounds (>= 3:1 on BACKGROUND and SURFACE)
BACKGROUND = "#050607"
SURFACE = "#0F1419"
TEXT = "#E6EDF3"
TEXT_2 = "#9AA7B4"
WHITE = "#FFFFFF"

COLOURWAYS = {
    # name: (structure, signal, wordmark, descriptor)
    "dark": (STEEL, SIGNAL, TEXT, TEXT_2),
    "light": (GRAPHITE, SIGNAL, GRAPHITE, STEEL),
    "mono-white": (WHITE, WHITE, WHITE, WHITE),
    "mono-black": (BACKGROUND, BACKGROUND, BACKGROUND, BACKGROUND),
}

WORDMARK = "metapatrol"
DESCRIPTOR = "infrastructure / developer tools / autonomous systems"

# --- construction ---------------------------------------------------------------
# hexagon N=20: top (0,-40), right edge i=20, bottom (0,40), left edge i=-20
PRIMARY = {
    "n": 20,
    "structure": [
        # main segment: top face, notch, spine, foot
        [(0, -40), (-10, -30), (4, -16), (-6, -6), (-6, 34), (0, 40),
         (9, 31), (0, 22), (0, 0), (11, -11), (11, -29)],
        # left segment: column with arm into the notch
        [(-20, -20), (-11, -29), (-3, -21), (-12, -12), (-12, 28), (-20, 20)],
        # right segment: column with foot under the signal panel
        [(12, -28), (20, -20), (20, 20), (10, 30), (2, 22), (12, 12)],
        # drop block in the channel
        [(-11, 13), (-7, 9), (-7, 33), (-11, 29)],
    ],
    # signal panel: isometric square, half the edge of the hexagon
    "signal": [(1, 1), (11, -9), (11, 11), (1, 21)],
}

# small optical size (20-40 px): N=8, no channel, no drop block
SMALL = {
    "n": 8,
    "structure": [
        [(0, -16), (-4, -12), (0, -8), (-4, -4), (-4, 12), (0, 16),
         (3, 13), (-1, 9), (-1, -1), (4, -6), (4, -12)],
        [(-8, -8), (-5, -11), (-2, -8), (-5, -5), (-5, 11), (-8, 8)],
        [(5, -11), (8, -8), (8, 8), (4, 12), (1, 9), (5, 5)],
    ],
    "signal": [(0, 0), (4, -4), (4, 4), (0, 8)],
}

# corner radius as a fraction of the hexagon height
RADIUS = 6 / 860
# clear space and mark-to-wordmark gap: the signal panel's vertical edge, H/4
X_UNIT = 0.25
# wordmark size in horizontal lockups, relative to the hexagon height
WORDMARK_SIZE = 0.50


# --- geometry -------------------------------------------------------------------
def to_xy(p, n, cx, cy, height):
    u = height / (2 * n)
    i, k = p
    return (cx + i * u * math.sqrt(3) / 2, cy + k * u / 2)


def inset(pts, d):
    """Offset a simple polygon inwards by d (mitre joins): widens every gap by 2d."""
    area = sum(pts[j - 1][0] * pts[j][1] - pts[j][0] * pts[j - 1][1] for j in range(len(pts)))
    sgn = 1 if area > 0 else -1
    lines = []
    for j in range(len(pts)):
        (x0, y0), (x1, y1) = pts[j], pts[(j + 1) % len(pts)]
        l = math.hypot(x1 - x0, y1 - y0)
        nx, ny = -(y1 - y0) / l * sgn, (x1 - x0) / l * sgn
        lines.append(((x0 + nx * d, y0 + ny * d), (x1 - x0, y1 - y0)))
    out = []
    for j in range(len(lines)):
        (p, r), (q, s) = lines[j - 1], lines[j]
        t = ((q[0] - p[0]) * s[1] - (q[1] - p[1]) * s[0]) / (r[0] * s[1] - r[1] * s[0])
        out.append((p[0] + r[0] * t, p[1] + r[1] * t))
    return out


def rounded_path(pts, r):
    """Closed polygon with circular corner radius r (tangent length capped)."""
    if r <= 0:
        return "M " + " L ".join(f"{x:.2f},{y:.2f}" for x, y in pts) + " Z"
    segs = []
    for j in range(len(pts)):
        p0, p1, p2 = pts[j - 1], pts[j], pts[(j + 1) % len(pts)]
        a = (p0[0] - p1[0], p0[1] - p1[1])
        b = (p2[0] - p1[0], p2[1] - p1[1])
        la, lb = math.hypot(*a), math.hypot(*b)
        theta = math.acos(max(-1, min(1, (a[0] * b[0] + a[1] * b[1]) / (la * lb))))
        t = min(r / math.tan(theta / 2), 0.45 * la, 0.45 * lb)
        rr = t * math.tan(theta / 2)
        s = (p1[0] + a[0] / la * t, p1[1] + a[1] / la * t)
        e = (p1[0] + b[0] / lb * t, p1[1] + b[1] / lb * t)
        sweep = 1 if (-a[0] * b[1] + a[1] * b[0]) > 0 else 0
        segs.append((s, e, rr, sweep))
    d = f"M {segs[0][1][0]:.2f},{segs[0][1][1]:.2f}"
    for s, e, rr, sweep in segs[1:] + segs[:1]:
        d += f" L {s[0]:.2f},{s[1]:.2f} A {rr:.2f},{rr:.2f} 0 0 {sweep} {e[0]:.2f},{e[1]:.2f}"
    return d + " Z"


def mark(spec, cx, cy, height, structure, signal, radius=None, extra_gap=0.0):
    """SVG elements for the mark centred on (cx, cy) with hexagon height `height`.

    extra_gap: additional gap width in lattice i-units (for tiny render sizes).
    """
    n = spec["n"]
    r = height * RADIUS if radius is None else radius
    d = extra_gap / 2 * (height / (2 * n)) * math.sqrt(3) / 2

    def poly(p):
        pts = [to_xy(q, n, cx, cy, height) for q in p]
        return rounded_path(inset(pts, d) if d else pts, r)

    body = "".join(f'<path d="{poly(p)}"/>' for p in spec["structure"])
    return f'<g fill="{structure}">{body}</g><path fill="{signal}" d="{poly(spec["signal"])}"/>'


def hex_width(height):
    return height * math.sqrt(3) / 2


# --- type -----------------------------------------------------------------------
class Face:
    def __init__(self, path):
        self.tt = TTFont(path)
        self.hb = hb.Font(hb.Face(hb.Blob.from_file_path(str(path))))
        self.glyphs = self.tt.getGlyphSet()
        self.order = self.tt.getGlyphOrder()
        self.upem = self.tt["head"].unitsPerEm

    def _run(self, text, tracking):
        buf = hb.Buffer()
        buf.add_str(text)
        buf.guess_segment_properties()
        hb.shape(self.hb, buf, {"kern": True, "liga": True})
        x, run = 0, []
        for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
            run.append((self.order[info.codepoint], x + pos.x_offset))
            x += pos.x_advance + tracking * self.upem
        return run

    def bounds(self, text, size, tracking=0.0):
        """(xmin, ymin, xmax, ymax) of the ink, y up, baseline at 0."""
        sc, box = size / self.upem, None
        for name, x in self._run(text, tracking):
            bp = BoundsPen(self.glyphs)
            self.glyphs[name].draw(TransformPen(bp, (sc, 0, 0, sc, x * sc, 0)))
            if bp.bounds:
                b = bp.bounds
                box = b if box is None else (min(box[0], b[0]), min(box[1], b[1]), max(box[2], b[2]), max(box[3], b[3]))
        return box

    def path(self, text, size, x, baseline, tracking=0.0):
        """Outlines with the ink's left edge at x."""
        sc = size / self.upem
        x0 = x - self.bounds(text, size, tracking)[0]
        pen = SVGPathPen(self.glyphs)
        for name, gx in self._run(text, tracking):
            self.glyphs[name].draw(TransformPen(pen, (sc, 0, 0, -sc, x0 + gx * sc, baseline)))
        return pen.getCommands()


INTER = Face(FONTS / "Inter-Medium.ttf")
MONO = Face(FONTS / "JetBrainsMono-Regular.ttf")
WM_TRACK = -0.015
DESC_TRACK = 0.02


def wordmark(size, x, baseline, colour):
    return f'<path fill="{colour}" d="{INTER.path(WORDMARK, size, x, baseline, WM_TRACK)}"/>'


def wordmark_box(size):
    return INTER.bounds(WORDMARK, size, WM_TRACK)


# --- documents ------------------------------------------------------------------
def svg(w, h, body, label, background=None):
    bg = f'<rect width="{w:.2f}" height="{h:.2f}" fill="{background}"/>' if background else ""
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:.2f} {h:.2f}" '
            f'role="img" aria-label="{label}">{bg}{body}</svg>\n')


def mark_file(spec, colours, size=1024, height=860, **kw):
    s, g = colours
    return svg(size, size, mark(spec, size / 2, size / 2, height, s, g, **kw), "metapatrol")


def lockup_horizontal(colourway, descriptor=False, H=200):
    s, g, t, d = COLOURWAYS[colourway]
    x = X_UNIT * H
    F = WORDMARK_SIZE * H
    xmin, ymin, xmax, ymax = wordmark_box(F)
    asc = INTER.bounds("l", F)[3]
    W = hex_width(H)
    mark_cx, mark_cy = x + W / 2, x + H / 2
    # ascender-to-baseline box of the wordmark is centred on the mark
    baseline = mark_cy + asc / 2
    tx = x + W + x
    body = mark(PRIMARY, mark_cx, mark_cy, H, s, g) + wordmark(F, tx, baseline, t)
    width = tx + (xmax - xmin) + x
    height = H + 2 * x
    if descriptor:
        # descriptor spans the full lockup (mark edge to wordmark edge), 0.6x below the mark
        span = width - 2 * x
        f = F * 0.2
        dw = MONO.bounds(DESCRIPTOR, f, DESC_TRACK)
        f *= span / (dw[2] - dw[0])
        dbox = MONO.bounds(DESCRIPTOR, f, DESC_TRACK)
        dbase = x + H + 0.6 * x + dbox[3]
        body += f'<path fill="{d}" d="{MONO.path(DESCRIPTOR, f, x, dbase, DESC_TRACK)}"/>'
        height = dbase - dbox[1] + x
    return svg(width, height, body, "metapatrol")


def lockup_stacked(colourway, H=320):
    s, g, t, _ = COLOURWAYS[colourway]
    x = X_UNIT * H
    F = 0.42 * H
    xmin, ymin, xmax, ymax = wordmark_box(F)
    tw = xmax - xmin
    width = max(tw, hex_width(H)) + 2 * x
    baseline = x + H + x + ymax
    body = mark(PRIMARY, width / 2, x + H / 2, H, s, g) + wordmark(F, (width - tw) / 2, baseline, t)
    return svg(width, baseline - ymin + x, body, "metapatrol")


def wordmark_file(colourway, F=200):
    t = COLOURWAYS[colourway][2]
    xmin, ymin, xmax, ymax = wordmark_box(F)
    pad = F * 0.2
    return svg(xmax - xmin + 2 * pad, ymax - ymin + 2 * pad,
               wordmark(F, pad, pad + ymax, t), "metapatrol")


def app_icon(size=1024):
    body = (f'<rect width="{size}" height="{size}" rx="{size * 0.2237:.2f}" fill="{SURFACE}"/>'
            + mark(PRIMARY, size / 2, size / 2, size * 0.60, STEEL, SIGNAL))
    return svg(size, size, body, "metapatrol")


AVATARS = {
    # name: (background, structure)
    "light": (WHITE, GRAPHITE),
    "dark": (BACKGROUND, STEEL),
}


def avatar(colourway, size=1024):
    # hexagon circumradius 0.31 * size: stays inside a circular crop with room to spare
    bg, structure = AVATARS[colourway]
    return svg(size, size, mark(PRIMARY, size / 2, size / 2, size * 0.62, structure, SIGNAL),
               "metapatrol", background=bg)


def favicon_adaptive():
    """16 px construction; switches structure colour with the browser theme."""
    body = mark(SMALL, 8, 8, 16, "var(--s)", SIGNAL, radius=0, extra_gap=0.6)
    style = (f"<style>:root{{--s:{GRAPHITE}}}"
             f"@media (prefers-color-scheme:dark){{:root{{--s:{STEEL}}}}}</style>")
    return svg(16, 16, style + body.replace('fill="var(--s)"', 'style="fill:var(--s)"'), "metapatrol")


def construction(spec, size=1024, height=860):
    n = spec["n"]
    xy = lambda p: to_xy(p, n, size / 2, size / 2, height)
    grid = []
    for i in range(-n, n + 1):
        (x0, y0), (x1, y1) = xy((i, -2 * n - 4)), xy((i, 2 * n + 4))
        grid.append(f'<line x1="{x0:.1f}" y1="{y0:.1f}" x2="{x1:.1f}" y2="{y1:.1f}"/>')
    for c in range(-4 * n, 4 * n + 1, 2):
        for sign in (1, -1):
            (x0, y0), (x1, y1) = xy((-n - 2, c - sign * (n + 2))), xy((n + 2, c + sign * (n + 2)))
            grid.append(f'<line x1="{x0:.1f}" y1="{y0:.1f}" x2="{x1:.1f}" y2="{y1:.1f}"/>')
    hexagon = [xy(p) for p in [(0, -2 * n), (n, -n), (n, n), (0, 2 * n), (-n, n), (-n, -n)]]
    outline = lambda poly: rounded_path([xy(p) for p in poly], 0)
    shapes = "".join(f'<path d="{outline(p)}"/>' for p in spec["structure"])
    body = (f'<g stroke="#25303A" stroke-width="1">{"".join(grid)}</g>'
            f'<path d="{rounded_path(hexagon, 0)}" fill="none" stroke="{TEXT_2}" stroke-width="1.5" stroke-dasharray="6 6"/>'
            f'<g fill="{STEEL}" fill-opacity="0.35" stroke="{TEXT}" stroke-width="2">{shapes}</g>'
            f'<path d="{outline(spec["signal"])}" fill="{SIGNAL}" fill-opacity="0.35" stroke="{SIGNAL}" stroke-width="2"/>')
    return svg(size, size, body, "metapatrol mark construction", background=BACKGROUND)


def clearspace(size=1024):
    H = size / (1 + 4 * X_UNIT) * 0.9
    x = X_UNIT * H
    W = hex_width(H)
    cx = cy = size / 2
    inner = (cx - W / 2, cy - H / 2, W, H)
    outer = (inner[0] - x, inner[1] - x, W + 2 * x, H + 2 * x)
    rect = lambda r, extra: f'<rect x="{r[0]:.1f}" y="{r[1]:.1f}" width="{r[2]:.1f}" height="{r[3]:.1f}" fill="none" {extra}/>'
    label = lambda px, py: (f'<text x="{px:.1f}" y="{py:.1f}" fill="{SIGNAL}" font-family="JetBrains Mono, monospace" '
                            f'font-size="{x * 0.32:.0f}" text-anchor="middle" dominant-baseline="middle">x</text>')
    body = (rect(outer, f'stroke="{TEXT_2}" stroke-width="2" stroke-dasharray="8 8"')
            + rect(inner, f'stroke="#25303A" stroke-width="2"')
            + mark(PRIMARY, cx, cy, H, STEEL, SIGNAL)
            + label(cx, outer[1] + x / 2) + label(cx, outer[1] + outer[3] - x / 2)
            + label(outer[0] + x / 2, cy) + label(outer[0] + outer[2] - x / 2, cy))
    return svg(size, size, body, "metapatrol clear space", background=BACKGROUND)


# --- output -----------------------------------------------------------------------
def write(rel, content):
    p = ASSETS / rel
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(content)
    return p


def export_png(src, dst, px, height=True):
    size = ["-w", str(px), "-h", str(px)] if height else ["-w", str(px)]
    subprocess.run(["inkscape", str(src), *size, "-o", str(dst)], check=True, capture_output=True)


# PNG width next to each SVG (GitHub READMEs and profiles do not accept SVG uploads).
# Small and favicon constructions are exported at 2x their intended display size.
PNG_WIDTH = {
    "mark/metapatrol-mark-small-": 64,
    "mark/metapatrol-mark-favicon-": 32,
    "mark/": 1024,
    "wordmark/": 2000,
    "lockup/metapatrol-lockup-stacked-": 1200,
    "lockup/": 2000,
    "construction/": 1024,
    "app/metapatrol-": 1024,
}


def main():
    for cw in ("dark", "light", "mono-white", "mono-black"):
        s, g, _, _ = COLOURWAYS[cw]
        write(f"mark/metapatrol-mark-{cw}.svg", mark_file(PRIMARY, (s, g)))
        write(f"mark/metapatrol-mark-small-{cw}.svg", mark_file(SMALL, (s, g), size=64, height=60, radius=0.6))
        write(f"mark/metapatrol-mark-favicon-{cw}.svg",
              mark_file(SMALL, (s, g), size=16, height=16, radius=0, extra_gap=0.6))
        write(f"wordmark/metapatrol-wordmark-{cw}.svg", wordmark_file(cw))
        write(f"lockup/metapatrol-lockup-horizontal-{cw}.svg", lockup_horizontal(cw))
        write(f"lockup/metapatrol-lockup-descriptor-{cw}.svg", lockup_horizontal(cw, descriptor=True))
        write(f"lockup/metapatrol-lockup-stacked-{cw}.svg", lockup_stacked(cw))
    app = write("app/metapatrol-app-icon.svg", app_icon())
    avatars = {cw: write(f"app/metapatrol-avatar-{cw}.svg", avatar(cw)) for cw in AVATARS}
    write("app/favicon.svg", favicon_adaptive())
    write("construction/construction.svg", construction(PRIMARY))
    write("construction/construction-small.svg", construction(SMALL))
    write("construction/clearspace.svg", clearspace())
    print("svg written to", ASSETS)

    if not (shutil.which("inkscape") and shutil.which("convert")):
        print("inkscape/convert not found: skipping png and ico")
        return
    for px in (1024, 512, 192, 180):
        export_png(app, ASSETS / f"app/metapatrol-app-icon-{px}.png", px)
    for cw, av in avatars.items():
        for px in (1024, 512, 256):
            export_png(av, ASSETS / f"app/metapatrol-avatar-{cw}-{px}.png", px)
    # favicon.ico: favicon construction at 16, small at 32, primary at 48.
    # Steel reads on light and dark browser chrome (5.8:1 on white, 3.5:1 on #050607).
    with tempfile.TemporaryDirectory() as tmp:
        frames = []
        for px, name in ((16, "mark-favicon"), (32, "mark-small"), (48, "mark")):
            f = pathlib.Path(tmp) / f"{px}.png"
            export_png(ASSETS / f"mark/metapatrol-{name}-dark.svg", f, px)
            frames.append(str(f))
        subprocess.run(["convert", *frames, str(ASSETS / "app/favicon.ico")], check=True)
    # favicon.svg switches colour via CSS; its PNG uses steel, which reads on light and dark
    export_png(ASSETS / "mark/metapatrol-mark-favicon-dark.svg", ASSETS / "app/favicon.png", 32)
    # one PNG per SVG, same name
    for src in sorted(ASSETS.glob("*/*.svg")):
        rel = src.relative_to(ASSETS).as_posix()
        width = next((w for prefix, w in PNG_WIDTH.items() if rel.startswith(prefix)), None)
        if width:
            export_png(src, src.with_suffix(".png"), width, height=False)
    print("png and ico written")


if __name__ == "__main__":
    main()
