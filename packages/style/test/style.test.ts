// Compiles real Tailwind CSS v4 (through @tailwindcss/postcss, as Angular
// applications do) and Sass against the built package (run `npm run build`
// first), resolving @metapatrol/style through node_modules the way an
// application does.
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { test } from "node:test";
import tailwindPostcss from "@tailwindcss/postcss";
import postcss from "postcss";
import * as sass from "sass";

const fixture = (f: string) => new URL(`fixture/${f}`, import.meta.url).pathname;
const entry = fixture("tailwind.css");
const output = fixture("out/styles.css");

const tailwind = (
  await postcss([tailwindPostcss()]).process(readFileSync(entry, "utf8"), { from: entry, to: output })
).css;

/** The declarations of the first rule for a selector. */
const rule = (selector: string): string => {
  const i = tailwind.indexOf(`${selector} {`);
  assert.ok(i >= 0, `no rule for ${selector}`);
  return tailwind.slice(i, tailwind.indexOf("}", i));
};

test("tokens, fonts, base and patterns are included", () => {
  assert.match(tailwind, /--mp-signal-fg: #00707F;/, "light theme tokens");
  assert.match(tailwind, /@font-face \{[^}]*font-family: ['"]?Inter['"]?/, "Inter @font-face");
  assert.match(tailwind, /@font-face \{[^}]*font-family: ['"]?JetBrains Mono['"]?/, "JetBrains Mono @font-face");
  assert.match(tailwind, /\.mp-panel \{/);
  assert.match(tailwind, /::selection/);
});

// Tailwind rebases url() relative to the entry stylesheet; Angular's bundler
// then resolves them from there and copies the files.
test("font urls are rebased to files that exist", () => {
  const urls = [...tailwind.matchAll(/url\(([^)]+\.woff2)\)/g)].map((m) => m[1]!);
  assert.ok(urls.length >= 7 * 5, `only ${urls.length} font urls`);
  for (const url of urls) assert.ok(existsSync(resolve(dirname(entry), url)), url);
});

test("controls, fields, tables and the inline mark are part of the build", () => {
  for (const c of [".mp-btn-primary", ".mp-btn-danger", ".mp-input", ".mp-field-label", ".mp-panel-head", ".mp-table", ".mp-mark-structure"]) {
    assert.ok(tailwind.includes(c), c);
  }
  assert.match(tailwind, /\.mp-mark-signal\s*\{\s*fill: var\(--mp-mark-signal\)/);
});

test("utilities use the semantic roles through the --mp variables", () => {
  assert.match(rule(".bg-surface"), /var\(--mp-surface\)/);
  assert.match(rule(".text-fg-muted"), /var\(--mp-fg-muted\)/);
  assert.match(rule(".border-line-strong"), /var\(--mp-line-strong\)/);
  assert.match(rule(".text-base"), /font-size: var\(--mp-font-size-base\)/);
  assert.match(rule(".rounded-lg"), /var\(--mp-radius-lg\)/);
  assert.match(rule(".font-mono"), /var\(--mp-font-family-mono\)/);
});

test("the default Tailwind palette is removed", () => {
  for (const c of [".bg-red-500", ".text-blue-600", ".bg-white"]) {
    assert.ok(!tailwind.includes(`${c} {`), `${c} should not exist`);
  }
});

test("dark: and light: follow data-theme and the system preference", () => {
  const dark = tailwind.slice(tailwind.indexOf(".dark\\:bg-surface-2"));
  assert.ok(tailwind.includes('.dark\\:bg-surface-2:where([data-theme="dark"], [data-theme="dark"] *)'));
  assert.match(tailwind, /@media not \(prefers-color-scheme: light\)/);
  assert.ok(dark.length > 0);
  assert.ok(tailwind.includes('.light\\:bg-signal-wash:where([data-theme="light"], [data-theme="light"] *)'));
});

test("shadcn/spartan names resolve to the tokens", () => {
  assert.match(rule(".bg-primary"), /var\(--primary\)/);
  assert.match(tailwind, /--primary: var\(--mp-signal\);/);
  assert.match(tailwind, /--ring: var\(--mp-signal-fg\);/);
  assert.match(rule(".bg-destructive"), /var\(--destructive\)/);
});

test("the Sass API compiles through the package exports", () => {
  const { css } = sass.compile(fixture("app.scss"), { importers: [new sass.NodePackageImporter()] });
  assert.match(css, /\.label \{[^}]*letter-spacing: 0\.14em;[^}]*text-transform: uppercase;/);
  assert.match(css, /\.panel \{[^}]*border-radius: 8px;[^}]*color: var\(--mp-fg-muted\);/);
  assert.match(css, /\.preview \{[^}]*color-scheme: light;[^}]*--mp-signal-fg: #00707F;/);
  assert.match(css, /\.raw \{\s*border-color: #D5DBE1;/);
});

test("the Sass API rejects unknown roles", () => {
  assert.throws(
    () => sass.compileString('@use "pkg:@metapatrol/style" as mp; a { color: mp.color(nope); }', {
      importers: [new sass.NodePackageImporter()],
      url: new URL(`file://${fixture("x.scss")}`),
    }),
    /unknown colour role 'nope'/,
  );
});

test("the built files are the ones the exports point to", () => {
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as {
    exports: Record<string, string | Record<string, string>>;
  };
  for (const target of Object.values(pkg.exports).flatMap((v) => (typeof v === "string" ? [v] : Object.values(v)))) {
    assert.doesNotThrow(() => readFileSync(new URL(`../${target}`, import.meta.url)), target);
  }
});
