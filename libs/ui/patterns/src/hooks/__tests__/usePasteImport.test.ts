/**
 * Tests for usePasteImport hook
 * @see NAS-4.23 - Implement Clipboard Integration
 */

import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import { usePasteImport } from '../usePasteImport';

describe('usePasteImport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('initializes with null parse result', () => {
      const { result } = renderHook(() => usePasteImport());

      expect(result.current.parseResult).toBeNull();
      expect(result.current.isParsing).toBe(false);
    });
  });

  describe('IP list parsing', () => {
    it('parses valid IP addresses', () => {
      const { result } = renderHook(() => usePasteImport({ type: 'ip-list' }));

      let parseResult: ReturnType<typeof result.current.parseContent> | undefined;
      act(() => {
        parseResult = result.current.parseContent('192.168.1.1\n10.0.0.1\n172.16.0.1');
      });

      expect(parseResult!.success).toBe(true);
      expect(parseResult!.type).toBe('ip-list');
      expect(parseResult!.items).toHaveLength(3);
      expect(parseResult!.errors).toHaveLength(0);
    });

    it('parses IP addresses with CIDR notation', () => {
      const { result } = renderHook(() => usePasteImport({ type: 'ip-list' }));

      let parseResult: ReturnType<typeof result.current.parseContent> | undefined;
      act(() => {
        parseResult = result.current.parseContent('192.168.1.0/24\n10.0.0.0/8');
      });

      expect(parseResult!.success).toBe(true);
      expect(parseResult!.items).toHaveLength(2);
      expect(parseResult!.items[0].value).toBe('192.168.1.0/24');
    });

    it('reports invalid IP addresses as errors', () => {
      const { result } = renderHook(() => usePasteImport({ type: 'ip-list' }));

      let parseResult: ReturnType<typeof result.current.parseContent> | undefined;
      act(() => {
        parseResult = result.current.parseContent('192.168.1.1\nnot-an-ip\n999.999.999.999');
      });

      expect(parseResult!.success).toBe(false);
      expect(parseResult!.items).toHaveLength(1);
      expect(parseResult!.errors).toHaveLength(2);
      expect(parseResult!.errors[0].line).toBe(2);
      expect(parseResult!.errors[0].message).toBe('Invalid IP address');
    });

    it('skips empty lines and comments', () => {
      const { result } = renderHook(() => usePasteImport({ type: 'ip-list' }));

      let parseResult: ReturnType<typeof result.current.parseContent> | undefined;
      act(() => {
        parseResult = result.current.parseContent('192.168.1.1\n\n# This is a comment\n10.0.0.1');
      });

      expect(parseResult!.success).toBe(true);
      expect(parseResult!.items).toHaveLength(2);
    });
  });

  describe('CSV parsing', () => {
    it('parses CSV with header', () => {
      const { result } = renderHook(() => usePasteImport({ type: 'csv' }));

      let parseResult: ReturnType<typeof result.current.parseContent> | undefined;
      act(() => {
        parseResult = result.current.parseContent(
          'name,ip,mac\nLaptop,192.168.1.1,00:11:22:33:44:55'
        );
      });

      expect(parseResult!.success).toBe(true);
      expect(parseResult!.type).toBe('csv');
      expect(parseResult!.items).toHaveLength(1);
      expect(parseResult!.items[0].value).toEqual({
        name: 'Laptop',
        ip: '192.168.1.1',
        mac: '00:11:22:33:44:55',
      });
    });

    it('reports column mismatch as error', () => {
      const { result } = renderHook(() => usePasteImport({ type: 'csv' }));

      let parseResult: ReturnType<typeof result.current.parseContent> | undefined;
      act(() => {
        parseResult = result.current.parseContent('name,ip,mac\nLaptop,192.168.1.1');
      });

      expect(parseResult!.success).toBe(false);
      expect(parseResult!.errors).toHaveLength(1);
      expect(parseResult!.errors[0].message).toContain('Expected 3 columns');
    });

    it('validates expected columns', () => {
      const { result } = renderHook(() =>
        usePasteImport({ type: 'csv', csvColumns: ['name', 'ip', 'mac', 'status'] })
      );

      let parseResult: ReturnType<typeof result.current.parseContent> | undefined;
      act(() => {
        parseResult = result.current.parseContent(
          'name,ip,mac\nLaptop,192.168.1.1,00:11:22:33:44:55'
        );
      });

      expect(parseResult!.errors[0].message).toContain('Missing columns: status');
    });

    it('supports custom delimiter', () => {
      const { result } = renderHook(() => usePasteImport({ type: 'csv', csvDelimiter: ';' }));

      let parseResult: ReturnType<typeof result.current.parseContent> | undefined;
      act(() => {
        parseResult = result.current.parseContent('name;ip\nLaptop;192.168.1.1');
      });

      expect(parseResult!.success).toBe(true);
      expect(parseResult!.items[0].value).toEqual({ name: 'Laptop', ip: '192.168.1.1' });
    });
  });

  describe('RouterOS parsing', () => {
    it('parses RouterOS commands', () => {
      const { result } = renderHook(() => usePasteImport({ type: 'routeros' }));

      let parseResult: ReturnType<typeof result.current.parseContent> | undefined;
      act(() => {
        parseResult = result.current.parseContent(
          '/ip firewall filter add chain=forward action=accept'
        );
      });

      expect(parseResult!.success).toBe(true);
      expect(parseResult!.type).toBe('routeros');
      expect(parseResult!.items).toHaveLength(1);
    });

    it('handles line continuations', () => {
      const { result } = renderHook(() => usePasteImport({ type: 'routeros' }));

      let parseResult: ReturnType<typeof result.current.parseContent> | undefined;
      act(() => {
        parseResult = result.current.parseContent(
          '/ip firewall filter add \\\nchain=forward action=accept'
        );
      });

      expect(parseResult!.success).toBe(true);
      expect(parseResult!.items).toHaveLength(1);
      expect(parseResult!.items[0].value).toContain('add');
      expect(parseResult!.items[0].value).toContain('chain=forward');
    });

    it('skips comments', () => {
      const { result } = renderHook(() => usePasteImport({ type: 'routeros' }));

      let parseResult: ReturnType<typeof result.current.parseContent> | undefined;
      act(() => {
        parseResult = result.current.parseContent(
          '# This is a comment\n/ip firewall filter add chain=forward action=accept'
        );
      });

      expect(parseResult!.success).toBe(true);
      expect(parseResult!.items).toHaveLength(1);
    });
  });

  describe('auto-detection', () => {
    it('detects IP list', () => {
      const { result } = renderHook(() => usePasteImport({ type: 'auto' }));

      let parseResult: ReturnType<typeof result.current.parseContent> | undefined;
      act(() => {
        parseResult = result.current.parseContent('192.168.1.1\n10.0.0.1');
      });

      expect(parseResult!.type).toBe('ip-list');
    });

    it('detects CSV', () => {
      const { result } = renderHook(() => usePasteImport({ type: 'auto' }));

      let parseResult: ReturnType<typeof result.current.parseContent> | undefined;
      act(() => {
        parseResult = result.current.parseContent('name,ip\nDevice,192.168.1.1');
      });

      expect(parseResult!.type).toBe('csv');
    });

    it('detects RouterOS', () => {
      const { result } = renderHook(() => usePasteImport({ type: 'auto' }));

      let parseResult: ReturnType<typeof result.current.parseContent> | undefined;
      act(() => {
        parseResult = result.current.parseContent('/ip firewall filter');
      });

      expect(parseResult!.type).toBe('routeros');
    });
  });

  describe('handlePaste', () => {
    it('updates parseResult state', () => {
      const onParsed = vi.fn();
      const { result } = renderHook(() => usePasteImport({ type: 'ip-list', onParsed }));

      const mockEvent = {
        clipboardData: {
          getData: vi.fn().mockReturnValue('192.168.1.1'),
        },
      } as unknown as React.ClipboardEvent;

      act(() => {
        result.current.handlePaste(mockEvent);
      });

      expect(result.current.parseResult).not.toBeNull();
      expect(result.current.parseResult?.items).toHaveLength(1);
      expect(onParsed).toHaveBeenCalled();
    });

    it('ignores empty paste', () => {
      const { result } = renderHook(() => usePasteImport());

      const mockEvent = {
        clipboardData: {
          getData: vi.fn().mockReturnValue(''),
        },
      } as unknown as React.ClipboardEvent;

      act(() => {
        result.current.handlePaste(mockEvent);
      });

      expect(result.current.parseResult).toBeNull();
    });
  });

  describe('clearResult', () => {
    it('clears parse result', () => {
      const { result } = renderHook(() => usePasteImport({ type: 'ip-list' }));

      // First parse something
      act(() => {
        result.current.parseContent('192.168.1.1');
      });

      const mockEvent = {
        clipboardData: {
          getData: vi.fn().mockReturnValue('192.168.1.1'),
        },
      } as unknown as React.ClipboardEvent;

      act(() => {
        result.current.handlePaste(mockEvent);
      });

      expect(result.current.parseResult).not.toBeNull();

      // Clear it
      act(() => {
        result.current.clearResult();
      });

      expect(result.current.parseResult).toBeNull();
    });
  });

  describe('maxItems limit', () => {
    it('respects maxItems option', () => {
      const { result } = renderHook(() => usePasteImport({ type: 'ip-list', maxItems: 2 }));

      let parseResult: ReturnType<typeof result.current.parseContent> | undefined;
      act(() => {
        parseResult = result.current.parseContent(
          '192.168.1.1\n192.168.1.2\n192.168.1.3\n192.168.1.4'
        );
      });

      expect(parseResult!.items).toHaveLength(2);
    });
  });

  describe('empty content handling', () => {
    it('returns error for empty content', () => {
      const { result } = renderHook(() => usePasteImport());

      let parseResult: ReturnType<typeof result.current.parseContent> | undefined;
      act(() => {
        parseResult = result.current.parseContent('');
      });

      expect(parseResult!.success).toBe(false);
      expect(parseResult!.errors).toHaveLength(1);
      expect(parseResult!.errors[0].message).toBe('Empty content');
    });

    it('returns error for whitespace-only content', () => {
      const { result } = renderHook(() => usePasteImport());

      let parseResult: ReturnType<typeof result.current.parseContent> | undefined;
      act(() => {
        parseResult = result.current.parseContent('   \n\t\n   ');
      });

      expect(parseResult!.success).toBe(false);
    });
  });
});
