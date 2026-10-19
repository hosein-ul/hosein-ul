// GitHub data access shared by the generators. Live mode uses the REST and GraphQL APIs;
// fixture mode reads a normalised JSON file so layouts can be built offline.
import { readFileSync, writeFileSync, mkdirSync, renameSync } from "node:fs";
import { dirname } from "node:path";

export const OWNER = "hosein-ul";

export function token() {
  return process.env.STATS_TOKEN || process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";
}

export async function rest(path, tok = token()) {
  const res = await fetch(`https://api.github.com/${path}`, {
    headers: {
      accept: "application/vnd.github+json",
      "x-github-api-version": "2022-11-28",
      "user-agent": "hosein-ul-profile",
      ...(tok ? { authorization: `Bearer ${tok}` } : {}),
    },
  });
  if (!res.ok) throw new Error(`GitHub REST ${path} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

export async function graphql(query, variables, tok = token()) {
  if (!tok) throw new Error("No token: set GITHUB_TOKEN (or STATS_TOKEN)");
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: { authorization: `Bearer ${tok}`, "content-type": "application/json", "user-agent": "hosein-ul-profile" },
    body: JSON.stringify({ query, variables }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.errors) throw new Error(`GitHub GraphQL failed: ${res.status} ${JSON.stringify(body.errors ?? body)}`);
  return body.data;
}

// Writes several files only after every one of them was produced, so a failed run never leaves
// a half-updated or empty asset behind.
export function writeAll(files) {
  for (const [path] of files) mkdirSync(dirname(path), { recursive: true });
  const tmp = files.map(([path, data]) => {
    const t = `${path}.tmp`;
    writeFileSync(t, data);
    return [t, path];
  });
  for (const [t, path] of tmp) renameSync(t, path);
}

export function argv(flag) {
  const i = process.argv.indexOf(flag);
  return i === -1 ? null : process.argv[i + 1];
}

export function run(main) {
  main().catch((err) => {
    console.error(`::error::${err.message}`);
    console.error(err.stack);
    process.exit(1);
  });
}

function streaks(days) {
  const byDate = new Map(days.map((d) => [d.date, d.count]));
  const all = [...byDate.keys()].sort();
  let longest = 0;
  let run = 0;
  for (const date of all) {
    run = byDate.get(date) > 0 ? run + 1 : 0;
    longest = Math.max(longest, run);
  }
  let i = all.length - 1;
  if (i >= 0 && byDate.get(all[i]) === 0) i--; // today may simply not have happened yet
  let current = 0;
  while (i >= 0 && byDate.get(all[i]) > 0) {
    current++;
    i--;
  }
  return { longest, current };
}

async function live(login) {
  const year = new Date().getUTCFullYear();
  const base = await graphql(
    `query($login:String!,$from:DateTime!){
      user(login:$login){
        createdAt
        pullRequests{totalCount}
        publicRepos: repositories(ownerAffiliations:OWNER, privacy:PUBLIC){totalCount}
        langRepos: repositories(ownerAffiliations:OWNER, isFork:false, privacy:PUBLIC, first:100){
          nodes{languages(first:10, orderBy:{field:SIZE, direction:DESC}){edges{size node{name}}}}
        }
        thisYear: contributionsCollection(from:$from){totalCommitContributions restrictedContributionsCount}
      }
    }`,
    { login, from: `${year}-01-01T00:00:00Z` },
  );
  const u = base.user;
  if (!u) throw new Error(`user ${login} not found`);

  const first = new Date(u.createdAt).getUTCFullYear();
  const aliases = [];
  for (let y = first; y <= year; y++) {
    const to = y === year ? "" : `, to:"${y}-12-31T23:59:59Z"`;
    aliases.push(`y${y}: contributionsCollection(from:"${y}-01-01T00:00:00Z"${to}){contributionCalendar{weeks{contributionDays{date contributionCount}}}}`);
  }
  const cal = await graphql(`query($login:String!){user(login:$login){${aliases.join("\n")}}}`, { login });
  const byDate = new Map();
  for (const v of Object.values(cal.user)) {
    for (const w of v.contributionCalendar.weeks) {
      for (const d of w.contributionDays) byDate.set(d.date, Math.max(byDate.get(d.date) ?? 0, d.contributionCount));
    }
  }
  const today = new Date().toISOString().slice(0, 10);
  const days = [...byDate]
    .filter(([date]) => date <= today) // the current-year calendar is padded with future days
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));

  const bytes = new Map();
  for (const r of u.langRepos.nodes) {
    for (const e of r.languages.edges) bytes.set(e.node.name, (bytes.get(e.node.name) ?? 0) + e.size);
  }
  const languages = [...bytes].sort((a, b) => b[1] - a[1]);

  const s = streaks(days);
  return {
    login,
    year,
    commits: u.thisYear.totalCommitContributions + u.thisYear.restrictedContributionsCount,
    prs: u.pullRequests.totalCount,
    repos: u.publicRepos.totalCount,
    longestStreak: s.longest,
    currentStreak: s.current,
    calendar: days.slice(-371),
    languages,
  };
}

export async function loadProfileData({ fixture, save } = {}) {
  let data;
  if (fixture) data = JSON.parse(readFileSync(fixture, "utf8"));
  else data = await live(OWNER);
  if (!data.calendar?.length || !Number.isFinite(data.commits)) throw new Error("profile data came back empty; refusing to overwrite assets");
  if (save && !fixture) {
    mkdirSync(dirname(save), { recursive: true });
    writeFileSync(save, JSON.stringify(data, null, 1) + "\n");
  }
  return data;
}
