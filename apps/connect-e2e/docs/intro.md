---
sidebar_position: 1
title: Introduction
---

# E2E Testing

End-to-end tests for NasNet using **Playwright**. These tests validate the full application stack across multiple browsers.

## Tech Stack

- **Playwright** for cross-browser testing (Chromium, Firefox, WebKit)
- **TypeScript** for type-safe test authoring

## Running Tests

```bash
# Run all E2E tests
npm run e2e

# Run with Playwright UI mode
npm run e2e:ui
```

## Project Structure

```
apps/connect-e2e/
├── src/               # Test source files
├── playwright.config.ts
└── tsconfig.json
```

## Writing Tests

Tests follow the Page Object Model pattern. Each page or component has a corresponding helper that encapsulates selectors and interactions.

```typescript
import { test, expect } from '@playwright/test';

test('should navigate to dashboard', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/NasNet/);
});
```
