const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 15000,
  expect: { timeout: 5000 },
  use: {
    baseURL: 'http://localhost:3030',
    viewport: { width: 390, height: 844 },
    locale: 'zh-CN',
    headless: true,
  },
  workers: 1,
});
