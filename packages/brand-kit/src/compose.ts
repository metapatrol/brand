// The brand's SVG documents: marks, wordmark, lockups, app icons, favicon and
// the construction sheets. Colours and construction parameters come from
// @metapatrol/tokens.
import { color, number, theme } from "@metapatrol/tokens";
import { hexWidth, mark, PRIMARY, roundedPath, SMALL, toXY, type MarkSpec, type Polygon } from "./geometry.ts";
import { Face } from "./type.ts";

export const dark = theme("dark");
export const light = theme("light");

export const COLOURS = {
  signal: color(dark, "mark.signal"),
  graphite: color(light, "mark.structure"),
  steel: color(dark, "mark.structure"),
  background: color(dark, "bg"),
  surface: color(dark, "surface"),
  line: color(dark, "line"),
  text: color(dark, "fg"),
  text2: color(dark, "fg-muted"),
  white: color(dark, "neutral.0"),
};

/** clear space and mark-to-wordmark gap: the signal panel's vertical edge */
export const X_UNIT = number(dark, "mark.clear-space");
/** wordmark size in horizontal lockups, relative to the hexagon height */
export const WORDMARK_SIZE = number(dark, "mark.wordmark-size");
export const CORNER = number(dark, "mark.corner-radius");

export const COLOURWAYS = ["dark", "light", "mono-white", "mono-black"] as const;
export type Colourway = (typeof COLOURWAYS)[number];

interface Palette {
  structure: string;
  signal: string;
  wordmark: string;
  descriptor: string;
}

const C = COLOURS;
export const PALETTES: Record<Colourway, Palette> = {
  dark: { structure: C.steel, signal: C.signal, wordmark: C.text, descriptor: C.text2 },
  light: { structure: C.graphite, signal: C.signal, wordmark: C.graphite, descriptor: C.steel },
  "mono-white": { structure: C.white, signal: C.white, wordmark: C.white, descriptor: C.white },
  "mono-black": { structure: C.background, signal: C.background, wordmark: C.background, descriptor: C.background },
};

export const WORDMARK = "metapatrol";
export const DESCRIPTOR = "infrastructure / developer tools / autonomous systems";

export const INTER = new Face("Inter-Medium.ttf");
export const MONO = new Face("JetBrainsMono-Regular.ttf");
export const WM_TRACK = -0.015;
export const DESC_TRACK = 0.02;

const f2 = (x: number) => x.toFixed(2);

export function svg(w: number, h: number, body: string, label: string, background?: string): string {
  const bg = background ? `<rect width="${f2(w)}" height="${f2(h)}" fill="${background}"/>` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${f2(w)} ${f2(h)}" role="img" aria-label="${label}">${bg}${body}</svg>\n`;
}

export const markAt = (spec: MarkSpec, cx: number, cy: number, h: number, s: string, g: string, radius?: number, extraGap?: number) =>
  mark(spec, cx, cy, h, s, g, { radius, cornerRadius: CORNER, extraGap });

const wordmark = (size: number, x: number, baseline: number, fill: string) =>
  `<path fill="${fill}" d="${INTER.path(WORDMARK, size, x, baseline, WM_TRACK)}"/>`;

export interface MarkFileOptions {
  size?: number;
  height?: number;
  radius?: number;
  extraGap?: number;
}

export function markFile(spec: MarkSpec, cw: Colourway, { size = 1024, height = 860, radius, extraGap }: MarkFileOptions = {}): string {
  const { structure, signal } = PALETTES[cw];
  return svg(size, size, markAt(spec, size / 2, size / 2, height, structure, signal, radius, extraGap), "metapatrol");
}

export const primaryMark = (cw: Colourway) => markFile(PRIMARY, cw);
export const smallMark = (cw: Colourway) => markFile(SMALL, cw, { size: 64, height: 60, radius: 0.6 });
export const faviconMark = (cw: Colourway) => markFile(SMALL, cw, { size: 16, height: 16, radius: 0, extraGap: 0.6 });

export function lockupHorizontal(cw: Colourway, descriptor = false, H = 200): string {
  const p = PALETTES[cw];
  const x = X_UNIT * H;
  const F = WORDMARK_SIZE * H;
  const [xmin, , xmax] = INTER.bounds(WORDMARK, F, WM_TRACK);
  const asc = INTER.bounds("l", F)[3];
  const W = hexWidth(H);
  const markCx = x + W / 2;
  const markCy = x + H / 2;
  // the wordmark's ascender-to-baseline box is centred on the mark
  const baseline = markCy + asc / 2;
  const tx = x + W + x;
  let body = markAt(PRIMARY, markCx, markCy, H, p.structure, p.signal) + wordmark(F, tx, baseline, p.wordmark);
  const width = tx + (xmax - xmin) + x;
  let height = H + 2 * x;
  if (descriptor) {
    // descriptor spans the full lockup (mark edge to wordmark edge), 0.6x below the mark
    const span = width - 2 * x;
    const dw = MONO.bounds(DESCRIPTOR, F * 0.2, DESC_TRACK);
    const f = (F * 0.2 * span) / (dw[2] - dw[0]);
    const dbox = MONO.bounds(DESCRIPTOR, f, DESC_TRACK);
    const dbase = x + H + 0.6 * x + dbox[3];
    body += `<path fill="${p.descriptor}" d="${MONO.path(DESCRIPTOR, f, x, dbase, DESC_TRACK)}"/>`;
    height = dbase - dbox[1] + x;
  }
  return svg(width, height, body, "metapatrol");
}

export function lockupStacked(cw: Colourway, H = 320): string {
  const p = PALETTES[cw];
  const x = X_UNIT * H;
  const F = 0.42 * H;
  const [xmin, ymin, xmax, ymax] = INTER.bounds(WORDMARK, F, WM_TRACK);
  const tw = xmax - xmin;
  const width = Math.max(tw, hexWidth(H)) + 2 * x;
  const baseline = x + H + x + ymax;
  const body = markAt(PRIMARY, width / 2, x + H / 2, H, p.structure, p.signal) + wordmark(F, (width - tw) / 2, baseline, p.wordmark);
  return svg(width, baseline - ymin + x, body, "metapatrol");
}

export function wordmarkFile(cw: Colourway, F = 200): string {
  const [xmin, ymin, xmax, ymax] = INTER.bounds(WORDMARK, F, WM_TRACK);
  const pad = F * 0.2;
  return svg(xmax - xmin + 2 * pad, ymax - ymin + 2 * pad, wordmark(F, pad, pad + ymax, PALETTES[cw].wordmark), "metapatrol");
}

export function appIcon(size = 1024): string {
  const body =
    `<rect width="${size}" height="${size}" rx="${f2(size * 0.2237)}" fill="${C.surface}"/>` +
    markAt(PRIMARY, size / 2, size / 2, size * 0.6, C.steel, C.signal);
  return svg(size, size, body, "metapatrol");
}

export const AVATARS = {
  light: { background: C.white, structure: C.graphite },
  dark: { background: C.background, structure: C.steel },
} as const;

export function avatar(cw: keyof typeof AVATARS, size = 1024): string {
  // hexagon circumradius 0.31 * size: stays inside a circular crop with room to spare
  const { background, structure } = AVATARS[cw];
  return svg(size, size, markAt(PRIMARY, size / 2, size / 2, size * 0.62, structure, C.signal), "metapatrol", background);
}

/** 16 px construction; switches structure colour with the browser theme. */
export function faviconAdaptive(): string {
  const body = markAt(SMALL, 8, 8, 16, "var(--s)", C.signal, 0, 0.6).replace('fill="var(--s)"', 'style="fill:var(--s)"');
  const style = `<style>:root{--s:${C.graphite}}@media (prefers-color-scheme:dark){:root{--s:${C.steel}}}</style>`;
  return svg(16, 16, style + body, "metapatrol");
}

export function construction(spec: MarkSpec, size = 1024, height = 860): string {
  const { n } = spec;
  const xy = (p: readonly [number, number]) => toXY(p, n, size / 2, size / 2, height);
  const line = ([x0, y0]: readonly number[], [x1, y1]: readonly number[]) =>
    `<line x1="${x0!.toFixed(1)}" y1="${y0!.toFixed(1)}" x2="${x1!.toFixed(1)}" y2="${y1!.toFixed(1)}"/>`;
  const grid: string[] = [];
  for (let i = -n; i <= n; i++) grid.push(line(xy([i, -2 * n - 4]), xy([i, 2 * n + 4])));
  for (let c = -4 * n; c <= 4 * n; c += 2) {
    for (const sign of [1, -1]) {
      grid.push(line(xy([-n - 2, c - sign * (n + 2)]), xy([n + 2, c + sign * (n + 2)])));
    }
  }
  const hexagon = ([[0, -2 * n], [n, -n], [n, n], [0, 2 * n], [-n, n], [-n, -n]] as const).map(xy);
  const outline = (poly: Polygon) => roundedPath(poly.map(xy), 0);
  const shapes = spec.structure.map((p) => `<path d="${outline(p)}"/>`).join("");
  const body =
    `<g stroke="${C.line}" stroke-width="1">${grid.join("")}</g>` +
    `<path d="${roundedPath(hexagon, 0)}" fill="none" stroke="${C.text2}" stroke-width="1.5" stroke-dasharray="6 6"/>` +
    `<g fill="${C.steel}" fill-opacity="0.35" stroke="${C.text}" stroke-width="2">${shapes}</g>` +
    `<path d="${outline(spec.signal)}" fill="${C.signal}" fill-opacity="0.35" stroke="${C.signal}" stroke-width="2"/>`;
  return svg(size, size, body, "metapatrol mark construction", C.background);
}

export function clearspace(size = 1024): string {
  const H = (size / (1 + 4 * X_UNIT)) * 0.9;
  const x = X_UNIT * H;
  const W = hexWidth(H);
  const cx = size / 2;
  const cy = size / 2;
  const inner = [cx - W / 2, cy - H / 2, W, H] as const;
  const outer = [inner[0] - x, inner[1] - x, W + 2 * x, H + 2 * x] as const;
  const rect = (r: readonly number[], extra: string) =>
    `<rect x="${r[0]!.toFixed(1)}" y="${r[1]!.toFixed(1)}" width="${r[2]!.toFixed(1)}" height="${r[3]!.toFixed(1)}" fill="none" ${extra}/>`;
  const label = (px: number, py: number) =>
    `<text x="${px.toFixed(1)}" y="${py.toFixed(1)}" fill="${C.signal}" font-family="JetBrains Mono, monospace" ` +
    `font-size="${Math.round(x * 0.32)}" text-anchor="middle" dominant-baseline="middle">x</text>`;
  const body =
    rect(outer, `stroke="${C.text2}" stroke-width="2" stroke-dasharray="8 8"`) +
    rect(inner, `stroke="${C.line}" stroke-width="2"`) +
    markAt(PRIMARY, cx, cy, H, C.steel, C.signal) +
    label(cx, outer[1] + x / 2) +
    label(cx, outer[1] + outer[3] - x / 2) +
    label(outer[0] + x / 2, cy) +
    label(outer[0] + outer[2] - x / 2, cy);
  return svg(size, size, body, "metapatrol clear space", C.background);
}
