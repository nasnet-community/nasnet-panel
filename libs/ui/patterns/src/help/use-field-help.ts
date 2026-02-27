/**
 * useFieldHelp Hook
 * Headless hook for field-level contextual help
 *
 * This hook manages:
 * - Loading help content from i18n based on field key and mode
 * - Open/closed state of the help popover/sheet
 * - ARIA labels for accessibility
 * - Integration with global help mode store
 *
 * @see NAS-4A.12: Build Help System Components
 * @see ADR-018: Headless Platform Presenters
 */

import { useMemo, useState, useCallback } from 'react';

import { useTranslation } from '@nasnet/core/i18n';

import { useHelpMode } from './use-help-mode';

import type { FieldHelpConfig, UseFieldHelpReturn, HelpContent, HelpMode } from './help.types';

/**
 * Default help content when translation is missing or loading
 */
const DEFAULT_HELP_CONTENT: HelpContent = {
  title: '',
  description: '',
  examples: [],
  link: '',
};

/**
 * Hook for managing field-level contextual help
 *
 * Provides all logic needed by both mobile and desktop presenters:
 * - Content loading from i18n with Simple/Technical mode support
 * - Open/closed state management
 * - ARIA labels for accessibility
 *
 * @param config - Configuration for the field help
 * @returns Help state and control functions
 *
 * @example
 * ```tsx
 * function FieldHelpDesktop({ field, placement }: FieldHelpProps) {
 *   const helpState = useFieldHelp({ field, placement });
 *   const { content, isOpen, setIsOpen, ariaLabel } = helpState;
 *
 *   return (
 *     <Popover open={isOpen} onOpenChange={setIsOpen}>
 *       <PopoverTrigger aria-label={ariaLabel}>
 *         <HelpCircle />
 *       </PopoverTrigger>
 *       <PopoverContent>
 *         <h4>{content.title}</h4>
 *         <p>{content.description}</p>
 *       </PopoverContent>
 *     </Popover>
 *   );
 * }
 * ```
 */
export function useFieldHelp(config: FieldHelpConfig): UseFieldHelpReturn {
  const { field, mode: propMode } = config;

  // Get i18n translation function for network namespace (where help content lives)
  // useSuspense: false to avoid blocking render while loading
  const { t, ready } = useTranslation('network');

  // Global help mode from Zustand store
  const { mode: globalMode, toggleMode: toggleGlobalMode } = useHelpMode();

  // Local open/closed state
  const [isOpen, setIsOpen] = useState(false);

  // Use prop mode if provided, otherwise use global mode
  const mode: HelpMode = propMode ?? globalMode;

  /**
   * Load help content from i18n based on field key and current mode
   * Content is structured as:
   * {
   *   "ip": {
   *     "title": { "simple": "IP Address", "technical": "IPv4/IPv6 Address" },
   *     "description": { "simple": "...", "technical": "..." },
   *     "examples": ["192.168.1.1", ...],
   *     "link": "https://..."
   *   }
   * }
   */
  const content = useMemo<HelpContent>(() => {
    if (!ready) {
      return DEFAULT_HELP_CONTENT;
    }

    // Get title based on mode
    const title = t(`help.${field}.title.${mode}`, {
      defaultValue: t(`help.${field}.title.simple`, { defaultValue: field }),
    });

    // Get description based on mode
    const description = t(`help.${field}.description.${mode}`, {
      defaultValue: t(`help.${field}.description.simple`, { defaultValue: '' }),
    });

    // Get examples (same for both modes)
    const examplesRaw = t(`help.${field}.examples`, {
      returnObjects: true,
      defaultValue: [],
    });
    const examples = Array.isArray(examplesRaw) ? examplesRaw : [];

    // Get documentation link (same for both modes)
    const link = t(`help.${field}.link`, { defaultValue: '' });

    return {
      title,
      description,
      examples: examples as string[],
      link: link || undefined,
    };
  }, [t, field, mode, ready]);

  /**
   * Generate ARIA label for the help icon
   * Uses the resolved title for context
   */
  const ariaLabel = useMemo(() => {
    const fieldTitle = content.title || field;
    return `Help for ${fieldTitle} field`;
  }, [content.title, field]);

  /**
   * Toggle open state
   */
  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return {
    content,
    isOpen,
    setIsOpen,
    toggle,
    mode,
    toggleMode: toggleGlobalMode,
    ariaLabel,
    isReady: ready,
  };
}
