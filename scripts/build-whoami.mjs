// Static art: assets/whoami-{light,dark}.svg  (run locally: node scripts/build-whoami.mjs)
// A terminal panel that types `whoami` and prints the answer line by line, looping every 14 s.
import { writeFileSync, mkdirSync } from "node:fs";
import { THEMES, esc, panel, MONO_STACK } from "./lib/theme.mjs";
import { FontSet, MONO_ADV } from "./lib/fonts.mjs";

const W = 860;
const H = 230;
const LOOP = 14; // seconds
const FS = 13;
const CW = FS * MONO_ADV; // 7.8
const p = (sec) => Math.round((sec / LOOP) * 10000) / 100;

const ROWS = [
  ["name", "Hosein"],
  ["role", "web3 builder · security researcher · writer"],
  ["focus", "stablecoin payments, private finance (FHE), AI agents that pay onchain"],
  ["now", "shipping plinth, a non-custodial USDC gateway"],
  ["audits", "independent bug bounty on web3 / DeFi, disclosed responsibly"],
];

const X = 28;
const VAL_X = +(X + 9 * CW).toFixed(1);
const CMD_X = +(X + 4 * CW).toFixed(1);
const Y0 = 66;
const LH = 24;

function build(t, fs) {
  const m = (s) => esc(fs.t("mono400", s));
  const cmd = "whoami";
  const typeFrom = 0.4;
  const typeTo = 1.1;
  const times = [1.3, 1.8, 2.3, 2.8, 3.3]; // each row appears 0.5 s after the previous
  const promptAt = 3.9;
  const fadeIn = 0.4;
  const holdUntil = 12.8;
  const fadeOutTo = 13.6;

  const rowCss = [...times, promptAt]
    .map((s, i) => `@keyframes wl${i}{0%{opacity:0;transform:translateX(-4px)}${p(s)}%{opacity:0;transform:translateX(-4px)}${p(s + fadeIn)}%{opacity:1;transform:none}100%{opacity:1;transform:none}}
.wl${i}{animation:wl${i} ${LOOP}s linear infinite}`)
    .join("\n");

  const full = +(cmd.length * CW).toFixed(1);
  const css = `
text{font-family:${MONO_STACK};font-size:${FS}px}
.cur{opacity:0}
.cover{transform:translateX(${full}px)}
.blink{opacity:1}
@media (prefers-reduced-motion:no-preference){
.all{animation:all ${LOOP}s linear infinite}
@keyframes all{0%{opacity:1}${p(holdUntil)}%{opacity:1}${p(fadeOutTo)}%{opacity:0}100%{opacity:0}}
.cover{animation:cover ${LOOP}s linear infinite}
@keyframes cover{0%{transform:translateX(0)}${p(typeFrom)}%{transform:translateX(0);animation-timing-function:steps(${cmd.length},end)}${p(typeTo)}%{transform:translateX(${full}px)}100%{transform:translateX(${full}px)}}
.cur{animation:cur ${LOOP}s linear infinite}
@keyframes cur{0%{opacity:1;transform:translateX(0)}${p(typeFrom)}%{opacity:1;transform:translateX(0);animation-timing-function:steps(${cmd.length},end)}${p(typeTo)}%{opacity:1;transform:translateX(${full}px)}${p(typeTo + 0.3)}%{opacity:0;transform:translateX(${full}px)}100%{opacity:0;transform:translateX(${full}px)}}
.blink{animation:blink 1.06s steps(1,end) infinite}
@keyframes blink{50%{opacity:0}}
${rowCss}
}
`;

  const rows = ROWS.map(([k, v], i) => {
    const y = Y0 + LH * (i + 1);
    return `<g class="wl${i}"><text x="${X}" y="${y}" fill="${t.muted}">${m(k)}</text><text x="${VAL_X}" y="${y}" fill="${t.fg}">${m(v)}</text></g>`;
  }).join("\n");

  const yEnd = Y0 + LH * (ROWS.length + 1);
  fs.t("mono400", "~ $ ");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="t d">
<title id="t">whoami</title>
<desc id="d">Terminal output. name: Hosein. role: web3 builder, security researcher, writer. focus: stablecoin payments, private finance (FHE), AI agents that pay onchain. now: shipping plinth, a non-custodial USDC gateway. audits: independent bug bounty on web3 and DeFi, disclosed responsibly.</desc>
<style>
__FONTS__
${css}</style>
${panel(t, W, H)}
<line x1="1" y1="36.5" x2="${W - 1}" y2="36.5" stroke="${t.line}"/>
<circle cx="22" cy="18.5" r="4.5" fill="${t.levels[1]}"/><circle cx="38" cy="18.5" r="4.5" fill="${t.levels[1]}"/><circle cx="54" cy="18.5" r="4.5" fill="${t.levels[1]}"/>
<text x="${W / 2}" y="22.5" text-anchor="middle" font-size="11" letter-spacing="0.6" fill="${t.faint}">${m("hosein-ul · zsh")}</text>
<g class="all">
<text x="${X}" y="${Y0}" fill="${t.faint}">~ $ </text>
<text x="${CMD_X}" y="${Y0}" fill="${t.fg}">${m(cmd)}</text>
<rect class="cover" x="${CMD_X}" y="${Y0 - 15}" width="${(full + 8).toFixed(1)}" height="22" fill="${t.sunk}"/>
<rect class="cur" x="${CMD_X}" y="${Y0 - 12}" width="${CW.toFixed(1)}" height="16" fill="${t.fg}" fill-opacity=".85"/>
${rows}
<g class="wl5"><text x="${X}" y="${yEnd}" fill="${t.faint}">~ $</text><rect class="blink" x="${CMD_X}" y="${yEnd - 12}" width="${CW.toFixed(1)}" height="16" fill="${t.fg}" fill-opacity=".85"/></g>
</g>
</svg>
`;
}

mkdirSync("assets", { recursive: true });
for (const name of ["light", "dark"]) {
  const fs = new FontSet("exact");
  let svg = build(THEMES[name], fs);
  svg = svg.replace("__FONTS__", await fs.css());
  writeFileSync(`assets/whoami-${name}.svg`, svg);
  console.log(`whoami-${name}.svg`, Math.round(svg.length / 1024) + " KB");
}
