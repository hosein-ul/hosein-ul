// Geist and Geist Mono (SIL OFL 1.1, github.com/vercel/geist-font) embedded as base64 woff2 subsets.
// SVGs inside <img> cannot load web fonts, so every SVG carries its own @font-face.
//
//   exact mode  (static art, run locally): subset to the glyphs actually used, via fontTools.
//   ascii mode  (data-driven art, run in Actions): reuse scripts/fonts/ascii-subset.json, no Python needed.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = join(here, "..", "..");
const CACHE = join(ROOT, ".cache", "fonts");
const ASCII_JSON = join(ROOT, "scripts", "fonts", "ascii-subset.json");
const TOOL = join(ROOT, "scripts", "tools", "font_tools.py");
const RAW = "https://raw.githubusercontent.com/vercel/geist-font/main/fonts";

export const FACES = {
  sans400: { family: "GeistSub", weight: 400, file: "Geist/ttf/Geist-Regular.ttf" },
  sans600: { family: "GeistSub", weight: 600, file: "Geist/ttf/Geist-SemiBold.ttf" },
  sans700: { family: "GeistSub", weight: 700, file: "Geist/ttf/Geist-Bold.ttf" },
  mono400: { family: "GeistMonoSub", weight: 400, file: "GeistMono/ttf/GeistMono-Regular.ttf" },
  mono500: { family: "GeistMonoSub", weight: 500, file: "GeistMono/ttf/GeistMono-Medium.ttf" },
  mono600: { family: "GeistMonoSub", weight: 600, file: "GeistMono/ttf/GeistMono-SemiBold.ttf" },
};

// Characters available in data-driven SVGs.
export const ASCII_CHARSET =
  Array.from({ length: 95 }, (_, i) => String.fromCharCode(32 + i)).join("") + "·…–—→×";

const python = () => process.env.PYTHON || (process.platform === "win32" ? "python" : "python3");

export async function ensureTtf(face) {
  const path = join(CACHE, face.file.split("/").pop());
  if (!existsSync(path)) {
    mkdirSync(CACHE, { recursive: true });
    const res = await fetch(`${RAW}/${face.file}`);
    if (!res.ok) throw new Error(`font download failed: ${face.file} (${res.status})`);
    writeFileSync(path, Buffer.from(await res.arrayBuffer()));
  }
  return path;
}

function runTool(args) {
  return execFileSync(python(), [TOOL, ...args], { encoding: "utf8", maxBuffer: 1 << 24 });
}

export async function subsetBase64(faceKey, text) {
  const ttf = await ensureTtf(FACES[faceKey]);
  const dir = mkdtempSync(join(tmpdir(), "geist-"));
  try {
    const txt = join(dir, "chars.txt");
    const out = join(dir, "out.woff2");
    writeFileSync(txt, text, "utf8");
    runTool(["subset", ttf, out, txt]);
    return readFileSync(out).toString("base64");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

export async function advanceTable(faceKey, text) {
  const ttf = await ensureTtf(FACES[faceKey]);
  const dir = mkdtempSync(join(tmpdir(), "geist-"));
  try {
    const txt = join(dir, "chars.txt");
    writeFileSync(txt, text, "utf8");
    return JSON.parse(runTool(["advances", ttf, txt]));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

let asciiCache;
function ascii() {
  if (!asciiCache) {
    if (!existsSync(ASCII_JSON)) throw new Error("scripts/fonts/ascii-subset.json is missing; run: node scripts/tools/make-ascii-subset.mjs");
    asciiCache = JSON.parse(readFileSync(ASCII_JSON, "utf8"));
  }
  return asciiCache;
}

// Width of a string in px, using real advance widths (no kerning), plus letter-spacing per glyph.
export function measure(faceKey, str, size, letterSpacing = 0) {
  const f = ascii().faces[faceKey];
  let w = 0;
  for (const ch of str) w += ((f.adv[ch] ?? f.upm * 0.55) / f.upm) * size + letterSpacing;
  return w;
}

export const MONO_ADV = 0.6; // Geist Mono advance in em

// Collects the text used per face so the subset covers exactly those glyphs.
export class FontSet {
  constructor(mode = "exact") {
    this.mode = mode;
    this.used = new Map();
  }
  // Records the string against a face and returns it unchanged.
  t(faceKey, str) {
    if (!FACES[faceKey]) throw new Error(`unknown face ${faceKey}`);
    const set = this.used.get(faceKey) ?? new Set();
    for (const ch of String(str)) set.add(ch);
    this.used.set(faceKey, set);
    return str;
  }
  use(faceKey) {
    this.t(faceKey, "");
    return this;
  }
  async css() {
    const rules = [];
    for (const [key, chars] of this.used) {
      const face = FACES[key];
      let b64;
      if (this.mode === "ascii") b64 = ascii().faces[key].woff2;
      else b64 = await subsetBase64(key, [...new Set([...chars, " "])].join(""));
      rules.push(
        `@font-face{font-family:${face.family};font-weight:${face.weight};font-style:normal;src:url(data:font/woff2;base64,${b64}) format("woff2")}`,
      );
    }
    return rules.join("\n");
  }
}

export const asciiFontSet = (...keys) => {
  const fs = new FontSet("ascii");
  keys.forEach((k) => fs.use(k));
  return fs;
};
