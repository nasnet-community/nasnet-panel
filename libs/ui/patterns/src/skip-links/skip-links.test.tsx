/**
 * SkipLinks Tests
 *
 * @see NAS-4.17: Implement Accessibility (a11y) Foundation
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { SkipLinks, SkipLink } from './skip-links';

describe('SkipLinks', () => {
  describe('rendering', () => {
    it('should render default skip links', () => {
      render(<SkipLinks />);

      expect(screen.getByText('Skip to main content')).toBeInTheDocument();
      expect(screen.getByText('Skip to navigation')).toBeInTheDocument();
    });

    it('should render custom skip links', () => {
      render(
        <SkipLinks
          links={[
            { href: '#sidebar', label: 'Skip to sidebar' },
            { href: '#footer', label: 'Skip to footer' },
          ]}
        />
      );

      expect(screen.getByText('Skip to sidebar')).toBeInTheDocument();
      expect(screen.getByText('Skip to footer')).toBeInTheDocument();
      expect(screen.queryByText('Skip to main content')).not.toBeInTheDocument();
    });

    it('should have correct href attributes', () => {
      render(<SkipLinks />);

      const mainLink = screen.getByText('Skip to main content');
      const navLink = screen.getByText('Skip to navigation');

      expect(mainLink).toHaveAttribute('href', '#main-content');
      expect(navLink).toHaveAttribute('href', '#navigation');
    });

    it('should have navigation role and aria-label', () => {
      render(<SkipLinks />);

      const nav = screen.getByRole('navigation', { name: 'Skip links' });
      expect(nav).toBeInTheDocument();
    });
  });

  describe('keyboard interaction', () => {
    it('should be focusable via keyboard', async () => {
      const user = userEvent.setup();
      render(<SkipLinks />);

      // Tab to first skip link
      await user.tab();

      const mainLink = screen.getByText('Skip to main content');
      expect(mainLink).toHaveFocus();
    });

    it('should allow tabbing between skip links', async () => {
      const user = userEvent.setup();
      render(<SkipLinks />);

      // Tab to first skip link
      await user.tab();
      expect(screen.getByText('Skip to main content')).toHaveFocus();

      // Tab to second skip link
      await user.tab();
      expect(screen.getByText('Skip to navigation')).toHaveFocus();
    });
  });

  describe('accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <>
          <SkipLinks />
          {/* Target elements for skip links */}
          <nav id="navigation">Navigation</nav>
          <main id="main-content">Main content</main>
        </>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have minimum touch target size', () => {
      render(<SkipLinks />);

      const mainLink = screen.getByText('Skip to main content');
      // Check that touch target class is applied
      expect(mainLink.className).toMatch(/min-h-\[44px\]/);
      expect(mainLink.className).toMatch(/min-w-\[44px\]/);
    });
  });
});

describe('SkipLink', () => {
  it('should render with children', () => {
    render(<SkipLink href="#main">Skip to main</SkipLink>);

    expect(screen.getByText('Skip to main')).toBeInTheDocument();
  });

  it('should have correct href', () => {
    render(<SkipLink href="#custom-section">Skip to custom</SkipLink>);

    expect(screen.getByText('Skip to custom')).toHaveAttribute('href', '#custom-section');
  });

  it('should apply custom className', () => {
    render(
      <SkipLink href="#main" className="custom-class">
        Skip
      </SkipLink>
    );

    expect(screen.getByText('Skip')).toHaveClass('custom-class');
  });

  it('should be accessible', async () => {
    const { container } = render(
      <>
        <SkipLink href="#main">Skip to main content</SkipLink>
        <main id="main">Content</main>
      </>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
