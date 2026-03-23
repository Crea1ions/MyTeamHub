// Playwright config for responsive checks
module.exports = {
  testDir: 'playwright-tests',
  timeout: 30 * 1000,
  use: {
    headless: true,
    viewport: { width: 1280, height: 720 },
    actionTimeout: 10 * 1000,
    ignoreHTTPSErrors: true
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1280, height: 800 } } },
    { name: 'mobile-portrait', use: { viewport: { width: 390, height: 844 }, isMobile: true } },
    { name: 'mobile-landscape', use: { viewport: { width: 844, height: 390 }, isMobile: true } }
  ]
};
