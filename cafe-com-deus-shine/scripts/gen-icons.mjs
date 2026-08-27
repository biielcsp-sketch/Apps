import sharp from "sharp";
import { mkdirSync } from "fs";
import { fileURLToPath } from "url";

const src = fileURLToPath(new URL("../public/icons/logo-official.png", import.meta.url));
const outDirUrl = new URL("../public/icons/", import.meta.url);
const outDir = fileURLToPath(outDirUrl);
mkdirSync(outDir, { recursive: true });

const BG = { r: 0xfd, g: 0xf8, b: 0xf3, alpha: 1 }; // --background

const targets = [
  { name: "icon-192.png", size: 192 },
  { name: "icon-512.png", size: 512 },
  { name: "icon-192-maskable.png", size: 192, pad: 0.12 },
  { name: "icon-512-maskable.png", size: 512, pad: 0.12 },
  { name: "icon-apple-touch.png", size: 180 },
];

for (const t of targets) {
  const size = t.size;
  if (t.pad) {
    const inner = Math.round(size * (1 - t.pad * 2));
    const buf = await sharp(src).resize(inner, inner, { fit: "cover" }).toBuffer();
    await sharp({
      create: { width: size, height: size, channels: 4, background: BG },
    })
      .composite([{ input: buf, gravity: "center" }])
      .png()
      .toFile(`${outDir}${t.name}`);
  } else {
    await sharp(src)
      .resize(size, size, { fit: "cover", background: BG })
      .png()
      .toFile(`${outDir}${t.name}`);
  }
}

await sharp(src)
  .resize(32, 32, { fit: "cover", background: BG })
  .png()
  .toFile(fileURLToPath(new URL("../public/favicon.png", import.meta.url)));

console.log("done");
