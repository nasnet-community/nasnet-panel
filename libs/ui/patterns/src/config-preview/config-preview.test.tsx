/**
 * ConfigPreview Component Tests
 *
 * Tests for the ConfigPreview component and its presenters.
 *
 * @see NAS-4A.21 - Build Config Preview Component
 */

import * as React from 'react';

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { axe } from 'vitest-axe';

import { ConfigPreview } from './config-preview';
import { ConfigPreviewDesktop } from './config-preview-desktop';
import { ConfigPreviewMobile } from './config-preview-mobile';

// Note: vitest-axe matchers are extended globally in src/test/setup.ts

// Mock usePlatform hook
vi.mock('@nasnet/ui/layouts', () => ({
  usePlatform: () => 'desktop',
}));

// Mock clipboard API
const mockClipboard = {
  writeText: vi.fn().mockResolvedValue(undefined),
};

// Mock toast
vi.mock('../hooks/useToast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('ConfigPreview', () => {
  const sampleScript = `/interface ethernet
set [ find default-name=ether1 ] name=ether1-wan

/ip address
add address=192.168.88.1/24 interface=bridge network=192.168.88.0

/ip firewall filter
add action=accept chain=input connection-state=established,related`;

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, 'clipboard', {
      value: mockClipboard,
      writable: true,
    });

    // Mock URL methods
    global.URL.createObjectURL = vi.fn().mockReturnValue('blob:test');
    global.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('rendering', () => {
    it('renders with script content', () => {
      render(
        <ConfigPreview
          script={sampleScript}
          title="Test Config"
        />
      );

      expect(screen.getByRole('region', { name: 'Test Config' })).toBeInTheDocument();
    });

    it('renders with custom title', () => {
      render(
        <ConfigPreview
          script={sampleScript}
          title="My Router Config"
        />
      );

      expect(screen.getByText('My Router Config')).toBeInTheDocument();
    });

    it('displays total line count', () => {
      const script = 'line1\nline2\nline3';
      render(<ConfigPreview script={script} />);

      expect(screen.getByText(/3 lines/)).toBeInTheDocument();
    });

    it('renders Copy button', () => {
      render(<ConfigPreview script={sampleScript} />);

      expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
    });

    it('renders Download button', () => {
      render(<ConfigPreview script={sampleScript} />);

      expect(screen.getByRole('button', { name: /download/i })).toBeInTheDocument();
    });
  });

  describe('copy functionality', () => {
    it('copies script to clipboard when Copy button is clicked', async () => {
      const user = userEvent.setup();
      render(<ConfigPreview script={sampleScript} />);

      const copyButton = screen.getByRole('button', { name: /copy/i });
      await user.click(copyButton);

      expect(mockClipboard.writeText).toHaveBeenCalledWith(sampleScript);
    });

    it('shows Copied state after successful copy', async () => {
      const user = userEvent.setup();
      render(<ConfigPreview script={sampleScript} />);

      const copyButton = screen.getByRole('button', { name: /copy/i });
      await user.click(copyButton);

      await waitFor(() => {
        expect(screen.getByText(/copied/i)).toBeInTheDocument();
      });
    });

    it('calls onCopy callback when provided', async () => {
      const onCopy = vi.fn();
      const user = userEvent.setup();
      render(
        <ConfigPreview
          script={sampleScript}
          onCopy={onCopy}
        />
      );

      const copyButton = screen.getByRole('button', { name: /copy/i });
      await user.click(copyButton);

      await waitFor(() => {
        expect(onCopy).toHaveBeenCalled();
      });
    });
  });

  describe('download functionality', () => {
    it('triggers download when Download button is clicked', async () => {
      const user = userEvent.setup();
      const mockClick = vi.fn();
      const mockLink = {
        href: '',
        download: '',
        click: mockClick,
      };

      vi.spyOn(document, 'createElement').mockReturnValue(mockLink as unknown as HTMLAnchorElement);
      vi.spyOn(document.body, 'appendChild').mockImplementation(
        () => mockLink as unknown as HTMLAnchorElement
      );
      vi.spyOn(document.body, 'removeChild').mockImplementation(
        () => mockLink as unknown as HTMLAnchorElement
      );

      render(
        <ConfigPreview
          script={sampleScript}
          routerName="test-router"
        />
      );

      const downloadButton = screen.getByRole('button', { name: /download/i });
      await user.click(downloadButton);

      expect(mockClick).toHaveBeenCalled();
    });

    it('calls onDownload callback when provided', async () => {
      const onDownload = vi.fn();
      const user = userEvent.setup();
      const mockLink = { href: '', download: '', click: vi.fn() };

      vi.spyOn(document, 'createElement').mockReturnValue(mockLink as unknown as HTMLAnchorElement);
      vi.spyOn(document.body, 'appendChild').mockImplementation(
        () => mockLink as unknown as HTMLAnchorElement
      );
      vi.spyOn(document.body, 'removeChild').mockImplementation(
        () => mockLink as unknown as HTMLAnchorElement
      );

      render(
        <ConfigPreview
          script={sampleScript}
          onDownload={onDownload}
        />
      );

      const downloadButton = screen.getByRole('button', { name: /download/i });
      await user.click(downloadButton);

      expect(onDownload).toHaveBeenCalled();
    });
  });

  describe('diff view', () => {
    it('shows diff stats when showDiff is true', () => {
      const oldScript = 'line1\nline2';
      const newScript = 'line1\nline3';

      render(
        <ConfigPreview
          script={newScript}
          previousScript={oldScript}
          showDiff
        />
      );

      // Should show added and removed counts
      expect(screen.getByText(/\+1/)).toBeInTheDocument();
      expect(screen.getByText(/-1/)).toBeInTheDocument();
    });

    it('does not show diff stats when showDiff is false', () => {
      render(
        <ConfigPreview
          script="script"
          previousScript="old script"
          showDiff={false}
        />
      );

      expect(screen.queryByText(/\+\d/)).not.toBeInTheDocument();
    });
  });

  describe('collapsible sections', () => {
    it('shows Expand All / Collapse All buttons when collapsible', () => {
      render(
        <ConfigPreview
          script={sampleScript}
          collapsible
        />
      );

      expect(screen.getByRole('button', { name: /expand all/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /collapse all/i })).toBeInTheDocument();
    });

    it('hides section controls when collapsible is false', () => {
      render(
        <ConfigPreview
          script={sampleScript}
          collapsible={false}
        />
      );

      expect(screen.queryByRole('button', { name: /expand all/i })).not.toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(
        <ConfigPreview
          script={sampleScript}
          title="Accessible Config"
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has proper ARIA role on main container', () => {
      render(
        <ConfigPreview
          script={sampleScript}
          title="My Config"
        />
      );

      expect(screen.getByRole('region', { name: 'My Config' })).toBeInTheDocument();
    });

    it('has aria-label on interactive elements', () => {
      render(<ConfigPreview script={sampleScript} />);

      const copyButton = screen.getByRole('button', { name: /copy/i });
      expect(copyButton).toHaveAttribute('aria-label');

      const downloadButton = screen.getByRole('button', { name: /download/i });
      expect(downloadButton).toHaveAttribute('aria-label');
    });

    it('has aria-live region for feedback', () => {
      render(<ConfigPreview script={sampleScript} />);

      const liveRegion = document.querySelector('[aria-live]');
      expect(liveRegion).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(
        <ConfigPreview
          script={sampleScript}
          collapsible
        />
      );

      // Tab through buttons
      await user.tab();
      expect(document.activeElement?.textContent).toMatch(/expand|collapse|copy|download/i);

      await user.tab();
      expect(document.activeElement?.textContent).toMatch(/expand|collapse|copy|download/i);
    });
  });
});

describe('ConfigPreviewDesktop', () => {
  const script = '/interface\nset name=eth1';

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      writable: true,
    });
  });

  it('renders Card layout', () => {
    render(<ConfigPreviewDesktop script={script} />);

    // Card should be present (role=region with title)
    expect(screen.getByRole('region', { name: /configuration/i })).toBeInTheDocument();
  });

  it('shows section controls for multiple sections', () => {
    const multiSectionScript = `/interface\nset\n\n/ip\nadd`;
    render(
      <ConfigPreviewDesktop
        script={multiSectionScript}
        collapsible
      />
    );

    expect(screen.getByText(/expand all/i)).toBeInTheDocument();
    expect(screen.getByText(/collapse all/i)).toBeInTheDocument();
  });

  it('applies maxHeight style', () => {
    const { container } = render(
      <ConfigPreviewDesktop
        script={script}
        maxHeight={300}
      />
    );

    const scrollContainer = container.querySelector('.overflow-auto');
    expect(scrollContainer).toHaveStyle({ maxHeight: '300px' });
  });
});

describe('ConfigPreviewMobile', () => {
  const script = '/interface\nset name=eth1';

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      writable: true,
    });
  });

  it('renders simplified mobile layout', () => {
    render(
      <ConfigPreviewMobile
        script={script}
        title="Mobile Config"
      />
    );

    expect(screen.getByRole('region', { name: 'Mobile Config' })).toBeInTheDocument();
  });

  it('has minimum 44px touch targets for buttons', () => {
    render(<ConfigPreviewMobile script={script} />);

    const copyButton = screen.getByRole('button', { name: /copy/i });
    const downloadButton = screen.getByRole('button', { name: /download/i });

    expect(copyButton).toHaveClass('min-h-[44px]');
    expect(downloadButton).toHaveClass('min-h-[44px]');
  });

  it('shows stacked buttons', () => {
    render(<ConfigPreviewMobile script={script} />);

    const copyButton = screen.getByRole('button', { name: /copy/i });
    const downloadButton = screen.getByRole('button', { name: /download/i });

    // Both should have flex-1 for equal width
    expect(copyButton).toHaveClass('flex-1');
    expect(downloadButton).toHaveClass('flex-1');
  });

  it('does not show section controls', () => {
    const multiSectionScript = `/interface\nset\n\n/ip\nadd`;
    render(<ConfigPreviewMobile script={multiSectionScript} />);

    expect(screen.queryByText(/expand all/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/collapse all/i)).not.toBeInTheDocument();
  });
});
