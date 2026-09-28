#!/usr/bin/env node
//   metapatrol-tokens check        resolve aliases, check tokens/contrast.json
//   metapatrol-tokens emit <dir>   write tokens.css, _tokens.scss, tokens.json
//   metapatrol-tokens css <file>   write only the CSS custom properties
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { contrastReport, css, json, scss } from "./index.ts";

const [cmd, arg] = process.argv.slice(2);

if (cmd === "check") {
  const report = contrastReport();
  const failed = report.filter((r) => r.ratio < r.min);
  for (const r of failed) {
    console.log(`FAIL ${r.theme.padEnd(5)} ${r.fg} on ${r.bg}: ${r.ratio.toFixed(2)} < ${r.min} (${r.why})`);
  }
  console.log(`${report.length - failed.length} contrast pairs pass, ${failed.length} fail`);
  if (failed.length) process.exit(1);
} else if (cmd === "emit" && arg) {
  mkdirSync(arg, { recursive: true });
  writeFileSync(join(arg, "tokens.css"), css());
  writeFileSync(join(arg, "_tokens.scss"), scss());
  writeFileSync(join(arg, "tokens.json"), json());
  console.log(`wrote tokens.css, _tokens.scss, tokens.json to ${arg}`);
} else if (cmd === "css" && arg) {
  writeFileSync(arg, css());
  console.log(`wrote ${arg}`);
} else {
  console.error("usage: metapatrol-tokens check | emit <dir> | css <file>");
  process.exit(2);
}
