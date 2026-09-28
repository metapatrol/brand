import assert from "node:assert/strict";
import { test } from "node:test";
import { color, contrast, contrastReport, css, json, number, scss, theme, THEMES } from "../src/index.ts";

test("every contrast rule holds in every theme", () => {
  const failed = contrastReport().filter((r) => r.ratio < r.min);
  assert.deepEqual(
    failed.map((r) => `${r.theme}: ${r.fg} on ${r.bg} ${r.ratio.toFixed(2)} < ${r.min}`),
    [],
  );
});

test("aliases resolve to hex colours", () => {
  for (const name of THEMES) {
    for (const [key, tok] of Object.entries(theme(name))) {
      if (tok.type === "color") assert.match(String(tok.value), /^#[0-9A-F]{6}([0-9A-F]{2})?$/i, `${name} ${key}`);
    }
  }
});

test("the mark colours match the brand", () => {
  assert.equal(color(theme("dark"), "mark.structure"), "#5B6776");
  assert.equal(color(theme("light"), "mark.structure"), "#171D25");
  assert.equal(color(theme("dark"), "mark.signal"), "#00E5FF");
  assert.equal(number(theme("dark"), "mark.clear-space"), 0.25);
});

test("contrast matches the WCAG reference values", () => {
  assert.equal(contrast("#000000", "#FFFFFF").toFixed(2), "21.00");
  assert.equal(contrast("#00E5FF", "#FFFFFF").toFixed(2), "1.54");
});

test("scss keeps generic font families unquoted and maps both themes", () => {
  const out = scss();
  assert.match(out, /\$font-family-sans: Inter, ui-sans-serif, system-ui, sans-serif;/);
  assert.match(out, /\$font-family-mono: "JetBrains Mono", /);
  assert.match(out, /"light": \([^)]*"signal-fg": #00707F,/);
});

test("json holds resolved values per theme", () => {
  const out = JSON.parse(json()) as Record<string, Record<string, unknown>>;
  assert.equal(out.dark?.["color.bg"], "#050607");
  assert.equal(out.light?.["color.bg"], "#FFFFFF");
  assert.equal(out.base?.["mark.clear-space"], 0.25);
});

test("css defines both themes", () => {
  const out = css();
  assert.match(out, /\[data-theme="light"\] \{[^}]*--mp-signal-fg: #00707F;/);
  assert.match(out, /--mp-bg: #050607;/);
});
