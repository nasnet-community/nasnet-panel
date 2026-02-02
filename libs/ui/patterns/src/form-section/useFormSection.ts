/**
 * useFormSection Hook
 *
 * Headless hook for managing form section collapse state with localStorage persistence.
 * Supports SSR by checking for window availability.
 *
 * @module @nasnet/ui/patterns/form-section
 * @see NAS-4A.13: Build Form Section Component
 */

import { useState, useCallback, useEffect } from 'react';

import type { UseFormSectionConfig, UseFormSectionReturn } from './form-section.types';

/** Storage key prefix for namespacing */
const STORAGE_PREFIX = 'nasnet:form-section:';

/**
 * Slugify a string for use as a storage key.
 * Converts to lowercase, replaces spaces with hyphens, removes special characters.
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '');
}

/**
 * Check if localStorage is available (SSR safe).
 */
function isLocalStorageAvailable(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  try {
    const testKey = '__test__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get stored expanded state from localStorage.
 */
function getStoredState(key: string): boolean | null {
  if (!isLocalStorageAvailable()) {
    return null;
  }
  try {
    const stored = window.localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    if (stored === null) {
      return null;
    }
    return stored === 'true';
  } catch {
    return null;
  }
}

/**
 * Save expanded state to localStorage.
 */
function setStoredState(key: string, isExpanded: boolean): void {
  if (!isLocalStorageAvailable()) {
    return;
  }
  try {
    window.localStorage.setItem(`${STORAGE_PREFIX}${key}`, String(isExpanded));
  } catch {
    // Storage might be full or disabled, silently fail
  }
}

/**
 * Hook for managing form section collapse state.
 *
 * Features:
 * - Collapse/expand state management
 * - localStorage persistence across page navigations
 * - SSR safe (checks for window availability)
 *
 * @param config - Configuration object
 * @returns State and control functions
 *
 * @example
 * ```tsx
 * function MySection() {
 *   const { isExpanded, toggle, expand, collapse } = useFormSection({
 *     storageKey: 'network-settings',
 *     defaultOpen: true,
 *     collapsible: true,
 *   });
 *
 *   return (
 *     <section>
 *       <button onClick={toggle}>
 *         {isExpanded ? 'Collapse' : 'Expand'}
 *       </button>
 *       {isExpanded && <div>Content</div>}
 *     </section>
 *   );
 * }
 * ```
 */
export function useFormSection({
  storageKey,
  defaultOpen = true,
  collapsible = false,
}: UseFormSectionConfig): UseFormSectionReturn {
  // Initialize state with stored value or default
  const [isExpanded, setIsExpanded] = useState(() => {
    // If not collapsible, always expanded
    if (!collapsible) {
      return true;
    }
    // Try to get stored state
    const storedState = getStoredState(storageKey);
    return storedState !== null ? storedState : defaultOpen;
  });

  // Sync with localStorage when storageKey changes
  useEffect(() => {
    if (!collapsible) {
      return;
    }
    const storedState = getStoredState(storageKey);
    if (storedState !== null) {
      setIsExpanded(storedState);
    }
  }, [storageKey, collapsible]);

  // Toggle between expanded and collapsed
  const toggle = useCallback(() => {
    if (!collapsible) {
      return;
    }
    setIsExpanded((prev) => {
      const newState = !prev;
      setStoredState(storageKey, newState);
      return newState;
    });
  }, [collapsible, storageKey]);

  // Expand the section
  const expand = useCallback(() => {
    if (!collapsible) {
      return;
    }
    setIsExpanded(true);
    setStoredState(storageKey, true);
  }, [collapsible, storageKey]);

  // Collapse the section
  const collapse = useCallback(() => {
    if (!collapsible) {
      return;
    }
    setIsExpanded(false);
    setStoredState(storageKey, false);
  }, [collapsible, storageKey]);

  return {
    // If not collapsible, always return true
    isExpanded: collapsible ? isExpanded : true,
    toggle,
    expand,
    collapse,
  };
}
