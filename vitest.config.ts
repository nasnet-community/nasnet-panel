import { defineConfig } from 'vitest/config';

/**
 * Root Vitest Configuration
 *
 * This provides shared configuration for all test files in the monorepo.
 * Individual projects can extend or override these settings in their own vitest.config.ts.
 *
 * Testing Trophy Architecture (per ADR-015):
 * - 20% Unit Tests
 * - 60% Integration Tests
 * - 15% E2E Tests
 * - 5% Static Analysis
 *
 * Coverage Gates:
 * - 80% line coverage
 * - 75% branch coverage
 */
export default defineConfig({
  test: {
    globals: true,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: [
      'node_modules/**',
      'dist/**',
      '**/*.d.ts',
      '**/coverage/**',
      'ConnectSetupOldRepo/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/types/**',
        '**/__mocks__/**',
        '**/__fixtures__/**',
        '**/test/**',
        'ConnectSetupOldRepo/**',
      ],
      // Coverage thresholds (warning mode initially per Story 1.6)
      thresholds: {
        lines: 80,
        branches: 75,
        functions: 75,
        statements: 80,
      },
    },
    // Reporter configuration
    reporters: ['default'],
    // Performance optimization
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    // Watch mode configuration
    watchExclude: ['node_modules/**', 'dist/**', 'ConnectSetupOldRepo/**'],
    // Test timeout
    testTimeout: 10000,
    hookTimeout: 10000,
  },
});
