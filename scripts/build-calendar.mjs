// Generates assets/calendar-{light,dark}.svg: an isometric-style 3D contribution calendar (52 weeks x 7 days).
//   node scripts/build-calendar.mjs [--fixture fixtures/sample.json] [--out DIR]
import { THEMES, THEME_NAMES, esc, fmt, panel, shade, r1, MONO_STACK } from "./lib/theme.mjs";
import { asciiFontSet, measure } from "./lib/fonts.mjs";
import { loadProfileData, writeAll, argv, run } from "./lib/github.mjs";

const W = 860;
const H = 360;
const WEEKS = 52;

// Camera: ground axes u (weeks) and v (days) are rotated 20 degrees and tilted 38 degrees.
const TH = (20 * Math.PI) / 180;
const PH = (38 * Math.PI) / 180;
const UX = Math.cos(TH);
const UY = Math.sin(TH) * Math.sin(PH);
const VX = -Math.sin(TH);
const VY = Math.cos(TH) * Math.sin(PH);
const LEVEL_H = [0, 8, 17, 29, 44]; // px at s = 15

function weeksOf(calendar) {
  const weeks = new Map();
  for (const d of calendar) {
    const dt = new Date(`${d.date}T00:00:00Z`);
    const start = new Date(dt.getTime() - dt.getUTCDay() * 86400000).toISOString().slice(0, 10);
    if (!weeks.has(start)) weeks.set(start, new Array(7).fill(null));
    weeks.get(start)[dt.getUTCDay()] = d.count;
  }
  return [...weeks.keys()]
    .sort()
    .slice(-WEEKS)
    .map((k) => weeks.get(k));
}

function levelFn(counts) {
  const nz = counts.filter((c) => c > 0).sort((a, b) => a - b);
  const q = (p) => nz[Math.min(nz.length - 1, Math.floor(p * nz.length))] ?? 1;
  const [a, b, c] = [q(0.25), q(0.5), q(0.75)];
  return (n) => (n <= 0 ? 0 : n <= a ? 1 : n <= b ? 2 : n <= c ? 3 : 4);
}

function layout(weeks, levels, s) {
  const k = s / 15;
  const pt = (u, v, z) => [u * UX * s + v * VX * s, u * UY * s + v * VY * s - z];
  const cubes = [];
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  weeks.forEach((days, u) => {
    days.forEach((count, v) => {
      if (count == null) return;
      const level = levels(count);
      const h = LEVEL_H[level] * k;
      const g = [pt(u, v, 0), pt(u + 1, v, 0), pt(u + 1, v + 1, 0), pt(u, v + 1, 0)];
      const top = [pt(u, v, h), pt(u + 1, v, h), pt(u + 1, v + 1, h), pt(u, v + 1, h)];
      for (const [x, y] of [...g, ...top]) {
        minX = Math.min(minX, x); maxX = Math.max(maxX, x);
        minY = Math.min(minY, y); maxY = Math.max(maxY, y);
      }
      cubes.push({ level, g, top });
    });
  });
  return { cubes, box: [minX, minY, maxX, maxY] };
}

async function build(data, t) {
  const fs = asciiFontSet("mono400", "mono500");
  const weeks = weeksOf(data.calendar);
  const counts = weeks.flat().filter((c) => c != null);
  const levels = levelFn(counts);
  const total = counts.reduce((a, b) => a + b, 0);
  const busiest = Math.max(...counts);

  // Fit the ribbon into the free area below the header text.
  const area = { x: 36, y: 74, w: W - 72, h: H - 74 - 44 };
  let s = 15.5;
  let L = layout(weeks, levels, s);
  const fit = Math.min(area.w / (L.box[2] - L.box[0]), area.h / (L.box[3] - L.box[1]));
  if (fit < 1) {
    s *= fit;
    L = layout(weeks, levels, s);
  }
  const [bx0, by0, bx1, by1] = L.box;
  const ox = area.x + (area.w - (bx1 - bx0)) / 2 - bx0;
  const oy = area.y + (area.h - (by1 - by0)) / 2 - by0;
  const P = (p) => `${r1(p[0] + ox)} ${r1(p[1] + oy)}`;

  let body = "";
  for (const c of L.cubes) {
    const [A, B, C, D] = c.top;
    body += `<path class="t${c.level}" d="M${P(A)}L${P(B)}L${P(C)}L${P(D)}Z"/>`;
    if (c.level > 0) {
      const [, gb, gc, gd] = c.g;
      body += `<path class="l${c.level}" d="M${P(D)}L${P(C)}L${P(gc)}L${P(gd)}Z"/><path class="r${c.level}" d="M${P(B)}L${P(C)}L${P(gc)}L${P(gb)}Z"/>`;
    }
  }

  const css = t.levels
    .map((col, i) => `.t${i}{fill:${col}}.l${i}{fill:${shade(col, 0.78)}}.r${i}{fill:${shade(col, 0.62)}}`)
    .join("");

  const head = `${fmt(total)} contributions`;
  const headW = measure("mono500", head, 13);
  const right = `busiest day · ${fmt(busiest)} contributions`;
  const keyX = 36;
  const key =
    `<text x="${keyX}" y="${H - 27}" font-size="10" letter-spacing="1" fill="${t.faint}">LESS</text>` +
    t.levels
      .map((col, i) => `<rect x="${keyX + 40 + i * 14}" y="${H - 35}" width="9" height="9" rx="2" fill="${col}"${i === 0 ? ` stroke="${t.line}"` : ""}/>`)
      .join("") +
    `<text x="${keyX + 40 + 5 * 14 + 4}" y="${H - 27}" font-size="10" letter-spacing="1" fill="${t.faint}">MORE</text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="t d">
<title id="t">Contribution calendar</title>
<desc id="d">${esc(`Isometric calendar of the last 52 weeks: ${fmt(total)} contributions, busiest day ${fmt(busiest)}.`)}</desc>
<style>
${await fs.css()}
text{font-family:${MONO_STACK}}
${css}.c path{stroke:${t.sunk};stroke-width:.5;stroke-linejoin:round}
</style>
${panel(t, W, H)}
<text x="36" y="40" font-size="13" font-weight="500" fill="${t.fg}">${esc(head)}</text>
<text x="${(36 + headW + 10).toFixed(1)}" y="40" font-size="11" fill="${t.faint}">last 52 weeks</text>
<text x="${W - 36}" y="40" font-size="11" text-anchor="end" fill="${t.muted}">${esc(right)}</text>
<g class="c">${body}</g>
${key}
</svg>
`;
}

run(async () => {
  const out = argv("--out") ?? "assets";
  const data = await loadProfileData({ fixture: argv("--fixture"), save: argv("--save-fixture") });
  const files = [];
  for (const name of THEME_NAMES) {
    files.push([`${out}/calendar-${name}.svg`, await build(data, THEMES[name])]);
  }
  writeAll(files);
  for (const [p, s] of files) console.log(p, Math.round(s.length / 1024) + " KB");
});
