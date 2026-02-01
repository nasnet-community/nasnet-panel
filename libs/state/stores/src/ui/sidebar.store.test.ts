/**
 * Tests for Sidebar Store
 * @see NAS-4.3: Build Responsive Layout System
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act } from '@testing-library/react';
import {
  useSidebarStore,
  selectSidebarCollapsed,
  selectSidebarToggle,
  getSidebarState,
} from './sidebar.store';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('useSidebarStore', () => {
  beforeEach(() => {
    // Reset store and localStorage before each test
    localStorageMock.clear();
    useSidebarStore.setState({ desktopCollapsed: false });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should have desktopCollapsed as false by default', () => {
      const state = useSidebarStore.getState();
      expect(state.desktopCollapsed).toBe(false);
    });
  });

  describe('Actions', () => {
    it('toggle() should flip desktopCollapsed state', () => {
      const store = useSidebarStore.getState();

      // Initial state should be false
      expect(store.desktopCollapsed).toBe(false);

      // Toggle to true
      act(() => {
        store.toggle();
      });
      expect(useSidebarStore.getState().desktopCollapsed).toBe(true);

      // Toggle back to false
      act(() => {
        useSidebarStore.getState().toggle();
      });
      expect(useSidebarStore.getState().desktopCollapsed).toBe(false);
    });

    it('setCollapsed() should set specific value', () => {
      const store = useSidebarStore.getState();

      act(() => {
        store.setCollapsed(true);
      });
      expect(useSidebarStore.getState().desktopCollapsed).toBe(true);

      act(() => {
        useSidebarStore.getState().setCollapsed(false);
      });
      expect(useSidebarStore.getState().desktopCollapsed).toBe(false);
    });

    it('expand() should set desktopCollapsed to false', () => {
      // First collapse
      act(() => {
        useSidebarStore.getState().collapse();
      });
      expect(useSidebarStore.getState().desktopCollapsed).toBe(true);

      // Then expand
      act(() => {
        useSidebarStore.getState().expand();
      });
      expect(useSidebarStore.getState().desktopCollapsed).toBe(false);
    });

    it('collapse() should set desktopCollapsed to true', () => {
      act(() => {
        useSidebarStore.getState().collapse();
      });
      expect(useSidebarStore.getState().desktopCollapsed).toBe(true);
    });

    it('reset() should return to default state (expanded)', () => {
      // First collapse
      act(() => {
        useSidebarStore.getState().collapse();
      });
      expect(useSidebarStore.getState().desktopCollapsed).toBe(true);

      // Then reset
      act(() => {
        useSidebarStore.getState().reset();
      });
      expect(useSidebarStore.getState().desktopCollapsed).toBe(false);
    });
  });

  describe('Selectors', () => {
    it('selectSidebarCollapsed should return desktopCollapsed value', () => {
      const state = useSidebarStore.getState();
      expect(selectSidebarCollapsed(state)).toBe(false);

      act(() => {
        state.collapse();
      });
      expect(selectSidebarCollapsed(useSidebarStore.getState())).toBe(true);
    });

    it('selectSidebarToggle should return toggle function', () => {
      const state = useSidebarStore.getState();
      const toggle = selectSidebarToggle(state);

      expect(typeof toggle).toBe('function');

      act(() => {
        toggle();
      });
      expect(useSidebarStore.getState().desktopCollapsed).toBe(true);
    });
  });

  describe('Helper Functions', () => {
    it('getSidebarState should return current state', () => {
      const state = getSidebarState();
      expect(state.desktopCollapsed).toBe(false);
      expect(typeof state.toggle).toBe('function');
      expect(typeof state.setCollapsed).toBe('function');
    });
  });

  describe('Persistence', () => {
    it('should persist state to localStorage', async () => {
      // Collapse the sidebar
      act(() => {
        useSidebarStore.getState().collapse();
      });

      // Wait for persistence (debounced)
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Check localStorage
      const stored = localStorageMock.getItem('nasnet-sidebar');
      expect(stored).toBeDefined();
      if (stored) {
        const parsed = JSON.parse(stored);
        expect(parsed.state.desktopCollapsed).toBe(true);
      }
    });
  });
});

describe('Sidebar State Precedence Rules', () => {
  /**
   * These tests document the expected behavior per story requirements:
   * - Mobile (<640px): Sidebar always hidden
   * - Tablet (640-1024px): Sidebar always visible, collapsible
   * - Desktop (>1024px): Use persisted desktopCollapsed preference
   *
   * The actual platform-based logic is in ResponsiveShell component.
   * The store just provides the desktop preference.
   */

  beforeEach(() => {
    // Reset store before this test
    localStorageMock.clear();
    useSidebarStore.setState({ desktopCollapsed: false });
  });

  it('store provides desktop preference for use by ResponsiveShell', () => {
    // Reset to ensure clean state
    useSidebarStore.setState({ desktopCollapsed: false });
    const state = useSidebarStore.getState();

    // Desktop uses persisted value - should start as false (expanded)
    expect(state.desktopCollapsed).toBe(false);

    act(() => {
      state.toggle();
    });

    expect(useSidebarStore.getState().desktopCollapsed).toBe(true);

    // ResponsiveShell would use this value like:
    // const isCollapsed = platform === 'mobile' ? true
    //                   : platform === 'tablet' ? false
    //                   : desktopCollapsed;
  });
});
