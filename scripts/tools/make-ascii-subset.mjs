// Rebuilds scripts/fonts/ascii-subset.json (base64 woff2 + advance widths for every face).
// Run locally after changing the charset: node scripts/tools/make-ascii-subset.mjs   (needs python with fonttools + brotli)
import { writeFileSync, mkdirSync } from "node:fs";
import { FACES, ASCII_CHARSET, subsetBase64, advanceTable } from "../lib/fonts.mjs";

const faces = {};
for (const key of Object.keys(FACES)) {
  const woff2 = await subsetBase64(key, ASCII_CHARSET);
  const { upm, adv } = await advanceTable(key, ASCII_CHARSET);
  faces[key] = { woff2, upm, adv };
  console.log(key, Math.round((woff2.length * 3) / 4 / 1024) + " KB woff2");
}
mkdirSync("scripts/fonts", { recursive: true });
writeFileSync("scripts/fonts/ascii-subset.json", JSON.stringify({ charset: ASCII_CHARSET, faces }));
