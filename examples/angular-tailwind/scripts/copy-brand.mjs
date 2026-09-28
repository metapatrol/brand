// Copies the brand files this app serves (favicon, mark) from @metapatrol/brand
// into public/brand. Angular only serves assets from inside the project, and
// node_modules is hoisted to the repository root.
import { cpSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";

const brand = fileURLToPath(new URL(".", import.meta.resolve("@metapatrol/brand/package.json")));
const target = fileURLToPath(new URL("../public/brand/", import.meta.url));

rmSync(target, { recursive: true, force: true });
for (const dir of ["app", "mark"]) cpSync(`${brand}${dir}`, `${target}${dir}`, { recursive: true });
console.log(`copied @metapatrol/brand app/ and mark/ to public/brand`);
