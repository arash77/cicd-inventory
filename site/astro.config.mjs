import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// Update `site` to your actual GitHub Pages URL after creating the repo.
export default defineConfig({
  site: 'https://arash77.github.io',
  base: '/cicd-inventory',
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
