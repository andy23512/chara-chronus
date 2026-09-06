# CLAUDE.md

## What this is

CharaChronus — an unofficial, community-maintained chronicle of CharaChorder
company events/products, rendered as a static timeline site. Not affiliated
with CharaChorder. Live at https://andy23512.github.io/chara-chronus/.

## Stack

Astro 5 (static output) + React 19 (for a few components) + Tailwind CSS 4 +
TypeScript (strict, via `astro/tsconfigs/strict`). Package manager is Yarn 4
(`packageManager` pinned in `package.json`; Yarn Berry config in `.yarnrc.yml`
/ `.yarn/`).

## Commands

```bash
yarn install
yarn dev          # start dev server (astro dev)
yarn build        # build static site into dist/
yarn preview       # serve the built site locally
yarn check         # type-check Astro + TS sources (astro check)
yarn check:links   # verify every source link in timeline.ts still resolves
yarn og            # rebuild build, then regenerate public/image/og.png (needs local Chrome)
```

There is no separate lint script and no test suite beyond `yarn check` /
`yarn check:links`.

## Architecture / layout

- `src/data/timeline.ts` — the actual content: a `timelineData` array, one
  entry per year, each with `items` (time + description, where description is
  an array of strings and `{ type: "url", url, content }` link objects).
  Adding an event should only touch this file.
- `src/components/TimelinePages.tsx` — renders `timelineData` into one
  full-screen page per year.
- `src/components/HeaderPage.tsx`, `src/components/Clock.tsx` — other page
  components.
- `src/layouts/Layout.astro`, `src/pages/index.astro` — main site shell/page.
- `src/pages/og.astro` — a page that exists only to be screenshotted for the
  social preview image (reuses `HeaderPage`); excluded from the sitemap in
  `astro.config.mjs`.
- `src/lib/utils.ts` — shared utilities (shadcn-style `cn` helper).
- `components.json` — shadcn/ui config (New York style, gray base, `@/*` →
  `src/*` aliases; components would land in `src/components/ui`).
- `scripts/check-links.mjs` — Node-stdlib-only script that checks every source
  link in the timeline; run weekly by `.github/workflows/check-links.yml`.
- `scripts/generate-og-image.mjs` — screenshots `/og` into
  `public/image/og.png`; requires a local Chrome install.

## Conventions / gotchas

- **No client-side JavaScript ships.** React components are rendered to
  static HTML at build time. Adding a `client:*` hydration directive changes
  this — prefer CSS-only solutions instead.
- Every timeline entry must include a source link (`{ type: "url", ... }`) —
  the chronicle's credibility depends on being verifiable. The link-check
  workflow fails CI-style if a source starts 404ing, so broken links surface
  without manual checking.
- `astro.config.mjs` sets `base: "/chara-chronus"` and
  `site: "https://andy23512.github.io"` (GitHub Pages project site) — keep
  this in mind when constructing internal links/assets.
- CI (`.github/workflows/deploy.yml`) explicitly runs `corepack enable`
  before `withastro/action`, because that action's runner otherwise keeps a
  global Yarn 1.x that ignores the `packageManager` pin.
- Regenerate `public/image/og.png` with `yarn og` after changing the hero /
  `HeaderPage`, so the social preview doesn't drift from the real site.
