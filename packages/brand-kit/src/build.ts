// Writes the complete asset tree: every SVG, a PNG with the same name next to
// it, the sized app icons and avatars, and favicon.ico.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import {
  appIcon,
  avatar,
  AVATARS,
  clearspace,
  COLOURWAYS,
  construction,
  faviconAdaptive,
  faviconMark,
  lockupHorizontal,
  lockupStacked,
  primaryMark,
  smallMark,
  wordmarkFile,
} from "./compose.ts";
import { PRIMARY, SMALL } from "./geometry.ts";
import { ico, png } from "./render.ts";

/** Asset path (relative to the output directory) -> SVG source. */
export function documents(): Map<string, string> {
  const docs = new Map<string, string>();
  for (const cw of COLOURWAYS) {
    docs.set(`mark/metapatrol-mark-${cw}.svg`, primaryMark(cw));
    docs.set(`mark/metapatrol-mark-small-${cw}.svg`, smallMark(cw));
    docs.set(`mark/metapatrol-mark-favicon-${cw}.svg`, faviconMark(cw));
    docs.set(`wordmark/metapatrol-wordmark-${cw}.svg`, wordmarkFile(cw));
    docs.set(`lockup/metapatrol-lockup-horizontal-${cw}.svg`, lockupHorizontal(cw));
    docs.set(`lockup/metapatrol-lockup-descriptor-${cw}.svg`, lockupHorizontal(cw, true));
    docs.set(`lockup/metapatrol-lockup-stacked-${cw}.svg`, lockupStacked(cw));
  }
  docs.set("app/metapatrol-app-icon.svg", appIcon());
  for (const cw of Object.keys(AVATARS) as (keyof typeof AVATARS)[]) {
    docs.set(`app/metapatrol-avatar-${cw}.svg`, avatar(cw));
  }
  docs.set("app/favicon.svg", faviconAdaptive());
  docs.set("construction/construction.svg", construction(PRIMARY));
  docs.set("construction/construction-small.svg", construction(SMALL));
  docs.set("construction/clearspace.svg", clearspace());
  return docs;
}

// PNG width next to each SVG (GitHub READMEs and profiles do not accept SVG uploads).
// Small and favicon constructions are exported at 2x their intended display size.
const PNG_WIDTH: [prefix: string, width: number][] = [
  ["mark/metapatrol-mark-small-", 64],
  ["mark/metapatrol-mark-favicon-", 32],
  ["mark/", 1024],
  ["wordmark/", 2000],
  ["lockup/metapatrol-lockup-stacked-", 1200],
  ["lockup/", 2000],
  ["construction/", 1024],
  ["app/metapatrol-", 1024],
];

export function build(out: string, log: (msg: string) => void = () => {}): string[] {
  const written: string[] = [];
  const write = (rel: string, data: string | Buffer) => {
    const file = join(out, rel);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, data);
    written.push(rel);
  };

  const docs = documents();
  for (const [rel, svg] of docs) write(rel, svg);
  log(`${docs.size} svg`);

  for (const [rel, svg] of docs) {
    const width = PNG_WIDTH.find(([prefix]) => rel.startsWith(prefix))?.[1];
    if (width) write(rel.replace(/\.svg$/, ".png"), png(svg, width));
  }
  const icon = docs.get("app/metapatrol-app-icon.svg")!;
  for (const px of [1024, 512, 192, 180]) write(`app/metapatrol-app-icon-${px}.png`, png(icon, px));
  for (const cw of Object.keys(AVATARS)) {
    const src = docs.get(`app/metapatrol-avatar-${cw}.svg`)!;
    for (const px of [1024, 512, 256]) write(`app/metapatrol-avatar-${cw}-${px}.png`, png(src, px));
  }
  // favicon.svg switches colour via CSS; its PNG uses steel, which reads on light and dark
  write("app/favicon.png", png(docs.get("mark/metapatrol-mark-favicon-dark.svg")!, 32));
  // favicon.ico: favicon construction at 16, small at 32, primary at 48
  write(
    "app/favicon.ico",
    ico([
      { size: 16, png: png(docs.get("mark/metapatrol-mark-favicon-dark.svg")!, 16) },
      { size: 32, png: png(docs.get("mark/metapatrol-mark-small-dark.svg")!, 32) },
      { size: 48, png: png(docs.get("mark/metapatrol-mark-dark.svg")!, 48) },
    ]),
  );
  log(`${written.length - docs.size} png/ico`);
  return written;
}
