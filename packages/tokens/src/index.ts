// Loads the DTCG token source shipped with this package, resolves aliases and
// checks contrast. Style Dictionary takes over the file outputs in phase 2;
// this module stays the programmatic API (used by @metapatrol/brand-kit).
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export const THEMES = ["dark", "light"] as const;
export type ThemeName = (typeof THEMES)[number];

export interface Dimension {
  value: number;
  unit: string;
}
export type TokenValue = string | number | string[] | Dimension;
export interface Token {
  value: TokenValue;
  type: string | undefined;
}
export type Tokens = Record<string, Token>;

interface Node {
  $type?: string;
  $value?: TokenValue;
  [key: string]: unknown;
}

/** Directory holding the *.tokens.json source files. */
export const TOKENS_DIR = fileURLToPath(new URL("../tokens/", import.meta.url));

function load(name: string): Node {
  return JSON.parse(readFileSync(new URL(name, `file://${TOKENS_DIR}`), "utf8")) as Node;
}

/** Flattens a DTCG tree into { "color.bg": { value, type } }, inheriting $type. */
function flatten(node: Node, path: string[] = [], type?: string, out: Tokens = {}): Tokens {
  const t = node.$type ?? type;
  if (node.$value !== undefined) {
    out[path.join(".")] = { value: node.$value, type: t };
    return out;
  }
  for (const [k, v] of Object.entries(node)) {
    if (!k.startsWith("$") && v && typeof v === "object") flatten(v as Node, [...path, k], t, out);
  }
  return out;
}

function resolve(tokens: Tokens): Tokens {
  const get = (key: string, seen: string[] = []): TokenValue => {
    if (seen.includes(key)) throw new Error(`alias cycle: ${[...seen, key].join(" -> ")}`);
    const tok = tokens[key];
    if (!tok) throw new Error(`unknown token {${key}}${seen.length ? ` (via ${seen.at(-1)})` : ""}`);
    const m = typeof tok.value === "string" ? tok.value.match(/^\{(.+)\}$/) : null;
    return m?.[1] ? get(m[1], [...seen, key]) : tok.value;
  };
  return Object.fromEntries(Object.entries(tokens).map(([k, t]) => [k, { ...t, value: get(k) }]));
}

/** All tokens of one theme: primitives, base and the theme's semantic roles, aliases resolved. */
export function theme(name: ThemeName): Tokens {
  return resolve({
    ...flatten(load("primitives.tokens.json")),
    ...flatten(load("base.tokens.json")),
    ...flatten(load(`theme.${name}.tokens.json`)),
  });
}

/** A resolved colour; throws if the token is missing or not a colour. */
export function color(tokens: Tokens, key: string): string {
  const t = tokens[key.startsWith("color.") ? key : `color.${key}`];
  if (!t || typeof t.value !== "string") throw new Error(`no colour token ${key}`);
  return t.value;
}

/** A resolved number; throws if the token is missing or not a number. */
export function number(tokens: Tokens, key: string): number {
  const t = tokens[key];
  if (!t || typeof t.value !== "number") throw new Error(`no number token ${key}`);
  return t.value;
}

function luminance(hex: string): number {
  const [r = 0, g = 0, b = 0] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((x) => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2.2 contrast ratio of two #RRGGBB colours. */
export function contrast(a: string, b: string): number {
  const [hi = 0, lo = 0] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

export interface ContrastResult {
  theme: ThemeName;
  fg: string;
  bg: string;
  ratio: number;
  min: number;
  why: string;
}

interface Rule {
  fg: string[];
  bg: string[];
  min: number;
  why: string;
}

/** Every pair from contrast.json in every theme, with its ratio. */
export function contrastReport(): ContrastResult[] {
  const { rules } = load("contrast.json") as unknown as { rules: Rule[] };
  return THEMES.flatMap((name) => {
    const t = theme(name);
    return rules.flatMap((rule) =>
      rule.fg.flatMap((fg) =>
        rule.bg.map((bg) => ({
          theme: name,
          fg,
          bg,
          ratio: contrast(color(t, fg), color(t, bg)),
          min: rule.min,
          why: rule.why,
        })),
      ),
    );
  });
}

const cssValue = ({ value, type }: Token): string => {
  if (type === "fontFamily" && Array.isArray(value)) return value.map((f) => (/\s/.test(f) ? `"${f}"` : f)).join(", ");
  if (type === "dimension" && typeof value === "object" && !Array.isArray(value)) return `${value.value}${value.unit}`;
  return String(value);
};

/** Semantic colour roles (what apps use), as opposed to the raw palette. */
const isSemantic = (k: string) => k.startsWith("color.") && !/^color\.(neutral|cyan|green|amber|red|blue)\./.test(k);
/** Theme-independent tokens exported to CSS and SCSS. */
const isBase = (k: string) => /^(font|radius)\./.test(k);
/** "color.mark.structure" -> "mark-structure", "font.size.base" -> "font-size-base" */
export const tokenName = (k: string) => k.replace(/^color\./, "").replaceAll(".", "-");

/** CSS custom properties (--mp-*) for both themes, dark by default, following prefers-color-scheme. */
export function css(): string {
  const block = (tokens: Tokens, filter: (k: string) => boolean) =>
    Object.entries(tokens)
      .filter(([k]) => filter(k))
      .map(([k, t]) => `  --mp-${tokenName(k)}: ${cssValue(t)};`)
      .join("\n");
  const semantic = isSemantic;
  const base = isBase;
  const dark = theme("dark");
  const light = theme("light");
  const indented = block(light, semantic).replaceAll("\n", "\n  ").replace(/^/, "  ");
  return `/* generated by @metapatrol/tokens, do not edit */
:root {
${block(dark, base)}
}
:root, [data-theme="dark"] {
  color-scheme: dark;
${block(dark, semantic)}
}
@media (prefers-color-scheme: light) {
  :root:not([data-theme="dark"]) {
    color-scheme: light;
${indented}
  }
}
[data-theme="light"] {
  color-scheme: light;
${block(light, semantic)}
}
`;
}

/** SCSS: one map per theme with the resolved colours, plus variables for the base tokens. */
export function scss(): string {
  const map = (name: ThemeName) =>
    Object.entries(theme(name))
      .filter(([k]) => isSemantic(k))
      .map(([k, t]) => `    "${tokenName(k)}": ${cssValue(t)},`)
      .join("\n");
  const base = Object.entries(theme("dark"))
    .filter(([k]) => isBase(k))
    // generic families (sans-serif, monospace, ...) must stay unquoted, as in CSS
    .map(([k, t]) => `$${tokenName(k)}: ${cssValue(t)};`)
    .join("\n");
  return `// generated by @metapatrol/tokens, do not edit
$themes: (
${THEMES.map((n) => `  "${n}": (\n${map(n)}\n  ),`).join("\n")}
);

${base}
`;
}

/** Resolved values: { base: {...}, dark: {...}, light: {...} } keyed by token path. */
export function json(): string {
  const pick = (tokens: Tokens, filter: (k: string) => boolean) =>
    Object.fromEntries(Object.entries(tokens).filter(([k]) => filter(k)).map(([k, t]) => [k, t.value]));
  const dark = theme("dark");
  return `${JSON.stringify(
    {
      base: pick(dark, (k) => isBase(k) || k.startsWith("mark.")),
      ...Object.fromEntries(THEMES.map((n) => [n, pick(theme(n), isSemantic)])),
    },
    null,
    2,
  )}\n`;
}
