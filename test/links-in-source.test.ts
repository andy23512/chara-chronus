// @vitest-environment node
import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { timelineData } from "@/data/timeline";

describe("timeline.ts as text", () => {
  it("spells every link as url: \"https://...\" in double quotes, as check-links.mjs expects", async () => {
    const source = await readFile(new URL("../src/data/timeline.ts", import.meta.url), "utf8");
    const written = [...source.matchAll(/url:\s*"([^"]+)"/g)].map((m) => m[1]);
    const inData = timelineData.flatMap((entry) =>
      entry.items.flatMap((item) =>
        item.description.flatMap((part) => (typeof part === "string" ? [] : [part.url])),
      ),
    );
    // the type declaration in the same file has `url: string`, which the pattern skips
    expect(written).toEqual(inData);
    expect(source).not.toMatch(/url:\s*'/);
    expect(source).not.toMatch(/url:\s*`/);
  });
});
