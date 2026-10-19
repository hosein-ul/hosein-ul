// Generates assets/stats-{light,dark}.svg from GitHub data.
//   node scripts/build-stats.mjs                       live (needs GITHUB_TOKEN, or STATS_TOKEN for private contributions)
//   node scripts/build-stats.mjs --fixture fixtures/sample.json
//   node scripts/build-stats.mjs --save-fixture fixtures/sample.json   live run that also stores the data
//   --out DIR   output directory (default: assets)
import { THEMES, THEME_NAMES, esc, fmt, panel, SANS_STACK, MONO_STACK } from "./lib/theme.mjs";
import { asciiFontSet, measure, MONO_ADV } from "./lib/fonts.mjs";
import { loadProfileData, writeAll, argv, run } from "./lib/github.mjs";

const W = 860;
const H = 200;
const PAD = 32;

// Largest-remainder rounding so the legend always sums to 100.
function percents(parts) {
  const total = parts.reduce((a, [, b]) => a + b, 0);
  const raw = parts.map(([, b]) => (b / total) * 100);
  const out = raw.map(Math.floor);
  let rest = 100 - out.reduce((a, b) => a + b, 0);
  raw
    .map((v, i) => [v - Math.floor(v), i])
    .sort((a, b) => b[0] - a[0])
    .forEach(([, i]) => {
      if (rest-- > 0) out[i]++;
    });
  return out;
}

async function build(d, t) {
  const fs = asciiFontSet("sans600", "mono400");
  const stat = [
    [fmt(d.commits), `COMMITS ${d.year}`],
    [fmt(d.prs), "PULL REQUESTS"],
    [fmt(d.repos), "PUBLIC REPOS"],
    [fmt(d.longestStreak), "LONGEST STREAK"],
  ];
  const colW = (W - PAD * 2) / 4;
  const cols = stat
    .map(([n, label], i) => {
      const x = PAD + i * colW + (i ? 20 : 0);
      const divider = i ? `<line x1="${PAD + i * colW}" y1="26" x2="${PAD + i * colW}" y2="92" stroke="${t.lineSoft}"/>` : "";
      const unit =
        i === 3
          ? `<text x="${(x + measure("sans600", n, 26) + 6).toFixed(1)}" y="62" font-size="11" fill="${t.faint}">days</text>`
          : "";
      return `${divider}<text class="num" x="${x}" y="62" font-size="26" font-weight="600" letter-spacing="-.6" fill="${t.fg}">${esc(n)}</text>${unit}<text x="${x}" y="84" font-size="10" letter-spacing="1.4" fill="${t.faint}">${esc(label)}</text>`;
    })
    .join("\n");

  // Language bar: top four languages, everything else folded into "Other".
  const total = d.languages.reduce((a, [, b]) => a + b, 0);
  let parts = d.languages.slice(0, 5);
  if (d.languages.length > 5) {
    const rest = total - d.languages.slice(0, 4).reduce((a, [, b]) => a + b, 0);
    parts = [...d.languages.slice(0, 4), ["Other", rest]];
  }
  const pc = percents(parts);
  const barW = W - PAD * 2;
  const gap = 2;
  const usable = barW - gap * (parts.length - 1);
  const sum = parts.reduce((a, [, b]) => a + b, 0);
  let x = PAD;
  let lx = PAD;
  let bar = "";
  let legend = "";
  parts.forEach(([name, b], i) => {
    const colour = t.levels[4 - i];
    const w = Math.max(6, (b / sum) * usable);
    const edge = i === 4 ? ` stroke="${t.line}"` : "";
    bar += `<rect x="${x.toFixed(1)}" y="142" width="${w.toFixed(1)}" height="8" rx="2" fill="${colour}"${edge}/>`;
    x += w + gap;
    const label = `${name} ${pc[i]}%`;
    legend += `<circle cx="${(lx + 3.5).toFixed(1)}" cy="174" r="3.5" fill="${colour}"${edge}/><text x="${(lx + 12).toFixed(1)}" y="178" font-size="11" fill="${t.muted}">${esc(label)}</text>`;
    lx += 12 + label.length * 11 * MONO_ADV + 22;
  });

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="t d">
<title id="t">GitHub stats</title>
<desc id="d">${esc(`${d.commits} commits in ${d.year}, ${d.prs} pull requests, ${d.repos} public repositories, longest streak ${d.longestStreak} days. Languages: ${parts.map(([n], i) => `${n} ${pc[i]}%`).join(", ")}.`)}</desc>
<style>
${await fs.css()}
text{font-family:${MONO_STACK}}
.num{font-family:${SANS_STACK};font-variant-numeric:tabular-nums;font-feature-settings:"tnum"}
</style>
${panel(t, W, H)}
${cols}
<line x1="${PAD}" y1="108.5" x2="${W - PAD}" y2="108.5" stroke="${t.line}"/>
<text x="${PAD}" y="130" font-size="10" letter-spacing="1.4" fill="${t.faint}">LANGUAGES · PUBLIC REPOS</text>
${bar}
${legend}
</svg>
`;
  // make sure every glyph we used is in the ascii subset
  return svg;
}

run(async () => {
  const out = argv("--out") ?? "assets";
  const data = await loadProfileData({ fixture: argv("--fixture"), save: argv("--save-fixture") });
  const files = [];
  for (const name of THEME_NAMES) files.push([`${out}/stats-${name}.svg`, await build(data, THEMES[name])]);
  writeAll(files);
  for (const [p, s] of files) console.log(p, Math.round(s.length / 1024) + " KB");
});
