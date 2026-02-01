/**
 * Tests for useBulkCopy hook
 * @see NAS-4.23 - Implement Clipboard Integration
 */

import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

import { useBulkCopy, SUPPORTED_FORMATS, FORMAT_LABELS } from '../useBulkCopy';

describe('useBulkCopy', () => {
  const mockWriteText = vi.fn();

  const sampleData = [
    { name: 'Laptop', ip: '192.168.1.100', mac: '00:1A:2B:3C:4D:5E' },
    { name: 'Phone', ip: '192.168.1.101', mac: 'AA:BB:CC:DD:EE:FF' },
    { name: 'Tablet', ip: '192.168.1.102', mac: '11:22:33:44:55:66' },
  ];

  beforeEach(() => {
    vi.useFakeTimers();
    Object.assign(navigator, {
      clipboard: { writeText: mockWriteText },
    });
    mockWriteText.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('initializes with default CSV format', () => {
      const { result } = renderHook(() => useBulkCopy());

      expect(result.current.format).toBe('csv');
      expect(result.current.copied).toBe(false);
      expect(result.current.copiedCount).toBe(0);
      expect(result.current.error).toBeNull();
    });

    it('allows custom default format', () => {
      const { result } = renderHook(() => useBulkCopy({ defaultFormat: 'json' }));

      expect(result.current.format).toBe('json');
    });

    it('provides list of supported formats', () => {
      const { result } = renderHook(() => useBulkCopy());

      expect(result.current.supportedFormats).toEqual(SUPPORTED_FORMATS);
    });
  });

  describe('format selection', () => {
    it('allows changing format', () => {
      const { result } = renderHook(() => useBulkCopy());

      act(() => {
        result.current.setFormat('json');
      });

      expect(result.current.format).toBe('json');
    });
  });

  describe('CSV export', () => {
    it('copies items as CSV with header', async () => {
      const { result } = renderHook(() => useBulkCopy());

      await act(async () => {
        await result.current.copyItems(sampleData);
      });

      const expected =
        'name,ip,mac\n' +
        'Laptop,192.168.1.100,00:1A:2B:3C:4D:5E\n' +
        'Phone,192.168.1.101,AA:BB:CC:DD:EE:FF\n' +
        'Tablet,192.168.1.102,11:22:33:44:55:66';

      expect(mockWriteText).toHaveBeenCalledWith(expected);
    });

    it('respects column selection', async () => {
      const { result } = renderHook(() => useBulkCopy());

      await act(async () => {
        await result.current.copyItems(sampleData, ['name', 'ip']);
      });

      const expected =
        'name,ip\n' +
        'Laptop,192.168.1.100\n' +
        'Phone,192.168.1.101\n' +
        'Tablet,192.168.1.102';

      expect(mockWriteText).toHaveBeenCalledWith(expected);
    });

    it('handles values with commas', async () => {
      const dataWithCommas = [{ name: 'Device, Type A', ip: '192.168.1.1' }];
      const { result } = renderHook(() => useBulkCopy());

      await act(async () => {
        await result.current.copyItems(dataWithCommas);
      });

      expect(mockWriteText).toHaveBeenCalledWith(
        'name,ip\n"Device, Type A",192.168.1.1'
      );
    });

    it('handles values with quotes', async () => {
      const dataWithQuotes = [{ name: 'Device "Pro"', ip: '192.168.1.1' }];
      const { result } = renderHook(() => useBulkCopy());

      await act(async () => {
        await result.current.copyItems(dataWithQuotes);
      });

      expect(mockWriteText).toHaveBeenCalledWith(
        'name,ip\n"Device ""Pro""",192.168.1.1'
      );
    });

    it('supports custom delimiter', async () => {
      const { result } = renderHook(() => useBulkCopy({ csvDelimiter: ';' }));

      await act(async () => {
        await result.current.copyItems(sampleData, ['name', 'ip']);
      });

      const expected =
        'name;ip\n' +
        'Laptop;192.168.1.100\n' +
        'Phone;192.168.1.101\n' +
        'Tablet;192.168.1.102';

      expect(mockWriteText).toHaveBeenCalledWith(expected);
    });

    it('can exclude header', async () => {
      const { result } = renderHook(() => useBulkCopy({ includeHeader: false }));

      await act(async () => {
        await result.current.copyItems(sampleData, ['name', 'ip']);
      });

      const expected =
        'Laptop,192.168.1.100\n' +
        'Phone,192.168.1.101\n' +
        'Tablet,192.168.1.102';

      expect(mockWriteText).toHaveBeenCalledWith(expected);
    });
  });

  describe('JSON export', () => {
    it('copies items as formatted JSON', async () => {
      const { result } = renderHook(() => useBulkCopy({ defaultFormat: 'json' }));

      await act(async () => {
        await result.current.copyItems(sampleData);
      });

      const calledArg = mockWriteText.mock.calls[0][0];
      const parsed = JSON.parse(calledArg);

      expect(parsed).toEqual(sampleData);
    });

    it('filters to selected columns', async () => {
      const { result } = renderHook(() => useBulkCopy({ defaultFormat: 'json' }));

      await act(async () => {
        await result.current.copyItems(sampleData, ['name', 'ip']);
      });

      const calledArg = mockWriteText.mock.calls[0][0];
      const parsed = JSON.parse(calledArg);

      expect(parsed).toEqual([
        { name: 'Laptop', ip: '192.168.1.100' },
        { name: 'Phone', ip: '192.168.1.101' },
        { name: 'Tablet', ip: '192.168.1.102' },
      ]);
    });

    it('respects custom indent', async () => {
      const { result } = renderHook(() =>
        useBulkCopy({ defaultFormat: 'json', jsonIndent: 4 })
      );

      const simpleData = [{ name: 'Test' }];

      await act(async () => {
        await result.current.copyItems(simpleData);
      });

      const calledArg = mockWriteText.mock.calls[0][0];
      expect(calledArg).toBe(JSON.stringify(simpleData, null, 4));
    });
  });

  describe('plain text export', () => {
    it('copies items as tab-separated text', async () => {
      const { result } = renderHook(() => useBulkCopy({ defaultFormat: 'text' }));

      await act(async () => {
        await result.current.copyItems(sampleData, ['name', 'ip']);
      });

      const expected =
        'Laptop\t192.168.1.100\n' +
        'Phone\t192.168.1.101\n' +
        'Tablet\t192.168.1.102';

      expect(mockWriteText).toHaveBeenCalledWith(expected);
    });

    it('supports custom separator', async () => {
      const { result } = renderHook(() =>
        useBulkCopy({ defaultFormat: 'text', textSeparator: '\r\n' })
      );

      await act(async () => {
        await result.current.copyItems(sampleData, ['name']);
      });

      const expected = 'Laptop\r\nPhone\r\nTablet';
      expect(mockWriteText).toHaveBeenCalledWith(expected);
    });
  });

  describe('copy state', () => {
    it('sets copied state on success', async () => {
      const { result } = renderHook(() => useBulkCopy());

      await act(async () => {
        await result.current.copyItems(sampleData);
      });

      expect(result.current.copied).toBe(true);
      expect(result.current.copiedCount).toBe(3);
    });

    it('returns true on successful copy', async () => {
      const { result } = renderHook(() => useBulkCopy());

      let success = false;
      await act(async () => {
        success = await result.current.copyItems(sampleData);
      });

      expect(success).toBe(true);
    });

    it('returns false for empty array', async () => {
      const { result } = renderHook(() => useBulkCopy());

      let success = true;
      await act(async () => {
        success = await result.current.copyItems([]);
      });

      expect(success).toBe(false);
      expect(mockWriteText).not.toHaveBeenCalled();
    });

    it('resets copied state after timeout', async () => {
      const { result } = renderHook(() => useBulkCopy());

      await act(async () => {
        await result.current.copyItems(sampleData);
      });

      expect(result.current.copied).toBe(true);

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(result.current.copied).toBe(false);
    });
  });

  describe('callbacks', () => {
    it('calls onSuccess with count and format', async () => {
      const onSuccess = vi.fn();
      const { result } = renderHook(() => useBulkCopy({ onSuccess }));

      await act(async () => {
        await result.current.copyItems(sampleData);
      });

      expect(onSuccess).toHaveBeenCalledWith(3, 'csv');
    });

    it('calls onError on failure', async () => {
      const error = new Error('Copy failed');
      mockWriteText.mockRejectedValue(error);

      const onError = vi.fn();
      const { result } = renderHook(() => useBulkCopy({ onError }));

      await act(async () => {
        await result.current.copyItems(sampleData);
      });

      expect(onError).toHaveBeenCalledWith(error);
    });
  });

  describe('reset', () => {
    it('resets all state', async () => {
      const { result } = renderHook(() => useBulkCopy());

      await act(async () => {
        await result.current.copyItems(sampleData);
      });

      expect(result.current.copied).toBe(true);
      expect(result.current.copiedCount).toBe(3);

      act(() => {
        result.current.reset();
      });

      expect(result.current.copied).toBe(false);
      expect(result.current.copiedCount).toBe(0);
    });
  });

  describe('constants', () => {
    it('exports SUPPORTED_FORMATS', () => {
      expect(SUPPORTED_FORMATS).toEqual(['csv', 'json', 'text']);
    });

    it('exports FORMAT_LABELS', () => {
      expect(FORMAT_LABELS.csv).toBe('CSV');
      expect(FORMAT_LABELS.json).toBe('JSON');
      expect(FORMAT_LABELS.text).toBe('Plain Text');
    });
  });
});
