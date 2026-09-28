// Copies every asset of @metapatrol/brand into public/brand and writes
// public/brand/manifest.json (path and size of each file) for the download
// section. Angular only serves assets from inside the project, and
// node_modules is hoisted to the repository root.
import { cpSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const brand = fileURLToPath(new URL(".", import.meta.resolve("@metapatrol/brand/package.json")));
const target = fileURLToPath(new URL("../public/brand/", import.meta.url));
const dirs = ["mark", "wordmark", "lockup", "app", "construction"];

rmSync(target, { recursive: true, force: true });
const files = [];
for (const dir of dirs) {
  cpSync(`${brand}${dir}`, `${target}${dir}`, { recursive: true });
  for (const name of readdirSync(`${target}${dir}`).sort()) {
    files.push({ path: `${dir}/${name}`, size: statSync(`${target}${dir}/${name}`).size });
  }
}
cpSync(`${brand}LICENSE.md`, `${target}LICENSE.md`);
writeFileSync(`${target}manifest.json`, `${JSON.stringify(files, null, 2)}\n`);
console.log(`copied ${files.length} files from @metapatrol/brand to public/brand`);
