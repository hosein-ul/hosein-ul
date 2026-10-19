// Generates assets/card-<repo>-{light,dark}.svg for every entry in cards.json.
// Repo metadata and real language data come from the REST API (repos/{owner}/{repo} and .../languages).
//   node scripts/build-cards.mjs [--out DIR]
import { readFileSync } from "node:fs";
import { THEMES, THEME_NAMES, esc, panel, SANS_STACK, MONO_STACK } from "./lib/theme.mjs";
import { asciiFontSet, measure, MONO_ADV } from "./lib/fonts.mjs";
import { rest, writeAll, argv, run } from "./lib/github.mjs";

const W = 420;
const H = 150;
const PAD = 22;
const DESC_SIZE = 12.5;

const config = JSON.parse(readFileSync(new URL("../cards.json", import.meta.url), "utf8"));

// Greedy word wrap into at most two lines, using real glyph advances; ellipsis if it still overflows.
function wrap(text, maxW) {
  const lines = [""];
  for (const word of text.split(/\s+/)) {
    const cur = lines[lines.length - 1];
    const next = cur ? `${cur} ${word}` : word;
    if (measure("sans400", next, DESC_SIZE) <= maxW || !cur) lines[lines.length - 1] = next;
    else lines.push(word);
  }
  if (lines.length <= 2) return lines;
  let second = lines.slice(1).join(" ");
  while (second && measure("sans400", second + "…", DESC_SIZE) > maxW) second = second.slice(0, -1).trimEnd();
  console.warn(`::warning::description wrapped past two lines and was shortened: ${text}`);
  return [lines[0], second + "…"];
}

async function fetchCard(card) {
  const [meta, langs] = await Promise.all([
    rest(`repos/${config.owner}/${card.repo}`),
    rest(`repos/${config.owner}/${card.repo}/languages`),
  ]);
  if (meta.private) throw new Error(`${card.repo} is private; refusing to publish a card for it`);
  const ignore = new Set(config.ignoreLanguages);
  const ranked = Object.entries(langs)
    .filter(([name]) => !ignore.has(name))
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name);
  return {
    ...card,
    description: card.description || meta.description || "",
    languages: ranked.slice(0, 2),
    url: meta.html_url,
  };
}

async function build(c, t) {
  const fs = asciiFontSet("sans400", "mono400", "mono600");
  const lines = wrap(c.description, W - PAD * 2);

  const tagW = c.tag.length * 10 * MONO_ADV + 18;
  const tag = `<rect x="${(W - PAD - tagW + 0.5).toFixed(1)}" y="19.5" width="${tagW.toFixed(1)}" height="20" rx="10" fill="${t.bg}" stroke="${t.line}"/>
<text x="${(W - PAD - tagW / 2).toFixed(1)}" y="33" font-size="10" text-anchor="middle" fill="${t.muted}">${esc(c.tag)}</text>`;

  const desc = lines
    .map((l, i) => `<text class="d" x="${PAD}" y="${64 + i * 18}" font-size="${DESC_SIZE}" fill="${t.muted}">${esc(l)}</text>`)
    .join("\n");

  // Language swatches: filled = primary, half-filled = secondary, hollow ring = no compiled language.
  const R = 4.5;
  const cy = 126;
  let lx = PAD;
  let langs = "";
  const items = c.languages.length ? c.languages : [c.languageFallback].filter(Boolean);
  items.forEach((name, i) => {
    const cx = lx + R;
    if (!c.languages.length) langs += `<circle cx="${cx}" cy="${cy}" r="${R - 0.5}" fill="none" stroke="${t.faint}"/>`;
    else if (i === 0) langs += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="${t.fg}"/>`;
    else
      langs += `<circle cx="${cx}" cy="${cy}" r="${R - 0.5}" fill="none" stroke="${t.fg}"/><path d="M${cx} ${cy - R + 0.5}A${R - 0.5} ${R - 0.5} 0 0 0 ${cx} ${cy + R - 0.5}Z" fill="${t.fg}"/>`;
    langs += `<text x="${lx + 2 * R + 7}" y="${cy + 4}" font-size="11" fill="${t.muted}">${esc(name)}</text>`;
    lx += 2 * R + 7 + name.length * 11 * MONO_ADV + 18;
  });

  const label = (s) => esc(s);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="t d">
<title id="t">${esc(c.repo)}</title>
<desc id="d">${esc(`${c.repo}: ${c.description} ${items.join(", ")}. ${c.context}.`)}</desc>
<style>
${await fs.css()}
text{font-family:${MONO_STACK}}
.d{font-family:${SANS_STACK}}
</style>
${panel(t, W, H)}
<text x="${PAD}" y="35" font-size="14" font-weight="600" fill="${t.fg}">${label(c.repo)}</text>
${tag}
${desc}
<line x1="${PAD}" y1="104.5" x2="${W - PAD}" y2="104.5" stroke="${t.lineSoft}"/>
${langs}
<text x="${W - PAD}" y="${cy + 4}" font-size="10.5" text-anchor="end" fill="${t.faint}">${label(c.context)}</text>
</svg>
`;
}

run(async () => {
  const out = argv("--out") ?? "assets";
  const cards = await Promise.all(config.cards.map(fetchCard));
  const files = [];
  for (const c of cards) {
    for (const name of THEME_NAMES) files.push([`${out}/card-${c.repo}-${name}.svg`, await build(c, THEMES[name])]);
    console.log(`${c.repo}: ${c.languages.join(", ") || `(no language data, using "${c.languageFallback}")`}`);
  }
  writeAll(files);
  for (const [p, s] of files) console.log(p, Math.round(s.length / 1024) + " KB");
});
