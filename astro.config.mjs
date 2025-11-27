// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';        // NEW: sitemap integration
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // Needed so @astrojs/sitemap knows your canonical domain
  site: 'https://pichonia.com',

  // Register sitemap integration
  integrations: [sitemap()],

  // Keep existing Tailwind Vite plugin
  vite: {
    plugins: [tailwindcss()],
  },
});
