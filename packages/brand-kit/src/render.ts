// SVG to PNG with resvg (no Inkscape), PNG frames to ICO.
import { Resvg } from "@resvg/resvg-js";
import { FONTS_DIR } from "./type.ts";

/** Renders an SVG to PNG at the given width; height follows the viewBox. Transparent background. */
export function png(svg: string, width: number): Buffer {
  const r = new Resvg(svg, {
    fitTo: { mode: "width", value: width },
    font: {
      loadSystemFonts: false,
      fontFiles: [`${FONTS_DIR}JetBrainsMono-Regular.ttf`, `${FONTS_DIR}Inter-Medium.ttf`],
      defaultFontFamily: "JetBrains Mono",
    },
  });
  return r.render().asPng();
}

/** ICO container with PNG-compressed frames (supported by every current browser and OS). */
export function ico(frames: { size: number; png: Buffer }[]): Buffer {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(frames.length, 4);
  const dir = Buffer.alloc(16 * frames.length);
  let offset = header.length + dir.length;
  frames.forEach(({ size, png: data }, j) => {
    const o = 16 * j;
    dir.writeUInt8(size >= 256 ? 0 : size, o); // width, 0 means 256
    dir.writeUInt8(size >= 256 ? 0 : size, o + 1); // height
    dir.writeUInt8(0, o + 2); // palette size
    dir.writeUInt8(0, o + 3); // reserved
    dir.writeUInt16LE(1, o + 4); // colour planes
    dir.writeUInt16LE(32, o + 6); // bits per pixel
    dir.writeUInt32LE(data.length, o + 8);
    dir.writeUInt32LE(offset, o + 12);
    offset += data.length;
  });
  return Buffer.concat([header, dir, ...frames.map((f) => f.png)]);
}
