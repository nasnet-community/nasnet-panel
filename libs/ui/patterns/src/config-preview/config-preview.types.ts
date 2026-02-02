/**
 * ConfigPreview Types
 *
 * TypeScript interfaces for the ConfigPreview component.
 * Displays RouterOS configuration scripts with syntax highlighting,
 * collapsible sections, and diff view capabilities.
 *
 * @see NAS-4A.21 - Build Config Preview Component
 * @see ADR-018 - Headless + Platform Presenters
 */

/**
 * Props for the ConfigPreview component
 */
export interface ConfigPreviewProps {
  /** The RouterOS script to display */
  script: string;
  /** Previous script for diff comparison */
  previousScript?: string;
  /** Show diff view instead of plain script */
  showDiff?: boolean;
  /** Title for the preview panel */
  title?: string;
  /** Callback when copy button clicked */
  onCopy?: () => void;
  /** Callback when download button clicked */
  onDownload?: () => void;
  /** Router name for download filename */
  routerName?: string;
  /** Show section collapse controls */
  collapsible?: boolean;
  /** Show line numbers */
  showLineNumbers?: boolean;
  /** Maximum height before scrolling */
  maxHeight?: number | string;
  /** Force specific presenter */
  presenter?: 'mobile' | 'desktop' | 'auto';
  /** Additional CSS classes */
  className?: string;
}

/**
 * A parsed section of RouterOS configuration
 * Each section starts with a command path (e.g., /interface, /ip address)
 */
export interface ConfigSection {
  /** Unique section identifier */
  id: string;
  /** Section header command path (e.g., "/interface", "/ip firewall filter") */
  header: string;
  /** Lines of content in this section (including the header line) */
  lines: string[];
  /** Starting line number in the original script */
  startLine: number;
  /** Whether this section is currently expanded */
  isExpanded: boolean;
}

/**
 * A single line in a diff view
 */
export interface DiffLine {
  /** Type of diff line */
  type: 'added' | 'removed' | 'unchanged';
  /** The line content */
  content: string;
  /** Line number in the old script (for removed/unchanged) */
  oldLineNumber?: number;
  /** Line number in the new script (for added/unchanged) */
  newLineNumber?: number;
}

/**
 * Configuration options for the useConfigPreview hook
 */
export interface UseConfigPreviewConfig {
  /** The RouterOS script to display */
  script: string;
  /** Previous script for diff comparison */
  previousScript?: string;
  /** Show diff view instead of plain script */
  showDiff?: boolean;
  /** Show section collapse controls */
  collapsible?: boolean;
  /** Router name for download filename */
  routerName?: string;
  /** Callback when copy button clicked */
  onCopy?: () => void;
  /** Callback when download button clicked */
  onDownload?: () => void;
}

/**
 * Return type for the useConfigPreview hook
 */
export interface UseConfigPreviewReturn {
  // Parsed sections
  /** Parsed configuration sections */
  sections: ConfigSection[];

  // Diff lines (when showDiff=true)
  /** Computed diff lines */
  diffLines: DiffLine[];
  /** Whether there are any differences */
  hasDiff: boolean;
  /** Count of added lines */
  addedCount: number;
  /** Count of removed lines */
  removedCount: number;

  // Section actions
  /** Toggle a specific section's expanded state */
  toggleSection: (sectionId: string) => void;
  /** Expand all sections */
  expandAll: () => void;
  /** Collapse all sections */
  collapseAll: () => void;

  // Copy/Download
  /** Copy the script to clipboard */
  copyToClipboard: () => Promise<void>;
  /** Download the script as a .rsc file */
  downloadAsFile: () => void;
  /** Whether the script was recently copied */
  isCopied: boolean;

  // Computed
  /** Total number of lines in the script */
  totalLines: number;
  /** Generated filename for download */
  filename: string;
}

/**
 * Configuration options for the useDiff hook
 */
export interface UseDiffConfig {
  /** The old/previous script */
  oldScript: string;
  /** The new/current script */
  newScript: string;
}

/**
 * Return type for the useDiff hook
 */
export interface UseDiffReturn {
  /** Computed diff lines */
  diffLines: DiffLine[];
  /** Count of added lines */
  addedCount: number;
  /** Count of removed lines */
  removedCount: number;
  /** Count of unchanged lines */
  unchangedCount: number;
  /** Whether there are any differences */
  hasDiff: boolean;
}

/**
 * Props for the internal SyntaxHighlight component
 */
export interface SyntaxHighlightProps {
  /** The code to highlight */
  code: string;
  /** Language for syntax highlighting */
  language?: string;
  /** Show line numbers in the gutter */
  showLineNumbers?: boolean;
  /** Starting line number offset */
  startLineNumber?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Props for the internal DiffView component
 */
export interface DiffViewProps {
  /** The computed diff lines to display */
  lines: DiffLine[];
  /** Show line numbers */
  showLineNumbers?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Props for the internal ConfigSection component
 */
export interface ConfigSectionComponentProps {
  /** The section data */
  section: ConfigSection;
  /** Callback when section is toggled */
  onToggle: () => void;
  /** Show line numbers */
  showLineNumbers?: boolean;
  /** Starting line number for this section */
  startLineNumber?: number;
}
