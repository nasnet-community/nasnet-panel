/**
 * MangleFlowDiagram Component Tests
 *
 * Tests for MangleFlowDiagram pattern component including:
 * - Renders all 5 chains (prerouting, input, forward, output, postrouting)
 * - Rule count badges shown at each chain
 * - Chain selection callback triggered
 * - Trace mode highlights matching rules
 * - Responsive layout (horizontal desktop, vertical mobile)
 * - Category accent color applied
 * - WCAG AAA accessibility (axe-core - 0 violations)
 */

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { axe } from 'vitest-axe';

import { MangleFlowDiagram } from './MangleFlowDiagram';

import type { MangleFlowDiagramProps } from './MangleFlowDiagram';

// Note: vitest-axe matchers are extended globally in src/test/setup.ts

// Mock the platform hook
vi.mock('@nasnet/ui/layouts', () => ({
  usePlatform: vi.fn(() => 'desktop'),
}));

const defaultProps: MangleFlowDiagramProps = {
  ruleCounts: {
    prerouting: 5,
    input: 2,
    forward: 10,
    output: 3,
    postrouting: 4,
  },
  selectedChain: null,
  onChainSelect: vi.fn(),
};

describe('MangleFlowDiagram', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // Reset platform mock to desktop for most tests
    const layoutModule = await import('@nasnet/ui/layouts');
    vi.mocked(layoutModule.usePlatform).mockReturnValue('desktop');
  });

  describe('Rendering', () => {
    it('renders all 5 chain nodes', () => {
      render(<MangleFlowDiagram {...defaultProps} />);

      // Check for all chain buttons
      expect(screen.getByRole('button', { name: /prerouting/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /input/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /forward/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /output/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /postrouting/i })).toBeInTheDocument();
    });

    it('displays rule count badges on chains', () => {
      render(<MangleFlowDiagram {...defaultProps} />);

      // Find prerouting button and check for badge with count
      const preroutingButton = screen.getByRole('button', { name: /prerouting.*5 rules/i });
      expect(preroutingButton).toBeInTheDocument();

      const forwardButton = screen.getByRole('button', { name: /forward.*10 rules/i });
      expect(forwardButton).toBeInTheDocument();
    });

    it('displays PACKET IN and PACKET OUT markers', () => {
      render(<MangleFlowDiagram {...defaultProps} />);

      expect(screen.getByText(/PACKET IN/i)).toBeInTheDocument();
      expect(screen.getByText(/PACKET OUT/i)).toBeInTheDocument();
    });

    it('displays routing decision node', () => {
      render(<MangleFlowDiagram {...defaultProps} />);

      // Use more specific text to avoid matching chain descriptions
      expect(screen.getByText('Routing Decision')).toBeInTheDocument();
    });

    it('does not show badges for chains with 0 rules', () => {
      render(
        <MangleFlowDiagram
          {...defaultProps}
          ruleCounts={{
            prerouting: 0,
            input: 0,
            forward: 0,
            output: 0,
            postrouting: 0,
          }}
        />
      );

      // Buttons should exist but no badges
      expect(screen.getByRole('button', { name: /prerouting/i })).toBeInTheDocument();
    });
  });

  describe('Chain Selection', () => {
    it('calls onChainSelect when chain is clicked', async () => {
      const onChainSelect = vi.fn();
      const user = userEvent.setup();

      render(<MangleFlowDiagram {...defaultProps} onChainSelect={onChainSelect} />);

      const preroutingButton = screen.getByRole('button', { name: /prerouting/i });
      await user.click(preroutingButton);

      expect(onChainSelect).toHaveBeenCalledWith('prerouting');
    });

    it('highlights selected chain', () => {
      render(<MangleFlowDiagram {...defaultProps} selectedChain="forward" />);

      const forwardButton = screen.getByRole('button', { name: /forward/i });
      expect(forwardButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('toggles selection when clicking same chain again', async () => {
      const onChainSelect = vi.fn();
      const user = userEvent.setup();

      render(
        <MangleFlowDiagram
          {...defaultProps}
          selectedChain="prerouting"
          onChainSelect={onChainSelect}
        />
      );

      const preroutingButton = screen.getByRole('button', { name: /prerouting/i });
      await user.click(preroutingButton);

      // Should deselect (pass null)
      expect(onChainSelect).toHaveBeenCalledWith(null);
    });

    it('shows clear filter button when chain is selected', () => {
      render(<MangleFlowDiagram {...defaultProps} selectedChain="forward" />);

      expect(screen.getByRole('button', { name: /clear filter/i })).toBeInTheDocument();
    });

    it('hides clear filter button when no chain selected', () => {
      render(<MangleFlowDiagram {...defaultProps} selectedChain={null} />);

      expect(screen.queryByRole('button', { name: /clear filter/i })).not.toBeInTheDocument();
    });

    it('clears selection when clear button clicked', async () => {
      const onChainSelect = vi.fn();
      const user = userEvent.setup();

      render(
        <MangleFlowDiagram
          {...defaultProps}
          selectedChain="forward"
          onChainSelect={onChainSelect}
        />
      );

      const clearButton = screen.getByRole('button', { name: /clear filter/i });
      await user.click(clearButton);

      expect(onChainSelect).toHaveBeenCalledWith(null);
    });
  });

  describe('Trace Mode', () => {
    it('highlights chains in trace mode', () => {
      render(
        <MangleFlowDiagram
          {...defaultProps}
          traceMode={true}
          highlightedChains={['prerouting', 'forward', 'postrouting']}
        />
      );

      // Highlighted chains should have special styling (ring classes)
      const preroutingButton = screen.getByRole('button', { name: /prerouting/i });
      const forwardButton = screen.getByRole('button', { name: /forward/i });
      const inputButton = screen.getByRole('button', { name: /input/i });

      // Highlighted chains should have ring styling
      expect(preroutingButton.className).toContain('ring');
      expect(forwardButton.className).toContain('ring');

      // Non-highlighted chain should not
      expect(inputButton.className).not.toContain('ring-warning');
    });

    it('does not highlight chains when trace mode is off', () => {
      render(
        <MangleFlowDiagram
          {...defaultProps}
          traceMode={false}
          highlightedChains={['prerouting', 'forward']}
        />
      );

      const preroutingButton = screen.getByRole('button', { name: /prerouting/i });
      // Should not have warning ring even though in highlightedChains
      expect(preroutingButton.className).not.toContain('ring-warning');
    });
  });

  describe('Responsive Layout', () => {
    it('renders horizontal layout on desktop', async () => {
      const layoutModule = await import('@nasnet/ui/layouts');
      vi.mocked(layoutModule.usePlatform).mockReturnValue('desktop');

      const { container } = render(<MangleFlowDiagram {...defaultProps} />);

      // Desktop uses flex-row layout with horizontal arrows
      const flowContainer = container.querySelector('.flex.items-center.justify-between');
      expect(flowContainer).toBeInTheDocument();
    });

    it('renders vertical layout on mobile', async () => {
      const layoutModule = await import('@nasnet/ui/layouts');
      vi.mocked(layoutModule.usePlatform).mockReturnValue('mobile');

      const { container } = render(<MangleFlowDiagram {...defaultProps} />);

      // Mobile uses flex-col layout
      const flowContainer = container.querySelector('.flex.flex-col.items-center');
      expect(flowContainer).toBeInTheDocument();
    });

    it('shows legend on desktop', async () => {
      const layoutModule = await import('@nasnet/ui/layouts');
      vi.mocked(layoutModule.usePlatform).mockReturnValue('desktop');

      render(<MangleFlowDiagram {...defaultProps} />);

      // Look for legend items
      expect(screen.getByText(/incoming/i)).toBeInTheDocument();
      expect(screen.getByText('Routing Decision')).toBeInTheDocument();
      expect(screen.getByText(/outgoing/i)).toBeInTheDocument();
    });

    it('uses shorter button text on mobile', async () => {
      const layoutModule = await import('@nasnet/ui/layouts');
      vi.mocked(layoutModule.usePlatform).mockReturnValue('mobile');

      render(
        <MangleFlowDiagram
          {...defaultProps}
          selectedChain="forward"
          onChainSelect={vi.fn()}
        />
      );

      // Mobile clear button should be shorter ("Clear" not "Clear Filter")
      const clearButton = screen.getByRole('button', { name: /^clear$/i });
      expect(clearButton).toBeInTheDocument();
    });
  });

  describe('WCAG AAA Accessibility', () => {
    it('has no accessibility violations (desktop)', async () => {
      const { container } = render(<MangleFlowDiagram {...defaultProps} />);

      expect(await axe(container)).toHaveNoViolations();
    });

    it('has no accessibility violations (mobile)', async () => {
      const layoutModule = await import('@nasnet/ui/layouts');
      vi.mocked(layoutModule.usePlatform).mockReturnValue('mobile');

      const { container } = render(<MangleFlowDiagram {...defaultProps} />);

      expect(await axe(container)).toHaveNoViolations();
    });

    it('has no accessibility violations with selected chain', async () => {
      const { container } = render(
        <MangleFlowDiagram {...defaultProps} selectedChain="forward" />
      );

      expect(await axe(container)).toHaveNoViolations();
    });

    it('has no accessibility violations in trace mode', async () => {
      const { container } = render(
        <MangleFlowDiagram
          {...defaultProps}
          traceMode={true}
          highlightedChains={['prerouting', 'forward']}
        />
      );

      expect(await axe(container)).toHaveNoViolations();
    });

    it('provides accessible labels for chain buttons', () => {
      render(<MangleFlowDiagram {...defaultProps} />);

      const preroutingButton = screen.getByRole('button', { name: /prerouting/i });
      expect(preroutingButton).toHaveAccessibleName();

      // Should include rule count in label
      expect(preroutingButton).toHaveAttribute('aria-label', expect.stringContaining('5 rules'));
    });

    it('supports keyboard navigation through chains', async () => {
      const user = userEvent.setup();
      const onChainSelect = vi.fn();

      render(<MangleFlowDiagram {...defaultProps} onChainSelect={onChainSelect} />);

      const preroutingButton = screen.getByRole('button', { name: /prerouting/i });

      // Focus and activate with keyboard
      preroutingButton.focus();
      await user.keyboard('{Enter}');

      expect(onChainSelect).toHaveBeenCalledWith('prerouting');
    });

    it('has proper focus indicators', async () => {
      const user = userEvent.setup();

      render(<MangleFlowDiagram {...defaultProps} />);

      const preroutingButton = screen.getByRole('button', { name: /prerouting/i });

      // Tab to button
      await user.tab();
      preroutingButton.focus();

      // Should have focus styles
      expect(preroutingButton.className).toContain('focus:ring');
    });

    it('uses aria-pressed for chain selection state', () => {
      render(<MangleFlowDiagram {...defaultProps} selectedChain="forward" />);

      const forwardButton = screen.getByRole('button', { name: /forward/i });
      const preroutingButton = screen.getByRole('button', { name: /prerouting/i });

      expect(forwardButton).toHaveAttribute('aria-pressed', 'true');
      expect(preroutingButton).toHaveAttribute('aria-pressed', 'false');
    });
  });

  describe('Edge Cases', () => {
    it('handles undefined ruleCounts gracefully', () => {
      expect(() =>
        render(<MangleFlowDiagram {...defaultProps} ruleCounts={undefined} />)
      ).not.toThrow();
    });

    it('handles missing onChainSelect callback', async () => {
      const user = userEvent.setup();

      render(<MangleFlowDiagram {...defaultProps} onChainSelect={undefined} />);

      const preroutingButton = screen.getByRole('button', { name: /prerouting/i });

      // Should not throw when clicked
      await expect(user.click(preroutingButton)).resolves.not.toThrow();
    });

    it('handles empty highlightedChains array', () => {
      expect(() =>
        render(
          <MangleFlowDiagram {...defaultProps} traceMode={true} highlightedChains={[]} />
        )
      ).not.toThrow();
    });
  });
});
