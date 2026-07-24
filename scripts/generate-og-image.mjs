// Screenshots the /og page into public/image/og.png at exactly 1200x630.
//
// Run `yarn og` (which builds first). Requires a local Chrome; override the
// binary with CHROME_PATH if it lives somewhere unusual.
import { spawn } from "node:child_process";
import { access } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const PORT = 4399;
const OUTPUT = fileURLToPath(
  new URL("../public/image/og.png", import.meta.url),
);
const PROJECT_ROOT = fileURLToPath(new URL("..", import.meta.url));

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].filter(Boolean);

async function findChrome() {
  for (const candidate of CHROME_CANDIDATES) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // try the next one
    }
  }
  throw new Error(
    `No Chrome binary found. Tried:\n  ${CHROME_CANDIDATES.join("\n  ")}\nSet CHROME_PATH to override.`,
  );
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit", ...options });
    child.on("error", reject);
    child.on("exit", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`${command} exited with code ${code}`)),
    );
  });
}

async function waitForServer(url, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // not up yet
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Preview server did not become ready at ${url}`);
}

const chrome = await findChrome();

const preview = spawn("npx", ["astro", "preview", "--port", String(PORT)], {
  cwd: PROJECT_ROOT,
  stdio: "ignore",
});

try {
  const url = `http://localhost:${PORT}/chara-chronus/og/`;
  await waitForServer(url);
  await run(chrome, [
    "--headless",
    "--disable-gpu",
    "--hide-scrollbars",
    "--force-device-scale-factor=1",
    "--window-size=1200,630",
    "--virtual-time-budget=4000",
    `--screenshot=${OUTPUT}`,
    url,
  ]);
  console.log(`Wrote ${OUTPUT}`);
} finally {
  preview.kill();
}
