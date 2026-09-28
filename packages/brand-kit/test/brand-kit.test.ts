import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { build, documents } from "../src/build.ts";
import { inset, PRIMARY, SMALL, type MarkSpec, type Polygon } from "../src/geometry.ts";
import { ico } from "../src/render.ts";

const specs: [string, MarkSpec][] = [["primary", PRIMARY], ["small", SMALL]];
const polygons = (s: MarkSpec): Polygon[] => [...s.structure, s.signal];

test("every edge is vertical or at ±30° on the lattice", () => {
  for (const [name, spec] of specs) {
    for (const poly of polygons(spec)) {
      poly.forEach(([i0, k0], j) => {
        const [i1, k1] = poly[(j + 1) % poly.length]!;
        const di = i1 - i0;
        const dk = k1 - k0;
        assert.ok(di === 0 || Math.abs(dk) === Math.abs(di), `${name}: edge (${i0},${k0})->(${i1},${k1})`);
      });
    }
  }
});

test("every point lies inside the hexagon", () => {
  for (const [name, { n, ...spec }] of specs) {
    for (const poly of polygons({ n, ...spec })) {
      for (const [i, k] of poly) {
        assert.ok(Math.abs(i) <= n && Math.abs(k) + Math.abs(i) <= 2 * n, `${name}: (${i},${k})`);
      }
    }
  }
});

test("the signal panel is an isometric square with half the hexagon's edge", () => {
  const [a, b, c] = PRIMARY.signal;
  const width = Math.abs(b![0] - a![0]); // in i-units
  const vertical = Math.abs(c![1] - b![1]); // in k-units (half steps)
  assert.equal(width, PRIMARY.n / 2);
  assert.equal(vertical, 2 * width);
});

test("inset moves every edge inwards by d", () => {
  const square: Polygon = [[0, 0], [10, 0], [10, 10], [0, 10]];
  assert.deepEqual(inset(square, 1), [[1, 1], [9, 1], [9, 9], [1, 9]]);
});

test("documents are deterministic and well-formed", () => {
  const a = documents();
  const b = documents();
  assert.equal(a.size, 35);
  for (const [rel, svg] of a) {
    assert.equal(svg, b.get(rel), rel);
    assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 [\d.]+ [\d.]+"/, rel);
    assert.ok(!/NaN|Infinity|undefined/.test(svg), rel);
  }
});

test("ico header and directory", () => {
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
  const out = ico([{ size: 16, png }, { size: 256, png }]);
  assert.equal(out.readUInt16LE(2), 1);
  assert.equal(out.readUInt16LE(4), 2);
  assert.equal(out.readUInt8(6), 16);
  assert.equal(out.readUInt8(22), 0); // 256 is written as 0
  assert.equal(out.readUInt32LE(6 + 12), 6 + 32); // first frame after header and directory
  assert.equal(out.length, 6 + 32 + 8);
});

test("build writes an svg and a png for every document, plus icons", () => {
  const out = mkdtempSync(join(tmpdir(), "brand-kit-"));
  try {
    const files = new Set(build(out));
    for (const rel of documents().keys()) {
      assert.ok(files.has(rel), rel);
      assert.ok(files.has(rel.replace(/\.svg$/, ".png")), `${rel} png`);
    }
    for (const rel of ["app/favicon.ico", "app/favicon.png", "app/metapatrol-app-icon-180.png", "app/metapatrol-avatar-light-512.png"]) {
      assert.ok(files.has(rel), rel);
    }
    const icoFile = readFileSync(join(out, "app/favicon.ico"));
    assert.deepEqual([0, 1, 2].map((j) => icoFile.readUInt8(6 + 16 * j)), [16, 32, 48]);
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
});
