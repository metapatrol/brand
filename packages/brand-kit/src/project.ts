// Per-project assets: the mark with "metapatrol / <project>", a social preview,
// the favicon set and a README header. A project does not get its own logo
// (identity: naming); it gets the brand with its name in the namespace.
import { color } from "@metapatrol/tokens";
import {
  avatar,
  COLOURS,
  dark,
  DESCRIPTOR,
  faviconAdaptive,
  faviconMark,
  INTER,
  light,
  markAt,
  MONO,
  primaryMark,
  smallMark,
  svg,
  WM_TRACK,
  WORDMARK_SIZE,
  X_UNIT,
  type Colourway,
} from "./compose.ts";
import { hexWidth, PRIMARY } from "./geometry.ts";
import { ico, png } from "./render.ts";

/** Project names are technical identifiers: lowercase, digits, dashes. */
export const NAME = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function assertName(name: string): void {
  if (!NAME.test(name)) {
    throw new Error(`"${name}" is not a project name: use lowercase letters, digits and single dashes`);
  }
}

const ORG = "metapatrol / ";
const MONO_SCALE = 0.9;

interface NamespacePalette {
  structure: string;
  signal: string;
  org: string;
  project: string;
}

const C = COLOURS;
export const NAMESPACE_PALETTES: Record<Colourway, NamespacePalette> = {
  dark: { structure: C.steel, signal: C.signal, org: color(dark, "fg-muted"), project: color(dark, "fg") },
  light: { structure: C.graphite, signal: C.signal, org: color(light, "fg-muted"), project: color(light, "fg") },
  "mono-white": { structure: C.white, signal: C.white, org: C.white, project: C.white },
  "mono-black": { structure: C.background, signal: C.background, org: C.background, project: C.background },
};

interface Namespace {
  body: string;
  width: number;
  /** the text's ascender-to-baseline box is centred on the mark */
  baseline: number;
}

/** "metapatrol /" in Inter, the project in JetBrains Mono, as in the mp-namespace pattern. */
function namespace(name: string, F: number, x: number, markCy: number, p: NamespacePalette): Namespace {
  const asc = INTER.bounds("l", F)[3];
  const baseline = markCy + asc / 2;
  const org = INTER.bounds(ORG.trimEnd(), F, WM_TRACK);
  // the space after the slash, from Inter's own advance, so it reads as text
  const space = INTER.bounds("a a", F)[2] - INTER.bounds("a", F)[2] * 2;
  const px = x + (org[2] - org[0]) + space;
  // JetBrains Mono has the taller x-height; at 90 % the two halves read as one line
  const M = F * MONO_SCALE;
  const proj = MONO.bounds(name, M);
  const body =
    `<path fill="${p.org}" d="${INTER.path(ORG.trimEnd(), F, x, baseline, WM_TRACK)}"/>` +
    `<path fill="${p.project}" d="${MONO.path(name, M, px, baseline)}"/>`;
  return { body, width: px + (proj[2] - proj[0]) - x, baseline };
}

/** [mark] metapatrol / <name> */
export function projectLockup(name: string, cw: Colourway, H = 200): string {
  assertName(name);
  const p = NAMESPACE_PALETTES[cw];
  const x = X_UNIT * H;
  const F = WORDMARK_SIZE * H;
  const W = hexWidth(H);
  const markCy = x + H / 2;
  const tx = x + W + x;
  const ns = namespace(name, F, tx, markCy, p);
  const body = markAt(PRIMARY, x + W / 2, markCy, H, p.structure, p.signal) + ns.body;
  return svg(tx + ns.width + x, H + 2 * x, body, `metapatrol / ${name}`);
}

/** Greedy word wrap by measured width; the last allowed line ends in an ellipsis if text remains. */
export function wrap(text: string, size: number, maxWidth: number, maxLines: number): string[] {
  const width = (s: string) => {
    const b = INTER.bounds(s, size);
    return b[2] - b[0];
  };
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  let i = 0;
  for (; i < words.length; i++) {
    const next = line ? `${line} ${words[i]}` : words[i]!;
    if (!line || width(next) <= maxWidth) {
      line = next;
      continue;
    }
    lines.push(line);
    line = words[i]!;
    if (lines.length === maxLines) break;
  }
  if (lines.length < maxLines && line) {
    lines.push(line);
    i = words.length;
  }
  if (i < words.length && lines.length) {
    let last = lines[lines.length - 1]!;
    while (last.includes(" ") && width(`${last} …`) > maxWidth) last = last.slice(0, last.lastIndexOf(" "));
    lines[lines.length - 1] = `${last} …`;
  }
  return lines;
}

/** 1280×640, the size GitHub and Forgejo use for link previews; dark, as the brand is at home. */
export function socialPreview(name: string, purpose: string): string {
  assertName(name);
  const Wd = 1280;
  const Ht = 640;
  const pad = 88;
  const p = NAMESPACE_PALETTES.dark;
  // 132 px of mark, smaller for names that would not fit the width
  const fit = (H: number) => {
    const W = hexWidth(H);
    const tx = pad + W + X_UNIT * H;
    return { H, W, tx, ns: namespace(name, WORDMARK_SIZE * H, tx, 150 + H / 2, p) };
  };
  let f = fit(132);
  if (f.tx + f.ns.width > Wd - pad) f = fit((132 * (Wd - 2 * pad)) / (f.tx + f.ns.width - pad));
  const { H, W, ns } = f;
  const markCy = 150 + H / 2;
  const lockup = markAt(PRIMARY, pad + W / 2, markCy, H, p.structure, p.signal) + ns.body;

  const size = 40;
  const lines = wrap(purpose, size, Wd - 2 * pad, 3);
  const text = lines
    .map((l, j) => `<path fill="${color(dark, "fg")}" d="${INTER.path(l, size, pad, 360 + j * size * 1.35)}"/>`)
    .join("");
  const descriptor = `<path fill="${color(dark, "fg-muted")}" d="${MONO.path(DESCRIPTOR, 18, pad, Ht - pad + 6, 0.02)}"/>`;
  const accent = `<rect x="${pad}" y="${Ht - pad - 34}" width="40" height="3" fill="${C.signal}"/>`;

  // the isometric lattice of the mark's construction, fading out to the left
  const u = 36;
  const dx = (u * Math.sqrt(3)) / 2;
  const grid: string[] = [];
  for (let gx = Wd; gx > Wd * 0.35; gx -= dx) grid.push(`M${gx.toFixed(1)} 0V${Ht}`);
  for (let c = -40; c < 60; c++) {
    const y0 = c * u;
    grid.push(`M0 ${y0.toFixed(1)}L${Wd} ${(y0 + Wd * Math.tan(Math.PI / 6)).toFixed(1)}`);
    grid.push(`M0 ${(y0 + Wd * Math.tan(Math.PI / 6)).toFixed(1)}L${Wd} ${y0.toFixed(1)}`);
  }
  const defs =
    `<defs><linearGradient id="fade" x1="0" x2="1" y1="0" y2="0">` +
    `<stop offset="0.35" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity="1"/>` +
    `</linearGradient><mask id="m"><rect width="${Wd}" height="${Ht}" fill="url(#fade)"/></mask></defs>`;
  const lattice = `<path d="${grid.join("")}" stroke="${color(dark, "line")}" stroke-width="1" fill="none" mask="url(#m)"/>`;
  return svg(Wd, Ht, defs + lattice + lockup + text + accent + descriptor, `metapatrol / ${name}`, color(dark, "bg"));
}

export function webManifest(name: string): string {
  return `${JSON.stringify(
    {
      name: `metapatrol / ${name}`,
      short_name: name,
      icons: [
        { src: "icon-192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
        { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
      ],
      theme_color: color(dark, "bg"),
      background_color: color(dark, "bg"),
      display: "standalone",
    },
    null,
    2,
  )}\n`;
}

/** What the README header shows besides the lockup and the purpose. */
export interface HeaderOptions {
  /** Where the project's assets are, relative to the README. */
  dir?: string;
  /** The GitHub repository the project is mirrored to, "owner/name": the release badge. */
  github?: string;
  /** The SPDX identifier of the licence: the licence badge, linked to LICENSE. */
  license?: string;
  /** The line of links under the badges: [label, relative path]. */
  links?: [string, string][];
}

/** A shields.io static badge's text: dashes and underscores doubled, spaces as underscores. */
const badgeText = (s: string) => encodeURIComponent(s.replace(/-/g, "--").replace(/_/g, "__").replace(/ /g, "_"));

/**
 * README header, the way the metapatrol projects present themselves on GitHub:
 * the lockup that follows the reader's theme, the purpose in bold, a release
 * and a licence badge, and a line of links into the repository.
 */
export function readmeHeader(name: string, purpose: string, opts: HeaderOptions = {}): string {
  const dir = opts.dir ?? ".metapatrol";
  const github = opts.github ?? `metapatrol/${name}`;
  const badges = [
    `  <a href="https://github.com/${github}/releases"><img alt="Release" src="https://img.shields.io/github/v/release/${github}?sort=semver"></a>`,
  ];
  if (opts.license) {
    badges.push(`  <a href="LICENSE"><img alt="License" src="https://img.shields.io/badge/license-${badgeText(opts.license)}-blue"></a>`);
  }
  const links = (opts.links ?? []).map(([label, href]) => `  <a href="${href}">${label}</a>`);
  return `<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="${dir}/${name}-lockup-dark.png">
    <img alt="metapatrol / ${name}" src="${dir}/${name}-lockup-light.png" width="420">
  </picture>
</p>

<p align="center">
  <strong>${purpose}</strong>
</p>

<p align="center">
${badges.join("\n")}
</p>
${links.length ? `\n<p align="center">\n${links.join(" ·\n")}\n</p>\n` : ""}
---
`;
}

/** Relative path -> file content for a project's asset directory. */
export function projectFiles(
  name: string,
  purpose: string,
  dir = ".metapatrol",
  header: Omit<HeaderOptions, "dir"> = {},
): Map<string, string | Buffer> {
  assertName(name);
  const files = new Map<string, string | Buffer>();
  for (const cw of ["dark", "light", "mono-white", "mono-black"] as const) {
    const lockup = projectLockup(name, cw);
    files.set(`${name}-lockup-${cw}.svg`, lockup);
    files.set(`${name}-lockup-${cw}.png`, png(lockup, 1600));
  }
  const preview = socialPreview(name, purpose);
  files.set("social-preview.svg", preview);
  files.set("social-preview.png", png(preview, 1280));

  // The favicon set is the brand's: a project has no mark of its own.
  files.set("favicon/favicon.svg", faviconAdaptive());
  files.set(
    "favicon/favicon.ico",
    ico([
      { size: 16, png: png(faviconMark("dark"), 16) },
      { size: 32, png: png(smallMark("dark"), 32) },
      { size: 48, png: png(primaryMark("dark"), 48) },
    ]),
  );
  // square on the brand background: iOS rounds it, and the mark sits inside the
  // maskable safe zone (radius 0.31 of the side, the zone is 0.4)
  const square = avatar("dark");
  files.set("favicon/apple-touch-icon.png", png(square, 180));
  files.set("favicon/icon-192.png", png(square, 192));
  files.set("favicon/icon-512.png", png(square, 512));
  files.set("favicon/site.webmanifest", webManifest(name));

  files.set("README-header.md", readmeHeader(name, purpose, { ...header, dir }));
  return files;
}
