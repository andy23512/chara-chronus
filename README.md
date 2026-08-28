# CharaChronus

An unofficial chronicle for CharaChorder. It records the important events and products of CharaChorder company.

Live site: https://andy23512.github.io/chara-chronus/

## Development

This project uses [Yarn 4](https://yarnpkg.com/) (see `packageManager` in `package.json`).

```bash
yarn install
yarn dev
```

| Script         | What it does                                          |
| -------------- | ----------------------------------------------------- |
| `yarn dev`     | Start the dev server                                  |
| `yarn build`   | Build the static site into `dist/`                    |
| `yarn preview` | Serve the built site locally                          |
| `yarn check`   | Type-check the Astro and TypeScript sources           |
| `yarn check:links` | Verify every source link in the chronicle still resolves |
| `yarn og`      | Regenerate `public/image/og.png` (needs local Chrome) |

The site ships no client-side JavaScript — the React components are rendered to
static HTML at build time. Adding a `client:*` directive to a component would
change that, so prefer CSS-only solutions where possible.

## Adding a timeline entry

Timeline content lives in the `timelineData` array in
[`src/data/timeline.ts`](src/data/timeline.ts) — separate from the rendering in
`src/components/TimelinePages.tsx`, so adding an event only touches data. Each
year is one full-screen page:

```ts
{
  year: 2026,
  yearInRoman: "ⅯⅯⅩⅩⅥ",
  title: "Community Owned",
  items: [
    {
      time: "Apr",
      description: [
        "Something happened, see ",
        { type: "url", url: "https://example.com", content: "the source" },
        ".",
      ],
    },
  ],
}
```

Please include a source link for every entry — the value of an unofficial
chronicle rests on being verifiable. A scheduled workflow re-checks those links
weekly and fails if one starts returning 404, so a dead source surfaces without
anyone having to notice it.

Prefer a source that's fixed at the time of the event — a video, blog post, or
Kickstarter campaign — over a product page. Product pages get edited in place
as products change, so a link that was accurate when added can silently drift
to describe a later revision instead of the one the entry is about.

## Social preview image

`public/image/og.png` is a screenshot of the `/og` page, which reuses the real
`HeaderPage` component so the image cannot drift from the site. Regenerate it
with `yarn og` after changing the hero.

## Disclaimer

This site is not affiliated, associated, authorized, endorsed by, or in any way officially connected with CharaChorder. The official websites can be found at https://www.charachorder.com/.
