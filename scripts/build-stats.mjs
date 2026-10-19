// Generates assets/stats-{light,dark}.svg from the GitHub GraphQL API.
//   node scripts/build-stats.mjs            live (needs GITHUB_TOKEN; STATS_TOKEN preferred if set)
//   node scripts/build-stats.mjs --demo     sample numbers, for local layout previews only
//   node scripts/build-stats.mjs --placeholder   dashes, committed until the Action's first run
// --out=DIR changes the output directory (default: assets).
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { THEMES, SANS, MONO, esc, fmt, langShade, gh } from "./lib/theme.mjs";

const arg = (k) => process.argv.includes(k);
const outDir = process.argv.find((a) => a.startsWith("--out="))?.slice(6) ?? "assets";
const { owner: LOGIN } = JSON.parse(readFileSync(new URL("./featured.json", import.meta.url)));

const QUERY = `
query($login: String!, $from: DateTime!) {
  user(login: $login) {
    year: contributionsCollection(from: $from) {
      totalCommitContributions
      restrictedContributionsCount
      totalPullRequestContributions
    }
    last: contributionsCollection {
      contributionCalendar { weeks { contributionDays { date contributionCount } } }
    }
    repositories(ownerAffiliations: OWNER, isFork: false, first: 100, privacy: PUBLIC) {
      totalCount
      nodes { languages(first: 8, orderBy: { field: SIZE, direction: DESC }) { edges { size node { name } } } }
    }
  }
}`;

function streaks(days) {
  const counts = days.map((d) => d.contributionCount);
  let longest = 0, run = 0;
  for (const c of counts) { run = c > 0 ? run + 1 : 0; longest = Math.max(longest, run); }
  let i = counts.length - 1;
  if (counts[i] === 0) i--; // today may simply not have happened yet
  let current = 0;
  while (i >= 0 && counts[i] > 0) { current++; i--; }
  return { current, longest };
}

async function live() {
  const token = process.env.STATS_TOKEN || process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN is not set");
  const from = `${new Date().getUTCFullYear()}-01-01T00:00:00Z`;
  const { data } = await gh("", { token, graphql: { query: QUERY, variables: { login: LOGIN, from } } });
  const u = data.user;
  const days = u.last.contributionCalendar.weeks.flatMap((w) => w.contributionDays);
  const bytes = {};
  for (const r of u.repositories.nodes) for (const e of r.languages.edges) bytes[e.node.name] = (bytes[e.node.name] ?? 0) + e.size;
  const langs = Object.entries(bytes).sort((a, b) => b[1] - a[1]);
  return {
    commits: u.year.totalCommitContributions + u.year.restrictedContributionsCount,
    prs: u.year.totalPullRequestContributions,
    repos: u.repositories.totalCount,
    ...streaks(days),
    langs,
  };
}

const demo = () => ({ commits: 412, prs: 38, repos: 41, current: 9, longest: 27, langs: [["TypeScript", 620], ["Solidity", 260], ["JavaScript", 90], ["Python", 30], ["Shell", 12]] });
const placeholder = () => ({ commits: null, prs: null, repos: null, current: null, longest: null, langs: [] });

function svg(s, themeName) {
  const t = THEMES[themeName];
  const W = 600, H = 196, PAD = 24;
  const v = (n) => (n == null ? "—" : fmt(n));
  const cols = [
    [v(s.commits), `COMMITS ${new Date().getUTCFullYear()}`],
    [v(s.prs), `PULL REQUESTS ${new Date().getUTCFullYear()}`],
    [v(s.repos), "PUBLIC REPOS"],
    [v(s.current), s.longest != null ? `DAY STREAK · BEST ${s.longest}` : "DAY STREAK"],
  ];
  const colW = (W - PAD * 2) / 4;
  const stats = cols
    .map(([n, label], i) => `<text class="v" x="${PAD + i * colW}" y="62">${esc(n)}</text><text class="l" x="${PAD + i * colW}" y="84">${esc(label)}</text>`)
    .join("\n  ");

  // Language bar: shares of the top 5, remainder folded into "Other".
  let bar = "", legend = "";
  const total = s.langs.reduce((a, [, b]) => a + b, 0);
  if (total) {
    const top = s.langs.slice(0, 5);
    const rest = total - top.reduce((a, [, b]) => a + b, 0);
    const parts = rest > 0 ? [...top, ["Other", rest]] : top;
    const barW = W - PAD * 2;
    let x = PAD, lx = PAD;
    parts.forEach(([name, b], i) => {
      const w = Math.max(2, (b / total) * barW);
      bar += `<rect x="${x.toFixed(1)}" y="118" width="${(w - 2).toFixed(1)}" height="6" rx="3" fill="${langShade(i, t)}"/>`;
      x += w;
      legend += `<circle cx="${lx + 4}" cy="150" r="4" fill="${langShade(i, t)}"/><text class="m" x="${lx + 14}" y="154">${esc(name)} ${Math.round((b / total) * 100)}%</text>`;
      lx += 14 + `${name} ${Math.round((b / total) * 100)}%`.length * 7 + 16;
    });
  } else {
    bar = `<rect x="${PAD}" y="118" width="${W - PAD * 2}" height="6" rx="3" fill="${t.line}"/>`;
    legend = `<text class="m" x="${PAD}" y="154">Languages appear after the first scheduled run.</text>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="GitHub stats">
  <title>GitHub stats</title>
  <style>
    .v { font: 700 30px ${SANS}; letter-spacing: -.8px; fill: ${t.ink}; }
    .l { font: 400 10px ${MONO}; letter-spacing: .8px; fill: ${t.muted}; }
    .m { font: 400 12px ${MONO}; fill: ${t.muted}; }
  </style>
  <rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="10" fill="${t.surface}" stroke="${t.line}"/>
  <rect x="${PAD}" y="24" width="18" height="3" rx="1.5" fill="${t.accent}"/>
  ${stats}
  <line x1="${PAD}" y1="102" x2="${W - PAD}" y2="102" stroke="${t.line}"/>
  ${bar}
  ${legend}
  <text class="l" x="${PAD}" y="${H - 14}">TOP LANGUAGES · PUBLIC REPOS</text>
</svg>
`;
}

const stats = arg("--demo") ? demo() : arg("--placeholder") ? placeholder() : await live();
mkdirSync(outDir, { recursive: true });
for (const th of ["light", "dark"]) writeFileSync(`${outDir}/stats-${th}.svg`, svg(stats, th));
console.log("stats written", arg("--demo") ? "(demo)" : arg("--placeholder") ? "(placeholder)" : "(live)");
