import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { init, resolveConfig } from "../src/init.ts";
import { assertName, projectFiles, projectLockup, readmeHeader, socialPreview, wrap } from "../src/project.ts";

const pngSize = (b: Buffer) => [b.readUInt32BE(16), b.readUInt32BE(20)];
const tmp = () => mkdtempSync(join(tmpdir(), "brand-kit-project-"));

test("project names are technical identifiers", () => {
  for (const ok of ["steward", "mcp-gateway", "oci-registry2"]) assert.doesNotThrow(() => assertName(ok));
  for (const bad of ["Steward", "mcp_gateway", "-x", "a--b", "", "a b"]) assert.throws(() => assertName(bad), bad);
});

test("wrap keeps lines within the width and ends cut text with an ellipsis", () => {
  const text = "one governed endpoint in front of every backend in the cluster, with policy, audit and quotas for each call";
  const lines = wrap(text, 40, 600, 2);
  assert.equal(lines.length, 2);
  assert.ok(lines[1]!.endsWith(" …"));
  assert.deepEqual(wrap("short", 40, 600, 3), ["short"]);
});

test("the lockup is deterministic and names the project", () => {
  const a = projectLockup("mcp-gateway", "dark");
  assert.equal(a, projectLockup("mcp-gateway", "dark"));
  assert.match(a, /aria-label="metapatrol \/ mcp-gateway"/);
  assert.ok(!/NaN|undefined/.test(a));
});

test("the social preview is 1280x640 and fits long names", () => {
  assert.match(socialPreview("x", "y"), /viewBox="0 0 1280\.00 640\.00"/);
  const svg = socialPreview("forgejo-github-bridge", "Mirrors repositories between Forgejo and GitHub.");
  assert.ok(!/NaN|undefined/.test(svg));
});

test("project files: lockups, preview, favicon set, header", () => {
  const files = projectFiles("steward", "Keeps a site whose CCU it is the only thing to talk to.");
  for (const cw of ["dark", "light", "mono-white", "mono-black"]) {
    assert.ok(files.has(`steward-lockup-${cw}.svg`) && files.has(`steward-lockup-${cw}.png`), cw);
  }
  assert.deepEqual(pngSize(files.get("social-preview.png") as Buffer), [1280, 640]);
  assert.deepEqual(pngSize(files.get("favicon/apple-touch-icon.png") as Buffer), [180, 180]);
  assert.deepEqual(pngSize(files.get("favicon/icon-512.png") as Buffer), [512, 512]);
  const manifest = JSON.parse(files.get("favicon/site.webmanifest") as string) as { name: string; icons: unknown[] };
  assert.equal(manifest.name, "metapatrol / steward");
  assert.equal(manifest.icons.length, 2);
  assert.match(files.get("README-header.md") as string, /prefers-color-scheme: dark/);
});

test("readme header points at the asset directory", () => {
  assert.match(readmeHeader("x", "p", ".metapatrol"), /srcset="\.metapatrol\/x-lockup-dark\.png"/);
});

test("config: flags, then metapatrol.json, then package.json, go.mod, directory", () => {
  const dir = tmp();
  try {
    writeFileSync(join(dir, "go.mod"), "module forgejo.example/platform/oci-registry\n\ngo 1.27\n");
    assert.equal(resolveConfig(dir).name, "oci-registry");
    writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "@scope/web-ui", description: "The console." }));
    assert.deepEqual(
      { ...resolveConfig(dir), source: undefined },
      { name: "web-ui", purpose: "The console.", source: undefined },
    );
    writeFileSync(join(dir, "metapatrol.json"), JSON.stringify({ name: "console", purpose: "Own." }));
    assert.equal(resolveConfig(dir).name, "console");
    assert.equal(resolveConfig(dir, { name: "flag" }).name, "flag");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("init writes the skeleton once and never overwrites hand-written files", () => {
  const dir = tmp();
  try {
    const first = init(dir, { name: "demo", purpose: "A demo." });
    assert.ok(first.written.includes("README.md") && first.written.includes("CONTRIBUTING.md"));
    assert.ok(first.written.includes(".metapatrol/social-preview.png"));
    assert.deepEqual(JSON.parse(readFileSync(join(dir, "metapatrol.json"), "utf8")), { name: "demo", purpose: "A demo." });

    writeFileSync(join(dir, "README.md"), "# mine\n");
    const second = init(dir);
    assert.deepEqual(second.kept.sort(), ["CONTRIBUTING.md", "README.md"]);
    assert.equal(readFileSync(join(dir, "README.md"), "utf8"), "# mine\n");
    assert.equal(second.config.name, "demo", "name comes back from metapatrol.json");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
