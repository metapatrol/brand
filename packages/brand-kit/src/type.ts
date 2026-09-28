// Text as outlines: shaping (kerning, ligatures) and glyph paths via fontkit,
// so the generated SVGs need no installed font.
import { fileURLToPath } from "node:url";
import * as fontkit from "fontkit";

export const FONTS_DIR = fileURLToPath(new URL("../fonts/", import.meta.url));

type Box = [number, number, number, number];

const num = (x: number): string => {
  const s = x.toFixed(2);
  return s.includes(".") ? s.replace(/\.?0+$/, "") : s;
};

export class Face {
  private readonly font: fontkit.Font;

  constructor(file: string) {
    const f = fontkit.openSync(`${FONTS_DIR}${file}`);
    if (!("layout" in f)) throw new Error(`${file} is a font collection`);
    this.font = f;
  }

  private run(text: string, tracking: number) {
    const { glyphs, positions } = this.font.layout(text);
    const upem = this.font.unitsPerEm;
    let x = 0;
    return glyphs.map((glyph, j) => {
      const pos = positions[j];
      const gx = x + (pos?.xOffset ?? 0);
      x += (pos?.xAdvance ?? 0) + tracking * upem;
      return { glyph, x: gx };
    });
  }

  /** [xmin, ymin, xmax, ymax] of the ink, y up, baseline at 0. */
  bounds(text: string, size: number, tracking = 0): Box {
    const sc = size / this.font.unitsPerEm;
    let box: Box | undefined;
    for (const { glyph, x } of this.run(text, tracking)) {
      const b = glyph.path.bbox;
      if (!Number.isFinite(b.minX) || b.maxX <= b.minX) continue;
      const g: Box = [(b.minX + x) * sc, b.minY * sc, (b.maxX + x) * sc, b.maxY * sc];
      box = box ? [Math.min(box[0], g[0]), Math.min(box[1], g[1]), Math.max(box[2], g[2]), Math.max(box[3], g[3])] : g;
    }
    if (!box) throw new Error(`no ink in "${text}"`);
    return box;
  }

  /** SVG path data with the ink's left edge at x and the baseline at `baseline` (y down). */
  path(text: string, size: number, x: number, baseline: number, tracking = 0): string {
    const sc = size / this.font.unitsPerEm;
    const x0 = x - this.bounds(text, size, tracking)[0];
    const out: string[] = [];
    for (const { glyph, x: gx } of this.run(text, tracking)) {
      const p = glyph.path.transform(sc, 0, 0, -sc, x0 + gx * sc, baseline);
      for (const { command, args } of p.commands) {
        const a = args.map(num).join(" ");
        if (command === "moveTo") out.push(`M${a}`);
        else if (command === "lineTo") out.push(`L${a}`);
        else if (command === "quadraticCurveTo") out.push(`Q${a}`);
        else if (command === "bezierCurveTo") out.push(`C${a}`);
        else if (command === "closePath") out.push("Z");
      }
    }
    return out.join("");
  }
}
