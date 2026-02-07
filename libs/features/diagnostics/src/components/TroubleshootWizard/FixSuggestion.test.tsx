/**
 * FixSuggestion - Component Tests
 *
 * Comprehensive component tests covering:
 * - Fix display (title, description, confidence badge)
 * - Manual vs automated fixes
 * - Manual steps rendering
 * - Command preview display
 * - ISP information display
 * - Button states (idle, applying, applied, failed)
 * - User interactions (apply, skip)
 * - Accessibility (ARIA labels, keyboard navigation, touch targets)
 *
 * @see Story NAS-5.11 - No Internet Troubleshooting Wizard - Task 5.11.11
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FixSuggestion } from './FixSuggestion';
import type { FixSuggestion as FixSuggestionType, ISPInfo } from '../../types/troubleshoot.types';

describe('FixSuggestion', () => {
  const defaultProps = {
    status: 'idle' as const,
    onApply: vi.fn(),
    onSkip: vi.fn(),
  };

  const createFix = (overrides?: Partial<FixSuggestionType>): FixSuggestionType => ({
    issueCode: 'WAN_DISABLED',
    title: 'Enable WAN Interface',
    description: 'Your WAN interface is disabled. Enable it to restore connectivity.',
    command: '/interface/enable [find name=ether1]',
    rollbackCommand: '/interface/disable [find name=ether1]',
    confidence: 'high',
    requiresConfirmation: false,
    isManualFix: false,
    manualSteps: [],
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render fix title', () => {
      const fix = createFix();

      render(<FixSuggestion {...defaultProps} fix={fix} />);

      expect(screen.getByText('Enable WAN Interface')).toBeInTheDocument();
    });

    it('should render fix description', () => {
      const fix = createFix();

      render(<FixSuggestion {...defaultProps} fix={fix} />);

      expect(
        screen.getByText(/Your WAN interface is disabled/)
      ).toBeInTheDocument();
    });

    it('should have warning border and background', () => {
      const fix = createFix();

      const { container } = render(<FixSuggestion {...defaultProps} fix={fix} />);

      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('border-warning/50');
      expect(card.className).toContain('bg-warning/5');
    });
  });

  describe('Confidence Badge', () => {
    it('should show high confidence badge with check icon', () => {
      const fix = createFix({ confidence: 'high' });

      const { container } = render(<FixSuggestion {...defaultProps} fix={fix} />);

      expect(screen.getByText(/high confidence/i)).toBeInTheDocument();
      expect(container.querySelector('.lucide-check-circle-2')).toBeInTheDocument();
    });

    it('should show medium confidence badge with alert icon', () => {
      const fix = createFix({ confidence: 'medium' });

      const { container } = render(<FixSuggestion {...defaultProps} fix={fix} />);

      expect(screen.getByText(/medium confidence/i)).toBeInTheDocument();
      expect(container.querySelector('.lucide-alert-circle')).toBeInTheDocument();
    });

    it('should show low confidence badge', () => {
      const fix = createFix({ confidence: 'low' });

      render(<FixSuggestion {...defaultProps} fix={fix} />);

      expect(screen.getByText(/low confidence/i)).toBeInTheDocument();
    });

    it('should apply correct colors for confidence levels', () => {
      const { container, rerender } = render(
        <FixSuggestion {...defaultProps} fix={createFix({ confidence: 'high' })} />
      );

      let badge = screen.getByText(/high confidence/i);
      expect(badge.className).toContain('text-success');

      rerender(<FixSuggestion {...defaultProps} fix={createFix({ confidence: 'medium' })} />);
      badge = screen.getByText(/medium confidence/i);
      expect(badge.className).toContain('text-warning');

      rerender(<FixSuggestion {...defaultProps} fix={createFix({ confidence: 'low' })} />);
      badge = screen.getByText(/low confidence/i);
      expect(badge.className).toContain('text-error');
    });
  });

  describe('Automated Fix', () => {
    it('should show Apply Fix button for automated fix', () => {
      const fix = createFix({ isManualFix: false });

      render(<FixSuggestion {...defaultProps} fix={fix} />);

      expect(screen.getByRole('button', { name: /apply fix/i })).toBeInTheDocument();
    });

    it('should call onApply when Apply Fix button is clicked', async () => {
      const user = userEvent.setup();
      const onApply = vi.fn();
      const fix = createFix({ isManualFix: false });

      render(<FixSuggestion {...defaultProps} fix={fix} onApply={onApply} />);

      await user.click(screen.getByRole('button', { name: /apply fix/i }));

      expect(onApply).toHaveBeenCalledTimes(1);
    });

    it('should show applying state with spinner', () => {
      const fix = createFix({ isManualFix: false });

      const { container } = render(<FixSuggestion {...defaultProps} fix={fix} status="applying" />);

      expect(screen.getByText(/applying fix/i)).toBeInTheDocument();
      expect(container.querySelector('.lucide-loader-2')).toBeInTheDocument();
      expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('should disable buttons when applying', () => {
      const fix = createFix({ isManualFix: false });

      render(<FixSuggestion {...defaultProps} fix={fix} status="applying" />);

      expect(screen.getByRole('button', { name: /applying fix/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /skip/i })).toBeDisabled();
    });

    it('should show applied state with check icon', () => {
      const fix = createFix({ isManualFix: false });

      const { container } = render(<FixSuggestion {...defaultProps} fix={fix} status="applied" />);

      expect(screen.getByText(/applied/i)).toBeInTheDocument();
      expect(container.querySelector('.lucide-check-circle-2')).toBeInTheDocument();
    });

    it('should disable Apply button when applied', () => {
      const fix = createFix({ isManualFix: false });

      render(<FixSuggestion {...defaultProps} fix={fix} status="applied" />);

      expect(screen.getByRole('button', { name: /applied/i })).toBeDisabled();
    });

    it('should show Try Again when failed', () => {
      const fix = createFix({ isManualFix: false });

      render(<FixSuggestion {...defaultProps} fix={fix} status="failed" />);

      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });
  });

  describe('Manual Fix', () => {
    it('should not show Apply Fix button for manual fix', () => {
      const fix = createFix({ isManualFix: true });

      render(<FixSuggestion {...defaultProps} fix={fix} />);

      expect(screen.queryByRole('button', { name: /apply fix/i })).not.toBeInTheDocument();
    });

    it('should show Continue button for manual fix', () => {
      const fix = createFix({ isManualFix: true });

      render(<FixSuggestion {...defaultProps} fix={fix} />);

      expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();
    });

    it('should display manual steps', () => {
      const fix = createFix({
        isManualFix: true,
        manualSteps: [
          'Check the cable connection',
          'Verify LED indicators',
          'Contact your ISP if issue persists',
        ],
      });

      render(<FixSuggestion {...defaultProps} fix={fix} />);

      expect(screen.getByText(/follow these steps/i)).toBeInTheDocument();
      expect(screen.getByText('Check the cable connection')).toBeInTheDocument();
      expect(screen.getByText('Verify LED indicators')).toBeInTheDocument();
      expect(screen.getByText('Contact your ISP if issue persists')).toBeInTheDocument();
    });

    it('should render manual steps as ordered list', () => {
      const fix = createFix({
        isManualFix: true,
        manualSteps: ['Step 1', 'Step 2', 'Step 3'],
      });

      const { container } = render(<FixSuggestion {...defaultProps} fix={fix} />);

      const list = container.querySelector('ol');
      expect(list).toBeInTheDocument();
      expect(list?.className).toContain('list-decimal');
    });

    it('should call onSkip when Continue button is clicked', async () => {
      const user = userEvent.setup();
      const onSkip = vi.fn();
      const fix = createFix({ isManualFix: true });

      render(<FixSuggestion {...defaultProps} fix={fix} onSkip={onSkip} />);

      await user.click(screen.getByRole('button', { name: /continue/i }));

      expect(onSkip).toHaveBeenCalledTimes(1);
    });
  });

  describe('Command Preview', () => {
    it('should not show command preview by default', () => {
      const fix = createFix();

      render(<FixSuggestion {...defaultProps} fix={fix} />);

      expect(screen.queryByText(/RouterOS Command/i)).not.toBeInTheDocument();
    });

    it('should show command preview when enabled', () => {
      const fix = createFix();

      render(<FixSuggestion {...defaultProps} fix={fix} showCommandPreview={true} />);

      expect(screen.getByText(/RouterOS Command/i)).toBeInTheDocument();
      expect(screen.getByText('/interface/enable [find name=ether1]')).toBeInTheDocument();
    });

    it('should display command in monospace font', () => {
      const fix = createFix();

      const { container } = render(
        <FixSuggestion {...defaultProps} fix={fix} showCommandPreview={true} />
      );

      const commandBlock = container.querySelector('code');
      expect(commandBlock).toBeInTheDocument();
      expect(commandBlock?.parentElement?.className).toContain('font-mono');
    });

    it('should not show command preview for manual fixes', () => {
      const fix = createFix({ isManualFix: true, command: '' });

      render(<FixSuggestion {...defaultProps} fix={fix} showCommandPreview={true} />);

      expect(screen.queryByText(/RouterOS Command/i)).not.toBeInTheDocument();
    });
  });

  describe('ISP Information', () => {
    const ispInfo: ISPInfo = {
      detected: true,
      name: 'Comcast',
      supportPhone: '1-800-COMCAST',
      supportUrl: 'https://www.comcast.com/support',
    };

    it('should show ISP info for internet-related manual fixes', () => {
      const fix = createFix({
        issueCode: 'NO_INTERNET',
        isManualFix: true,
      });

      render(<FixSuggestion {...defaultProps} fix={fix} ispInfo={ispInfo} />);

      expect(screen.getByText(/ISP Information/i)).toBeInTheDocument();
      expect(screen.getByText('Provider: Comcast')).toBeInTheDocument();
    });

    it('should display ISP phone number as clickable link', () => {
      const fix = createFix({
        issueCode: 'NO_INTERNET',
        isManualFix: true,
      });

      render(<FixSuggestion {...defaultProps} fix={fix} ispInfo={ispInfo} />);

      const phoneLink = screen.getByRole('link', { name: /1-800-COMCAST/i });
      expect(phoneLink).toHaveAttribute('href', 'tel:1-800-COMCAST');
    });

    it('should display ISP support URL as clickable link', () => {
      const fix = createFix({
        issueCode: 'NO_INTERNET',
        isManualFix: true,
      });

      render(<FixSuggestion {...defaultProps} fix={fix} ispInfo={ispInfo} />);

      const websiteLink = screen.getByRole('link', { name: /comcast.com\/support/i });
      expect(websiteLink).toHaveAttribute('href', 'https://www.comcast.com/support');
      expect(websiteLink).toHaveAttribute('target', '_blank');
      expect(websiteLink).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('should not show ISP info for non-internet issues', () => {
      const fix = createFix({
        issueCode: 'WAN_DISABLED',
        isManualFix: true,
      });

      render(<FixSuggestion {...defaultProps} fix={fix} ispInfo={ispInfo} />);

      expect(screen.queryByText(/ISP Information/i)).not.toBeInTheDocument();
    });

    it('should not show ISP info when not detected', () => {
      const fix = createFix({
        issueCode: 'NO_INTERNET',
        isManualFix: true,
      });

      const noIspInfo: ISPInfo = { detected: false };

      render(<FixSuggestion {...defaultProps} fix={fix} ispInfo={noIspInfo} />);

      expect(screen.queryByText(/ISP Information/i)).not.toBeInTheDocument();
    });

    it('should handle missing ISP contact info gracefully', () => {
      const fix = createFix({
        issueCode: 'NO_INTERNET',
        isManualFix: true,
      });

      const partialIspInfo: ISPInfo = {
        detected: true,
        name: 'Local ISP',
      };

      render(<FixSuggestion {...defaultProps} fix={fix} ispInfo={partialIspInfo} />);

      expect(screen.getByText('Provider: Local ISP')).toBeInTheDocument();
      expect(screen.queryByText(/Phone/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Website/i)).not.toBeInTheDocument();
    });
  });

  describe('Skip Button', () => {
    it('should show Skip button', () => {
      const fix = createFix();

      render(<FixSuggestion {...defaultProps} fix={fix} />);

      expect(screen.getByRole('button', { name: /skip/i })).toBeInTheDocument();
    });

    it('should call onSkip when Skip button is clicked', async () => {
      const user = userEvent.setup();
      const onSkip = vi.fn();
      const fix = createFix();

      render(<FixSuggestion {...defaultProps} fix={fix} onSkip={onSkip} />);

      await user.click(screen.getByRole('button', { name: /skip/i }));

      expect(onSkip).toHaveBeenCalledTimes(1);
    });

    it('should disable Skip button when applying', () => {
      const fix = createFix();

      render(<FixSuggestion {...defaultProps} fix={fix} status="applying" />);

      expect(screen.getByRole('button', { name: /skip/i })).toBeDisabled();
    });

    it('should enable Skip button when not applying', () => {
      const fix = createFix();

      render(<FixSuggestion {...defaultProps} fix={fix} status="idle" />);

      expect(screen.getByRole('button', { name: /skip/i })).not.toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper touch target size for buttons (min 44px)', () => {
      const fix = createFix();

      render(<FixSuggestion {...defaultProps} fix={fix} />);

      const applyButton = screen.getByRole('button', { name: /apply fix/i });
      const skipButton = screen.getByRole('button', { name: /skip/i });

      expect(applyButton.className).toContain('min-h-[44px]');
      expect(skipButton.className).toContain('min-h-[44px]');
    });

    it('should have accessible button labels', () => {
      const fix = createFix();

      render(<FixSuggestion {...defaultProps} fix={fix} />);

      const applyButton = screen.getByRole('button', { name: /apply fix/i });
      expect(applyButton).toHaveAccessibleName();

      const skipButton = screen.getByRole('button', { name: /skip/i });
      expect(skipButton).toHaveAccessibleName();
    });

    it('should link Apply button to fix description with aria-describedby', () => {
      const fix = createFix();

      render(<FixSuggestion {...defaultProps} fix={fix} />);

      const applyButton = screen.getByRole('button', { name: /apply fix/i });
      expect(applyButton).toHaveAttribute('aria-describedby', `fix-description-${fix.issueCode}`);
    });

    it('should hide decorative icons from screen readers', () => {
      const fix = createFix();

      const { container } = render(<FixSuggestion {...defaultProps} fix={fix} />);

      const icons = container.querySelectorAll('[aria-hidden="true"]');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('should have proper heading hierarchy', () => {
      const fix = createFix();

      const { container } = render(<FixSuggestion {...defaultProps} fix={fix} />);

      const heading = container.querySelector('h3');
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('Enable WAN Interface');
    });

    it('should have accessible external links', () => {
      const fix = createFix({
        issueCode: 'NO_INTERNET',
        isManualFix: true,
      });

      const ispInfo: ISPInfo = {
        detected: true,
        supportUrl: 'https://example.com',
      };

      render(<FixSuggestion {...defaultProps} fix={fix} ispInfo={ispInfo} />);

      const link = screen.getByRole('link', { name: /example.com/i });
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing confidence gracefully', () => {
      const fix = createFix({ confidence: undefined });

      render(<FixSuggestion {...defaultProps} fix={fix} />);

      expect(screen.queryByText(/confidence/i)).not.toBeInTheDocument();
    });

    it('should handle empty manual steps', () => {
      const fix = createFix({
        isManualFix: true,
        manualSteps: [],
      });

      render(<FixSuggestion {...defaultProps} fix={fix} />);

      expect(screen.queryByText(/follow these steps/i)).not.toBeInTheDocument();
    });

    it('should handle empty command', () => {
      const fix = createFix({ command: '' });

      render(<FixSuggestion {...defaultProps} fix={fix} showCommandPreview={true} />);

      expect(screen.queryByText(/RouterOS Command/i)).not.toBeInTheDocument();
    });

    it('should handle very long description text', () => {
      const fix = createFix({
        description:
          'This is a very long description that explains in great detail what the issue is and how to fix it. ' +
          'It contains multiple sentences and provides comprehensive information about the problem and the solution. ' +
          'The component should handle this gracefully without layout issues.',
      });

      render(<FixSuggestion {...defaultProps} fix={fix} />);

      expect(screen.getByText(/This is a very long description/)).toBeInTheDocument();
    });

    it('should handle null ISP info', () => {
      const fix = createFix({
        issueCode: 'NO_INTERNET',
        isManualFix: true,
      });

      render(<FixSuggestion {...defaultProps} fix={fix} ispInfo={undefined} />);

      expect(screen.queryByText(/ISP Information/i)).not.toBeInTheDocument();
    });
  });
});
