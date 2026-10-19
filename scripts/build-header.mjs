// Static art: assets/header-{light,dark}.svg  (run locally: node scripts/build-header.mjs)
// Left: name, cycling role line, status. Right: an endless chain of block cards.
import { writeFileSync, mkdirSync } from "node:fs";
import { THEMES, esc, panel, SANS_STACK, MONO_STACK } from "./lib/theme.mjs";
import { FontSet, MONO_ADV } from "./lib/fonts.mjs";

const W = 860;
const H = 230;
const pct = (n) => (Math.round(n * 100) / 100).toString();

const ROLES = [
  "building payment rails for stablecoins",
  "hunting bugs in DeFi protocols",
  "explaining infra to humans",
];

const BLOCKS = [
  { n: "#21,904,118", hash: "0x9f3a…c1e7", txs: "142 txs", gas: 0.62, y: 56 },
  { n: "#21,904,119", hash: "0x4be0…7a52", txs: "97 txs", gas: 0.41, y: 96 },
  { n: "#21,904,120", hash: "0xd17c…09fb", txs: "218 txs", gas: 0.88, y: 56 },
  { n: "#21,904,121", hash: "0x62aa…e3d4", txs: "64 txs", gas: 0.33, y: 96 },
  { n: "#21,904,122", hash: "0xa8f1…5b06", txs: "131 txs", gas: 0.57, y: 56 },
];

const PITCH = 120;
const CARD_W = 104;
const CARD_H = 78;
const CHAIN_X = 430;
const SET = BLOCKS.length; // two identical sets of 5; the loop shifts by exactly one set

function roleCss() {
  const slot = 100 / ROLES.length;
  const typeSpan = 10; // % of the 9s cycle spent typing (0.9s)
  let css = "";
  ROLES.forEach((text, i) => {
    const s = slot * i;
    const e = s + slot;
    const full = (text.length + 2) * 14 * MONO_ADV;
    // group visibility
    const stops = [];
    if (i === 0) stops.push(`0%{opacity:1}`);
    else stops.push(`0%{opacity:0}`, `${pct(s)}%{opacity:0}`, `${pct(s + 0.9)}%{opacity:1}`);
    stops.push(`${pct(e - 1.8)}%{opacity:1}`, `${pct(e)}%{opacity:0}`);
    if (e < 100) stops.push(`100%{opacity:0}`);
    css += `@keyframes ro${i}{${stops.join("")}}\n`;
    // typing: cover and caret both step across the text, one step per character
    const n = text.length + 2;
    const move = (name) => {
      const a = [];
      a.push(`0%{transform:translateX(0)}`);
      if (s > 0) a.push(`${pct(s + 0.9)}%{transform:translateX(0);animation-timing-function:steps(${n},end)}`);
      else a.push(`0.9%{transform:translateX(0);animation-timing-function:steps(${n},end)}`);
      a.push(`${pct(s + 0.9 + typeSpan)}%{transform:translateX(${pct(full)}px)}`, `100%{transform:translateX(${pct(full)}px)}`);
      return `@keyframes ${name}${i}{${a.join("")}}\n`;
    };
    css += move("co") + move("ca");
  });
  return css;
}

function build(t, fs) {
  const mono = (key, s) => esc(fs.t(key, s));
  const css = `
text{font-family:${MONO_STACK}}
.name{font-family:${SANS_STACK}}
.r1,.r2{opacity:0}
@media (prefers-reduced-motion:no-preference){
.chain{animation:slide 12s linear infinite}
@keyframes slide{from{transform:translateX(0)}to{transform:translateX(-${PITCH * SET}px)}}
.pulse{transform-box:fill-box;transform-origin:center;animation:pulse 2.4s ease-out infinite}
@keyframes pulse{0%{transform:scale(1);opacity:.55}100%{transform:scale(3.4);opacity:0}}
.blink{animation:blink 1.06s steps(1,end) infinite}
@keyframes blink{50%{opacity:0}}
.r0{animation:ro0 9s linear infinite}.r1{animation:ro1 9s linear infinite}.r2{animation:ro2 9s linear infinite}
${ROLES.map((_, i) => `.r${i} .role-co{animation:co${i} 9s linear infinite}.r${i} .role-ca{animation:ca${i} 9s linear infinite}`).join("\n")}
${roleCss()}}
`;

  const x0 = 32;
  const roleBlocks = ROLES.map((text, i) => {
    const full = (text.length + 2) * 14 * MONO_ADV;
    return `<g class="r${i}">
<text x="${x0}" y="148" font-size="14" fill="${t.muted}"><tspan fill="${t.faint}">&gt; </tspan>${mono("mono400", text)}</text>
<rect class="role-co" style="transform:translateX(${pct(full)}px)" x="${x0}" y="132" width="${pct(full + 6)}" height="24" fill="${t.sunk}"/>
<g class="role-ca" style="transform:translateX(${pct(full)}px)"><rect class="blink" x="${x0 + 1}" y="133" width="1.6" height="18" fill="${t.fg}"/></g>
</g>`;
  }).join("\n");
  fs.t("mono400", "> ");

  // block cards and connectors
  const cards = [];
  const links = [];
  // k = -1 is an incoming link for the first card, so the loop seam at translateX(-600px) matches frame 0
  for (let k = -1; k < SET * 2; k++) {
    const b = BLOCKS[((k % SET) + SET) % SET];
    if (k < 0) {
      const x1 = CHAIN_X - PITCH + CARD_W;
      const y1 = b.y + CARD_H / 2;
      const x2 = CHAIN_X;
      const y2 = BLOCKS[0].y + CARD_H / 2;
      links.push(`<path d="M${x1} ${y1}C${x1 + 10} ${y1} ${x2 - 10} ${y2} ${x2} ${y2}" fill="none" stroke="${t.levels[2]}" stroke-width="1.2"/>`);
      continue;
    }
    const x = CHAIN_X + k * PITCH;
    cards.push(
      `<g><rect x="${x}" y="${b.y}" width="${CARD_W}" height="${CARD_H}" rx="6" fill="${t.bg}" stroke="${t.line}"/>
<text x="${x + 12}" y="${b.y + 23}" font-size="11" font-weight="500" fill="${t.fg}">${mono("mono500", b.n)}</text>
<text x="${x + 12}" y="${b.y + 39}" font-size="10" fill="${t.muted}">${mono("mono400", b.hash)}</text>
<text x="${x + 12}" y="${b.y + 53}" font-size="10" fill="${t.muted}">${mono("mono400", b.txs)}</text>
<rect x="${x + 12}" y="${b.y + 62}" width="80" height="4" rx="2" fill="${t.levels[1]}"/>
<rect x="${x + 12}" y="${b.y + 62}" width="${pct(80 * b.gas)}" height="4" rx="2" fill="${t.fg}"/></g>`,
    );
    if (k < SET * 2 - 1) {
      const nb = BLOCKS[(k + 1) % SET];
      const x1 = x + CARD_W;
      const y1 = b.y + CARD_H / 2;
      const x2 = x + PITCH;
      const y2 = nb.y + CARD_H / 2;
      links.push(`<path d="M${x1} ${y1}C${x1 + 10} ${y1} ${x2 - 10} ${y2} ${x2} ${y2}" fill="none" stroke="${t.levels[2]}" stroke-width="1.2"/>`);
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="t d">
<title id="t">hosein</title>
<desc id="d">Header: hosein, a web3 builder. The role line cycles between building payment rails for stablecoins, hunting bugs in DeFi protocols and explaining infra to humans. Block cards scroll past on a chain.</desc>
<style>
__FONTS__
${css}</style>
<defs>
<clipPath id="cc"><rect x="400" y="1" width="458.5" height="228"/></clipPath>
<linearGradient id="fl" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="${t.sunk}" stop-opacity="1"/><stop offset="1" stop-color="${t.sunk}" stop-opacity="0"/></linearGradient>
<linearGradient id="fr" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="${t.sunk}" stop-opacity="0"/><stop offset="1" stop-color="${t.sunk}" stop-opacity="1"/></linearGradient>
</defs>
${panel(t, W, H)}
<text x="${x0}" y="50" font-size="11" letter-spacing="1.6" fill="${t.faint}">${mono("mono400", "0x HOSEIN-UL · ONCHAIN SINCE 2021")}</text>
<text class="name" x="${x0 - 2}" y="108" font-size="46" font-weight="700" letter-spacing="-1.8" fill="${t.fg}">${esc(fs.t("sans700", "hosein"))}</text>
${roleBlocks}
<circle class="pulse" cx="36" cy="192" r="4" fill="${t.green}"/>
<circle cx="36" cy="192" r="4" fill="${t.green}"/>
<text x="50" y="196" font-size="11" letter-spacing="1.4" fill="${t.faint}">${mono("mono400", "FINALIZED · SHIPPING WEEKLY")}</text>
<g clip-path="url(#cc)"><g class="chain">
${links.join("\n")}
${cards.join("\n")}
</g></g>
<rect x="400" y="1" width="64" height="228" fill="url(#fl)"/>
<rect x="796" y="1" width="62.5" height="228" fill="url(#fr)"/>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="8" fill="none" stroke="${t.line}"/>
</svg>
`;
  return svg;
}

mkdirSync("assets", { recursive: true });
for (const name of ["light", "dark"]) {
  const fs = new FontSet("exact");
  let svg = build(THEMES[name], fs);
  svg = svg.replace("__FONTS__", await fs.css());
  writeFileSync(`assets/header-${name}.svg`, svg);
  console.log(`header-${name}.svg`, Math.round(svg.length / 1024) + " KB");
}
