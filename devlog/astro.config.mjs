import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://looptrain.me',
  output: 'static',
  devToolbar: {
    enabled: false,
  },
  markdown: {
    shikiConfig: {
      theme: 'github-dark-dimmed',
    },
  },
});
