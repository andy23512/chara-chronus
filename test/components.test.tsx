import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import Clock from "@/components/Clock";
import HeaderPage from "@/components/HeaderPage";
import { TimelinePages } from "@/components/TimelinePages";
import { timelineData } from "@/data/timeline";
import { cn } from "@/lib/utils";

afterEach(cleanup);

const labelsOf = (root: Element) => [...root.querySelectorAll("text")].map((t) => t.textContent);

describe("Clock", () => {
  const twelve = Array.from({ length: 12 }, (_, i) => String(i + 1));

  it("is decoration: hidden from assistive technology and not focusable", () => {
    const { container } = render(<Clock idPrefix="a" labels={twelve} />);
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("aria-hidden")).toBe("true");
    expect(svg.getAttribute("focusable")).toBe("false");
    expect(svg.getAttribute("viewBox")).toBe("-205 -205 410 410");
  });

  it("draws every label twice, once in the light layer and once in the dark layer", () => {
    const { container } = render(<Clock idPrefix="a" labels={twelve} />);
    const layers = [...container.querySelectorAll("svg > g")];
    expect(layers).toHaveLength(2);
    expect(layers.map((g) => g.getAttribute("class"))).toEqual(["fill-gray-100", "fill-gray-500"]);
    for (const layer of layers) expect(labelsOf(layer)).toEqual(twelve);
  });

  it("turns each label by its share of a full circle, the last one ending at 360", () => {
    const { container } = render(<Clock idPrefix="a" labels={["x", "y", "z", "w"]} />);
    const turns = [...container.querySelector("svg > g")!.querySelectorAll("text")].map((t) =>
      t.getAttribute("transform"),
    );
    expect(turns).toEqual(["rotate(90 0 0)", "rotate(180 0 0)", "rotate(270 0 0)", "rotate(360 0 0)"]);
  });

  it("clips each layer with its own clip path, named from the prefix", () => {
    const { container } = render(<Clock idPrefix="y2025" labels={twelve} />);
    expect([...container.querySelectorAll("clipPath")].map((c) => c.id)).toEqual([
      "y2025-whiteClip",
      "y2025-blackClip",
    ]);
    expect([...container.querySelectorAll("svg > g")].map((g) => g.getAttribute("clip-path"))).toEqual([
      "url(#y2025-whiteClip)",
      "url(#y2025-blackClip)",
    ]);
  });

  it("draws clip shapes made of real numbers, the dark one filled by the even-odd rule", () => {
    const { container } = render(<Clock idPrefix="a" labels={twelve} />);
    const [white, black] = [...container.querySelectorAll("clipPath path")];
    for (const path of [white, black]) {
      const d = path.getAttribute("d")!;
      expect(d).not.toMatch(/NaN|undefined|Infinity/);
      expect(d.trim()).toMatch(/^M /);
      expect(d.trim()).toMatch(/Z$/);
    }
    expect(white.getAttribute("clip-rule")).toBeNull();
    expect(black.getAttribute("clip-rule")).toBe("evenodd");
    // the outer ring is the 205 radius, the inner ring 134 and 60
    expect(white.getAttribute("d")).toMatch(/A 205 205 0 1 1/);
    expect(black.getAttribute("d")).toMatch(/A 145 145 0 1 1/);
  });

  // The shapes below are pinned from the current drawing (a characterization test): the
  // arithmetic behind them is degree/radian conversion and four radii, easy to break and
  // hard to see. Numbers are compared one by one with a tiny tolerance, not as text.
  const tokens = (d: string) => d.trim().split(/\s+/);
  const expectPath = (actual: string, expected: string) => {
    const got = tokens(actual);
    const want = tokens(expected);
    expect(got).toHaveLength(want.length);
    want.forEach((token, i) => {
      if (Number.isNaN(Number(token))) expect(got[i]).toBe(token);
      else expect(Number(got[i])).toBeCloseTo(Number(token), 6);
    });
  };

  it("draws the two clip shapes with the radii 205, 145, 134 and 60", () => {
    const { container } = render(<Clock idPrefix="a" labels={twelve} />);
    const [white, black] = [...container.querySelectorAll("clipPath path")].map((p) => p.getAttribute("d")!);
    const inner =
      "M 119.81652640600127 60 A 134 134 0 1 1 119.81652640600127 -60 L 0 -60 A 56 60 0 1 0 0 60 Z";
    expectPath(
      white,
      "M 196.0229578391266 60 A 205 205 0 1 1 196.0229578391266 -60 L 132.00378782444085 -60 " +
        "A 145 145 0 1 0 132.00378782444085 60 Z " +
        inner,
    );
    expectPath(
      black,
      "M 196.0229578391266 60 L 132.00378782444085 60 A 145 145 0 1 1 132.00378782444085 -60 " +
        "L 196.0229578391266 -60 A 205 205 0 0 1 196.0229578391266 60 Z " +
        inner,
    );
  });

  it("sets each numeral 85 units above the centre, centred on itself", () => {
    const { container } = render(<Clock idPrefix="a" labels={["a", "b"]} />);
    const text = container.querySelector("text")!;
    expect(text.getAttribute("x")).toBe("0");
    expect(text.getAttribute("y")).toBe("-85");
    expect(text.getAttribute("text-anchor")).toBe("middle");
    expect(text.getAttribute("dominant-baseline")).toBe("middle");
    expect(text.getAttribute("font-size")).toBe("250");
    expect(text.getAttribute("font-weight")).toBe("bold");
  });

  it("merges a given class name with its own", () => {
    const { container } = render(<Clock className="opacity-20" idPrefix="a" labels={twelve} />);
    const classes = container.querySelector("svg")!.getAttribute("class")!.split(" ");
    expect(classes).toEqual(expect.arrayContaining(["opacity-20", "size-full", "select-none"]));
  });
});

describe("HeaderPage", () => {
  it("has the site name as the one h1, the three-part tagline, and the disclaimer", () => {
    const { container } = render(<HeaderPage />);
    expect(container.querySelectorAll("h1")).toHaveLength(1);
    expect(container.querySelector("h1")!.textContent).toBe("CharaChronus");
    expect([...container.querySelectorAll("h2 span")].map((s) => s.textContent)).toEqual([
      "Every Character,",
      "Every Chord,",
      "Every Milestone",
    ]);
    expect(container.textContent).toMatch(/not affiliated, associated, authorized, endorsed by/);
    expect(container.textContent).toMatch(/officially connected with CharaChorder/);
  });

  it("draws a clock of the twelve Roman numerals", () => {
    const { container } = render(<HeaderPage />);
    const layer = container.querySelector("svg > g")!;
    expect(labelsOf(layer)).toEqual(
      Array.from({ length: 12 }, (_, i) => String.fromCodePoint(0x2160 + i)),
    );
    expect(container.querySelector("clipPath")!.id).toBe("header-whiteClip");
  });
});

describe("TimelinePages", () => {
  const sections = (container: HTMLElement) => [...container.querySelectorAll("section")];

  it("renders one section per page, with the year as its id and \"future\" for the open-ended page", () => {
    const { container } = render(<TimelinePages />);
    expect(sections(container).map((s) => s.id)).toEqual(
      timelineData.map((e) => (e.year === null ? "future" : String(e.year))),
    );
  });

  it("names each section by its heading", () => {
    const { container } = render(<TimelinePages />);
    for (const section of sections(container)) {
      const heading = section.querySelector("h2")!;
      expect(section.getAttribute("aria-labelledby")).toBe(heading.id);
      expect(heading.id).toBe(`${section.id}-title`);
    }
  });

  it("puts the year in front of each dated title for screen readers only, never on the open page", () => {
    const { container } = render(<TimelinePages />);
    timelineData.forEach((entry, i) => {
      const heading = sections(container)[i].querySelector("h2")!;
      const hidden = heading.querySelector(".sr-only");
      if (entry.year === null) {
        expect(hidden).toBeNull();
        expect(heading.textContent).toBe(entry.title);
      } else {
        expect(hidden!.textContent).toBe(`${entry.year}: `);
        expect(heading.textContent).toBe(`${entry.year}: ${entry.title}`);
      }
    });
  });

  it("shows the big year beside the clock as decoration only, with nothing on the open page", () => {
    const { container } = render(<TimelinePages />);
    timelineData.forEach((entry, i) => {
      const big = sections(container)[i].querySelector('div[aria-hidden="true"]')!;
      expect(big.textContent).toBe(entry.year === null ? "" : String(entry.year));
    });
  });

  it("draws each clock with the year's numerals repeated round to twelve or more", () => {
    const { container } = render(<TimelinePages />);
    timelineData.forEach((entry, i) => {
      const layer = sections(container)[i].querySelector("svg > g")!;
      const labels = labelsOf(layer);
      expect(labels.length, entry.title).toBeGreaterThanOrEqual(12);
      expect(labels.join(""), entry.title).toBe(
        entry.yearInRoman.repeat(Math.ceil(12 / entry.yearInRoman.length)),
      );
    });
  });

  it("gives every clock clip path an id that no other element on the page shares", () => {
    const { container } = render(
      <>
        <HeaderPage />
        <TimelinePages />
      </>,
    );
    const ids = [...container.querySelectorAll("[id]")].map((el) => el.id);
    expect(ids.length).toBeGreaterThan(timelineData.length * 3);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("lists each item in order, with the month before a dash only when there is one", () => {
    const { container } = render(<TimelinePages />);
    timelineData.forEach((entry, i) => {
      const items = [...sections(container)[i].querySelectorAll("li")];
      expect(items).toHaveLength(entry.items.length);
      entry.items.forEach((item, j) => {
        const text = items[j].textContent!;
        const sentence = item.description.map((p) => (typeof p === "string" ? p : p.content)).join("");
        expect(text, entry.title).toBe(item.time ? `${item.time} - ${sentence}` : sentence);
      });
    });
    expect(container.querySelector("section#future li")!.textContent).not.toMatch(/ - /);
  });

  it("turns each link part into an anchor that opens a new tab, and leaves plain text as text", () => {
    const { container } = render(<TimelinePages />);
    const expected = timelineData.flatMap((e) =>
      e.items.flatMap((item) => item.description.flatMap((p) => (typeof p === "string" ? [] : [p]))),
    );
    const anchors = [...container.querySelectorAll("a")];
    expect(anchors.map((a) => [a.getAttribute("href"), a.textContent])).toEqual(
      expected.map((p) => [p.url, p.content]),
    );
    for (const a of anchors) {
      expect(a.target).toBe("_blank");
      expect(a.rel).toBe("noopener noreferrer");
    }
    // the sentence around a link is plain text, not a link
    const withLink = container.querySelector('section[id="2019"] li')!;
    expect(withLink.querySelectorAll("a")).toHaveLength(1);
    expect(withLink.textContent).toMatch(/was introduced at CodeLaunch 7\.$/);
  });

  it("renders an item with no link as text only", () => {
    const { container } = render(<TimelinePages />);
    const li = [...container.querySelectorAll("li")].find((el) =>
      el.textContent!.includes("ChorderCon 2025 was held."),
    )!;
    expect(li.querySelector("a")).toBeNull();
    expect(li.textContent).toBe("Nov - ChorderCon 2025 was held.");
  });
});

describe("cn", () => {
  it("joins class names, drops falsy ones, and lets a later Tailwind class win", () => {
    expect(cn("a", false, undefined, "b")).toBe("a b");
    expect(cn("p-2", "p-4")).toBe("p-4");
    expect(cn("text-sm", { hidden: true, flex: false })).toBe("text-sm hidden");
    expect(cn()).toBe("");
  });
});
