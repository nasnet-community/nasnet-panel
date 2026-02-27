import { defineConfig, devices } from '@playwright/test';
import { nxE2EPreset } from '@nx/playwright/preset';
import { workspaceRoot } from '@nx/devkit';

/**
 * Playwright E2E Test Configuration
 *
 * Testing Strategy (per ADR-015):
 * - E2E tests focus on critical user journeys only (15% of test pyramid)
 * - Three-tier router testing: Mock → CHR Docker → Physical Hardware
 * - Retry strategy for network transient failures (3 retries)
 *
 * Run tests:
 * - npm run e2e              - Run all E2E tests (headless)
 * - npm run e2e:ui           - Run with Playwright UI
 * - npx playwright test --project=chromium  - Run specific browser
 */

// For CI, you may want to set BASE_URL to the deployed application.
const baseURL = process.env['BASE_URL'] || 'http://localhost:4200';

// CHR Docker Router URL for integration testing
const chrRouterURL = process.env['CHR_ROUTER_URL'] || 'http://localhost:8080';

export default defineConfig({
  ...nxE2EPreset(__filename, { testDir: './src' }),

  // Global test timeout
  timeout: 30000,

  // Expect timeout for assertions
  expect: {
    timeout: 5000,
  },

  // Retry strategy for flaky tests (per ADR-015)
  // 3 retries for network-related transient failures
  retries: process.env.CI ? 3 : 1,

  // Reporter configuration
  reporter:
    process.env.CI ?
      [
        ['github'],
        ['html', { open: 'never' }],
        ['json', { outputFile: 'test-results/results.json' }],
      ]
    : [['list'], ['html', { open: 'on-failure' }]],

  // Output directory for test artifacts
  outputDir: 'test-results',

  // Shared settings for all projects
  use: {
    baseURL,
    // Collect trace when retrying the failed test
    trace: 'on-first-retry',
    // Screenshot on failure
    screenshot: 'only-on-failure',
    // Video recording for debugging
    video: 'on-first-retry',
    // Action timeout
    actionTimeout: 10000,
    // Navigation timeout
    navigationTimeout: 15000,
  },

  // Run local dev server before starting tests
  webServer: {
    command: 'npx nx run @nas-net/connect:preview',
    url: 'http://localhost:4200',
    reuseExistingServer: !process.env.CI,
    cwd: workspaceRoot,
    timeout: 120000, // 2 minutes to start the server
  },

  projects: [
    // Desktop browsers
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // Mobile browsers (uncomment when needed)
    // {
    //   name: 'mobile-chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'mobile-safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    // CHR Docker integration tests (Tier 2 testing)
    // These tests run against a real RouterOS CHR Docker container
    {
      name: 'chr-integration',
      testMatch: '**/chr-*.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        // Override baseURL for CHR-specific tests if needed
        // baseURL: chrRouterURL,
      },
    },
  ],

  // Global setup/teardown
  // globalSetup: require.resolve('./src/global-setup.ts'),
  // globalTeardown: require.resolve('./src/global-teardown.ts'),
});
