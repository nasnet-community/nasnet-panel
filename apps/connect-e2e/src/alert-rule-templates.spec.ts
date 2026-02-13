/**
 * Alert Rule Templates E2E Tests
 * NAS-18.12: Alert Rule Templates Feature
 *
 * End-to-end tests for alert rule template functionality using Playwright.
 * Tests the complete user flow from browsing templates to creating alert rules.
 */

import { test, expect, Page } from '@playwright/test';

// =============================================================================
// Test Helpers
// =============================================================================

/**
 * Navigate to alert rule templates page
 */
async function navigateToTemplates(page: Page) {
  await page.goto('/alerts/templates');
  await expect(page.getByRole('heading', { name: /alert.*templates/i })).toBeVisible();
}

/**
 * Select a template card by name
 */
async function selectTemplate(page: Page, templateName: string) {
  const templateCard = page.getByRole('article').filter({ hasText: templateName });
  await expect(templateCard).toBeVisible();
  await templateCard.click();
}

/**
 * Fill in template variables form
 */
async function fillTemplateVariables(
  page: Page,
  variables: Record<string, string | number>
) {
  for (const [name, value] of Object.entries(variables)) {
    const input = page.getByLabel(new RegExp(name, 'i'));
    await input.clear();
    await input.fill(String(value));
  }
}

/**
 * Submit the template application form
 */
async function applyTemplate(page: Page, ruleName: string, ruleDescription?: string) {
  // Fill in rule name
  await page.getByLabel(/rule.*name/i).fill(ruleName);

  // Fill in description if provided
  if (ruleDescription) {
    await page.getByLabel(/description/i).fill(ruleDescription);
  }

  // Submit form
  await page.getByRole('button', { name: /apply.*template|create.*rule/i }).click();
}

/**
 * Wait for success toast notification
 */
async function waitForSuccess(page: Page) {
  await expect(page.getByText(/success|created/i)).toBeVisible({ timeout: 5000 });
}

// =============================================================================
// Test Case 1: Browse Templates and Filter by Category
// =============================================================================

test.describe('Browse Alert Rule Templates', () => {
  test('should display all template categories', async ({ page }) => {
    await navigateToTemplates(page);

    // Verify category tabs/filters are visible
    const categories = ['NETWORK', 'SECURITY', 'RESOURCES', 'VPN', 'DHCP', 'SYSTEM'];

    for (const category of categories) {
      await expect(page.getByRole('tab', { name: new RegExp(category, 'i') })).toBeVisible();
    }
  });

  test('should filter templates by category', async ({ page }) => {
    await navigateToTemplates(page);

    // Click on NETWORK category
    await page.getByRole('tab', { name: /network/i }).click();

    // Wait for templates to load
    await page.waitForTimeout(500);

    // Verify at least one network template is visible
    await expect(
      page.getByRole('article').filter({ hasText: /device.*offline|interface.*down/i })
    ).toBeVisible();

    // Click on SECURITY category
    await page.getByRole('tab', { name: /security/i }).click();
    await page.waitForTimeout(500);

    // Verify security templates are visible
    await expect(
      page.getByRole('article').filter({ hasText: /firewall|attack|bandwidth/i })
    ).toBeVisible();
  });

  test('should show template details on selection', async ({ page }) => {
    await navigateToTemplates(page);

    // Select "Device Offline" template
    await selectTemplate(page, 'Device Offline');

    // Verify template details are displayed
    await expect(page.getByText(/alert when.*device.*offline/i)).toBeVisible();
    await expect(page.getByText(/severity.*critical/i)).toBeVisible();

    // Verify variables section is visible
    await expect(page.getByRole('heading', { name: /variables|configuration/i })).toBeVisible();
  });
});

// =============================================================================
// Test Case 2: Create Alert Rule from Template with Custom Variables
// =============================================================================

test.describe('Apply Template - Create Alert Rule', () => {
  test('should create alert rule from Device Offline template', async ({ page }) => {
    await navigateToTemplates(page);

    // Select Device Offline template
    await selectTemplate(page, 'Device Offline');

    // Fill in variables
    await fillTemplateVariables(page, {
      OFFLINE_DURATION: 120, // 120 seconds
    });

    // Preview should show updated values
    const preview = page.getByTestId('template-preview');
    if (await preview.isVisible()) {
      await expect(preview).toContainText('120');
    }

    // Apply template with custom rule details
    await applyTemplate(page, 'Production Router Offline', 'Alert for production router downtime');

    // Wait for success notification
    await waitForSuccess(page);

    // Verify redirect to alert rules page
    await expect(page).toHaveURL(/\/alerts\/rules/);

    // Verify new rule appears in the list
    await expect(page.getByText('Production Router Offline')).toBeVisible();
  });

  test('should validate required variables', async ({ page }) => {
    await navigateToTemplates(page);

    // Select a template with required variables
    await selectTemplate(page, 'High CPU Usage');

    // Try to apply without filling required variables
    const applyButton = page.getByRole('button', { name: /apply.*template|create.*rule/i });
    await applyButton.click();

    // Should show validation error
    await expect(page.getByText(/required|must.*provide|missing/i)).toBeVisible();

    // Fill in required variable
    await fillTemplateVariables(page, {
      CPU_THRESHOLD: 85,
    });

    // Error should disappear
    await expect(page.getByText(/required|must.*provide|missing/i)).not.toBeVisible();
  });

  test('should enforce variable min/max constraints', async ({ page }) => {
    await navigateToTemplates(page);

    // Select template
    await selectTemplate(page, 'Device Offline');

    // Try to set value below minimum
    await fillTemplateVariables(page, {
      OFFLINE_DURATION: 10, // Below min (30)
    });

    // Should show validation error
    await expect(page.getByText(/minimum.*30|must be at least 30/i)).toBeVisible();

    // Try to set value above maximum
    await fillTemplateVariables(page, {
      OFFLINE_DURATION: 5000, // Above max (3600)
    });

    // Should show validation error
    await expect(page.getByText(/maximum.*3600|must be at most 3600/i)).toBeVisible();

    // Set valid value
    await fillTemplateVariables(page, {
      OFFLINE_DURATION: 300, // Valid
    });

    // Error should disappear
    await expect(
      page.getByText(/minimum|maximum|must be at least|must be at most/i)
    ).not.toBeVisible();
  });
});

// =============================================================================
// Test Case 3: Save Custom Template and Reuse
// =============================================================================

test.describe('Save Custom Template', () => {
  test('should save custom template from existing rule', async ({ page }) => {
    await navigateToTemplates(page);

    // Apply a template first
    await selectTemplate(page, 'Device Offline');
    await fillTemplateVariables(page, { OFFLINE_DURATION: 180 });
    await applyTemplate(page, 'Custom Offline Alert');
    await waitForSuccess(page);

    // Navigate to alert rules
    await page.goto('/alerts/rules');
    await expect(page.getByText('Custom Offline Alert')).toBeVisible();

    // Find the rule and save as template
    await page.getByText('Custom Offline Alert').click();
    await page.getByRole('button', { name: /save.*template/i }).click();

    // Fill in template details
    await page.getByLabel(/template.*name/i).fill('My Custom Offline Template');
    await page.getByLabel(/description/i).fill('Custom template with 180s threshold');

    // Submit
    await page.getByRole('button', { name: /save/i }).click();
    await waitForSuccess(page);

    // Navigate back to templates
    await navigateToTemplates(page);

    // Click on CUSTOM category
    await page.getByRole('tab', { name: /custom/i }).click();

    // Verify custom template appears
    await expect(page.getByText('My Custom Offline Template')).toBeVisible();
  });

  test('should reuse saved custom template', async ({ page }) => {
    // Prerequisite: Custom template was saved in previous test
    await navigateToTemplates(page);

    // Go to CUSTOM category
    await page.getByRole('tab', { name: /custom/i }).click();

    // Select custom template
    await selectTemplate(page, 'My Custom Offline Template');

    // Verify it has the saved configuration
    await expect(page.getByDisplayValue('180')).toBeVisible();

    // Apply the custom template
    await applyTemplate(page, 'Reused Custom Alert');
    await waitForSuccess(page);
  });
});

// =============================================================================
// Test Case 4: Export and Import Template
// =============================================================================

test.describe('Import/Export Templates', () => {
  test('should export template as JSON', async ({ page, context }) => {
    await navigateToTemplates(page);

    // Select a template
    await selectTemplate(page, 'Device Offline');

    // Setup download listener
    const downloadPromise = page.waitForEvent('download');

    // Click export button
    await page.getByRole('button', { name: /export/i }).click();

    // Wait for download
    const download = await downloadPromise;

    // Verify download filename
    expect(download.suggestedFilename()).toMatch(/device-offline.*\.json/i);

    // Verify JSON content is valid
    const path = await download.path();
    if (path) {
      const fs = require('fs');
      const content = fs.readFileSync(path, 'utf-8');
      const json = JSON.parse(content);

      expect(json.id).toBe('device-offline');
      expect(json.name).toBeTruthy();
      expect(json.eventType).toBeTruthy();
    }
  });

  test('should import template from JSON file', async ({ page }) => {
    await navigateToTemplates(page);

    // Click import button
    await page.getByRole('button', { name: /import/i }).click();

    // Wait for file input or dialog
    const fileInput = page.getByLabel(/select.*file|choose.*file/i);

    // Create a test JSON file
    const testTemplate = {
      id: 'imported-test-template',
      name: 'Imported Test Template',
      description: 'A template imported for testing',
      category: 'CUSTOM',
      eventType: 'test.event',
      severity: 'INFO',
      conditions: [
        {
          field: 'status',
          operator: 'EQUALS',
          value: 'test',
        },
      ],
      channels: ['email'],
      variables: [],
      version: '1.0.0',
    };

    // Upload the file
    await fileInput.setInputFiles({
      name: 'test-template.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(testTemplate)),
    });

    // Submit import
    await page.getByRole('button', { name: /import|upload/i }).click();
    await waitForSuccess(page);

    // Verify template was imported
    await page.getByRole('tab', { name: /custom/i }).click();
    await expect(page.getByText('Imported Test Template')).toBeVisible();
  });

  test('should show error for invalid JSON import', async ({ page }) => {
    await navigateToTemplates(page);

    // Click import button
    await page.getByRole('button', { name: /import/i }).click();

    // Upload invalid JSON
    const fileInput = page.getByLabel(/select.*file|choose.*file/i);
    await fileInput.setInputFiles({
      name: 'invalid.json',
      mimeType: 'application/json',
      buffer: Buffer.from('{ invalid json }'),
    });

    // Try to submit
    await page.getByRole('button', { name: /import|upload/i }).click();

    // Should show error
    await expect(page.getByText(/invalid.*json|parse.*error/i)).toBeVisible();
  });
});

// =============================================================================
// Test Case 5: Responsive Design Validation
// =============================================================================

test.describe('Responsive Design', () => {
  test('should work correctly on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await navigateToTemplates(page);

    // Verify mobile layout
    // Category selector should be dropdown or horizontal scroll
    const categorySelector = page.getByTestId('category-selector');
    await expect(categorySelector).toBeVisible();

    // Select a template
    await selectTemplate(page, 'Device Offline');

    // Verify mobile form layout
    await expect(page.getByRole('form')).toBeVisible();

    // Fill and submit
    await fillTemplateVariables(page, { OFFLINE_DURATION: 90 });
    await applyTemplate(page, 'Mobile Test Alert');
    await waitForSuccess(page);
  });

  test('should work correctly on tablet viewport', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });

    await navigateToTemplates(page);

    // Verify tablet layout adapts correctly
    await expect(page.getByRole('heading', { name: /templates/i })).toBeVisible();

    // Template grid should adjust
    const templateCards = page.getByRole('article');
    expect(await templateCards.count()).toBeGreaterThan(0);
  });

  test('should work correctly on desktop viewport', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });

    await navigateToTemplates(page);

    // Verify desktop layout with sidebar
    await expect(page.getByRole('navigation')).toBeVisible();

    // Template grid should show multiple columns
    const templateCards = page.getByRole('article');
    expect(await templateCards.count()).toBeGreaterThan(0);

    // Side panel should be available
    await selectTemplate(page, 'Device Offline');
    const detailPanel = page.getByRole('complementary');
    if (await detailPanel.isVisible()) {
      await expect(detailPanel).toContainText(/device.*offline/i);
    }
  });
});

// =============================================================================
// Test Case 6: Accessibility Validation
// =============================================================================

test.describe('Accessibility (A11y)', () => {
  test('should meet WCAG AAA standards', async ({ page }) => {
    await navigateToTemplates(page);

    // Inject axe-core
    await page.addScriptTag({
      url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.7.2/axe.min.js',
    });

    // Run axe accessibility scan
    const results = await page.evaluate(() => {
      return (window as any).axe.run();
    });

    // Check for violations
    expect(results.violations).toHaveLength(0);
  });

  test('should be keyboard navigable', async ({ page }) => {
    await navigateToTemplates(page);

    // Tab through interactive elements
    await page.keyboard.press('Tab'); // Category tabs
    await page.keyboard.press('Tab'); // First template card

    // Verify focus is visible
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();

    // Navigate to template with Enter
    await page.keyboard.press('Enter');

    // Should open template details
    await expect(page.getByRole('form')).toBeVisible();
  });

  test('should support screen readers', async ({ page }) => {
    await navigateToTemplates(page);

    // Verify ARIA labels and roles
    await expect(page.getByRole('main')).toHaveAttribute('aria-label');
    await expect(page.getByRole('navigation')).toHaveAttribute('aria-label');

    // Template cards should have accessible names
    const templateCards = page.getByRole('article');
    const firstCard = templateCards.first();
    await expect(firstCard).toHaveAttribute('aria-labelledby');
  });
});
