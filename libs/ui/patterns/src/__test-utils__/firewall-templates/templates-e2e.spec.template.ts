/**
 * E2E Tests for Firewall Templates Feature (NAS-7.6 Task 7.6-7.8)
 *
 * End-to-end tests for complete user workflows.
 * This is a TEMPLATE file - uncomment and move to the appropriate location once
 * the feature is fully implemented.
 *
 * MOVE TO: apps/connect-e2e/src/firewall-templates.spec.ts
 *
 * @see apps/connect/src/routes/firewall/templates.tsx
 */

import { test, expect, type Page } from '@playwright/test';

// Test data
const TEST_ROUTER_ID = 'test-router-123';
const TEST_VARIABLES = {
  LAN_INTERFACE: 'bridge1',
  WAN_INTERFACE: 'ether1',
  LAN_SUBNET: '192.168.88.0/24',
};

// Helper functions
async function navigateToTemplatesPage(page: Page) {
  await page.goto('/');
  await page.click('[data-testid="nav-firewall"]');
  await page.click('[data-testid="nav-firewall-templates"]');
  await expect(page).toHaveURL(/\/firewall\/templates/);
}

async function waitForTemplateGalleryLoad(page: Page) {
  await expect(page.locator('[data-testid="template-gallery"]')).toBeVisible();
  await expect(page.locator('[data-testid="template-card"]').first()).toBeVisible();
}

async function selectTemplate(page: Page, templateName: string) {
  await page.click(`[data-testid="template-card-${templateName}"]`);
  await expect(page.locator('[data-testid="template-preview"]')).toBeVisible();
}

test.describe('Firewall Templates - Template Gallery', () => {
  test.beforeEach(async ({ page }) => {
    // Mock router connection
    await page.route('**/graphql', (route) => {
      const request = route.request();
      const postData = request.postDataJSON();

      if (postData.operationName === 'FirewallTemplates') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              firewallTemplates: [
                {
                  id: 'basic-security',
                  name: 'Basic Security',
                  description: 'Essential firewall rules',
                  category: 'BASIC',
                  complexity: 'SIMPLE',
                  ruleCount: 5,
                  isBuiltIn: true,
                },
                {
                  id: 'home-network',
                  name: 'Home Network',
                  description: 'Complete home setup',
                  category: 'HOME',
                  complexity: 'MODERATE',
                  ruleCount: 8,
                  isBuiltIn: true,
                },
              ],
            },
          }),
        });
      }
    });

    await navigateToTemplatesPage(page);
  });

  test('AC1: View available templates', async ({ page }) => {
    await waitForTemplateGalleryLoad(page);

    // Verify templates are visible
    await expect(page.locator('[data-testid="template-card"]')).toHaveCount(2);

    // Verify template metadata is displayed
    const basicSecurityCard = page.locator('[data-testid="template-card-basic-security"]');
    await expect(basicSecurityCard.locator('[data-testid="template-name"]')).toHaveText(
      'Basic Security'
    );
    await expect(basicSecurityCard.locator('[data-testid="template-description"]')).toContainText(
      'Essential firewall rules'
    );
    await expect(basicSecurityCard.locator('[data-testid="template-rule-count"]')).toContainText(
      '5'
    );
    await expect(basicSecurityCard.locator('[data-testid="template-complexity"]')).toContainText(
      'SIMPLE'
    );
  });

  test('AC1: Templates are organized by category', async ({ page }) => {
    await waitForTemplateGalleryLoad(page);

    // Verify category tabs exist
    await expect(page.locator('[data-testid="category-tab-BASIC"]')).toBeVisible();
    await expect(page.locator('[data-testid="category-tab-HOME"]')).toBeVisible();
    await expect(page.locator('[data-testid="category-tab-GAMING"]')).toBeVisible();

    // Filter by HOME category
    await page.click('[data-testid="category-tab-HOME"]');
    await expect(page.locator('[data-testid="template-card"]')).toHaveCount(1);
    await expect(
      page.locator('[data-testid="template-card-home-network"]')
    ).toBeVisible();
  });

  test('Search templates by name', async ({ page }) => {
    await waitForTemplateGalleryLoad(page);

    // Search for "security"
    await page.fill('[data-testid="template-search"]', 'security');
    await expect(page.locator('[data-testid="template-card"]')).toHaveCount(1);
    await expect(
      page.locator('[data-testid="template-card-basic-security"]')
    ).toBeVisible();
  });

  test('Keyboard navigation through templates', async ({ page }) => {
    await waitForTemplateGalleryLoad(page);

    // Focus first template card
    await page.keyboard.press('Tab');
    const firstCard = page.locator('[data-testid="template-card"]').first();
    await expect(firstCard).toBeFocused();

    // Navigate to next card
    await page.keyboard.press('Tab');
    const secondCard = page.locator('[data-testid="template-card"]').nth(1);
    await expect(secondCard).toBeFocused();

    // Activate with Enter
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-testid="template-preview"]')).toBeVisible();
  });
});

test.describe('Firewall Templates - Template Preview', () => {
  test.beforeEach(async ({ page }) => {
    // Mock GraphQL responses
    await page.route('**/graphql', (route) => {
      const request = route.request();
      const postData = request.postDataJSON();

      if (postData.operationName === 'PreviewTemplate') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              previewTemplate: {
                template: {
                  id: 'basic-security',
                  name: 'Basic Security',
                  variables: [
                    {
                      name: 'LAN_INTERFACE',
                      label: 'LAN Interface',
                      type: 'INTERFACE',
                      required: true,
                      options: ['bridge1', 'ether2', 'ether3'],
                    },
                    {
                      name: 'LAN_SUBNET',
                      label: 'LAN Subnet',
                      type: 'SUBNET',
                      required: true,
                    },
                  ],
                },
                resolvedRules: [],
                conflicts: [],
                impactAnalysis: {
                  newRulesCount: 5,
                  affectedChains: ['input', 'forward'],
                  estimatedApplyTime: 2,
                  warnings: [],
                },
              },
            },
          }),
        });
      }

      if (postData.operationName === 'RouterInterfaces') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              routerInterfaces: ['bridge1', 'ether1', 'ether2', 'ether3', 'wlan1'],
            },
          }),
        });
      }
    });

    await navigateToTemplatesPage(page);
    await selectTemplate(page, 'basic-security');
  });

  test('AC2: Preview template before applying', async ({ page }) => {
    // Verify preview is visible
    await expect(page.locator('[data-testid="template-preview"]')).toBeVisible();

    // Click Preview button
    await page.click('[data-testid="preview-button"]');

    // Verify all rules are shown
    await expect(page.locator('[data-testid="preview-rules"]')).toBeVisible();

    // Verify impact analysis
    await expect(page.locator('[data-testid="impact-analysis"]')).toBeVisible();
    await expect(page.locator('[data-testid="new-rules-count"]')).toContainText('5');
    await expect(page.locator('[data-testid="affected-chains"]')).toContainText('input, forward');
  });

  test('AC2: Customize variables with validation', async ({ page }) => {
    // Fill LAN interface (autocomplete)
    await page.click('[data-testid="variable-LAN_INTERFACE"]');
    await expect(page.locator('[data-testid="interface-option"]')).toHaveCount(5);
    await page.click('[data-testid="interface-option-bridge1"]');

    // Fill LAN subnet with validation
    const subnetInput = page.locator('[data-testid="variable-LAN_SUBNET"]');
    await subnetInput.fill('invalid-subnet');
    await expect(page.locator('[data-testid="validation-error-LAN_SUBNET"]')).toBeVisible();

    await subnetInput.fill('192.168.88.0/24');
    await expect(page.locator('[data-testid="validation-error-LAN_SUBNET"]')).not.toBeVisible();
  });

  test('AC2: Interface dropdowns populated from router', async ({ page }) => {
    await page.click('[data-testid="variable-LAN_INTERFACE"]');

    // Verify interfaces from router are shown
    await expect(page.locator('[data-testid="interface-option-bridge1"]')).toBeVisible();
    await expect(page.locator('[data-testid="interface-option-ether1"]')).toBeVisible();
    await expect(page.locator('[data-testid="interface-option-wlan1"]')).toBeVisible();
  });

  test('Preview updates when variables change', async ({ page }) => {
    // Change variable
    await page.fill('[data-testid="variable-LAN_SUBNET"]', '10.0.0.0/8');

    // Verify preview updates
    await expect(page.locator('[data-testid="preview-rules"]')).toContainText('10.0.0.0/8');
  });
});

test.describe('Firewall Templates - Apply and Rollback', () => {
  test('AC3: Apply template with safety confirmation', async ({ page }) => {
    // Mock apply mutation
    await page.route('**/graphql', (route) => {
      const request = route.request();
      const postData = request.postDataJSON();

      if (postData.operationName === 'ApplyFirewallTemplate') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              applyFirewallTemplate: {
                success: true,
                appliedRulesCount: 5,
                rollbackId: 'rollback-123456',
                errors: [],
              },
            },
          }),
        });
      }
    });

    await navigateToTemplatesPage(page);
    await selectTemplate(page, 'basic-security');

    // Fill variables
    await page.click('[data-testid="variable-LAN_INTERFACE"]');
    await page.click('[data-testid="interface-option-bridge1"]');
    await page.fill('[data-testid="variable-LAN_SUBNET"]', '192.168.88.0/24');

    // Click Apply
    await page.click('[data-testid="apply-template-button"]');

    // Verify Safety Pipeline confirmation dialog (Dangerous level)
    await expect(page.locator('[data-testid="safety-confirmation-dialog"]')).toBeVisible();
    await expect(page.locator('[data-testid="risk-level"]')).toContainText('Dangerous');

    // Verify impact analysis in dialog
    await expect(page.locator('[data-testid="impact-summary"]')).toContainText('5 rules');

    // Acknowledge changes
    await page.check('[data-testid="acknowledge-checkbox"]');

    // Confirm application
    await page.click('[data-testid="confirm-apply-button"]');

    // Verify success message
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-toast"]')).toContainText('5 rules');

    // Verify undo button with countdown
    await expect(page.locator('[data-testid="undo-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="undo-countdown"]')).toContainText(/\d:\d{2}/);
  });

  test('AC3: Rollback applied template', async ({ page }) => {
    // Mock rollback mutation
    await page.route('**/graphql', (route) => {
      const request = route.request();
      const postData = request.postDataJSON();

      if (postData.operationName === 'RollbackFirewallTemplate') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              rollbackFirewallTemplate: true,
            },
          }),
        });
      }
    });

    // Assume template was just applied (undo button visible)
    await expect(page.locator('[data-testid="undo-button"]')).toBeVisible();

    // Click Undo
    await page.click('[data-testid="undo-button"]');

    // Verify rollback confirmation
    await expect(page.locator('[data-testid="rollback-success-toast"]')).toBeVisible();
    await expect(page.locator('[data-testid="rollback-success-toast"]')).toContainText(
      'reverted'
    );

    // Verify undo button disappears
    await expect(page.locator('[data-testid="undo-button"]')).not.toBeVisible();
  });

  test('Undo button countdown and expiration', async ({ page }) => {
    await expect(page.locator('[data-testid="undo-button"]')).toBeVisible();

    // Verify countdown decreases
    const initialTime = await page
      .locator('[data-testid="undo-countdown"]')
      .textContent();
    await page.waitForTimeout(2000);
    const newTime = await page.locator('[data-testid="undo-countdown"]').textContent();

    expect(newTime).not.toBe(initialTime);

    // TODO: Test expiration after 5 minutes (may need to mock time)
  });
});

test.describe('Firewall Templates - Custom Templates', () => {
  test('AC4: Save custom template from existing rules', async ({ page }) => {
    // Mock save mutation
    await page.route('**/graphql', (route) => {
      const request = route.request();
      const postData = request.postDataJSON();

      if (postData.operationName === 'SaveFirewallTemplate') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              saveFirewallTemplate: {
                id: 'custom-123',
                name: 'My Custom Template',
                category: 'CUSTOM',
                isBuiltIn: false,
              },
            },
          }),
        });
      }
    });

    await navigateToTemplatesPage(page);

    // Click "Save as Template"
    await page.click('[data-testid="save-template-button"]');

    // Fill template details
    await expect(page.locator('[data-testid="save-template-dialog"]')).toBeVisible();
    await page.fill('[data-testid="template-name-input"]', 'My Custom Template');
    await page.fill('[data-testid="template-description-input"]', 'Custom firewall rules');
    await page.selectOption('[data-testid="template-category-select"]', 'CUSTOM');

    // Save template
    await page.click('[data-testid="save-template-confirm-button"]');

    // Verify success
    await expect(page.locator('[data-testid="success-toast"]')).toContainText(
      'Template saved'
    );

    // Verify template appears in Custom Templates section
    await page.click('[data-testid="category-tab-CUSTOM"]');
    await expect(page.locator('[data-testid="template-card-custom-123"]')).toBeVisible();
  });

  test('AC5: Export template for sharing', async ({ page }) => {
    await navigateToTemplatesPage(page);

    // Select custom template
    await page.click('[data-testid="category-tab-CUSTOM"]');
    await page.click('[data-testid="template-card-custom-123"]');

    // Click Export
    await page.click('[data-testid="export-template-button"]');

    // Select format (JSON)
    await page.click('[data-testid="export-format-json"]');

    // Verify download starts
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="confirm-export-button"]');
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/\.json$/);
  });

  test('AC5: Import external template', async ({ page }) => {
    // Mock import validation
    await page.route('**/graphql', (route) => {
      const request = route.request();
      const postData = request.postDataJSON();

      if (postData.operationName === 'SaveFirewallTemplate') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              saveFirewallTemplate: {
                id: 'imported-123',
                name: 'Imported Template',
                category: 'CUSTOM',
                isBuiltIn: false,
              },
            },
          }),
        });
      }
    });

    await navigateToTemplatesPage(page);

    // Click Import
    await page.click('[data-testid="import-template-button"]');

    // Upload file
    const fileInput = page.locator('[data-testid="template-file-input"]');
    await fileInput.setInputFiles({
      name: 'template.json',
      mimeType: 'application/json',
      buffer: Buffer.from(
        JSON.stringify({
          name: 'Imported Template',
          description: 'Imported from file',
          category: 'CUSTOM',
          variables: [],
          rules: [],
        })
      ),
    });

    // Verify preview
    await expect(page.locator('[data-testid="import-preview"]')).toBeVisible();

    // Confirm import
    await page.click('[data-testid="confirm-import-button"]');

    // Verify success
    await expect(page.locator('[data-testid="success-toast"]')).toContainText(
      'Template imported'
    );
  });

  test('AC5: Import invalid template shows errors', async ({ page }) => {
    await navigateToTemplatesPage(page);
    await page.click('[data-testid="import-template-button"]');

    // Upload invalid file
    const fileInput = page.locator('[data-testid="template-file-input"]');
    await fileInput.setInputFiles({
      name: 'invalid.json',
      mimeType: 'application/json',
      buffer: Buffer.from('{ "invalid": "template" }'),
    });

    // Verify validation errors
    await expect(page.locator('[data-testid="validation-errors"]')).toBeVisible();
    await expect(page.locator('[data-testid="validation-error"]')).toContainText('required');

    // Verify import button is disabled
    await expect(page.locator('[data-testid="confirm-import-button"]')).toBeDisabled();
  });
});

test.describe('Firewall Templates - Accessibility', () => {
  test('Keyboard navigation through entire flow', async ({ page }) => {
    await navigateToTemplatesPage(page);

    // Tab through gallery
    await page.keyboard.press('Tab'); // Search input
    await page.keyboard.press('Tab'); // First category tab
    await page.keyboard.press('Tab'); // First template card

    // Activate template
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-testid="template-preview"]')).toBeVisible();

    // Tab through variables
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Activate apply button
    await page.keyboard.press('Tab'); // Apply button
    await page.keyboard.press('Enter');

    // Verify confirmation dialog is keyboard accessible
    await expect(page.locator('[data-testid="safety-confirmation-dialog"]')).toBeVisible();
    await page.keyboard.press('Tab'); // Acknowledge checkbox
    await page.keyboard.press('Space'); // Check
    await page.keyboard.press('Tab'); // Confirm button
    await page.keyboard.press('Enter'); // Apply
  });

  test('Screen reader announcements', async ({ page }) => {
    await navigateToTemplatesPage(page);

    // Verify ARIA labels
    const gallery = page.locator('[data-testid="template-gallery"]');
    await expect(gallery).toHaveAttribute('role', 'grid');

    const templateCard = page.locator('[data-testid="template-card"]').first();
    await expect(templateCard).toHaveAttribute('role', 'gridcell');
    await expect(templateCard).toHaveAttribute('aria-label');

    // Verify live region for status updates
    const liveRegion = page.locator('[aria-live="polite"]');
    await expect(liveRegion).toBeAttached();
  });

  test('Focus indicators visible', async ({ page }) => {
    await navigateToTemplatesPage(page);

    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluateHandle(() => document.activeElement);

    // Verify focus ring styles (3px ring as per design system)
    const ringStyles = await page.evaluate((el) => {
      const styles = window.getComputedStyle(el as Element);
      return styles.outline;
    }, focusedElement);

    expect(ringStyles).toBeTruthy();
  });

  test('Touch targets meet 44x44px requirement', async ({ page }) => {
    await navigateToTemplatesPage(page);

    const templateCard = page.locator('[data-testid="template-card"]').first();
    const box = await templateCard.boundingBox();

    expect(box?.width).toBeGreaterThanOrEqual(44);
    expect(box?.height).toBeGreaterThanOrEqual(44);
  });
});

// TODO: Add performance tests for large template lists
// TODO: Add visual regression tests with Chromatic/Percy
// TODO: Add tests for mobile responsive presenters
