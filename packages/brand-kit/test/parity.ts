// Compares the generated documents with a reference asset tree, pixel by pixel
// and, for geometry files, coordinate by coordinate. Used in phase 1 to prove
// that the TypeScript port reproduces the archived Python generator
// (archive/python-generator, output in its out/ directory); useful whenever a
// change should not alter the assets.
//
//   npm run parity -w @metapatrol/brand-kit -- <reference dir>
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { Resvg } from "@resvg/resvg-js";
import { documents } from "../src/build.ts";
import { FONTS_DIR } from "../src/type.ts";

const ref = process.argv[2];
if (!ref) {
  console.error("usage: parity <reference dir>   e.g. ../brand or ../../archive/python-generator/out");
  process.exit(2);
}

const walk = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name)) : e.name.endsWith(".svg") ? [join(dir, e.name)] : [],
  );

const pixels = (svg: string) =>
  new Resvg(svg, {
    fitTo: { mode: "width", value: 512 },
    font: { loadSystemFonts: false, fontFiles: [`${FONTS_DIR}JetBrainsMono-Regular.ttf`], defaultFontFamily: "JetBrains Mono" },
  }).render();

const numbers = (svg: string) => (svg.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);

const docs = documents();
const refs = new Map(walk(ref).map((f) => [relative(ref, f), readFileSync(f, "utf8")]));
let failed = 0;

const missing = [...refs.keys()].filter((k) => !docs.has(k));
const extra = [...docs.keys()].filter((k) => !refs.has(k));
if (missing.length || extra.length) {
  failed++;
  console.log(`FILES missing: ${missing.join(", ") || "-"} · extra: ${extra.join(", ") || "-"}`);
}

for (const [rel, want] of refs) {
  const got = docs.get(rel);
  if (!got) continue;
  const a = pixels(want);
  const b = pixels(got);
  let differing = 0;
  let maxDiff = 0;
  if (a.width !== b.width || a.height !== b.height) {
    failed++;
    console.log(`SIZE ${rel}: ${a.width}x${a.height} vs ${b.width}x${b.height}`);
    continue;
  }
  const pa = a.pixels;
  const pb = b.pixels;
  for (let j = 0; j < pa.length; j += 4) {
    const d = Math.max(...[0, 1, 2, 3].map((c) => Math.abs(pa[j + c]! - pb[j + c]!)));
    if (d > 16) differing++;
    maxDiff = Math.max(maxDiff, d);
  }
  const share = differing / (pa.length / 4);
  // geometry files: coordinates must agree to one unit of the last printed digit
  // (Python and JavaScript round exact halves differently); construction grids
  // are written with one decimal, everything else with two
  let coord = "";
  if (/^(mark|construction)\/|^app\/(metapatrol-app|metapatrol-avatar|favicon\.svg)/.test(rel)) {
    const na = numbers(want);
    const nb = numbers(got);
    const worst = na.length === nb.length ? Math.max(0, ...na.map((x, j) => Math.abs(x - nb[j]!))) : Infinity;
    coord = ` · coordinates Δmax ${worst === Infinity ? `count ${na.length} vs ${nb.length}` : worst.toFixed(3)}`;
    if (worst > (rel.startsWith("construction/") ? 0.101 : 0.0101)) failed++;
  }
  const ok = share < 0.001;
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "DIFF"} ${rel}: ${(share * 100).toFixed(3)} % pixels differ (max Δ ${maxDiff})${coord}`);
}

console.log(failed ? `\n${failed} problem(s)` : `\nall ${refs.size} documents match`);
process.exit(failed ? 1 : 0);
