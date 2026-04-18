// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://shelters-website.hvernon.workers.dev',
  output: 'static',
  build: {
    assets: 'assets',
  },
});
