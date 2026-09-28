// Mark geometry.
//
// Every point of the mark lives on an isometric lattice (i, k):
//
//     x = cx + i * u * sqrt(3)/2
//     y = cy + k * u / 2          with u = hexagon height / (2 N)
//
// so every edge is either vertical (i constant), falling at 30deg (k - i
// constant) or rising at 30deg (k + i constant). The gap between two segments
// is always one lattice step: 1 in i for vertical edges, 2 in c for diagonal
// edges, which is the same perpendicular distance in both cases.

export type Point = readonly [number, number];
export type Polygon = readonly Point[];

export interface MarkSpec {
  /** lattice steps per half width */
  n: number;
  structure: readonly Polygon[];
  signal: Polygon;
}

// hexagon N=20: top (0,-40), right edge i=20, bottom (0,40), left edge i=-20
export const PRIMARY: MarkSpec = {
  n: 20,
  structure: [
    // main segment: top face, notch, spine, foot
    [[0, -40], [-10, -30], [4, -16], [-6, -6], [-6, 34], [0, 40],
     [9, 31], [0, 22], [0, 0], [11, -11], [11, -29]],
    // left segment: column with arm into the notch
    [[-20, -20], [-11, -29], [-3, -21], [-12, -12], [-12, 28], [-20, 20]],
    // right segment: column with foot under the signal panel
    [[12, -28], [20, -20], [20, 20], [10, 30], [2, 22], [12, 12]],
    // drop block in the channel
    [[-11, 13], [-7, 9], [-7, 33], [-11, 29]],
  ],
  // signal panel: isometric square, half the edge of the hexagon
  signal: [[1, 1], [11, -9], [11, 11], [1, 21]],
};

// small optical size (20-40 px): N=8, no channel, no drop block
export const SMALL: MarkSpec = {
  n: 8,
  structure: [
    [[0, -16], [-4, -12], [0, -8], [-4, -4], [-4, 12], [0, 16],
     [3, 13], [-1, 9], [-1, -1], [4, -6], [4, -12]],
    [[-8, -8], [-5, -11], [-2, -8], [-5, -5], [-5, 11], [-8, 8]],
    [[5, -11], [8, -8], [8, 8], [4, 12], [1, 9], [5, 5]],
  ],
  signal: [[0, 0], [4, -4], [4, 4], [0, 8]],
};

export function toXY([i, k]: Point, n: number, cx: number, cy: number, height: number): Point {
  const u = height / (2 * n);
  return [cx + (i * u * Math.sqrt(3)) / 2, cy + (k * u) / 2];
}

export const hexWidth = (height: number): number => (height * Math.sqrt(3)) / 2;

const at = <T>(xs: readonly T[], j: number): T => xs[(j + xs.length) % xs.length] as T;

/** Offsets a simple polygon inwards by d (mitre joins): widens every gap by 2d. */
export function inset(pts: Polygon, d: number): Point[] {
  let area = 0;
  for (let j = 0; j < pts.length; j++) {
    const [x0, y0] = at(pts, j - 1);
    const [x1, y1] = at(pts, j);
    area += x0 * y1 - x1 * y0;
  }
  const sgn = area > 0 ? 1 : -1;
  const lines = pts.map((p, j) => {
    const [x0, y0] = p;
    const [x1, y1] = at(pts, j + 1);
    const l = Math.hypot(x1 - x0, y1 - y0);
    const nx = (-(y1 - y0) / l) * sgn;
    const ny = ((x1 - x0) / l) * sgn;
    return { p: [x0 + nx * d, y0 + ny * d] as Point, r: [x1 - x0, y1 - y0] as Point };
  });
  return lines.map((cur, j) => {
    const { p, r } = at(lines, j - 1);
    const { p: q, r: s } = cur;
    const t = ((q[0] - p[0]) * s[1] - (q[1] - p[1]) * s[0]) / (r[0] * s[1] - r[1] * s[0]);
    return [p[0] + r[0] * t, p[1] + r[1] * t];
  });
}

const f2 = (x: number): string => x.toFixed(2);

/** Closed polygon path with circular corner radius r (tangent length capped). */
export function roundedPath(pts: Polygon, r: number): string {
  if (r <= 0) return `M ${pts.map(([x, y]) => `${f2(x)},${f2(y)}`).join(" L ")} Z`;
  const segs = pts.map((p1, j) => {
    const p0 = at(pts, j - 1);
    const p2 = at(pts, j + 1);
    const a: Point = [p0[0] - p1[0], p0[1] - p1[1]];
    const b: Point = [p2[0] - p1[0], p2[1] - p1[1]];
    const la = Math.hypot(...a);
    const lb = Math.hypot(...b);
    const theta = Math.acos(Math.max(-1, Math.min(1, (a[0] * b[0] + a[1] * b[1]) / (la * lb))));
    const t = Math.min(r / Math.tan(theta / 2), 0.45 * la, 0.45 * lb);
    const rr = t * Math.tan(theta / 2);
    const s: Point = [p1[0] + (a[0] / la) * t, p1[1] + (a[1] / la) * t];
    const e: Point = [p1[0] + (b[0] / lb) * t, p1[1] + (b[1] / lb) * t];
    const sweep = -a[0] * b[1] + a[1] * b[0] > 0 ? 1 : 0;
    return { s, e, rr, sweep };
  });
  const first = segs[0];
  if (!first) return "";
  let d = `M ${f2(first.e[0])},${f2(first.e[1])}`;
  for (const { s, e, rr, sweep } of [...segs.slice(1), first]) {
    d += ` L ${f2(s[0])},${f2(s[1])} A ${f2(rr)},${f2(rr)} 0 0 ${sweep} ${f2(e[0])},${f2(e[1])}`;
  }
  return `${d} Z`;
}

export interface MarkOptions {
  /** corner radius in px; default: height * cornerRadius */
  radius?: number;
  /** relative corner radius (token mark.corner-radius) */
  cornerRadius: number;
  /** additional gap width in lattice i-units (for tiny render sizes) */
  extraGap?: number;
}

/** SVG elements for the mark centred on (cx, cy) with hexagon height `height`. */
export function mark(
  spec: MarkSpec,
  cx: number,
  cy: number,
  height: number,
  structure: string,
  signal: string,
  { radius, cornerRadius, extraGap = 0 }: MarkOptions,
): string {
  const r = radius ?? height * cornerRadius;
  const d = ((extraGap / 2) * (height / (2 * spec.n)) * Math.sqrt(3)) / 2;
  const poly = (p: Polygon) => {
    const pts = p.map((q) => toXY(q, spec.n, cx, cy, height));
    return roundedPath(d ? inset(pts, d) : pts, r);
  };
  const body = spec.structure.map((p) => `<path d="${poly(p)}"/>`).join("");
  return `<g fill="${structure}">${body}</g><path fill="${signal}" d="${poly(spec.signal)}"/>`;
}
