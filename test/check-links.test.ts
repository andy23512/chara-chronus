// @vitest-environment node
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createServer, type IncomingMessage, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { timelineData } from "@/data/timeline";

const SCRIPT = fileURLToPath(new URL("../scripts/check-links.mjs", import.meta.url));

let server: Server;
let base: string;
let dir: string;
const hits = new Map<string, number>();
const seenHeaders: IncomingMessage["headers"][] = [];

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), "chronus-links-"));
  server = createServer((req, res) => {
    const path = new URL(req.url!, "http://x").pathname; // the query string only makes addresses distinct
    hits.set(path, (hits.get(path) ?? 0) + 1);
    seenHeaders.push(req.headers);
    const status = ({ "/ok": 200, "/gone": 404, "/removed": 410, "/forbidden": 403, "/broken": 500, "/notmodified": 304 } as Record<string, number>)[path];
    if (path === "/redirect") {
      res.writeHead(302, { location: "/ok" }).end();
    } else if (path === "/flaky") {
      // fails the first time, then works: the script's retry should absorb it
      res.writeHead(hits.get(path) === 1 ? 503 : 200).end();
    } else if (status) {
      res.writeHead(status).end();
    } else {
      res.writeHead(404).end();
    }
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
  await rm(dir, { recursive: true, force: true });
});

interface Run {
  code: number;
  out: string;
  err: string;
}

/** Writes a timeline file, runs the script on it from inside the temp dir, returns the outcome. */
async function check(name: string, source: string): Promise<Run> {
  await writeFile(join(dir, name), source);
  return new Promise((resolve) => {
    execFile(process.execPath, [SCRIPT, name], { cwd: dir }, (error, stdout, stderr) => {
      resolve({ code: error ? (error.code as number) : 0, out: stdout, err: stderr });
    });
  });
}

const entry = (path: string) => `{ type: "url", url: "${base}${path}", content: "x" },`;

describe("check-links.mjs", () => {
  it("passes when every link answers 2xx, and says how many it checked", async () => {
    const run = await check("ok.ts", `const d = [\n${entry("/ok")}\n${entry("/ok?b=1")}\n];`);
    expect(run.code).toBe(0);
    expect(run.out).toContain("Checking 2 source links from ok.ts");
    expect(run.out).toMatch(/2 ok, 0 unverified, 0 gone/);
    expect(run.out).toMatch(/OK\s+200\s+http/);
  });

  it("counts any 2xx or 3xx answer as fine, such as 304", async () => {
    const run = await check("notmodified.ts", entry("/notmodified"));
    expect(run.code).toBe(0);
    expect(run.out).toMatch(/OK\s+304/);
  });

  it("follows a redirect to the page behind it", async () => {
    const run = await check("redirect.ts", entry("/redirect"));
    expect(run.code).toBe(0);
    expect(run.out).toMatch(/OK\s+200/);
    expect(hits.get("/ok")).toBeGreaterThan(0);
  });

  it("fails on a 404 and names the file, the line and the link to replace", async () => {
    const run = await check("gone.ts", `// a\n// b\n${entry("/gone")}\n`);
    expect(run.code).toBe(1);
    expect(run.out).toMatch(/GONE\s+404\s+http/);
    expect(run.out).toMatch(/1 gone/);
    expect(run.out).toContain("These returned 404/410 and need a replacement source:");
    expect(run.out).toContain(`gone.ts:3  ${base}/gone`);
  });

  it("fails on a 410 too, without retrying a link that is gone", async () => {
    const before = hits.get("/removed") ?? 0;
    const run = await check("removed.ts", entry("/removed"));
    expect(run.code).toBe(1);
    expect(run.out).toMatch(/GONE\s+410/);
    expect((hits.get("/removed") ?? 0) - before).toBe(1);
  });

  it("only warns, and still passes, for a refusal or a server error (after retrying)", async () => {
    const run = await check("warn.ts", `${entry("/forbidden")}\n${entry("/broken")}\n${entry("/ok")}\n`);
    expect(run.code).toBe(0);
    expect(run.out).toMatch(/WARN\s+HTTP 403\s+http/);
    expect(run.out).toMatch(/WARN\s+HTTP 500\s+http/);
    expect(run.out).toMatch(/1 ok, 2 unverified, 0 gone/);
    expect(run.out).toContain("Unverified links answered but not with a usable status.");
    expect(run.out).not.toContain("These returned 404/410");
    // one try and two retries each
    expect(hits.get("/forbidden")).toBe(3);
    expect(hits.get("/broken")).toBe(3);
  }, 30_000);

  it("absorbs a failure that goes away on retry, after waiting two seconds first", async () => {
    const started = Date.now();
    const run = await check("flaky.ts", entry("/flaky"));
    expect(Date.now() - started).toBeGreaterThanOrEqual(1900);
    expect(run.code).toBe(0);
    expect(run.out).toMatch(/OK\s+200/);
    expect(run.out).toMatch(/1 ok, 0 unverified, 0 gone/);
    expect(hits.get("/flaky")).toBe(2);
  }, 15_000);

  it("fails when any one link is gone, even if the others are fine or only warn", async () => {
    const run = await check("mixed.ts", `${entry("/ok")}\n${entry("/gone")}\n${entry("/forbidden")}\n`);
    expect(run.code).toBe(1);
    expect(run.out).toMatch(/1 ok, 1 unverified, 1 gone/);
  }, 30_000);

  it("lists a link that appears twice once, at the line where it first appears", async () => {
    const run = await check("dupes.ts", `\n\n${entry("/gone")}\n${entry("/gone")}\n`);
    expect(run.out).toContain("Checking 1 source links");
    expect(run.out).toContain(`dupes.ts:3  ${base}/gone`);
    expect(run.out).not.toContain("dupes.ts:4");
  });

  it("prints the results in the order the links appear in the file", async () => {
    const run = await check("order.ts", `${entry("/ok?c=3")}\n${entry("/redirect")}\n${entry("/ok?a=1")}\n`);
    const order = [...run.out.matchAll(/^(?:OK|WARN|GONE)\s.*?(http:\S+)$/gm)].map((m) => m[1].replace(base, ""));
    expect(order).toEqual(["/ok?c=3", "/redirect", "/ok?a=1"]);
  });

  it("only reads url: \"...\" values, not other text that looks like a link", async () => {
    const run = await check(
      "text.ts",
      `// see ${base}/gone in a comment\nconst note = "${base}/gone";\ntype T = { url: string };\n${entry("/ok")}\n`,
    );
    expect(run.code).toBe(0);
    expect(run.out).toContain("Checking 1 source links");
  });

  it("reads only double-quoted, non-empty url values", async () => {
    const run = await check(
      "quotes.ts",
      `const a = { url: '${base}/gone' };\nconst b = { url: "" };\nconst c = { url: \`${base}/gone\` };\n`,
    );
    expect(run.code).toBe(0);
    expect(run.out).toContain("Checking 0 source links");
  });

  it("is happy with a file that has no links at all", async () => {
    const run = await check("none.ts", "export const timelineData = [];\n");
    expect(run.code).toBe(0);
    expect(run.out).toContain("Checking 0 source links");
    expect(run.out).toMatch(/0 ok, 0 unverified, 0 gone/);
  });

  it("introduces itself with a browser-like User-Agent, not the bare fetch one", async () => {
    seenHeaders.length = 0;
    await check("ua.ts", entry("/ok?ua=1"));
    const sent = seenHeaders.find((h) => (h.host ?? "").length > 0)!;
    expect(sent["user-agent"]).toMatch(/^Mozilla\/5\.0 \(compatible; CharaChronusLinkCheck\/1\.0; \+https:\/\/github\.com\/andy23512\/chara-chronus\)$/);
    expect(sent.accept).toBe("text/html,application/xhtml+xml,*/*");
  });

  it("stops with an error when the file cannot be read", async () => {
    const run = await new Promise<Run>((resolve) => {
      execFile(process.execPath, [SCRIPT, "missing.ts"], { cwd: dir }, (error, stdout, stderr) =>
        resolve({ code: error ? (error.code as number) : 0, out: stdout, err: stderr }),
      );
    });
    expect(run.code).not.toBe(0);
    expect(run.err).toMatch(/ENOENT/);
  });

  it("finds every link in the real chronicle, whatever the host, when the same file is pointed at the local server", async () => {
    // Same file, but each address swapped for a local one, so no network is needed. If a link
    // were written in a way the script's pattern misses, the count would come up short.
    const real = await readFile(new URL("../src/data/timeline.ts", import.meta.url), "utf8");
    let n = 0;
    const local = real.replace(/url:\s*"[^"]+"/g, () => `url: "${base}/ok?real=${n++}"`);
    const distinct = new Set(
      timelineData.flatMap((e) => e.items.flatMap((i) => i.description.flatMap((p) => (typeof p === "string" ? [] : [p.url])))),
    ).size;
    // every link in the data is also unique in the file, so the counts agree
    expect(n).toBeGreaterThanOrEqual(distinct);
    const run = await check("real.ts", local);
    expect(run.code).toBe(0);
    expect(run.out).toContain(`Checking ${n} source links`);
    expect(run.out).toMatch(new RegExp(`${n} ok, 0 unverified, 0 gone`));
  }, 30_000);
});
