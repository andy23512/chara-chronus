// @ts-check
import { defineConfig } from "astro/config";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  integrations: [
    react(),
    // `/og` only exists to be screenshotted into the social preview image.
    sitemap({ filter: (page) => !page.endsWith("/og/") }),
  ],

  vite: {
    plugins: [tailwindcss()],
  },

  site: "https://andy23512.github.io",

  base: "/chara-chronus",
});
