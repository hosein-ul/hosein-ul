// Shared palette + helpers for every generated SVG. Monochrome + one accent.
// No external fonts: system stacks only.

export const THEMES = {
  light: {
    ink: "#0d0d0f",
    muted: "#6b6b73",
    faint: "#d4d4da",
    line: "#e4e4e9",
    surface: "#ffffff",
    accent: "#3b5bdb",
  },
  dark: {
    ink: "#f2f2f5",
    muted: "#9a9aa4",
    faint: "#3a3a42",
    line: "#2a2a31",
    surface: "#0d1117",
    accent: "#8da2ff",
  },
};

export const SANS = `ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif`;
export const MONO = `ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace`;

export const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// Rough text width for the sans stack, good enough to wrap card copy.
export const textWidth = (s, size) => [...String(s)].length * size * 0.5;

export function wrap(text, size, maxWidth, maxLines) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (textWidth(next, size) <= maxWidth || !cur) cur = next;
    else {
      lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = kept[maxLines - 1].replace(/[\s.,;:]*$/, "") + "…";
    return kept;
  }
  return lines;
}

export const fmt = (n) => (n >= 10000 ? `${(n / 1000).toFixed(1)}k` : n.toLocaleString("en-US"));

// Language color is intentionally not GitHub's rainbow: first = accent, rest = greys.
export function langShade(i, t) {
  if (i === 0) return t.accent;
  const greys = t === THEMES.light ? ["#52525b", "#8e8e98", "#bcbcc4", "#dcdce1"] : ["#c4c4cc", "#8e8e98", "#5e5e68", "#404048"];
  return greys[Math.min(i - 1, greys.length - 1)];
}

export async function gh(path, { token = process.env.GITHUB_TOKEN, graphql } = {}) {
  const url = graphql ? "https://api.github.com/graphql" : `https://api.github.com${path}`;
  const res = await fetch(url, {
    method: graphql ? "POST" : "GET",
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "profile-readme-builder",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(graphql ? { "Content-Type": "application/json" } : {}),
    },
    body: graphql ? JSON.stringify(graphql) : undefined,
  });
  if (!res.ok) {
    const err = new Error(`${res.status} ${res.statusText} for ${graphql ? "graphql" : path}`);
    err.status = res.status;
    throw err;
  }
  const json = await res.json();
  if (json.errors) throw new Error(`GraphQL: ${JSON.stringify(json.errors)}`);
  return json;
}
