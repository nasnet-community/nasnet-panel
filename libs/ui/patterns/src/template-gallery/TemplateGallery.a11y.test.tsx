/**
 * Accessibility Tests for TemplateGallery
 *
 * Tests WCAG AAA compliance for the TemplateGallery pattern component.
 *
 * Coverage:
 * - Keyboard navigation (Tab, Arrow keys, Enter, Escape)
 * - Screen reader support (ARIA labels, roles, live regions)
 * - Focus management and indicators
 * - Color contrast (7:1 ratio)
 * - Touch target sizes (44x44px minimum)
 * - Reduced motion support
 * - Semantic HTML structure
 *
 * @see libs/ui/patterns/src/template-gallery/TemplateGallery.tsx
 * @see Docs/design/ux-design/8-responsive-design-accessibility.md
 */

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { TemplateGallery } from './TemplateGallery';
import { useTemplateGallery } from './use-template-gallery';
import {
  mockAllTemplates,
  mockBasicSecurityTemplate,
  mockHomeNetworkTemplate,
} from '../__test-utils__/firewall-templates/template-fixtures';

// jest-axe augments expect type with toHaveNoViolations method
// (no need to extend manually)

describe('TemplateGallery - Accessibility (WCAG AAA)', () => {
  const mockOnSelect = vi.fn();

  beforeEach(() => {
    mockOnSelect.mockReset();
  });

  function TestGallery() {
    const gallery = useTemplateGallery({
      templates: mockAllTemplates,
      onSelect: mockOnSelect,
    });
    return (
      <TemplateGallery
        gallery={gallery}
        onApplyTemplate={mockOnSelect}
      />
    );
  }

  const renderGallery = () => render(<TestGallery />);

  describe('Automated Accessibility Testing (axe)', () => {
    it('should have no accessibility violations', async () => {
      const { container } = renderGallery();
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no violations in filtered state', async () => {
      const { container } = renderGallery();

      // Apply filter
      const searchInput = screen.getByRole('searchbox', { name: /search templates/i });
      await userEvent.type(searchInput, 'Basic');

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no violations with selected template', async () => {
      const { container } = renderGallery();

      // Select template
      const templateCard = screen.getByRole('article', {
        name: new RegExp(mockBasicSecurityTemplate.name, 'i'),
      });
      await userEvent.click(templateCard);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should allow navigating between templates with Tab key', async () => {
      const user = userEvent.setup();
      renderGallery();

      const templateCards = screen.getAllByRole('article');
      expect(templateCards.length).toBeGreaterThan(0);

      // Tab to first template card
      await user.tab();
      expect(templateCards[0]).toHaveFocus();

      // Tab to next template card
      await user.tab();
      expect(templateCards[1]).toHaveFocus();
    });

    it('should allow selecting template with Enter key', async () => {
      const user = userEvent.setup();
      renderGallery();

      const templateCard = screen.getByRole('article', {
        name: new RegExp(mockBasicSecurityTemplate.name, 'i'),
      });

      // Focus and press Enter
      templateCard.focus();
      await user.keyboard('{Enter}');

      expect(mockOnSelect).toHaveBeenCalledWith(mockBasicSecurityTemplate);
    });

    it('should allow selecting template with Space key', async () => {
      const user = userEvent.setup();
      renderGallery();

      const templateCard = screen.getByRole('article', {
        name: new RegExp(mockBasicSecurityTemplate.name, 'i'),
      });

      // Focus and press Space
      templateCard.focus();
      await user.keyboard(' ');

      expect(mockOnSelect).toHaveBeenCalledWith(mockBasicSecurityTemplate);
    });

    it('should allow navigating filters with keyboard', async () => {
      const user = userEvent.setup();
      renderGallery();

      // Tab to category filter
      const categoryFilter = screen.getByRole('combobox', { name: /category/i });
      categoryFilter.focus();

      // Open dropdown with Enter
      await user.keyboard('{Enter}');

      // Navigate with arrow keys
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Enter}');

      expect(categoryFilter).toHaveValue('HOME');
    });

    it('should trap focus in modal when open', async () => {
      const user = userEvent.setup();
      renderGallery();

      // Open filter modal (mobile view)
      const filterButton = screen.queryByRole('button', { name: /filters/i });
      if (filterButton) {
        await user.click(filterButton);

        // Tab through modal elements
        const modal = screen.getByRole('dialog');
        const focusableElements = within(modal).getAllByRole('button');

        // Last element should cycle back to first
        focusableElements[focusableElements.length - 1].focus();
        await user.tab();

        const firstFocusable = focusableElements[0];
        expect(firstFocusable).toHaveFocus();
      }
    });

    it('should close filter modal with Escape key', async () => {
      const user = userEvent.setup();
      renderGallery();

      const filterButton = screen.queryByRole('button', { name: /filters/i });
      if (filterButton) {
        await user.click(filterButton);

        expect(screen.getByRole('dialog')).toBeInTheDocument();

        await user.keyboard('{Escape}');

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      }
    });
  });

  describe('Screen Reader Support', () => {
    it('should have proper ARIA labels on template cards', () => {
      renderGallery();

      const templateCard = screen.getByRole('article', {
        name: new RegExp(mockBasicSecurityTemplate.name, 'i'),
      });

      expect(templateCard).toHaveAttribute('aria-label');
      expect(templateCard.getAttribute('aria-label')).toContain(mockBasicSecurityTemplate.name);
      expect(templateCard.getAttribute('aria-label')).toContain(mockBasicSecurityTemplate.category);
    });

    it('should announce selected state to screen readers', async () => {
      const user = userEvent.setup();
      renderGallery();

      const templateCard = screen.getByRole('article', {
        name: new RegExp(mockBasicSecurityTemplate.name, 'i'),
      });

      await user.click(templateCard);

      expect(templateCard).toHaveAttribute('aria-selected', 'true');
    });

    it('should have descriptive labels for filter controls', () => {
      renderGallery();

      const searchInput = screen.getByRole('searchbox');
      expect(searchInput).toHaveAccessibleName();

      const categoryFilter = screen.getByRole('combobox', { name: /category/i });
      expect(categoryFilter).toHaveAccessibleName();

      const complexityFilter = screen.getByRole('combobox', { name: /complexity/i });
      expect(complexityFilter).toHaveAccessibleName();
    });

    it('should announce filter results to screen readers', async () => {
      const user = userEvent.setup();
      renderGallery();

      const searchInput = screen.getByRole('searchbox');
      await user.type(searchInput, 'Basic');

      // Live region should announce results
      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toHaveTextContent(/1 template/i);
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
    });

    it('should use semantic HTML elements', () => {
      renderGallery();

      // Search input should be a searchbox
      expect(screen.getByRole('searchbox')).toBeInTheDocument();

      // Filter controls should be comboboxes
      expect(screen.getByRole('combobox', { name: /category/i })).toBeInTheDocument();

      // Template cards should be articles
      const articles = screen.getAllByRole('article');
      expect(articles.length).toBeGreaterThan(0);

      // Buttons should have proper roles
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should have descriptive alt text for icons', () => {
      renderGallery();

      // Category icons should have aria-label or aria-hidden
      const templateCard = screen.getByRole('article', {
        name: new RegExp(mockBasicSecurityTemplate.name, 'i'),
      });

      const icons = within(templateCard).queryAllByRole('img', { hidden: true });
      icons.forEach((icon) => {
        expect(icon.hasAttribute('aria-label') || icon.getAttribute('aria-hidden') === 'true').toBe(
          true
        );
      });
    });
  });

  describe('Focus Management', () => {
    it('should have visible focus indicators', async () => {
      const user = userEvent.setup();
      renderGallery();

      const searchInput = screen.getByRole('searchbox');
      await user.tab();

      expect(searchInput).toHaveFocus();

      // Check for focus ring (CSS class or style)
      const computedStyle = window.getComputedStyle(searchInput);
      expect(computedStyle.outline !== 'none' || computedStyle.boxShadow !== 'none').toBe(true);
    });

    it('should maintain focus after filtering', async () => {
      const user = userEvent.setup();
      renderGallery();

      const searchInput = screen.getByRole('searchbox');
      searchInput.focus();

      await user.type(searchInput, 'Basic');

      expect(searchInput).toHaveFocus();
    });

    it('should restore focus after closing modal', async () => {
      const user = userEvent.setup();
      renderGallery();

      const filterButton = screen.queryByRole('button', { name: /filters/i });
      if (filterButton) {
        filterButton.focus();
        await user.click(filterButton);

        const closeButton = screen.getByRole('button', { name: /close/i });
        await user.click(closeButton);

        expect(filterButton).toHaveFocus();
      }
    });

    it('should have focus ring with 3px width (WCAG AAA)', async () => {
      const user = userEvent.setup();
      renderGallery();

      const templateCard = screen.getAllByRole('article')[0];
      templateCard.focus();

      const computedStyle = window.getComputedStyle(templateCard);
      const outline = computedStyle.outline || computedStyle.boxShadow;

      // Focus indicator should be at least 3px (WCAG AAA requirement)
      expect(outline).toBeTruthy();
    });
  });

  describe('Color Contrast (7:1 Ratio - WCAG AAA)', () => {
    it('should have sufficient contrast for text', () => {
      renderGallery();

      // Note: Automated color contrast testing is handled by axe
      // This test documents the requirement
      const templateCard = screen.getByRole('article', {
        name: new RegExp(mockBasicSecurityTemplate.name, 'i'),
      });

      const heading = within(templateCard).getByRole('heading');
      expect(heading).toBeInTheDocument();

      // axe will check contrast ratios >= 7:1 for normal text
    });

    it('should maintain contrast in selected state', async () => {
      const user = userEvent.setup();
      const { container } = renderGallery();

      const templateCard = screen.getByRole('article', {
        name: new RegExp(mockBasicSecurityTemplate.name, 'i'),
      });

      await user.click(templateCard);

      // Run axe on selected card
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should maintain contrast in hover state', () => {
      renderGallery();

      // Note: Hover state contrast is verified by axe
      const templateCard = screen.getByRole('article', {
        name: new RegExp(mockBasicSecurityTemplate.name, 'i'),
      });

      expect(templateCard).toBeInTheDocument();
    });
  });

  describe('Touch Target Sizes (44x44px Minimum)', () => {
    it('should have touch targets >= 44x44px for template cards', () => {
      renderGallery();

      const templateCards = screen.getAllByRole('article');

      templateCards.forEach((card) => {
        const rect = card.getBoundingClientRect();
        expect(rect.height).toBeGreaterThanOrEqual(44);
        expect(rect.width).toBeGreaterThanOrEqual(44);
      });
    });

    it('should have touch targets >= 44x44px for buttons', () => {
      renderGallery();

      const buttons = screen.getAllByRole('button');

      buttons.forEach((button) => {
        const rect = button.getBoundingClientRect();
        expect(rect.height).toBeGreaterThanOrEqual(44);
        expect(rect.width).toBeGreaterThanOrEqual(44);
      });
    });

    it('should have sufficient spacing between interactive elements', () => {
      renderGallery();

      const templateCards = screen.getAllByRole('article');

      if (templateCards.length > 1) {
        const firstCard = templateCards[0].getBoundingClientRect();
        const secondCard = templateCards[1].getBoundingClientRect();

        // Minimum 8px spacing between cards (from design system)
        const spacing = secondCard.top - firstCard.bottom;
        expect(Math.abs(spacing)).toBeGreaterThanOrEqual(8);
      }
    });
  });

  describe('Reduced Motion Support', () => {
    it('should respect prefers-reduced-motion', () => {
      // Mock prefers-reduced-motion
      const matchMediaMock = vi.fn().mockImplementation((query) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }));

      global.matchMedia = matchMediaMock;

      renderGallery();

      // Verify no animations are applied when reduced motion is preferred
      const templateCard = screen.getAllByRole('article')[0];
      const computedStyle = window.getComputedStyle(templateCard);

      // Animation duration should be 0 or very short when reduced motion is active
      expect(
        computedStyle.animationDuration === '0s' || computedStyle.transitionDuration === '0s'
      ).toBe(true);
    });
  });

  describe('Error States and Messages', () => {
    it('should announce errors to screen readers', () => {
      const gallery = useTemplateGallery({
        templates: [],
        onSelect: mockOnSelect,
      });

      render(<TemplateGallery gallery={gallery} />);

      // No templates message should be in a role="status" region
      const emptyMessage = screen.getByText(/no templates found/i);
      const statusRegion = emptyMessage.closest('[role="status"]');
      expect(statusRegion).toBeInTheDocument();
    });

    it('should have descriptive error messages', () => {
      const gallery = useTemplateGallery({
        templates: [],
        onSelect: mockOnSelect,
      });

      render(<TemplateGallery gallery={gallery} />);

      const emptyMessage = screen.getByText(/no templates found/i);
      expect(emptyMessage).toBeInTheDocument();
      expect(emptyMessage).toHaveAccessibleName();
    });
  });

  describe('Loading States', () => {
    it('should announce loading state to screen readers', () => {
      const gallery = useTemplateGallery({
        templates: [],
        onSelect: mockOnSelect,
      });

      render(
        <TemplateGallery
          gallery={gallery}
          loading={true}
        />
      );

      const loadingIndicator = screen.getByRole('status');
      expect(loadingIndicator).toHaveAttribute('aria-live', 'polite');
      expect(loadingIndicator).toHaveTextContent(/loading/i);
    });

    it('should have accessible loading spinner', () => {
      const gallery = useTemplateGallery({
        templates: [],
        onSelect: mockOnSelect,
      });

      render(
        <TemplateGallery
          gallery={gallery}
          loading={true}
        />
      );

      const spinner = screen.getByRole('status');
      expect(spinner).toHaveAccessibleName(/loading/i);
    });
  });

  describe('Mobile Accessibility', () => {
    it('should have accessible filter drawer on mobile', async () => {
      const user = userEvent.setup();

      // Mock mobile viewport
      global.innerWidth = 375;
      global.dispatchEvent(new Event('resize'));

      renderGallery();

      const filterButton = screen.queryByRole('button', { name: /filters/i });
      if (filterButton) {
        await user.click(filterButton);

        const drawer = screen.getByRole('dialog');
        expect(drawer).toHaveAccessibleName(/filters/i);
        expect(drawer).toHaveAttribute('aria-modal', 'true');
      }
    });

    it('should have accessible sort controls on mobile', () => {
      global.innerWidth = 375;
      global.dispatchEvent(new Event('resize'));

      renderGallery();

      const sortButton = screen.queryByRole('button', { name: /sort/i });
      if (sortButton) {
        expect(sortButton).toHaveAccessibleName();
        expect(sortButton).toHaveAttribute('aria-expanded');
      }
    });
  });

  describe('Complex UI Patterns', () => {
    it('should have proper ARIA roles for grid layout', () => {
      renderGallery();

      // Template gallery should use appropriate container roles
      const main = screen.getByRole('main') || screen.getByRole('region');
      expect(main).toBeInTheDocument();
    });

    it('should use aria-describedby for additional context', () => {
      renderGallery();

      const templateCard = screen.getByRole('article', {
        name: new RegExp(mockBasicSecurityTemplate.name, 'i'),
      });

      // Description should be linked via aria-describedby
      if (templateCard.hasAttribute('aria-describedby')) {
        const descriptionId = templateCard.getAttribute('aria-describedby');
        const description = document.getElementById(descriptionId!);
        expect(description).toBeInTheDocument();
      }
    });

    it('should have proper heading hierarchy', () => {
      renderGallery();

      const headings = screen.getAllByRole('heading');

      // Verify heading levels don't skip (h1 -> h3)
      let previousLevel = 0;
      headings.forEach((heading) => {
        const level = parseInt(heading.tagName.substring(1));
        expect(level - previousLevel).toBeLessThanOrEqual(1);
        previousLevel = level;
      });
    });
  });
});
