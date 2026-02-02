/**
 * useConfigPreview Hook Tests
 *
 * Tests for the ConfigPreview headless hook.
 *
 * @see NAS-4A.21 - Build Config Preview Component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

import { useConfigPreview } from './use-config-preview';

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

describe('useConfigPreview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, 'clipboard', {
      value: mockClipboard,
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('script parsing', () => {
    it('parses script into sections by command path', () => {
      const script = `/interface ethernet
set name=ether1

/ip address
add address=192.168.1.1/24`;

      const { result } = renderHook(() =>
        useConfigPreview({ script, collapsible: true })
      );

      expect(result.current.sections.length).toBe(2);
      expect(result.current.sections[0].header).toBe('/interface ethernet');
      expect(result.current.sections[1].header).toBe('/ip address');
    });

    it('handles scripts without sections', () => {
      const script = '# This is just a comment\n# Another comment';

      const { result } = renderHook(() =>
        useConfigPreview({ script, collapsible: true })
      );

      // Should still create a section for the content
      expect(result.current.sections.length).toBeGreaterThan(0);
    });

    it('handles empty scripts', () => {
      const { result } = renderHook(() =>
        useConfigPreview({ script: '', collapsible: true })
      );

      expect(result.current.totalLines).toBe(1); // Empty string splits to ['']
    });

    it('groups preamble content before first section', () => {
      const script = `# Router configuration
# Generated on 2026-02-01

/interface ethernet
set name=ether1`;

      const { result } = renderHook(() =>
        useConfigPreview({ script, collapsible: true })
      );

      // Should have preamble section and one command section
      const preambleSection = result.current.sections.find(
        (s) => s.header === '__preamble__'
      );
      expect(preambleSection).toBeDefined();
    });
  });

  describe('section management', () => {
    it('all sections expanded by default', () => {
      const script = `/interface\nset name=eth1\n\n/ip address\nadd address=1.1.1.1`;

      const { result } = renderHook(() =>
        useConfigPreview({ script, collapsible: true })
      );

      expect(result.current.sections.every((s) => s.isExpanded)).toBe(true);
    });

    it('toggleSection toggles a specific section', () => {
      const script = `/interface\nset name=eth1\n\n/ip address\nadd address=1.1.1.1`;

      const { result } = renderHook(() =>
        useConfigPreview({ script, collapsible: true })
      );

      const sectionId = result.current.sections[0].id;

      act(() => {
        result.current.toggleSection(sectionId);
      });

      expect(result.current.sections[0].isExpanded).toBe(false);
      expect(result.current.sections[1].isExpanded).toBe(true);
    });

    it('expandAll expands all sections', () => {
      const script = `/interface\nset\n\n/ip address\nadd`;

      const { result } = renderHook(() =>
        useConfigPreview({ script, collapsible: true })
      );

      // Collapse all first
      act(() => {
        result.current.collapseAll();
      });

      expect(result.current.sections.every((s) => !s.isExpanded)).toBe(true);

      // Now expand all
      act(() => {
        result.current.expandAll();
      });

      expect(result.current.sections.every((s) => s.isExpanded)).toBe(true);
    });

    it('collapseAll collapses all sections', () => {
      const script = `/interface\nset\n\n/ip address\nadd`;

      const { result } = renderHook(() =>
        useConfigPreview({ script, collapsible: true })
      );

      act(() => {
        result.current.collapseAll();
      });

      expect(result.current.sections.every((s) => !s.isExpanded)).toBe(true);
    });
  });

  describe('copy to clipboard', () => {
    it('copies script to clipboard on copyToClipboard', async () => {
      const script = '/interface ethernet\nset name=ether1';

      const { result } = renderHook(() => useConfigPreview({ script }));

      await act(async () => {
        await result.current.copyToClipboard();
      });

      expect(mockClipboard.writeText).toHaveBeenCalledWith(script);
    });

    it('calls onCopy callback when provided', async () => {
      const onCopy = vi.fn();
      const script = '/interface ethernet';

      const { result } = renderHook(() =>
        useConfigPreview({ script, onCopy })
      );

      await act(async () => {
        await result.current.copyToClipboard();
      });

      // Wait for the callback to be called
      await waitFor(() => {
        expect(onCopy).toHaveBeenCalled();
      });
    });

    it('sets isCopied to true after successful copy', async () => {
      const script = '/interface ethernet';

      const { result } = renderHook(() => useConfigPreview({ script }));

      expect(result.current.isCopied).toBe(false);

      await act(async () => {
        await result.current.copyToClipboard();
      });

      expect(result.current.isCopied).toBe(true);
    });
  });

  describe('download', () => {
    it('generates correct filename with router name', () => {
      const { result } = renderHook(() =>
        useConfigPreview({
          script: 'test',
          routerName: 'my-router',
        })
      );

      expect(result.current.filename).toMatch(/^my-router-\d{4}-\d{2}-\d{2}\.rsc$/);
    });

    it('generates fallback filename without router name', () => {
      const { result } = renderHook(() =>
        useConfigPreview({ script: 'test' })
      );

      expect(result.current.filename).toMatch(/^config-\d{4}-\d{2}-\d{2}\.rsc$/);
    });

    it('sanitizes router name in filename', () => {
      const { result } = renderHook(() =>
        useConfigPreview({
          script: 'test',
          routerName: 'My Router / Special <chars>',
        })
      );

      // Should not contain special characters
      expect(result.current.filename).not.toMatch(/[/<>]/);
    });

    it('calls downloadAsFile without errors', () => {
      const { result } = renderHook(() =>
        useConfigPreview({ script: 'test script' })
      );

      // Mock DOM methods
      const createObjectURL = vi.fn().mockReturnValue('blob:test');
      const revokeObjectURL = vi.fn();
      const appendChild = vi.fn();
      const removeChild = vi.fn();
      const click = vi.fn();

      global.URL.createObjectURL = createObjectURL;
      global.URL.revokeObjectURL = revokeObjectURL;

      const mockLink = {
        href: '',
        download: '',
        click,
      };

      vi.spyOn(document, 'createElement').mockReturnValue(mockLink as unknown as HTMLAnchorElement);
      vi.spyOn(document.body, 'appendChild').mockImplementation(appendChild);
      vi.spyOn(document.body, 'removeChild').mockImplementation(removeChild);

      act(() => {
        result.current.downloadAsFile();
      });

      expect(createObjectURL).toHaveBeenCalled();
      expect(click).toHaveBeenCalled();
      expect(revokeObjectURL).toHaveBeenCalled();
    });

    it('calls onDownload callback when provided', () => {
      const onDownload = vi.fn();

      const { result } = renderHook(() =>
        useConfigPreview({ script: 'test', onDownload })
      );

      // Mock DOM methods
      global.URL.createObjectURL = vi.fn().mockReturnValue('blob:test');
      global.URL.revokeObjectURL = vi.fn();

      const mockLink = { href: '', download: '', click: vi.fn() };
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink as unknown as HTMLAnchorElement);
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as unknown as HTMLAnchorElement);
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as unknown as HTMLAnchorElement);

      act(() => {
        result.current.downloadAsFile();
      });

      expect(onDownload).toHaveBeenCalled();
    });
  });

  describe('diff integration', () => {
    it('computes diff when showDiff is true', () => {
      const oldScript = '/interface ethernet\nset name=ether1';
      const newScript = '/interface ethernet\nset name=ether2';

      const { result } = renderHook(() =>
        useConfigPreview({
          script: newScript,
          previousScript: oldScript,
          showDiff: true,
        })
      );

      expect(result.current.hasDiff).toBe(true);
      expect(result.current.diffLines.length).toBeGreaterThan(0);
    });

    it('does not compute diff when showDiff is false', () => {
      const oldScript = '/interface ethernet\nset name=ether1';
      const newScript = '/interface ethernet\nset name=ether2';

      const { result } = renderHook(() =>
        useConfigPreview({
          script: newScript,
          previousScript: oldScript,
          showDiff: false,
        })
      );

      expect(result.current.hasDiff).toBe(false);
      expect(result.current.diffLines).toEqual([]);
    });

    it('returns diff counts when showDiff is true', () => {
      const oldScript = 'line1\nline2';
      const newScript = 'line1\nline3\nline4';

      const { result } = renderHook(() =>
        useConfigPreview({
          script: newScript,
          previousScript: oldScript,
          showDiff: true,
        })
      );

      expect(result.current.addedCount).toBeGreaterThan(0);
      expect(result.current.removedCount).toBeGreaterThan(0);
    });
  });

  describe('computed values', () => {
    it('calculates totalLines correctly', () => {
      const script = 'line1\nline2\nline3';

      const { result } = renderHook(() => useConfigPreview({ script }));

      expect(result.current.totalLines).toBe(3);
    });

    it('handles single line script', () => {
      const script = 'single line';

      const { result } = renderHook(() => useConfigPreview({ script }));

      expect(result.current.totalLines).toBe(1);
    });
  });
});
