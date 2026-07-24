// Checks every source link in the chronicle and reports the ones that rot.
//
// Run `yarn check:links`. Exits non-zero only when a link is genuinely gone,
// so a scheduled run staying green means something.
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

// Defaults to the chronicle; an explicit path makes the failure path testable.
const TIMELINE =
  process.argv[2] ??
  fileURLToPath(new URL("../src/data/timeline.ts", import.meta.url));
const TIMEOUT_MS = 20_000;
const RETRIES = 2;

// Some hosts serve bot-protection or rate limits to CI egress addresses. Those
// say nothing about whether the page still exists, so they warn rather than
// fail; only an explicit "gone" from the origin is treated as rot.
const GONE = new Set([404, 410]);

function extractUrls(source) {
  const urls = new Map();
  for (const match of source.matchAll(/url:\s*"([^"]+)"/g)) {
    const url = match[1];
    const line = source.slice(0, match.index).split("\n").length;
    if (!urls.has(url)) urls.set(url, line);
  }
  return [...urls].map(([url, line]) => ({ url, line }));
}

async function fetchStatus(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        // A bare fetch UA gets refused by several of the hosts we link to.
        "user-agent":
          "Mozilla/5.0 (compatible; CharaChronusLinkCheck/1.0; +https://github.com/andy23512/chara-chronus)",
        accept: "text/html,application/xhtml+xml,*/*",
      },
    });
    return { status: response.status };
  } finally {
    clearTimeout(timer);
  }
}

async function check({ url, line }) {
  let lastError;
  for (let attempt = 0; attempt <= RETRIES; attempt++) {
    try {
      const { status } = await fetchStatus(url);
      if (status >= 200 && status < 400)
        return { url, line, verdict: "ok", status };
      if (GONE.has(status)) return { url, line, verdict: "gone", status };
      // 401/403/429/5xx: retry once in case it is transient, then warn.
      lastError = `HTTP ${status}`;
    } catch (error) {
      lastError = error.name === "AbortError" ? "timeout" : error.message;
    }
    if (attempt < RETRIES)
      await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
  }
  return { url, line, verdict: "warn", status: lastError };
}

const relative = TIMELINE.replace(`${process.cwd()}/`, "");
const source = await readFile(TIMELINE, "utf8");
const links = extractUrls(source);
console.log(`Checking ${links.length} source links from ${relative}\n`);

const results = await Promise.all(links.map(check));
results.sort((a, b) => a.line - b.line);

const symbol = { ok: "OK  ", gone: "GONE", warn: "WARN" };
for (const r of results) {
  console.log(`${symbol[r.verdict]} ${String(r.status).padEnd(8)} ${r.url}`);
}

const gone = results.filter((r) => r.verdict === "gone");
const warned = results.filter((r) => r.verdict === "warn");

console.log(
  `\n${results.length - gone.length - warned.length} ok, ${warned.length} unverified, ${gone.length} gone`,
);

if (warned.length) {
  console.log(
    "\nUnverified links answered but not with a usable status. Usually bot\n" +
      "protection or a rate limit rather than rot; worth an eyeball, not a failure.",
  );
}

if (gone.length) {
  console.log("\nThese returned 404/410 and need a replacement source:");
  for (const r of gone) console.log(`  ${relative}:${r.line}  ${r.url}`);
  process.exit(1);
}
