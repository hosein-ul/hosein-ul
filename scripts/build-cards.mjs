// Generates assets/cards/<repo>-{light,dark}.svg for the repos in featured.json.
// Live mode (GITHUB_TOKEN set): reads description, stars, languages, pushed date via the
// REST API and skips anything that is missing, private, or archived-away.
// Offline mode (--offline): uses the fallbacks in featured.json. No network.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { THEMES, SANS, MONO, esc, wrap, fmt, langShade, gh } from "./lib/theme.mjs";

const offline = process.argv.includes("--offline");
const outDir = process.argv.find((a) => a.startsWith("--out="))?.slice(6) ?? "assets/cards";
const cfg = JSON.parse(readFileSync(new URL("./featured.json", import.meta.url)));

const W = 600, H = 148;

async function load(r) {
  if (offline) return { name: r.name, description: r.blurb, stars: null, pushed: null, langs: r.languages.map((l) => [l, 1]) };
  let meta;
  try {
    meta = await gh(`/repos/${cfg.owner}/${r.name}`);
  } catch (e) {
    console.warn(`skip ${r.name}: ${e.message}`);
    return null;
  }
  if (meta.private || meta.visibility !== "public") {
    console.warn(`skip ${r.name}: not public`);
    return null;
  }
  let langs = [];
  try {
    langs = Object.entries(await gh(`/repos/${cfg.owner}/${r.name}/languages`)).sort((a, b) => b[1] - a[1]);
  } catch {}
  if (!langs.length) langs = r.languages.map((l) => [l, 1]);
  return { name: meta.name, description: meta.description || r.blurb, stars: meta.stargazers_count, pushed: meta.pushed_at, langs, url: meta.html_url };
}

function ago(iso) {
  if (!iso) return "";
  const d = (Date.now() - new Date(iso)) / 864e5;
  if (d < 1) return "updated today";
  if (d < 31) return `updated ${Math.floor(d)}d ago`;
  if (d < 365) return `updated ${Math.floor(d / 30)}mo ago`;
  return `updated ${Math.floor(d / 365)}y ago`;
}

function card(repo, themeName) {
  const t = THEMES[themeName];
  const lines = wrap(repo.description, 14, W - 96, 2);
  const total = repo.langs.reduce((s, [, b]) => s + b, 0);
  const top = repo.langs.slice(0, 3);
  let x = 24;
  const meta = top
    .map(([name], i) => {
      const s = `<circle cx="${x + 4}" cy="${H - 26}" r="4" fill="${langShade(i, t)}"/><text x="${x + 14}" y="${H - 22}" class="m">${esc(name)}</text>`;
      x += 14 + name.length * 7 + 16;
      return s;
    })
    .join("");
  const right = [repo.stars != null ? `★ ${fmt(repo.stars)}` : "", ago(repo.pushed)].filter(Boolean).join("   ·   ");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(repo.name)}: ${esc(repo.description)}">
  <title>${esc(repo.name)}</title>
  <style>
    .n { font: 600 20px ${SANS}; letter-spacing: -.3px; fill: ${t.ink}; }
    .d { font: 400 14px ${SANS}; fill: ${t.muted}; }
    .m { font: 400 12px ${MONO}; fill: ${t.muted}; }
  </style>
  <rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="10" fill="${t.surface}" stroke="${t.line}"/>
  <rect x="24" y="28" width="3" height="20" rx="1.5" fill="${t.accent}"/>
  <text class="n" x="36" y="45">${esc(repo.name)}</text>
  <text class="m" x="${W - 24}" y="43" text-anchor="end">${esc(right)}</text>
  ${lines.map((l, i) => `<text class="d" x="24" y="${76 + i * 20}">${esc(l)}</text>`).join("\n  ")}
  ${meta}
</svg>
`;
}

mkdirSync(outDir, { recursive: true });
let n = 0;
for (const r of cfg.repos) {
  const repo = await load(r);
  if (!repo) continue;
  for (const th of ["light", "dark"]) writeFileSync(`${outDir}/${r.name.toLowerCase()}-${th}.svg`, card(repo, th));
  n++;
}
console.log(`cards: ${n}/${cfg.repos.length} written${offline ? " (offline)" : ""}`);
