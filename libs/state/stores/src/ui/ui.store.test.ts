/**
 * Tests for UI Store
 * @see NAS-4.5: Implement UI State with Zustand
 */

import { act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import {
  useUIStore,
  selectActiveTab,
  selectCommandPaletteOpen,
  selectCompactMode,
  selectAnimationsEnabled,
  selectDefaultNotificationDuration,
  getUIState,
} from './ui.store';

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

describe('useUIStore', () => {
  beforeEach(() => {
    // Reset store and localStorage before each test
    localStorageMock.clear();
    useUIStore.setState({
      activeTab: null,
      commandPaletteOpen: false,
      compactMode: false,
      animationsEnabled: true,
      defaultNotificationDuration: 4000,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should have default values', () => {
      const state = useUIStore.getState();
      expect(state.activeTab).toBe(null);
      expect(state.commandPaletteOpen).toBe(false);
      expect(state.compactMode).toBe(false);
      expect(state.animationsEnabled).toBe(true);
      expect(state.defaultNotificationDuration).toBe(4000);
    });
  });

  describe('Active Tab Actions', () => {
    it('setActiveTab should set the active tab', () => {
      const { setActiveTab } = useUIStore.getState();

      act(() => {
        setActiveTab('settings');
      });
      expect(useUIStore.getState().activeTab).toBe('settings');

      act(() => {
        setActiveTab('network');
      });
      expect(useUIStore.getState().activeTab).toBe('network');
    });

    it('setActiveTab should allow null to clear the tab', () => {
      const { setActiveTab } = useUIStore.getState();

      act(() => {
        setActiveTab('settings');
      });
      expect(useUIStore.getState().activeTab).toBe('settings');

      act(() => {
        setActiveTab(null);
      });
      expect(useUIStore.getState().activeTab).toBe(null);
    });
  });

  describe('Command Palette Actions', () => {
    it('openCommandPalette should set commandPaletteOpen to true', () => {
      const { openCommandPalette } = useUIStore.getState();

      expect(useUIStore.getState().commandPaletteOpen).toBe(false);

      act(() => {
        openCommandPalette();
      });
      expect(useUIStore.getState().commandPaletteOpen).toBe(true);
    });

    it('closeCommandPalette should set commandPaletteOpen to false', () => {
      useUIStore.setState({ commandPaletteOpen: true });
      const { closeCommandPalette } = useUIStore.getState();

      expect(useUIStore.getState().commandPaletteOpen).toBe(true);

      act(() => {
        closeCommandPalette();
      });
      expect(useUIStore.getState().commandPaletteOpen).toBe(false);
    });

    it('toggleCommandPalette should toggle the state', () => {
      const { toggleCommandPalette } = useUIStore.getState();

      expect(useUIStore.getState().commandPaletteOpen).toBe(false);

      act(() => {
        toggleCommandPalette();
      });
      expect(useUIStore.getState().commandPaletteOpen).toBe(true);

      act(() => {
        useUIStore.getState().toggleCommandPalette();
      });
      expect(useUIStore.getState().commandPaletteOpen).toBe(false);
    });

    it('setCommandPaletteOpen should set specific value', () => {
      const { setCommandPaletteOpen } = useUIStore.getState();

      act(() => {
        setCommandPaletteOpen(true);
      });
      expect(useUIStore.getState().commandPaletteOpen).toBe(true);

      act(() => {
        useUIStore.getState().setCommandPaletteOpen(false);
      });
      expect(useUIStore.getState().commandPaletteOpen).toBe(false);
    });
  });

  describe('Compact Mode Actions', () => {
    it('setCompactMode should set compact mode', () => {
      const { setCompactMode } = useUIStore.getState();

      expect(useUIStore.getState().compactMode).toBe(false);

      act(() => {
        setCompactMode(true);
      });
      expect(useUIStore.getState().compactMode).toBe(true);

      act(() => {
        useUIStore.getState().setCompactMode(false);
      });
      expect(useUIStore.getState().compactMode).toBe(false);
    });

    it('toggleCompactMode should toggle the state', () => {
      const { toggleCompactMode } = useUIStore.getState();

      expect(useUIStore.getState().compactMode).toBe(false);

      act(() => {
        toggleCompactMode();
      });
      expect(useUIStore.getState().compactMode).toBe(true);

      act(() => {
        useUIStore.getState().toggleCompactMode();
      });
      expect(useUIStore.getState().compactMode).toBe(false);
    });
  });

  describe('Animations Actions', () => {
    it('setAnimationsEnabled should set animations state', () => {
      const { setAnimationsEnabled } = useUIStore.getState();

      expect(useUIStore.getState().animationsEnabled).toBe(true);

      act(() => {
        setAnimationsEnabled(false);
      });
      expect(useUIStore.getState().animationsEnabled).toBe(false);

      act(() => {
        useUIStore.getState().setAnimationsEnabled(true);
      });
      expect(useUIStore.getState().animationsEnabled).toBe(true);
    });
  });

  describe('Notification Duration Actions', () => {
    it('setDefaultNotificationDuration should set duration', () => {
      const { setDefaultNotificationDuration } = useUIStore.getState();

      act(() => {
        setDefaultNotificationDuration(5000);
      });
      expect(useUIStore.getState().defaultNotificationDuration).toBe(5000);
    });

    it('setDefaultNotificationDuration should clamp to min 1000ms', () => {
      const { setDefaultNotificationDuration } = useUIStore.getState();

      act(() => {
        setDefaultNotificationDuration(500);
      });
      expect(useUIStore.getState().defaultNotificationDuration).toBe(1000);
    });

    it('setDefaultNotificationDuration should clamp to max 30000ms', () => {
      const { setDefaultNotificationDuration } = useUIStore.getState();

      act(() => {
        setDefaultNotificationDuration(60000);
      });
      expect(useUIStore.getState().defaultNotificationDuration).toBe(30000);
    });
  });

  describe('Reset Preferences', () => {
    it('resetPreferences should restore defaults for persisted preferences', () => {
      const {
        setCompactMode,
        setAnimationsEnabled,
        setDefaultNotificationDuration,
        resetPreferences,
      } = useUIStore.getState();

      // Change all preferences
      act(() => {
        setCompactMode(true);
        setAnimationsEnabled(false);
        setDefaultNotificationDuration(10000);
      });

      expect(useUIStore.getState().compactMode).toBe(true);
      expect(useUIStore.getState().animationsEnabled).toBe(false);
      expect(useUIStore.getState().defaultNotificationDuration).toBe(10000);

      // Reset
      act(() => {
        useUIStore.getState().resetPreferences();
      });

      expect(useUIStore.getState().compactMode).toBe(false);
      expect(useUIStore.getState().animationsEnabled).toBe(true);
      expect(useUIStore.getState().defaultNotificationDuration).toBe(4000);
    });
  });

  describe('Selectors', () => {
    it('selectActiveTab should return activeTab value', () => {
      useUIStore.setState({ activeTab: 'network' });
      expect(selectActiveTab(useUIStore.getState())).toBe('network');
    });

    it('selectCommandPaletteOpen should return commandPaletteOpen value', () => {
      useUIStore.setState({ commandPaletteOpen: true });
      expect(selectCommandPaletteOpen(useUIStore.getState())).toBe(true);
    });

    it('selectCompactMode should return compactMode value', () => {
      useUIStore.setState({ compactMode: true });
      expect(selectCompactMode(useUIStore.getState())).toBe(true);
    });

    it('selectAnimationsEnabled should return animationsEnabled value', () => {
      useUIStore.setState({ animationsEnabled: false });
      expect(selectAnimationsEnabled(useUIStore.getState())).toBe(false);
    });

    it('selectDefaultNotificationDuration should return duration value', () => {
      useUIStore.setState({ defaultNotificationDuration: 8000 });
      expect(selectDefaultNotificationDuration(useUIStore.getState())).toBe(8000);
    });
  });

  describe('Helper Functions', () => {
    it('getUIState should return current state', () => {
      const state = getUIState();
      expect(state.activeTab).toBe(null);
      expect(typeof state.setActiveTab).toBe('function');
      expect(typeof state.toggleCommandPalette).toBe('function');
    });
  });

  describe('Persistence', () => {
    it('should persist preferences to localStorage', async () => {
      const { setCompactMode, setAnimationsEnabled } = useUIStore.getState();

      act(() => {
        setCompactMode(true);
        setAnimationsEnabled(false);
      });

      // Wait for persistence (debounced)
      await new Promise((resolve) => setTimeout(resolve, 100));

      const stored = localStorageMock.getItem('nasnet-ui-store');
      expect(stored).toBeDefined();
      if (stored) {
        const parsed = JSON.parse(stored);
        expect(parsed.state.compactMode).toBe(true);
        expect(parsed.state.animationsEnabled).toBe(false);
      }
    });

    it('should NOT persist transient state (activeTab, commandPaletteOpen)', async () => {
      const { setActiveTab, openCommandPalette } = useUIStore.getState();

      act(() => {
        setActiveTab('settings');
        openCommandPalette();
      });

      // Wait for persistence
      await new Promise((resolve) => setTimeout(resolve, 100));

      const stored = localStorageMock.getItem('nasnet-ui-store');
      if (stored) {
        const parsed = JSON.parse(stored);
        // These should not be in persisted state
        expect(parsed.state.activeTab).toBeUndefined();
        expect(parsed.state.commandPaletteOpen).toBeUndefined();
      }
    });
  });
});
