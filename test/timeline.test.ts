import { describe, expect, it } from "vitest";
import { timelineData } from "@/data/timeline";
import type { TimelineDescription } from "@/data/timeline";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const links = (description: TimelineDescription) =>
  description.filter((part) => typeof part !== "string");
const textOf = (description: TimelineDescription) =>
  description.map((part) => (typeof part === "string" ? part : part.content)).join("");

// The Unicode Roman numeral block: Ⅰ..Ⅻ are 1..12 (one glyph each, so Ⅸ is 9), then Ⅼ ⅭⅮⅯ.
const ROMAN: Record<string, number> = {
  ...Object.fromEntries(Array.from({ length: 12 }, (_, i) => [String.fromCodePoint(0x2160 + i), i + 1])),
  "Ⅼ": 50, "Ⅽ": 100, "Ⅾ": 500, "Ⅿ": 1000,
};
const romanValue = (text: string) => [...text].reduce((sum, ch) => sum + ROMAN[ch], 0);

const dated = timelineData.filter((entry) => entry.year !== null);
const open = timelineData.filter((entry) => entry.year === null);

describe("timeline data: shape", () => {
  it("has one page per year, in order, then a single open-ended page at the end", () => {
    expect(timelineData.length).toBeGreaterThan(5);
    expect(open).toHaveLength(1);
    expect(timelineData.at(-1)!.year).toBeNull();
    const years = dated.map((entry) => entry.year!);
    expect(years).toEqual([...years].sort((a, b) => a - b));
    expect(new Set(years).size).toBe(years.length);
  });

  it("gives every page a title and at least one item", () => {
    for (const entry of timelineData) {
      expect(entry.title.trim(), String(entry.year)).toBe(entry.title);
      expect(entry.title.length, String(entry.year)).toBeGreaterThan(0);
      expect(entry.items.length, entry.title).toBeGreaterThan(0);
    }
  });

  it("uses titles that are unique", () => {
    const titles = timelineData.map((entry) => entry.title);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it("writes each year as a Roman numeral of its last two digits", () => {
    for (const entry of dated) {
      expect(romanValue(entry.yearInRoman), String(entry.year)).toBe(entry.year! % 100);
    }
  });

  it("gives the open-ended page the twelve numerals of a clock face, in order", () => {
    expect([...open[0].yearInRoman]).toEqual(
      Array.from({ length: 12 }, (_, i) => String.fromCodePoint(0x2160 + i)),
    );
  });

  it("uses only the Roman numeral characters the clock can draw", () => {
    for (const entry of timelineData) {
      for (const ch of entry.yearInRoman) expect(ROMAN[ch], `${entry.title}: ${ch}`).toBeDefined();
    }
  });

  it("puts months in calendar order inside a year, and no month on the open-ended page", () => {
    for (const entry of dated) {
      const months = entry.items.map((item) => item.time);
      for (const month of months) expect(MONTHS, `${entry.year}: ${month}`).toContain(month);
      const indexes = months.map((m) => MONTHS.indexOf(m));
      expect(indexes, String(entry.year)).toEqual([...indexes].sort((a, b) => a - b));
    }
    expect(open[0].items.every((item) => item.time === "")).toBe(true);
  });

  it("has a non-empty sentence for every item", () => {
    for (const entry of timelineData) {
      for (const item of entry.items) {
        expect(textOf(item.description).trim().length, `${entry.title}`).toBeGreaterThan(0);
        for (const part of item.description) {
          if (typeof part === "string") expect(part.length).toBeGreaterThan(0);
        }
      }
    }
  });
});

describe("timeline data: sources", () => {
  // README and CLAUDE.md: every item should carry a source link, so the chronicle stays
  // verifiable. This one item has none today. It is listed here so a new gap cannot slip in
  // quietly; add the source to the data and delete the line (the test after this one
  // fails until you do).
  const KNOWN_WITHOUT_SOURCE = ["ChorderCon 2025 was held."];

  const dateditems = dated.flatMap((entry) => entry.items.map((item) => ({ entry, item })));

  it("gives every dated item a source link, apart from the known gap", () => {
    const missing = dateditems
      .filter(({ item }) => links(item.description).length === 0)
      .map(({ item }) => textOf(item.description));
    expect(missing).toEqual(KNOWN_WITHOUT_SOURCE);
  });

  it("keeps the known-gap list honest: those items still have no link", () => {
    for (const sentence of KNOWN_WITHOUT_SOURCE) {
      const found = dateditems.filter(({ item }) => textOf(item.description) === sentence);
      expect(found, sentence).toHaveLength(1);
      expect(links(found[0].item.description), sentence).toHaveLength(0);
    }
  });

  it("does not ask for a source on the open-ended last page", () => {
    expect(links(open[0].items[0].description)).toHaveLength(0);
  });

  const allLinks = timelineData.flatMap((entry) =>
    entry.items.flatMap((item) => links(item.description).map((link) => ({ entry, link }))),
  );

  it("has https links with readable text and no stray whitespace", () => {
    expect(allLinks.length).toBeGreaterThan(15);
    for (const { link } of allLinks) {
      if (typeof link === "string") continue;
      expect(link.type).toBe("url");
      expect(link.url, link.content).toBe(link.url.trim());
      expect(new URL(link.url).protocol, link.url).toBe("https:");
      expect(link.content.trim().length, link.url).toBeGreaterThan(0);
    }
  });
});
