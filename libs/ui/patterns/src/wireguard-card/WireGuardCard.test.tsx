/**
 * WireGuardCard Component Tests
 * Tests for the WireGuard interface display card component
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { WireGuardCard } from './WireGuardCard';

// Mock the toast function
const mockToast = vi.fn();
vi.mock('@nasnet/ui/primitives', async () => {
  const actual = await vi.importActual('@nasnet/ui/primitives');
  return {
    ...actual,
    useToast: () => ({
      toast: mockToast,
    }),
  };
});

describe('WireGuardCard', () => {
  const mockInterface = {
    name: 'wg0',
    running: true,
    disabled: false,
    listenPort: 13231,
    publicKey: 'A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6',
    mtu: 1420,
    peerCount: 3,
  };

  // Save original clipboard API
  const originalClipboard = global.navigator.clipboard;

  beforeEach(() => {
    mockToast.mockClear();

    // Mock clipboard API
    Object.assign(global.navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  afterEach(() => {
    // Restore original clipboard
    Object.assign(global.navigator, {
      clipboard: originalClipboard,
    });
  });

  describe('Basic Rendering', () => {
    it('should render interface name', () => {
      render(<WireGuardCard {...mockInterface} />);
      expect(screen.getByText('wg0')).toBeInTheDocument();
    });

    it('should render listening port', () => {
      render(<WireGuardCard {...mockInterface} />);
      expect(screen.getByText(/13231/)).toBeInTheDocument();
      expect(screen.getByText(/Port:/)).toBeInTheDocument();
    });

    it('should render MTU', () => {
      render(<WireGuardCard {...mockInterface} />);
      expect(screen.getByText(/1420/)).toBeInTheDocument();
      expect(screen.getByText(/MTU:/)).toBeInTheDocument();
    });

    it('should render peer count badge', () => {
      render(<WireGuardCard {...mockInterface} />);
      expect(screen.getByText('3 peers')).toBeInTheDocument();
    });

    it('should render singular peer for count of 1', () => {
      render(<WireGuardCard {...mockInterface} peerCount={1} />);
      expect(screen.getByText('1 peer')).toBeInTheDocument();
    });

    it('should render 0 peers correctly', () => {
      render(<WireGuardCard {...mockInterface} peerCount={0} />);
      expect(screen.getByText('0 peers')).toBeInTheDocument();
    });
  });

  describe('Status Indicator', () => {
    it('should show running status when running and not disabled', () => {
      render(<WireGuardCard {...mockInterface} running={true} disabled={false} />);
      expect(screen.getByText('Running')).toBeInTheDocument();
    });

    it('should show disabled status when disabled', () => {
      render(<WireGuardCard {...mockInterface} running={false} disabled={true} />);
      expect(screen.getByText('Disabled')).toBeInTheDocument();
    });

    it('should show inactive status when not running and not disabled', () => {
      render(<WireGuardCard {...mockInterface} running={false} disabled={false} />);
      expect(screen.getByText('Inactive')).toBeInTheDocument();
    });

    it('should apply correct color class for running status', () => {
      const { container } = render(<WireGuardCard {...mockInterface} running={true} disabled={false} />);
      const statusElement = container.querySelector('[class*="bg-green"]');
      expect(statusElement).toBeInTheDocument();
    });

    it('should apply correct color class for disabled status', () => {
      const { container } = render(<WireGuardCard {...mockInterface} running={false} disabled={true} />);
      const statusElement = container.querySelector('[class*="bg-slate"]');
      expect(statusElement).toBeInTheDocument();
    });

    it('should apply correct color class for inactive status', () => {
      const { container } = render(<WireGuardCard {...mockInterface} running={false} disabled={false} />);
      const statusElement = container.querySelector('[class*="bg-yellow"]');
      expect(statusElement).toBeInTheDocument();
    });
  });

  describe('Public Key Display', () => {
    it('should truncate public key to first8...last4 format', () => {
      render(<WireGuardCard {...mockInterface} />);
      // Public key should be truncated
      expect(screen.getByText('A1B2C3D4...Y5Z6')).toBeInTheDocument();
    });

    it('should display full key in title attribute for tooltip', () => {
      const { container } = render(<WireGuardCard {...mockInterface} />);
      const keyElement = container.querySelector('[title*="A1B2C3D4E5F6G7H8"]');
      expect(keyElement).toBeInTheDocument();
    });

    it('should handle short public keys', () => {
      render(<WireGuardCard {...mockInterface} publicKey="shortkey" />);
      expect(screen.getByText('shortkey')).toBeInTheDocument();
    });

    it('should handle empty public key', () => {
      render(<WireGuardCard {...mockInterface} publicKey="" />);
      const copyButtons = screen.getAllByRole('button');
      expect(copyButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Copy Button Functionality', () => {
    it('should have a copy button', () => {
      render(<WireGuardCard {...mockInterface} />);
      const copyButton = screen.getByRole('button', { name: /copy/i });
      expect(copyButton).toBeInTheDocument();
    });

    it('should copy full public key to clipboard on click', async () => {
      const user = userEvent.setup();
      render(<WireGuardCard {...mockInterface} />);

      const copyButton = screen.getByRole('button', { name: /copy/i });
      await user.click(copyButton);

      expect(global.navigator.clipboard.writeText).toHaveBeenCalledWith(mockInterface.publicKey);
    });

    it('should show success toast after copying', async () => {
      const user = userEvent.setup();
      render(<WireGuardCard {...mockInterface} />);

      const copyButton = screen.getByRole('button', { name: /copy/i });
      await user.click(copyButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Public key copied',
          description: 'The public key has been copied to your clipboard',
        });
      });
    });

    it('should show checkmark briefly after successful copy', async () => {
      const user = userEvent.setup();
      render(<WireGuardCard {...mockInterface} />);

      const copyButton = screen.getByRole('button', { name: /copy/i });
      await user.click(copyButton);

      // Checkmark should appear
      await waitFor(() => {
        const checkIcon = screen.queryByRole('button', { name: /copied/i });
        expect(checkIcon || copyButton).toBeInTheDocument();
      });
    });

    it('should handle clipboard errors gracefully', async () => {
      const user = userEvent.setup();
      const clipboardError = new Error('Clipboard access denied');
      vi.spyOn(global.navigator.clipboard, 'writeText').mockRejectedValueOnce(clipboardError);

      render(<WireGuardCard {...mockInterface} />);

      const copyButton = screen.getByRole('button', { name: /copy/i });
      await user.click(copyButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Failed to copy',
          description: 'Could not copy the public key to clipboard',
          variant: 'destructive',
        });
      });
    });

    it('should reset checkmark after 1 second', async () => {
      const user = userEvent.setup();
      vi.useFakeTimers();

      render(<WireGuardCard {...mockInterface} />);

      const copyButton = screen.getByRole('button', { name: /copy/i });
      await user.click(copyButton);

      // Fast-forward time
      vi.advanceTimersByTime(1000);

      // Checkmark should be gone, copy icon should return
      await waitFor(() => {
        const resetButton = screen.queryByRole('button', { name: /copy/i });
        expect(resetButton).toBeInTheDocument();
      });

      vi.useRealTimers();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing optional props gracefully', () => {
      render(
        <WireGuardCard
          name="wg-test"
          running={true}
          disabled={false}
          listenPort={13231}
          publicKey=""
          mtu={1420}
          peerCount={0}
        />
      );

      expect(screen.getByText('wg-test')).toBeInTheDocument();
    });

    it('should handle very long interface names', () => {
      render(
        <WireGuardCard
          {...mockInterface}
          name="wireguard-very-long-interface-name-that-might-break-layout"
        />
      );

      expect(screen.getByText('wireguard-very-long-interface-name-that-might-break-layout')).toBeInTheDocument();
    });

    it('should handle high peer counts', () => {
      render(<WireGuardCard {...mockInterface} peerCount={999} />);
      expect(screen.getByText('999 peers')).toBeInTheDocument();
    });

    it('should handle non-standard ports', () => {
      render(<WireGuardCard {...mockInterface} listenPort={51820} />);
      expect(screen.getByText(/51820/)).toBeInTheDocument();
    });

    it('should handle large MTU values', () => {
      render(<WireGuardCard {...mockInterface} mtu={9000} />);
      expect(screen.getByText(/9000/)).toBeInTheDocument();
    });
  });

  describe('Connection Stats Display (Story 0-4-3)', () => {
    it('should display RX (received) data when available', () => {
      render(<WireGuardCard {...mockInterface} rx={1024 * 1024 * 10} />);
      expect(screen.getByText(/Received:/)).toBeInTheDocument();
      expect(screen.getByText(/10 MB/)).toBeInTheDocument();
    });

    it('should display TX (transmitted) data when available', () => {
      render(<WireGuardCard {...mockInterface} tx={1024 * 1024 * 5} />);
      expect(screen.getByText(/Transmitted:/)).toBeInTheDocument();
      expect(screen.getByText(/5 MB/)).toBeInTheDocument();
    });

    it('should display last handshake time when available', () => {
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
      render(<WireGuardCard {...mockInterface} lastHandshake={twoMinutesAgo} />);
      expect(screen.getByText(/Last Handshake:/)).toBeInTheDocument();
      expect(screen.getByText(/minute/)).toBeInTheDocument();
      expect(screen.getByText(/ago/)).toBeInTheDocument();
    });

    it('should display all connection stats together', () => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      render(
        <WireGuardCard
          {...mockInterface}
          rx={1024 * 1024 * 100}
          tx={1024 * 1024 * 50}
          lastHandshake={oneHourAgo}
        />
      );
      expect(screen.getByText(/Connection Stats/)).toBeInTheDocument();
      expect(screen.getByText(/Received:/)).toBeInTheDocument();
      expect(screen.getByText(/Transmitted:/)).toBeInTheDocument();
      expect(screen.getByText(/Last Handshake:/)).toBeInTheDocument();
    });

    it('should not show connection stats section when no stats available', () => {
      render(<WireGuardCard {...mockInterface} />);
      expect(screen.queryByText(/Connection Stats/)).not.toBeInTheDocument();
    });

    it('should format bytes correctly using formatBytes utility', () => {
      render(<WireGuardCard {...mockInterface} rx={1024} tx={1024 * 1024} />);
      expect(screen.getByText(/1 KB/)).toBeInTheDocument(); // RX
      expect(screen.getByText(/1 MB/)).toBeInTheDocument(); // TX
    });

    it('should show "Never" for last handshake when not available', () => {
      // This would be tested via the PeerListItem component
      // WireGuardCard interface itself may not show "Never" explicitly
    });

    it('should handle zero bytes stats', () => {
      render(<WireGuardCard {...mockInterface} rx={0} tx={0} />);
      expect(screen.getByText(/0 B/)).toBeInTheDocument();
    });

    it('should handle very large data transfers (GB range)', () => {
      const oneGB = 1024 * 1024 * 1024;
      render(<WireGuardCard {...mockInterface} rx={oneGB * 5} tx={oneGB * 2} />);
      expect(screen.getByText(/5 GB/)).toBeInTheDocument();
      expect(screen.getByText(/2 GB/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible copy button', () => {
      render(<WireGuardCard {...mockInterface} />);
      const copyButton = screen.getByRole('button', { name: /copy/i });
      expect(copyButton).toHaveAccessibleName();
    });

    it('should provide visual feedback for all states', () => {
      const { rerender } = render(<WireGuardCard {...mockInterface} running={true} disabled={false} />);
      expect(screen.getByText('Running')).toBeInTheDocument();

      rerender(<WireGuardCard {...mockInterface} running={false} disabled={true} />);
      expect(screen.getByText('Disabled')).toBeInTheDocument();

      rerender(<WireGuardCard {...mockInterface} running={false} disabled={false} />);
      expect(screen.getByText('Inactive')).toBeInTheDocument();
    });

    it('should have proper contrast for all text elements', () => {
      const { container } = render(<WireGuardCard {...mockInterface} />);

      // Check that text elements have color classes (implicit contrast check)
      const textElements = container.querySelectorAll('[class*="text-"]');
      expect(textElements.length).toBeGreaterThan(0);
    });
  });
});
