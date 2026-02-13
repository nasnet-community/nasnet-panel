/**
 * E2E Tests for Firewall Templates Feature (Playwright)
 *
 * Tests complete user journeys across the firewall templates feature,
 * including browsing, previewing, applying, and managing templates.
 *
 * Coverage:
 * - Browse gallery → Select template → Preview → Apply → Verify rules
 * - Create custom template → Export → Import → Verify
 * - Apply template → Undo within 5 min → Verify rollback
 * - Error handling and edge cases
 * - Multi-browser testing (Chromium, Firefox, WebKit)
 *
 * @see apps/connect/src/routes/router/$id/firewall/templates.tsx
 */

import { test, expect, type Page } from '@playwright/test';

// Test configuration
const TEST_ROUTER_ID = 'test-router-1';
const BASE_URL = process.env.VITE_APP_URL || 'http://localhost:5173';

test.describe('Firewall Templates E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to templates page
    await page.goto(`${BASE_URL}/router/${TEST_ROUTER_ID}/firewall/templates`);

    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test.describe('Template Gallery - Browsing and Filtering', () => {
    test('should display built-in templates', async ({ page }) => {
      // Verify templates are displayed
      await expect(page.getByText('Basic Security')).toBeVisible();
      await expect(page.getByText('Home Network')).toBeVisible();
      await expect(page.getByText('Gaming Optimized')).toBeVisible();
    });

    test('should filter templates by search', async ({ page }) => {
      // Enter search query
      const searchInput = page.getByRole('searchbox', { name: /search/i });
      await searchInput.fill('Basic');

      // Verify only matching templates are shown
      await expect(page.getByText('Basic Security')).toBeVisible();
      await expect(page.getByText('Home Network')).not.toBeVisible();

      // Verify result count
      await expect(page.getByText('1 template')).toBeVisible();
    });

    test('should filter templates by category', async ({ page }) => {
      // Open category filter
      const categoryFilter = page.getByRole('combobox', { name: /category/i });
      await categoryFilter.click();

      // Select HOME category
      await page.getByRole('option', { name: 'Home' }).click();

      // Verify only HOME templates are shown
      await expect(page.getByText('Home Network')).toBeVisible();
      await expect(page.getByText('Basic Security')).not.toBeVisible();
    });

    test('should filter templates by complexity', async ({ page }) => {
      // Open complexity filter
      const complexityFilter = page.getByRole('combobox', { name: /complexity/i });
      await complexityFilter.click();

      // Select SIMPLE complexity
      await page.getByRole('option', { name: 'Simple' }).click();

      // Verify only SIMPLE templates are shown
      const simpleTemplate = page.getByText('Basic Security');
      await expect(simpleTemplate).toBeVisible();
    });

    test('should sort templates by name', async ({ page }) => {
      // Click sort by name
      const sortButton = page.getByRole('button', { name: /sort.*name/i });
      await sortButton.click();

      // Get all template names
      const templateNames = await page.locator('[data-testid="template-card-name"]').allTextContents();

      // Verify alphabetical order
      const sorted = [...templateNames].sort();
      expect(templateNames).toEqual(sorted);
    });

    test('should sort templates by rule count', async ({ page }) => {
      // Click sort by rule count
      const sortButton = page.getByRole('button', { name: /sort.*rules/i });
      await sortButton.click();

      // Get all rule counts
      const ruleCounts = await page.locator('[data-testid="template-rule-count"]').allTextContents();
      const counts = ruleCounts.map((text) => parseInt(text.match(/\d+/)?.[0] || '0'));

      // Verify ascending order
      for (let i = 0; i < counts.length - 1; i++) {
        expect(counts[i]).toBeLessThanOrEqual(counts[i + 1]);
      }
    });

    test('should clear filters', async ({ page }) => {
      // Apply filter
      const searchInput = page.getByRole('searchbox', { name: /search/i });
      await searchInput.fill('Basic');

      // Verify filter is active
      await expect(page.getByText('1 template')).toBeVisible();

      // Clear filter
      const clearButton = page.getByRole('button', { name: /clear.*filter/i });
      await clearButton.click();

      // Verify all templates are shown
      await expect(page.getByText(/6 templates/i)).toBeVisible();
    });
  });

  test.describe('Template Selection and Preview', () => {
    test('should select template and show details', async ({ page }) => {
      // Click on template card
      await page.getByText('Basic Security').click();

      // Verify template details are shown
      await expect(page.getByText(/essential firewall rules/i)).toBeVisible();
      await expect(page.getByText(/5 rules/i)).toBeVisible();
      await expect(page.getByText(/simple complexity/i)).toBeVisible();
    });

    test('should configure template variables', async ({ page }) => {
      // Select template
      await page.getByText('Home Network').click();

      // Verify variable inputs are shown
      const lanInterfaceInput = page.getByLabel(/LAN Interface/i);
      const wanInterfaceInput = page.getByLabel(/WAN Interface/i);
      const lanSubnetInput = page.getByLabel(/LAN Subnet/i);

      await expect(lanInterfaceInput).toBeVisible();
      await expect(wanInterfaceInput).toBeVisible();
      await expect(lanSubnetInput).toBeVisible();

      // Verify default values
      await expect(lanInterfaceInput).toHaveValue('bridge1');
      await expect(wanInterfaceInput).toHaveValue('ether1');
      await expect(lanSubnetInput).toHaveValue('192.168.88.0/24');
    });

    test('should validate variable inputs', async ({ page }) => {
      // Select template
      await page.getByText('Basic Security').click();

      // Enter invalid subnet
      const lanSubnetInput = page.getByLabel(/LAN Subnet/i);
      await lanSubnetInput.fill('invalid-subnet');

      // Verify validation error
      await expect(page.getByText(/invalid subnet format/i)).toBeVisible();

      // Verify preview button is disabled
      const previewButton = page.getByRole('button', { name: /preview/i });
      await expect(previewButton).toBeDisabled();
    });

    test('should generate preview successfully', async ({ page }) => {
      // Select template
      await page.getByText('Basic Security').click();

      // Click preview
      const previewButton = page.getByRole('button', { name: /preview/i });
      await previewButton.click();

      // Wait for preview to load
      await page.waitForSelector('[data-testid="preview-results"]', { timeout: 5000 });

      // Verify preview results
      await expect(page.getByText(/5 rules will be created/i)).toBeVisible();
      await expect(page.getByText(/no conflicts detected/i)).toBeVisible();
      await expect(page.getByText(/estimated apply time/i)).toBeVisible();
    });

    test('should display preview rules in tabs', async ({ page }) => {
      // Select template and generate preview
      await page.getByText('Basic Security').click();
      await page.getByRole('button', { name: /preview/i }).click();
      await page.waitForSelector('[data-testid="preview-results"]');

      // Verify tabs exist
      await expect(page.getByRole('tab', { name: /rules/i })).toBeVisible();
      await expect(page.getByRole('tab', { name: /impact/i })).toBeVisible();
      await expect(page.getByRole('tab', { name: /conflicts/i })).toBeVisible();

      // Click on Rules tab
      await page.getByRole('tab', { name: /rules/i }).click();

      // Verify rules are displayed
      await expect(page.getByText(/allow established connections/i)).toBeVisible();
      await expect(page.getByText(/drop invalid packets/i)).toBeVisible();
    });

    test('should detect conflicts', async ({ page }) => {
      // Mock API to return conflicts
      await page.route('**/api/firewall/templates/preview', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            conflicts: [
              {
                type: 'DUPLICATE_RULE',
                message: 'A similar rule already exists',
                existingRuleId: '*10',
              },
            ],
            impactAnalysis: {
              newRulesCount: 5,
              affectedChains: ['input', 'forward'],
              estimatedApplyTime: 3,
              warnings: [],
            },
          }),
        });
      });

      // Select template and generate preview
      await page.getByText('Basic Security').click();
      await page.getByRole('button', { name: /preview/i }).click();
      await page.waitForSelector('[data-testid="preview-results"]');

      // Verify conflict is detected
      await expect(page.getByText(/1 conflict detected/i)).toBeVisible();

      // Auto-switch to conflicts tab
      const conflictsTab = page.getByRole('tab', { name: /conflicts/i });
      await expect(conflictsTab).toHaveAttribute('aria-selected', 'true');

      // Verify conflict details
      await expect(page.getByText(/duplicate rule/i)).toBeVisible();
      await expect(page.getByText(/a similar rule already exists/i)).toBeVisible();

      // Verify apply button is disabled
      const applyButton = page.getByRole('button', { name: /apply/i });
      await expect(applyButton).toBeDisabled();
    });
  });

  test.describe('Template Application', () => {
    test('should apply template successfully', async ({ page }) => {
      // Mock successful apply
      await page.route('**/api/firewall/templates/apply', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            appliedRulesCount: 5,
            rollbackId: 'rollback-123',
            errors: [],
          }),
        });
      });

      // Select template, preview, and apply
      await page.getByText('Basic Security').click();
      await page.getByRole('button', { name: /preview/i }).click();
      await page.waitForSelector('[data-testid="preview-results"]');

      const applyButton = page.getByRole('button', { name: /apply/i });
      await applyButton.click();

      // Wait for apply to complete
      await page.waitForSelector('[data-testid="apply-success"]', { timeout: 10000 });

      // Verify success message
      await expect(page.getByText(/template applied successfully/i)).toBeVisible();
      await expect(page.getByText(/5 rules created/i)).toBeVisible();
    });

    test('should require confirmation for high-risk templates', async ({ page }) => {
      // Mock high-risk preview
      await page.route('**/api/firewall/templates/preview', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            conflicts: [],
            impactAnalysis: {
              newRulesCount: 15, // High risk: > 10 rules
              affectedChains: ['input', 'forward', 'output', 'prerouting'],
              estimatedApplyTime: 8,
              warnings: ['Large number of rules may impact performance'],
            },
          }),
        });
      });

      // Select template and preview
      await page.getByText('Gaming Optimized').click();
      await page.getByRole('button', { name: /preview/i }).click();
      await page.waitForSelector('[data-testid="preview-results"]');

      // Click apply
      const applyButton = page.getByRole('button', { name: /apply/i });
      await applyButton.click();

      // Verify confirmation dialog appears
      await expect(page.getByText(/high-risk operation/i)).toBeVisible();
      await expect(page.getByText(/15 rules/i)).toBeVisible();
      await expect(page.getByText(/4 chains/i)).toBeVisible();

      // Confirm
      const confirmButton = page.getByRole('button', { name: /i understand, proceed/i });
      await confirmButton.click();

      // Verify apply proceeds
      await page.waitForSelector('[data-testid="apply-in-progress"]');
    });

    test('should display rollback timer after successful apply', async ({ page }) => {
      // Mock successful apply
      await page.route('**/api/firewall/templates/apply', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            appliedRulesCount: 5,
            rollbackId: 'rollback-123',
            errors: [],
          }),
        });
      });

      // Apply template
      await page.getByText('Basic Security').click();
      await page.getByRole('button', { name: /preview/i }).click();
      await page.waitForSelector('[data-testid="preview-results"]');
      await page.getByRole('button', { name: /apply/i }).click();
      await page.waitForSelector('[data-testid="apply-success"]');

      // Verify rollback timer
      await expect(page.getByText(/rollback available for/i)).toBeVisible();
      await expect(page.getByText(/4:5/i)).toBeVisible(); // ~5 minutes

      // Verify rollback button exists
      const rollbackButton = page.getByRole('button', { name: /rollback/i });
      await expect(rollbackButton).toBeVisible();
      await expect(rollbackButton).toBeEnabled();
    });

    test('should handle apply errors gracefully', async ({ page }) => {
      // Mock failed apply
      await page.route('**/api/firewall/templates/apply', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            appliedRulesCount: 3,
            rollbackId: 'rollback-456',
            errors: [
              'Failed to create rule in position 4: invalid chain',
              'Failed to create rule in position 5: syntax error',
            ],
          }),
        });
      });

      // Apply template
      await page.getByText('Basic Security').click();
      await page.getByRole('button', { name: /preview/i }).click();
      await page.waitForSelector('[data-testid="preview-results"]');
      await page.getByRole('button', { name: /apply/i }).click();

      // Wait for error
      await page.waitForSelector('[data-testid="apply-error"]');

      // Verify error details
      await expect(page.getByText(/apply failed/i)).toBeVisible();
      await expect(page.getByText(/3 of 5 rules created/i)).toBeVisible();
      await expect(page.getByText(/invalid chain/i)).toBeVisible();
      await expect(page.getByText(/syntax error/i)).toBeVisible();

      // Verify rollback option is available
      const rollbackButton = page.getByRole('button', { name: /rollback/i });
      await expect(rollbackButton).toBeVisible();
    });
  });

  test.describe('Rollback Flow', () => {
    test('should execute rollback successfully', async ({ page }) => {
      // Mock successful apply and rollback
      await page.route('**/api/firewall/templates/apply', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            appliedRulesCount: 5,
            rollbackId: 'rollback-789',
            errors: [],
          }),
        });
      });

      await page.route('**/api/firewall/templates/rollback', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      // Apply template
      await page.getByText('Basic Security').click();
      await page.getByRole('button', { name: /preview/i }).click();
      await page.waitForSelector('[data-testid="preview-results"]');
      await page.getByRole('button', { name: /apply/i }).click();
      await page.waitForSelector('[data-testid="apply-success"]');

      // Execute rollback
      const rollbackButton = page.getByRole('button', { name: /rollback/i });
      await rollbackButton.click();

      // Confirm rollback
      const confirmButton = page.getByRole('button', { name: /confirm rollback/i });
      await confirmButton.click();

      // Wait for rollback to complete
      await page.waitForSelector('[data-testid="rollback-success"]', { timeout: 10000 });

      // Verify rollback success
      await expect(page.getByText(/changes rolled back successfully/i)).toBeVisible();
    });

    test('should verify rules after successful apply', async ({ page }) => {
      // Mock successful apply
      await page.route('**/api/firewall/templates/apply', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            appliedRulesCount: 5,
            rollbackId: 'rollback-101',
            errors: [],
          }),
        });
      });

      // Apply template
      await page.getByText('Basic Security').click();
      await page.getByRole('button', { name: /preview/i }).click();
      await page.waitForSelector('[data-testid="preview-results"]');
      await page.getByRole('button', { name: /apply/i }).click();
      await page.waitForSelector('[data-testid="apply-success"]');

      // Navigate to filter rules to verify
      await page.getByRole('link', { name: /filter rules/i }).click();

      // Verify new rules exist
      await expect(page.getByText(/allow established connections/i)).toBeVisible();
      await expect(page.getByText(/drop invalid packets/i)).toBeVisible();
    });
  });

  test.describe('Custom Template Management', () => {
    test('should create custom template', async ({ page }) => {
      // Click "Create Custom Template"
      await page.getByRole('button', { name: /create custom/i }).click();

      // Fill template details
      await page.getByLabel(/template name/i).fill('My Custom Template');
      await page.getByLabel(/description/i).fill('Custom rules for my network');
      await page.getByLabel(/category/i).selectOption('CUSTOM');

      // Add variable
      await page.getByRole('button', { name: /add variable/i }).click();
      await page.getByLabel(/variable name/i).fill('MY_PORT');
      await page.getByLabel(/variable type/i).selectOption('PORT');
      await page.getByLabel(/default value/i).fill('8080');

      // Add rule
      await page.getByRole('button', { name: /add rule/i }).click();
      await page.getByLabel(/chain/i).selectOption('input');
      await page.getByLabel(/action/i).selectOption('accept');
      await page.getByLabel(/protocol/i).fill('tcp');
      await page.getByLabel(/destination port/i).fill('{{MY_PORT}}');

      // Save template
      await page.getByRole('button', { name: /save template/i }).click();

      // Verify success
      await expect(page.getByText(/template saved successfully/i)).toBeVisible();

      // Verify template appears in gallery
      await expect(page.getByText('My Custom Template')).toBeVisible();
    });

    test('should export custom template', async ({ page }) => {
      // Select custom template
      await page.getByText('My Custom Template').click();

      // Click export
      const exportButton = page.getByRole('button', { name: /export/i });
      await exportButton.click();

      // Choose export format
      await page.getByRole('menuitem', { name: /json/i }).click();

      // Wait for download
      const downloadPromise = page.waitForEvent('download');
      const download = await downloadPromise;

      // Verify filename
      expect(download.suggestedFilename()).toMatch(/my-custom-template.*\.json/i);
    });

    test('should import custom template', async ({ page }) => {
      // Click import
      const importButton = page.getByRole('button', { name: /import/i });
      await importButton.click();

      // Upload file
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'template.json',
        mimeType: 'application/json',
        buffer: Buffer.from(
          JSON.stringify({
            name: 'Imported Template',
            description: 'Imported from file',
            category: 'CUSTOM',
            complexity: 'MODERATE',
            variables: [],
            rules: [],
          })
        ),
      });

      // Verify template is imported
      await expect(page.getByText(/template imported successfully/i)).toBeVisible();
      await expect(page.getByText('Imported Template')).toBeVisible();
    });

    test('should delete custom template', async ({ page }) => {
      // Select custom template
      await page.getByText('My Custom Template').click();

      // Click delete
      const deleteButton = page.getByRole('button', { name: /delete/i });
      await deleteButton.click();

      // Confirm deletion
      const confirmButton = page.getByRole('button', { name: /confirm delete/i });
      await confirmButton.click();

      // Verify template is removed
      await expect(page.getByText(/template deleted successfully/i)).toBeVisible();
      await expect(page.getByText('My Custom Template')).not.toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      // Verify mobile layout
      await expect(page.getByText('Basic Security')).toBeVisible();

      // Open filters drawer
      const filtersButton = page.getByRole('button', { name: /filters/i });
      await filtersButton.click();

      // Verify drawer opens
      const drawer = page.getByRole('dialog', { name: /filters/i });
      await expect(drawer).toBeVisible();

      // Apply filter
      const searchInput = drawer.getByRole('searchbox');
      await searchInput.fill('Basic');

      // Close drawer
      const closeButton = drawer.getByRole('button', { name: /close/i });
      await closeButton.click();

      // Verify filter applied
      await expect(page.getByText('1 template')).toBeVisible();
    });

    test('should work on tablet viewport', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });

      // Verify hybrid layout
      await expect(page.getByText('Basic Security')).toBeVisible();
      await expect(page.getByRole('searchbox')).toBeVisible();
    });
  });

  test.describe('Multi-Browser Compatibility', () => {
    test('should work in Chromium', async ({ page, browserName }) => {
      test.skip(browserName !== 'chromium', 'Chromium-specific test');

      await expect(page.getByText('Basic Security')).toBeVisible();
    });

    test('should work in Firefox', async ({ page, browserName }) => {
      test.skip(browserName !== 'firefox', 'Firefox-specific test');

      await expect(page.getByText('Basic Security')).toBeVisible();
    });

    test('should work in WebKit', async ({ page, browserName }) => {
      test.skip(browserName !== 'webkit', 'WebKit-specific test');

      await expect(page.getByText('Basic Security')).toBeVisible();
    });
  });
});
