// The chronicle itself. See README.md for how to add an entry; every item
// should carry a source link so the chronicle stays verifiable.

/** A run of text where some segments link out to a source. */
export type TimelineDescription = (
  string | { type: "url"; url: string; content: string }
)[];

export interface TimelineEntry {
  /** Abbreviated month, e.g. "Jun". Empty for the open-ended final page. */
  time: string;
  description: TimelineDescription;
}

export interface TimelineYearEntry {
  /** null marks the open-ended "to be continued" page. */
  year: number | null;
  yearInRoman: string;
  title: string;
  items: TimelineEntry[];
}

export const timelineData: TimelineYearEntry[] = [
  {
    year: 2019,
    yearInRoman: "ⅩⅨ",
    title: "CharaChorder One",
    items: [
      {
        time: "Jun",
        description: [
          {
            type: "url",
            url: "https://charachorder.com",
            content: "CharaChorder",
          },
          " was founded.",
        ],
      },
      { time: "Jun", description: ["CharaChorder One was introduced."] },
    ],
  },
  {
    year: 2021,
    yearInRoman: "ⅩⅩⅠ",
    title: "CharaChorder Lite",
    items: [
      {
        time: "Apr",
        description: [
          "Kickstarter campaign of ",
          {
            type: "url",
            url: "https://www.charachorder.com/products/charachorder-lite",
            content: "CharaChorder Lite",
          },
          " started.",
        ],
      },
    ],
  },
  {
    year: 2022,
    yearInRoman: "ⅩⅩⅡ",
    title: "CharaChorder X",
    items: [
      {
        time: "Nov",
        description: [
          "Kickstarter campaign of ",
          {
            type: "url",
            url: "https://www.charachorder.com/products/charachorder-x",
            content: "CharaChorder X",
          },
          " started.",
        ],
      },
    ],
  },
  {
    year: 2023,
    yearInRoman: "ⅩⅩⅢ",
    title: "Master Forge",
    items: [
      {
        time: "Nov",
        description: [
          {
            type: "url",
            url: "https://youtu.be/fux9gU3M25E",
            content: "ChorderCon 2023",
          },
          " was held.",
        ],
      },
      {
        time: "Nov",
        description: [
          {
            type: "url",
            url: "https://www.charachorder.com/collections/forge-collection/products/master-forge-1",
            content: "Master Forge",
          },
          " was revealed in ",
          {
            type: "url",
            url: "https://youtu.be/fux9gU3M25E?si=yfcLuXMcfKwJzLoq&t=1025",
            content: "ChorderCon 2023",
          },
          ".",
        ],
      },
    ],
  },
  {
    year: 2024,
    yearInRoman: "ⅩⅩⅣ",
    title: "CharaChorder Two",
    items: [
      {
        time: "Nov",
        description: [
          {
            type: "url",
            url: "https://youtu.be/yh5c10bW7z0",
            content: "ChorderCon 2024",
          },
          " was held.",
        ],
      },
      {
        time: "Nov",
        description: [
          {
            type: "url",
            url: "https://www.charachorder.com/products/cc2",
            content: "CharaChorder Two",
          },
          " was announced in ",
          {
            type: "url",
            url: "https://youtu.be/yh5c10bW7z0?t=223",
            content: "ChorderCon 2024",
          },
          ".",
        ],
      },
    ],
  },
  {
    year: 2025,
    yearInRoman: "ⅩⅩⅤ",
    title: "CCIO & CC2.1",
    // title: "CCIO & CC2.1 & CCU",
    items: [
      {
        time: "Aug",
        description: [
          "The beta of ",
          {
            type: "url",
            url: "https://adventure.charachorder.io/",
            content: "CCIO",
          },
          " started.",
        ],
      },
      { time: "Nov", description: ["ChorderCon 2025 was held."] },
      // { time: "Nov", description: ["CCU was revealed in ChorderCon 2025."] },
      {
        time: "Nov",
        description: [
          {
            type: "url",
            url: "https://www.charachorder.com/products/cc2",
            content: "CC2.1",
          },
          " was introduced.",
        ],
      },
    ],
  },
  {
    year: 2026,
    yearInRoman: "ⅩⅩⅥ",
    title: "Community Owned",
    items: [
      {
        time: "Apr",
        description: [
          {
            type: "url",
            url: "https://youtu.be/6kwy6dXkLqs",
            content: "CharaChorder became community owned.",
          },
        ],
      },
    ],
  },
  {
    year: null,
    yearInRoman: "ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩⅪⅫ",
    title: "To be continued...",
    items: [
      {
        time: "",
        description: [
          "until the whole world can type at the speed of thought...",
        ],
      },
    ],
  },
];
