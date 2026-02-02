/**
 * Help System Types
 *
 * Type definitions for the contextual help system that provides
 * field-level explanations with Simple/Technical mode toggle.
 *
 * @see NAS-4A.12: Build Help System Components
 * @see ADR-018: Headless Platform Presenters
 */

import type { ReactNode } from 'react';

/**
 * Help mode determines the terminology level displayed
 * - 'simple': User-friendly explanations for beginners
 * - 'technical': Technical terminology for power users
 */
export type HelpMode = 'simple' | 'technical';

/**
 * Content structure for help information
 */
export interface HelpContent {
  /** Title displayed in the help popover/sheet */
  title: string;
  /** Descriptive explanation of the field */
  description: string;
  /** Optional list of example values */
  examples?: string[];
  /** Optional link to detailed documentation */
  link?: string;
}

/**
 * Configuration for field help
 */
export interface FieldHelpConfig {
  /** Key for looking up help content in i18n */
  field: string;
  /** Override global mode preference for this instance */
  mode?: HelpMode;
  /** Popover placement relative to trigger */
  placement?: 'top' | 'right' | 'bottom' | 'left';
}

/**
 * Return type for useFieldHelp hook
 */
export interface UseFieldHelpReturn {
  /** Resolved help content from i18n */
  content: HelpContent;
  /** Whether the help popover/sheet is open */
  isOpen: boolean;
  /** Control open state */
  setIsOpen: (open: boolean) => void;
  /** Toggle open state */
  toggle: () => void;
  /** Current help mode */
  mode: HelpMode;
  /** Toggle between simple and technical modes */
  toggleMode: () => void;
  /** ARIA label for the help icon */
  ariaLabel: string;
  /** Whether i18n content is loaded */
  isReady: boolean;
}

/**
 * Props for the FieldHelp component (auto-detecting wrapper)
 */
export interface FieldHelpProps {
  /** Key for looking up help content in i18n */
  field: string;
  /** Override global mode preference for this instance */
  mode?: HelpMode;
  /** Popover placement relative to trigger */
  placement?: 'top' | 'right' | 'bottom' | 'left';
  /** Additional CSS classes */
  className?: string;
}

/**
 * Props for HelpIcon component
 */
export interface HelpIconProps {
  /** Field identifier for ARIA labeling */
  field: string;
  /** Additional CSS classes */
  className?: string;
  /** Icon size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Click handler */
  onClick?: () => void;
  /** ARIA label override */
  'aria-label'?: string;
  /** Tab index for keyboard navigation */
  tabIndex?: number;
}

/**
 * Props for HelpPopover (desktop presenter)
 */
export interface HelpPopoverProps {
  /** Help content to display */
  content: HelpContent;
  /** Popover placement */
  placement?: 'top' | 'right' | 'bottom' | 'left';
  /** Trigger element */
  children: ReactNode;
  /** Controlled open state */
  open?: boolean;
  /** Open state change handler */
  onOpenChange?: (open: boolean) => void;
}

/**
 * Props for HelpSheet (mobile presenter)
 */
export interface HelpSheetProps {
  /** Help content to display */
  content: HelpContent;
  /** Controlled open state */
  open: boolean;
  /** Open state change handler */
  onOpenChange: (open: boolean) => void;
}

/**
 * Internal props for desktop presenter
 */
export interface FieldHelpDesktopProps extends FieldHelpProps {
  /** State from headless hook */
  helpState: UseFieldHelpReturn;
}

/**
 * Internal props for mobile presenter
 */
export interface FieldHelpMobileProps extends FieldHelpProps {
  /** State from headless hook */
  helpState: UseFieldHelpReturn;
}

/**
 * Zustand store state for help mode
 */
export interface HelpModeState {
  /** Current global help mode */
  mode: HelpMode;
  /** Toggle between modes */
  toggleMode: () => void;
  /** Set specific mode */
  setMode: (mode: HelpMode) => void;
}
