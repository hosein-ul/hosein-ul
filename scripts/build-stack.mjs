// Static art: assets/stack-{light,dark}.svg  (run locally: node scripts/build-stack.mjs)
// Only tools that appear in the real repos (package.json, foundry.toml, hardhat.config.*) are listed.
import { writeFileSync, mkdirSync } from "node:fs";
import { THEMES, esc, panel, MONO_STACK } from "./lib/theme.mjs";
import { FontSet, MONO_ADV } from "./lib/fonts.mjs";
import { ICONS } from "./lib/icons.mjs";

const W = 860;
const COLS = [
  ["CONTRACTS", [["Solidity", "gem"], ["Foundry", "hammer"], ["Hardhat", "hard-hat"], ["Zama FHEVM", "lock-keyhole"]]],
  ["APP", [["TypeScript", "braces"], ["Next.js", "app-window"], ["viem · wagmi", "plug"], ["Fastify · Prisma", "database"]]],
  ["PROTOCOLS", [["Arbitrum Nitro", "network"], ["Uniswap V3", "dices"]]],
  ["AGENTS", [["MCP", "blocks"], ["x402", "coins"], ["Circle · Arc", "circle-dollar-sign"]]],
];
const CW = W / COLS.length;
const CHIP_H = 24;
const GAP = 6;
const TOP = 50;
const H = TOP + 4 * CHIP_H + 3 * GAP + 18;
const SIZE = 11.5;

function build(t, fs) {
  const m = (key, s) => esc(fs.t(key, s));
  const css = `text{font-family:${MONO_STACK}}`;
  const dividers = COLS.slice(1)
    .map((_, i) => `<line x1="${(i + 1) * CW}" y1="1" x2="${(i + 1) * CW}" y2="${H - 1}" stroke="${t.line}"/>`)
    .join("\n");
  const cells = COLS.map(([label, items], c) => {
    const x = c * CW + 24;
    const chips = items
      .map(([name, icon], i) => {
        const y = TOP + i * (CHIP_H + GAP);
        const w = Math.round(10 + 12 + 8 + name.length * SIZE * MONO_ADV + 12);
        return `<g><rect x="${x + 0.5}" y="${y + 0.5}" width="${w}" height="${CHIP_H}" rx="5" fill="${t.bg}" stroke="${t.line}"/>
<g transform="translate(${x + 10.5} ${y + 6.5}) scale(.5)" fill="none" stroke="${t.muted}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[icon]}</g>
<text x="${x + 30.5}" y="${y + 16}" font-size="${SIZE}" fill="${t.fg}">${m("mono400", name)}</text></g>`;
      })
      .join("\n");
    return `<text x="${x}" y="32" font-size="10.5" letter-spacing="1.8" fill="${t.faint}">${m("mono400", label)}</text>\n${chips}`;
  }).join("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="t d">
<title id="t">Stack</title>
<desc id="d">Contracts: Solidity, Foundry, Hardhat, Zama FHEVM. App: TypeScript, Next.js, viem and wagmi, Fastify and Prisma. Security: threat modeling, fuzzing. Agents: MCP, x402, Circle and Arc.</desc>
<style>
__FONTS__
${css}</style>
${panel(t, W, H)}
${dividers}
${cells}
</svg>
`;
}

mkdirSync("assets", { recursive: true });
for (const name of ["light", "dark"]) {
  const fs = new FontSet("exact");
  let svg = build(THEMES[name], fs);
  svg = svg.replace("__FONTS__", await fs.css());
  writeFileSync(`assets/stack-${name}.svg`, svg);
  console.log(`stack-${name}.svg`, Math.round(svg.length / 1024) + " KB");
}
