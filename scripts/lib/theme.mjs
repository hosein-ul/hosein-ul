// Design tokens for every generated SVG. Pure monochrome; the only colour is the "finalized" green.
export const THEMES = {
  light: {
    name: "light",
    bg: "#ffffff",
    sunk: "#f6f8fa",
    fg: "#0b0d10",
    muted: "#59636e",
    faint: "#8a939d",
    line: "#d1d9e0",
    lineSoft: "#e8ecf0",
    levels: ["#ebeef1", "#c4cbd2", "#8c96a0", "#4b545d", "#0b0d10"],
    green: "#1a7f37",
  },
  dark: {
    name: "dark",
    bg: "#0d1117",
    sunk: "#11161d",
    fg: "#eef1f4",
    muted: "#9198a1",
    faint: "#656d76",
    line: "#262c34",
    lineSoft: "#1b2027",
    levels: ["#151a21", "#2a313a", "#4d5661", "#8f98a3", "#eef1f4"],
    green: "#3fb950",
  },
};

export const THEME_NAMES = Object.keys(THEMES);

export const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export const fmt = (n) => Number(n).toLocaleString("en-US");

export const r1 = (n) => (Math.round(n * 10) / 10).toString();

// Multiply an #rrggbb colour by a factor (used for isometric side faces).
export function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.max(0, Math.min(255, Math.round(v * k))));
  return "#" + c.map((v) => v.toString(16).padStart(2, "0")).join("");
}

// Panel that every graphic sits in: sunk fill, 1px line, 8px radius.
export function panel(t, w, h) {
  return `<rect x=".5" y=".5" width="${w - 1}" height="${h - 1}" rx="8" fill="${t.sunk}" stroke="${t.line}"/>`;
}

export const SANS_STACK = `GeistSub, ui-sans-serif, system-ui, sans-serif`;
export const MONO_STACK = `GeistMonoSub, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
