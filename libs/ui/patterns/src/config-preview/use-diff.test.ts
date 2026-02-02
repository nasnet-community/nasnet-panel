/**
 * useDiff Hook Tests
 *
 * Tests for the diff computation hook.
 *
 * @see NAS-4A.21 - Build Config Preview Component
 */

import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';

import { useDiff } from './use-diff';

describe('useDiff', () => {
  describe('edge cases', () => {
    it('returns all unchanged lines when scripts are identical', () => {
      const script = '/interface ethernet\nset name=ether1';

      const { result } = renderHook(() =>
        useDiff({ oldScript: script, newScript: script })
      );

      expect(result.current.hasDiff).toBe(false);
      expect(result.current.addedCount).toBe(0);
      expect(result.current.removedCount).toBe(0);
      expect(result.current.unchangedCount).toBe(2);
      expect(result.current.diffLines.every((l) => l.type === 'unchanged')).toBe(true);
    });

    it('returns all added lines when old script is empty', () => {
      const newScript = '/interface ethernet\nset name=ether1';

      const { result } = renderHook(() =>
        useDiff({ oldScript: '', newScript })
      );

      expect(result.current.hasDiff).toBe(true);
      expect(result.current.addedCount).toBe(2);
      expect(result.current.removedCount).toBe(0);
      expect(result.current.diffLines.every((l) => l.type === 'added')).toBe(true);
    });

    it('returns all removed lines when new script is empty', () => {
      const oldScript = '/interface ethernet\nset name=ether1';

      const { result } = renderHook(() =>
        useDiff({ oldScript, newScript: '' })
      );

      expect(result.current.hasDiff).toBe(true);
      expect(result.current.addedCount).toBe(0);
      expect(result.current.removedCount).toBe(2);
      expect(result.current.diffLines.every((l) => l.type === 'removed')).toBe(true);
    });

    it('handles both scripts empty', () => {
      const { result } = renderHook(() =>
        useDiff({ oldScript: '', newScript: '' })
      );

      expect(result.current.hasDiff).toBe(false);
      expect(result.current.addedCount).toBe(0);
      expect(result.current.removedCount).toBe(0);
    });
  });

  describe('diff computation', () => {
    it('detects added lines', () => {
      const oldScript = '/interface ethernet\nset name=ether1';
      const newScript = '/interface ethernet\nset name=ether1\nset name=ether2';

      const { result } = renderHook(() =>
        useDiff({ oldScript, newScript })
      );

      expect(result.current.hasDiff).toBe(true);
      expect(result.current.addedCount).toBe(1);
      expect(result.current.removedCount).toBe(0);

      const addedLine = result.current.diffLines.find((l) => l.type === 'added');
      expect(addedLine?.content).toBe('set name=ether2');
      expect(addedLine?.newLineNumber).toBe(3);
    });

    it('detects removed lines', () => {
      const oldScript = '/interface ethernet\nset name=ether1\nset name=ether2';
      const newScript = '/interface ethernet\nset name=ether1';

      const { result } = renderHook(() =>
        useDiff({ oldScript, newScript })
      );

      expect(result.current.hasDiff).toBe(true);
      expect(result.current.addedCount).toBe(0);
      expect(result.current.removedCount).toBe(1);

      const removedLine = result.current.diffLines.find((l) => l.type === 'removed');
      expect(removedLine?.content).toBe('set name=ether2');
      expect(removedLine?.oldLineNumber).toBe(3);
    });

    it('detects mixed changes', () => {
      const oldScript = '/interface ethernet\nset name=ether1\nset name=ether2';
      const newScript = '/interface ethernet\nset name=modified\nset name=ether3';

      const { result } = renderHook(() =>
        useDiff({ oldScript, newScript })
      );

      expect(result.current.hasDiff).toBe(true);
      // The first line should be unchanged
      const unchangedLines = result.current.diffLines.filter(
        (l) => l.type === 'unchanged'
      );
      expect(unchangedLines.length).toBeGreaterThan(0);
      expect(unchangedLines[0].content).toBe('/interface ethernet');
    });

    it('handles completely different scripts', () => {
      const oldScript = 'line1\nline2\nline3';
      const newScript = 'different1\ndifferent2\ndifferent3';

      const { result } = renderHook(() =>
        useDiff({ oldScript, newScript })
      );

      expect(result.current.hasDiff).toBe(true);
      expect(result.current.addedCount).toBe(3);
      expect(result.current.removedCount).toBe(3);
      expect(result.current.unchangedCount).toBe(0);
    });
  });

  describe('line number tracking', () => {
    it('tracks correct line numbers for unchanged lines', () => {
      const script = 'line1\nline2\nline3';

      const { result } = renderHook(() =>
        useDiff({ oldScript: script, newScript: script })
      );

      result.current.diffLines.forEach((line, index) => {
        expect(line.oldLineNumber).toBe(index + 1);
        expect(line.newLineNumber).toBe(index + 1);
      });
    });

    it('tracks correct line numbers for added lines', () => {
      const oldScript = 'line1';
      const newScript = 'line1\nline2';

      const { result } = renderHook(() =>
        useDiff({ oldScript, newScript })
      );

      const addedLine = result.current.diffLines.find((l) => l.type === 'added');
      expect(addedLine?.newLineNumber).toBe(2);
      expect(addedLine?.oldLineNumber).toBeUndefined();
    });

    it('tracks correct line numbers for removed lines', () => {
      const oldScript = 'line1\nline2';
      const newScript = 'line1';

      const { result } = renderHook(() =>
        useDiff({ oldScript, newScript })
      );

      const removedLine = result.current.diffLines.find((l) => l.type === 'removed');
      expect(removedLine?.oldLineNumber).toBe(2);
      expect(removedLine?.newLineNumber).toBeUndefined();
    });
  });

  describe('memoization', () => {
    it('returns same reference when inputs unchanged', () => {
      const oldScript = '/interface ethernet';
      const newScript = '/interface bridge';

      const { result, rerender } = renderHook(
        ({ old, newS }) => useDiff({ oldScript: old, newScript: newS }),
        { initialProps: { old: oldScript, newS: newScript } }
      );

      const firstResult = result.current.diffLines;

      rerender({ old: oldScript, newS: newScript });

      expect(result.current.diffLines).toBe(firstResult);
    });

    it('recomputes when inputs change', () => {
      const { result, rerender } = renderHook(
        ({ old, newS }) => useDiff({ oldScript: old, newScript: newS }),
        { initialProps: { old: 'line1', newS: 'line1' } }
      );

      expect(result.current.hasDiff).toBe(false);

      rerender({ old: 'line1', newS: 'line2' });

      expect(result.current.hasDiff).toBe(true);
    });
  });
});
