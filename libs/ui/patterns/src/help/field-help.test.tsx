/**
 * Field Help Component Tests
 *
 * Tests for the FieldHelp component, hooks, and presenters.
 *
 * @module @nasnet/ui/patterns/help
 * @see NAS-4A.12: Build Help System Components
 */

import * as React from 'react';

import { render, screen, waitFor , renderHook, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { axe } from 'vitest-axe';

import {
  FieldHelp,
  FieldHelpDesktop,
  FieldHelpMobile,
  HelpModeToggle,
  HelpIcon,
  HelpPopover,
  HelpSheet,
  useFieldHelp,
  useHelpMode,
} from './index';

import type { HelpContent, UseFieldHelpReturn } from './help.types';

// Note: vitest-axe matchers are extended in setup.ts

// Mock usePlatform hook
vi.mock('@nasnet/ui/layouts', () => ({
  usePlatform: vi.fn(() => 'desktop'),
}));

// Mock useTranslation hook
vi.mock('@nasnet/core/i18n', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string; returnObjects?: boolean }) => {
      const translations: Record<string, string | string[]> = {
        'help.ip.title.simple': 'IP Address',
        'help.ip.title.technical': 'IPv4/IPv6 Address',
        'help.ip.description.simple': 'The unique address that identifies this device on the network',
        'help.ip.description.technical': 'A 32-bit (IPv4) or 128-bit (IPv6) network layer address',
        'help.ip.examples': ['192.168.1.1', '10.0.0.1'],
        'help.ip.link': 'https://wiki.mikrotik.com/wiki/Manual:IP/Address',
        'help.gateway.title.simple': 'Gateway',
        'help.gateway.title.technical': 'Default Route',
        'help.gateway.description.simple': 'The router that connects your network to the internet',
        'help.gateway.description.technical': 'The next-hop address for packets destined outside the local subnet',
        'help.gateway.examples': ['192.168.1.1'],
        'help.gateway.link': 'https://wiki.mikrotik.com/wiki/Manual:IP/Route',
      };

      if (options?.returnObjects && key.includes('examples')) {
        return translations[key] || [];
      }

      return translations[key] || options?.defaultValue || key;
    },
    ready: true,
  }),
}));

// Mock Zustand store
const mockHelpModeStore = {
  mode: 'simple' as 'simple' | 'technical',
  toggleMode: vi.fn(),
  setMode: vi.fn(),
};

vi.mock('@nasnet/state/stores', () => ({
  useHelpModeStore: (selector: (state: typeof mockHelpModeStore) => unknown) => selector(mockHelpModeStore),
}));

// Sample help content for testing
const sampleContent: HelpContent = {
  title: 'IP Address',
  description: 'The unique address that identifies this device on the network',
  examples: ['192.168.1.1', '10.0.0.1'],
  link: 'https://wiki.mikrotik.com/wiki/Manual:IP/Address',
};

describe('useFieldHelp Hook', () => {
  beforeEach(() => {
    mockHelpModeStore.mode = 'simple';
    vi.clearAllMocks();
  });

  it('should return content from i18n based on field key', () => {
    const { result } = renderHook(() => useFieldHelp({ field: 'ip' }));

    expect(result.current.content.title).toBe('IP Address');
    expect(result.current.content.description).toBe('The unique address that identifies this device on the network');
    expect(result.current.content.examples).toEqual(['192.168.1.1', '10.0.0.1']);
    expect(result.current.content.link).toBe('https://wiki.mikrotik.com/wiki/Manual:IP/Address');
  });

  it('should use global mode from store by default', () => {
    const { result } = renderHook(() => useFieldHelp({ field: 'ip' }));

    expect(result.current.mode).toBe('simple');
  });

  it('should use prop mode when provided', () => {
    const { result } = renderHook(() => useFieldHelp({ field: 'ip', mode: 'technical' }));

    expect(result.current.mode).toBe('technical');
  });

  it('should manage open/closed state', () => {
    const { result } = renderHook(() => useFieldHelp({ field: 'ip' }));

    expect(result.current.isOpen).toBe(false);

    act(() => {
      result.current.setIsOpen(true);
    });

    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.toggle();
    });

    expect(result.current.isOpen).toBe(false);
  });

  it('should generate correct ARIA label', () => {
    const { result } = renderHook(() => useFieldHelp({ field: 'ip' }));

    expect(result.current.ariaLabel).toBe('Help for IP Address field');
  });

  it('should indicate when i18n is ready', () => {
    const { result } = renderHook(() => useFieldHelp({ field: 'ip' }));

    expect(result.current.isReady).toBe(true);
  });
});

describe('useHelpMode Hook', () => {
  beforeEach(() => {
    mockHelpModeStore.mode = 'simple';
    vi.clearAllMocks();
  });

  it('should return current mode', () => {
    const { result } = renderHook(() => useHelpMode());

    expect(result.current.mode).toBe('simple');
    expect(result.current.isSimple).toBe(true);
    expect(result.current.isTechnical).toBe(false);
  });

  it('should provide toggleMode function', () => {
    const { result } = renderHook(() => useHelpMode());

    result.current.toggleMode();

    expect(mockHelpModeStore.toggleMode).toHaveBeenCalled();
  });

  it('should provide setMode function', () => {
    const { result } = renderHook(() => useHelpMode());

    result.current.setMode('technical');

    expect(mockHelpModeStore.setMode).toHaveBeenCalledWith('technical');
  });
});

describe('HelpIcon Component', () => {
  it('should render with correct ARIA label', () => {
    render(<HelpIcon field="gateway" />);

    const icon = screen.getByRole('button', { name: /help for gateway field/i });
    expect(icon).toBeInTheDocument();
  });

  it('should call onClick when clicked', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<HelpIcon field="ip" onClick={handleClick} />);

    const icon = screen.getByRole('button');
    await user.click(icon);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be keyboard accessible', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<HelpIcon field="ip" onClick={handleClick} />);

    const icon = screen.getByRole('button');
    await user.tab();
    expect(icon).toHaveFocus();

    await user.keyboard('{Enter}');
    expect(handleClick).toHaveBeenCalledTimes(1);

    await user.keyboard(' ');
    expect(handleClick).toHaveBeenCalledTimes(2);
  });

  it('should apply size classes', () => {
    const { rerender } = render(<HelpIcon field="ip" size="sm" />);
    expect(screen.getByRole('button')).toHaveClass('h-5', 'w-5');

    rerender(<HelpIcon field="ip" size="md" />);
    expect(screen.getByRole('button')).toHaveClass('h-6', 'w-6');

    rerender(<HelpIcon field="ip" size="lg" />);
    expect(screen.getByRole('button')).toHaveClass('h-8', 'w-8');
  });

  it('should have no accessibility violations', async () => {
    const { container } = render(<HelpIcon field="ip" />);

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

describe('HelpPopover Component', () => {
  it('should render trigger children', () => {
    render(
      <HelpPopover content={sampleContent}>
        <button data-testid="trigger">Open</button>
      </HelpPopover>
    );

    expect(screen.getByTestId('trigger')).toBeInTheDocument();
  });

  it('should show content when open', async () => {
    render(
      <HelpPopover content={sampleContent} open={true} onOpenChange={() => {}}>
        <button>Trigger</button>
      </HelpPopover>
    );

    expect(screen.getByText('IP Address')).toBeInTheDocument();
    expect(screen.getByText(/unique address/i)).toBeInTheDocument();
    expect(screen.getByText('192.168.1.1')).toBeInTheDocument();
    expect(screen.getByText('10.0.0.1')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /learn more/i })).toBeInTheDocument();
  });

  it('should call onOpenChange when closed', async () => {
    const handleOpenChange = vi.fn();
    const user = userEvent.setup();

    render(
      <HelpPopover content={sampleContent} open={true} onOpenChange={handleOpenChange}>
        <button>Trigger</button>
      </HelpPopover>
    );

    // Press Escape to close
    await user.keyboard('{Escape}');

    expect(handleOpenChange).toHaveBeenCalledWith(false);
  });

  it('should render external link with correct attributes', async () => {
    render(
      <HelpPopover content={sampleContent} open={true} onOpenChange={() => {}}>
        <button>Trigger</button>
      </HelpPopover>
    );

    const link = screen.getByRole('link', { name: /learn more/i });
    expect(link).toHaveAttribute('href', sampleContent.link);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });
});

describe('HelpSheet Component', () => {
  it('should show content when open', async () => {
    render(
      <HelpSheet content={sampleContent} open={true} onOpenChange={() => {}} />
    );

    expect(screen.getByText('IP Address')).toBeInTheDocument();
    expect(screen.getByText(/unique address/i)).toBeInTheDocument();
  });

  it('should call onOpenChange when closed', async () => {
    const handleOpenChange = vi.fn();
    const user = userEvent.setup();

    render(
      <HelpSheet content={sampleContent} open={true} onOpenChange={handleOpenChange} />
    );

    // Find and click close button
    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);

    expect(handleOpenChange).toHaveBeenCalledWith(false);
  });

  it('should have drag handle indicator', async () => {
    render(
      <HelpSheet content={sampleContent} open={true} onOpenChange={() => {}} />
    );

    // Check for drag handle element (styled div)
    const sheetContent = document.querySelector('[class*="rounded-t"]');
    expect(sheetContent).toBeInTheDocument();
  });
});

describe('HelpModeToggle Component', () => {
  beforeEach(() => {
    mockHelpModeStore.mode = 'simple';
    vi.clearAllMocks();
  });

  it('should render with Simple and Technical labels', () => {
    render(<HelpModeToggle />);

    expect(screen.getByText('Simple')).toBeInTheDocument();
    expect(screen.getByText('Technical')).toBeInTheDocument();
  });

  it('should toggle mode when switch is clicked', async () => {
    const user = userEvent.setup();

    render(<HelpModeToggle />);

    const toggle = screen.getByRole('switch');
    await user.click(toggle);

    expect(mockHelpModeStore.toggleMode).toHaveBeenCalled();
  });

  it('should render compact variant without labels', () => {
    render(<HelpModeToggle compact />);

    expect(screen.queryByText('Simple')).not.toBeInTheDocument();
    expect(screen.queryByText('Technical')).not.toBeInTheDocument();
    expect(screen.getByRole('switch')).toBeInTheDocument();
  });

  it('should support custom labels', () => {
    render(<HelpModeToggle simpleLabel="Beginner" technicalLabel="Expert" />);

    expect(screen.getByText('Beginner')).toBeInTheDocument();
    expect(screen.getByText('Expert')).toBeInTheDocument();
  });

  it('should have no accessibility violations', async () => {
    const { container } = render(<HelpModeToggle />);

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

describe('FieldHelp Component', () => {
  it('should render desktop presenter on desktop platform', () => {
    render(<FieldHelp field="ip" />);

    // HelpIcon should be rendered
    const icon = screen.getByRole('button', { name: /help for/i });
    expect(icon).toBeInTheDocument();
  });

  it('should open popover on click (desktop)', async () => {
    const user = userEvent.setup();

    render(<FieldHelp field="ip" />);

    const icon = screen.getByRole('button', { name: /help for/i });
    await user.click(icon);

    await waitFor(() => {
      expect(screen.getByText('IP Address')).toBeInTheDocument();
    });
  });

  it('should pass placement prop to popover', () => {
    render(<FieldHelp field="ip" placement="bottom" />);

    // Verify component renders (placement is internal to Popover)
    const icon = screen.getByRole('button');
    expect(icon).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(<FieldHelp field="ip" className="custom-class" />);

    const icon = screen.getByRole('button');
    expect(icon).toHaveClass('custom-class');
  });

  it('should have proper ARIA attributes', () => {
    render(<FieldHelp field="gateway" />);

    const icon = screen.getByRole('button');
    expect(icon).toHaveAttribute('aria-label', 'Help for Gateway field');
    expect(icon).toHaveAttribute('aria-haspopup', 'dialog');
    expect(icon).toHaveAttribute('aria-expanded', 'false');
  });

  it('should have no accessibility violations', async () => {
    const { container } = render(<FieldHelp field="ip" />);

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

describe('Accessibility', () => {
  it('HelpIcon should have correct focus styles', () => {
    render(<HelpIcon field="ip" />);

    const icon = screen.getByRole('button');
    expect(icon).toHaveClass('focus-visible:ring-[3px]');
  });

  it('should support keyboard navigation for popover', async () => {
    const user = userEvent.setup();

    render(<FieldHelp field="ip" />);

    // Tab to focus icon
    await user.tab();
    const icon = screen.getByRole('button');
    expect(icon).toHaveFocus();

    // Enter to open
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.getByText('IP Address')).toBeInTheDocument();
    });

    // Escape to close
    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByText('IP Address')).not.toBeInTheDocument();
    });
  });

  it('should have minimum 44px touch target on mobile sizes', () => {
    render(<HelpIcon field="ip" size="sm" />);

    const icon = screen.getByRole('button');
    expect(icon).toHaveClass('min-h-[44px]');
    expect(icon).toHaveClass('min-w-[44px]');
  });
});

describe('Content Handling', () => {
  it('should handle content without examples', async () => {
    const contentWithoutExamples: HelpContent = {
      title: 'Custom Field',
      description: 'This field has no examples',
    };

    render(
      <HelpPopover content={contentWithoutExamples} open={true} onOpenChange={() => {}}>
        <button>Trigger</button>
      </HelpPopover>
    );

    expect(screen.getByText('Custom Field')).toBeInTheDocument();
    expect(screen.queryByText('Examples')).not.toBeInTheDocument();
  });

  it('should handle content without link', async () => {
    const contentWithoutLink: HelpContent = {
      title: 'Custom Field',
      description: 'This field has no link',
      examples: ['Example 1'],
    };

    render(
      <HelpPopover content={contentWithoutLink} open={true} onOpenChange={() => {}}>
        <button>Trigger</button>
      </HelpPopover>
    );

    expect(screen.getByText('Custom Field')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /learn more/i })).not.toBeInTheDocument();
  });

  it('should handle empty content gracefully', async () => {
    const emptyContent: HelpContent = {
      title: '',
      description: '',
    };

    render(
      <HelpPopover content={emptyContent} open={true} onOpenChange={() => {}}>
        <button>Trigger</button>
      </HelpPopover>
    );

    // Should not crash
    expect(screen.getByRole('button', { name: 'Trigger' })).toBeInTheDocument();
  });
});
