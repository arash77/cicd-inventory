import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// SITE_URL and BASE_PATH are injected by CI and derived from the repo context.
// Override via repository variables (vars.PAGES_SITE_URL / vars.PAGES_BASE_PATH) for custom domains.
// Falls back to localhost for local development.
export default defineConfig({
  site: process.env.SITE_URL ?? 'http://localhost:4321',
  base: process.env.BASE_PATH ?? '/',
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
