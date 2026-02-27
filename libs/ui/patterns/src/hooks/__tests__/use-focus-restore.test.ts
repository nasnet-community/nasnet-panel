/**
 * useFocusRestore Hook Tests
 *
 * @see NAS-4.17: Implement Accessibility (a11y) Foundation
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { useFocusRestore, useFocusManagement } from '../use-focus-restore';

describe('useFocusRestore', () => {
  let button: HTMLButtonElement;
  let input: HTMLInputElement;

  beforeEach(() => {
    // Create test elements
    button = document.createElement('button');
    button.textContent = 'Trigger';
    button.tabIndex = 0;
    document.body.appendChild(button);

    input = document.createElement('input');
    input.type = 'text';
    document.body.appendChild(input);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('saveTrigger', () => {
    it('should save the currently focused element', () => {
      const { result } = renderHook(() => useFocusRestore());

      // Focus the button
      button.focus();
      expect(document.activeElement).toBe(button);

      // Save the trigger
      act(() => {
        result.current.saveTrigger();
      });

      expect(result.current.hasSavedTrigger()).toBe(true);
    });

    it('should not save if no element is focused', () => {
      const { result } = renderHook(() => useFocusRestore());

      // Blur any focused element
      (document.activeElement as HTMLElement)?.blur();

      act(() => {
        result.current.saveTrigger();
      });

      expect(result.current.hasSavedTrigger()).toBe(false);
    });
  });

  describe('restoreFocus', () => {
    it('should restore focus to the saved trigger', () => {
      const { result } = renderHook(() => useFocusRestore());

      // Focus the button and save
      button.focus();
      act(() => {
        result.current.saveTrigger();
      });

      // Focus something else
      input.focus();
      expect(document.activeElement).toBe(input);

      // Restore focus
      act(() => {
        result.current.restoreFocus();
      });

      expect(document.activeElement).toBe(button);
    });

    it('should clear the saved trigger after restoring', () => {
      const { result } = renderHook(() => useFocusRestore());

      button.focus();
      act(() => {
        result.current.saveTrigger();
      });

      act(() => {
        result.current.restoreFocus();
      });

      expect(result.current.hasSavedTrigger()).toBe(false);
    });

    it('should handle removed elements gracefully', () => {
      const { result } = renderHook(() => useFocusRestore());

      button.focus();
      act(() => {
        result.current.saveTrigger();
      });

      // Remove the button from DOM
      button.remove();

      // Should not throw
      act(() => {
        result.current.restoreFocus();
      });

      expect(result.current.hasSavedTrigger()).toBe(false);
    });

    it('should use fallback element when trigger is unavailable', () => {
      const fallbackButton = document.createElement('button');
      fallbackButton.id = 'fallback';
      document.body.appendChild(fallbackButton);

      const { result } = renderHook(() => useFocusRestore({ fallback: '#fallback' }));

      button.focus();
      act(() => {
        result.current.saveTrigger();
      });

      // Remove the button
      button.remove();

      // Restore should focus fallback
      act(() => {
        result.current.restoreFocus();
      });

      expect(document.activeElement).toBe(fallbackButton);
    });

    it('should support delayed focus restore', async () => {
      vi.useFakeTimers();

      const { result } = renderHook(() => useFocusRestore({ restoreDelay: 100 }));

      button.focus();
      act(() => {
        result.current.saveTrigger();
      });

      input.focus();

      act(() => {
        result.current.restoreFocus();
      });

      // Focus should not be restored yet
      expect(document.activeElement).toBe(input);

      // Advance timers
      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      expect(document.activeElement).toBe(button);

      vi.useRealTimers();
    });
  });

  describe('clearTrigger', () => {
    it('should clear the saved trigger without restoring focus', () => {
      const { result } = renderHook(() => useFocusRestore());

      button.focus();
      act(() => {
        result.current.saveTrigger();
      });

      input.focus();

      act(() => {
        result.current.clearTrigger();
      });

      expect(result.current.hasSavedTrigger()).toBe(false);
      expect(document.activeElement).toBe(input); // Focus not restored
    });
  });

  describe('auto behaviors', () => {
    it('should auto-save on mount when enabled', () => {
      button.focus();

      const { result } = renderHook(() => useFocusRestore({ autoSave: true }));

      expect(result.current.hasSavedTrigger()).toBe(true);
    });

    it('should auto-restore on unmount when enabled', () => {
      button.focus();

      const { result, unmount } = renderHook(() =>
        useFocusRestore({ autoSave: true, autoRestore: true })
      );

      input.focus();
      expect(document.activeElement).toBe(input);

      unmount();

      expect(document.activeElement).toBe(button);
    });
  });
});

describe('useFocusManagement', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should handle open state changes', () => {
    const onClose = vi.fn();

    const { result } = renderHook(() => useFocusManagement({ isOpen: true, onClose }));

    act(() => {
      result.current.onOpenChange(false);
    });

    expect(onClose).toHaveBeenCalled();
  });

  it('should close on Escape key when enabled', () => {
    const onClose = vi.fn();

    renderHook(() =>
      useFocusManagement({
        isOpen: true,
        onClose,
        closeOnEscape: true,
      })
    );

    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    document.dispatchEvent(event);

    expect(onClose).toHaveBeenCalled();
  });

  it('should not close on Escape when disabled', () => {
    const onClose = vi.fn();

    renderHook(() =>
      useFocusManagement({
        isOpen: true,
        onClose,
        closeOnEscape: false,
      })
    );

    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    document.dispatchEvent(event);

    expect(onClose).not.toHaveBeenCalled();
  });
});
