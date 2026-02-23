/**
 * useAutoScroll Hook Tests
 * Tests for auto-scroll behavior in scrollable containers
 * Epic 0.8: System Logs - Story 0.8.4
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useRef } from 'react';
import { useAutoScroll } from './useAutoScroll';

describe('useAutoScroll', () => {
  let scrollContainer: HTMLDivElement;

  beforeEach(() => {
    // Create a mock scroll container
    scrollContainer = document.createElement('div');
    Object.defineProperty(scrollContainer, 'scrollHeight', {
      writable: true,
      value: 1000,
    });
    Object.defineProperty(scrollContainer, 'clientHeight', {
      writable: true,
      value: 500,
    });
    Object.defineProperty(scrollContainer, 'scrollTop', {
      writable: true,
      value: 0,
    });

    // Mock scrollTo method
    scrollContainer.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
  });

  describe('Initial State', () => {
    it('should start at bottom', () => {
      const { result } = renderHook(() => {
        const scrollRef = useRef<HTMLDivElement>(scrollContainer);
        return useAutoScroll({ scrollRef, data: [] });
      });

      expect(result.current.isAtBottom).toBe(true);
      expect(result.current.newEntriesCount).toBe(0);
    });

    it('should provide scrollToBottom function', () => {
      const { result } = renderHook(() => {
        const scrollRef = useRef<HTMLDivElement>(scrollContainer);
        return useAutoScroll({ scrollRef, data: [] });
      });

      expect(typeof result.current.scrollToBottom).toBe('function');
    });
  });

  describe('Scroll Detection', () => {
    it('should detect when scrolled to bottom', async () => {
      const { result } = renderHook(() => {
        const scrollRef = useRef<HTMLDivElement>(scrollContainer);
        return useAutoScroll({ scrollRef, data: [], threshold: 100 });
      });

      // Scroll to bottom (scrollTop + clientHeight >= scrollHeight - threshold)
      Object.defineProperty(scrollContainer, 'scrollTop', {
        writable: true,
        value: 500, // 500 + 500 = 1000 (scrollHeight)
      });

      act(() => {
        scrollContainer.dispatchEvent(new Event('scroll'));
      });

      await waitFor(() => {
        expect(result.current.isAtBottom).toBe(true);
      });
    });

    it('should detect when scrolled up from bottom', async () => {
      const { result } = renderHook(() => {
        const scrollRef = useRef<HTMLDivElement>(scrollContainer);
        return useAutoScroll({ scrollRef, data: [], threshold: 100 });
      });

      // Scroll up significantly (more than threshold)
      Object.defineProperty(scrollContainer, 'scrollTop', {
        writable: true,
        value: 200, // 200 + 500 = 700, which is < 900 (1000 - 100 threshold)
      });

      act(() => {
        scrollContainer.dispatchEvent(new Event('scroll'));
      });

      await waitFor(() => {
        expect(result.current.isAtBottom).toBe(false);
      });
    });

    it('should use custom threshold', async () => {
      const { result } = renderHook(() => {
        const scrollRef = useRef<HTMLDivElement>(scrollContainer);
        return useAutoScroll({ scrollRef, data: [], threshold: 50 });
      });

      // Scroll to within 50px of bottom
      Object.defineProperty(scrollContainer, 'scrollTop', {
        writable: true,
        value: 470, // 470 + 500 = 970, which is >= 950 (1000 - 50 threshold)
      });

      act(() => {
        scrollContainer.dispatchEvent(new Event('scroll'));
      });

      await waitFor(() => {
        expect(result.current.isAtBottom).toBe(true);
      });
    });
  });

  describe('scrollToBottom Function', () => {
    it('should call scrollTo with correct parameters', () => {
      const { result } = renderHook(() => {
        const scrollRef = useRef<HTMLDivElement>(scrollContainer);
        return useAutoScroll({ scrollRef, data: [] });
      });

      act(() => {
        result.current.scrollToBottom();
      });

      expect(scrollContainer.scrollTo).toHaveBeenCalledWith({
        top: 1000, // scrollHeight
        behavior: 'smooth',
      });
    });

    it('should reset new entries count when called', () => {
      const { result, rerender } = renderHook(
        ({ data }) => {
          const scrollRef = useRef<HTMLDivElement>(scrollContainer);
          return useAutoScroll({ scrollRef, data });
        },
        { initialProps: { data: [1, 2, 3] } }
      );

      // Scroll up first
      Object.defineProperty(scrollContainer, 'scrollTop', {
        writable: true,
        value: 0,
      });

      act(() => {
        scrollContainer.dispatchEvent(new Event('scroll'));
      });

      // Add new entries while scrolled up
      rerender({ data: [1, 2, 3, 4, 5] });

      // Should have new entries count
      expect(result.current.newEntriesCount).toBeGreaterThan(0);

      // Scroll to bottom
      act(() => {
        result.current.scrollToBottom();
      });

      // Count should be reset
      expect(result.current.newEntriesCount).toBe(0);
    });
  });

  describe('New Entries Tracking', () => {
    it('should increment count when new data arrives while scrolled up', () => {
      const { result, rerender } = renderHook(
        ({ data }) => {
          const scrollRef = useRef<HTMLDivElement>(scrollContainer);
          return useAutoScroll({ scrollRef, data });
        },
        { initialProps: { data: [1, 2, 3] } }
      );

      // Scroll up
      Object.defineProperty(scrollContainer, 'scrollTop', {
        writable: true,
        value: 0,
      });

      act(() => {
        scrollContainer.dispatchEvent(new Event('scroll'));
      });

      // Add 2 new entries
      act(() => {
        rerender({ data: [1, 2, 3, 4, 5] });
      });

      expect(result.current.newEntriesCount).toBe(2);
    });

    it('should not increment count when at bottom', () => {
      const { result, rerender } = renderHook(
        ({ data }) => {
          const scrollRef = useRef<HTMLDivElement>(scrollContainer);
          return useAutoScroll({ scrollRef, data });
        },
        { initialProps: { data: [1, 2, 3] } }
      );

      // Stay at bottom
      Object.defineProperty(scrollContainer, 'scrollTop', {
        writable: true,
        value: 500,
      });

      // Add new entries
      act(() => {
        rerender({ data: [1, 2, 3, 4, 5] });
      });

      expect(result.current.newEntriesCount).toBe(0);
    });

    it('should reset count when user manually scrolls to bottom', async () => {
      const { result, rerender } = renderHook(
        ({ data }) => {
          const scrollRef = useRef<HTMLDivElement>(scrollContainer);
          return useAutoScroll({ scrollRef, data });
        },
        { initialProps: { data: [1, 2, 3] } }
      );

      // Scroll up
      Object.defineProperty(scrollContainer, 'scrollTop', {
        writable: true,
        value: 0,
      });

      act(() => {
        scrollContainer.dispatchEvent(new Event('scroll'));
      });

      // Add new entries
      act(() => {
        rerender({ data: [1, 2, 3, 4, 5] });
      });

      expect(result.current.newEntriesCount).toBeGreaterThan(0);

      // Manually scroll to bottom
      Object.defineProperty(scrollContainer, 'scrollTop', {
        writable: true,
        value: 500,
      });

      act(() => {
        scrollContainer.dispatchEvent(new Event('scroll'));
      });

      await waitFor(() => {
        expect(result.current.newEntriesCount).toBe(0);
      });
    });
  });

  describe('Disabled State', () => {
    it('should not track scroll when disabled', async () => {
      const { result } = renderHook(() => {
        const scrollRef = useRef<HTMLDivElement>(scrollContainer);
        return useAutoScroll({ scrollRef, data: [], enabled: false });
      });

      // Try to scroll
      Object.defineProperty(scrollContainer, 'scrollTop', {
        writable: true,
        value: 0,
      });

      act(() => {
        scrollContainer.dispatchEvent(new Event('scroll'));
      });

      // Should not update isAtBottom
      expect(result.current.isAtBottom).toBe(true);
    });

    it('should not auto-scroll when disabled', () => {
      const { rerender } = renderHook(
        ({ data, enabled }) => {
          const scrollRef = useRef<HTMLDivElement>(scrollContainer);
          return useAutoScroll({ scrollRef, data, enabled });
        },
        { initialProps: { data: [1, 2, 3], enabled: false } }
      );

      // Add new data
      act(() => {
        rerender({ data: [1, 2, 3, 4, 5], enabled: false });
      });

      // Should not have called scrollTo
      expect(scrollContainer.scrollTo).not.toHaveBeenCalled();
    });
  });
});
