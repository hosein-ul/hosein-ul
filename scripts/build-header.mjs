// Generates assets/header-{light,dark}.svg: name, tagline, and a sparse dot grid
// whose nodes slowly connect. Pure CSS animation, no JS, no external resources.
// Deterministic (seeded) so reruns produce identical files.
import { writeFileSync, mkdirSync } from "node:fs";
import { THEMES, SANS, MONO } from "./lib/theme.mjs";

const W = 880, H = 260, STEP = 40, X0 = 20, Y0 = 30;
const COLS = 22, ROWS = 6;

let seed = 7;
const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);

const grid = [];
for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) grid.push({ c, r, x: X0 + c * STEP, y: Y0 + r * STEP });

// Nodes live mostly on the right, away from the text.
const nodes = grid.filter((p) => (p.c >= 11 && rand() < 0.38) || (p.c >= 7 && p.c < 11 && rand() < 0.1));

const edges = [];
for (const a of nodes) {
  const near = nodes
    .filter((b) => b !== a && Math.hypot(a.c - b.c, a.r - b.r) <= 2.3)
    .sort((p, q) => Math.hypot(a.c - p.c, a.r - p.r) - Math.hypot(a.c - q.c, a.r - q.r))
    .slice(0, 2);
  for (const b of near) {
    const key = [a.c, a.r, b.c, b.r].join(",");
    const rev = [b.c, b.r, a.c, a.r].join(",");
    if (!edges.some((e) => e.key === key || e.key === rev)) edges.push({ key, a, b });
  }
}

function build(name) {
  const t = THEMES[name];
  seed = 99; // same motion in light and dark
  const dots = grid.map((p) => `<circle cx="${p.x}" cy="${p.y}" r="1.3"/>`).join("");
  const nodeEls = nodes.map((p, i) => `<circle class="n" style="animation-delay:${(-rand() * 12).toFixed(1)}s" cx="${p.x}" cy="${p.y}" r="2.6"/>`).join("");
  const edgeEls = edges
    .map((e, i) => {
      const dur = (9 + rand() * 7).toFixed(1);
      const delay = (-rand() * 16).toFixed(1);
      return `<line class="e" style="animation-duration:${dur}s;animation-delay:${delay}s" x1="${e.a.x}" y1="${e.a.y}" x2="${e.b.x}" y2="${e.b.y}" pathLength="1"/>`;
    })
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Hosein. Web3 builder, security researcher, writer.">
  <title>Hosein. Web3 builder, security researcher, writer.</title>
  <defs>
    <linearGradient id="fade" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0" stop-color="#fff" stop-opacity="0.12"/>
      <stop offset="0.42" stop-color="#fff" stop-opacity="0.2"/>
      <stop offset="0.68" stop-color="#fff" stop-opacity="1"/>
      <stop offset="1" stop-color="#fff" stop-opacity="1"/>
    </linearGradient>
    <mask id="m"><rect width="${W}" height="${H}" fill="url(#fade)"/></mask>
  </defs>
  <style>
    .dots circle { fill: ${t.faint}; }
    .n { fill: ${t.muted}; opacity: .35; animation: node 12s ease-in-out infinite; }
    .e { stroke: ${t.accent}; stroke-width: 1.2; stroke-linecap: round; fill: none;
         stroke-dasharray: 1; stroke-dashoffset: 1; opacity: 0;
         animation: link 12s ease-in-out infinite; }
    @keyframes link {
      0%   { stroke-dashoffset: 1; opacity: 0; }
      12%  { opacity: .75; }
      40%  { stroke-dashoffset: 0; opacity: .75; }
      70%  { stroke-dashoffset: 0; opacity: .75; }
      100% { stroke-dashoffset: 0; opacity: 0; }
    }
    @keyframes node { 0%, 100% { opacity: .3; } 50% { opacity: .85; } }
    @media (prefers-reduced-motion: reduce) {
      .n, .e { animation: none; }
      .e { stroke-dashoffset: 0; opacity: .35; }
    }
    .name { font: 700 56px ${SANS}; letter-spacing: -1.5px; fill: ${t.ink}; }
    .tag  { font: 400 18px ${SANS}; fill: ${t.muted}; }
    .meta { font: 400 12px ${MONO}; letter-spacing: .6px; fill: ${t.muted}; }
  </style>
  <g mask="url(#m)">
    <g class="dots">${dots}</g>
    <g>${edgeEls}</g>
    <g>${nodeEls}</g>
  </g>
  <rect x="48" y="84" width="28" height="3" rx="1.5" fill="${t.accent}"/>
  <text class="name" x="46" y="146">Hosein</text>
  <text class="tag" x="48" y="182">Web3 builder · Security researcher · Writer</text>
  <text class="meta" x="48" y="214">ONCHAIN SINCE 2021</text>
</svg>
`;
}

mkdirSync("assets", { recursive: true });
for (const n of ["light", "dark"]) writeFileSync(`assets/header-${n}.svg`, build(n));
console.log(`header: ${nodes.length} nodes, ${edges.length} edges`);
