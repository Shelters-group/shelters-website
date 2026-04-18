// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://shelters.pages.dev',
  output: 'static',
  build: {
    assets: 'assets',
  },
});
