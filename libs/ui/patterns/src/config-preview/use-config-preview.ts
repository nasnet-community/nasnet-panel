/**
 * useConfigPreview Hook
 *
 * Headless hook providing all business logic for ConfigPreview component.
 * Handles script parsing, section management, diff computation,
 * clipboard copy, and file download.
 *
 * @see NAS-4A.21 - Build Config Preview Component
 * @see ADR-018 - Headless + Platform Presenters
 */

import { useState, useCallback, useMemo } from 'react';

import { useClipboard } from '../hooks';
import { useDiff } from './use-diff';
import { useToast } from '../hooks/useToast';

import type {
  ConfigSection,
  UseConfigPreviewConfig,
  UseConfigPreviewReturn,
} from './config-preview.types';

/**
 * Parse a RouterOS script into sections based on command paths
 *
 * Sections are detected by lines starting with `/` (e.g., /interface, /ip address).
 * Lines before the first section are grouped into a "__preamble__" section.
 *
 * @param script - The RouterOS script to parse
 * @returns Array of parsed sections
 */
function parseScriptIntoSections(script: string): ConfigSection[] {
  const lines = script.split('\n');
  const sections: ConfigSection[] = [];
  let currentSection: ConfigSection | null = null;
  let lineNumber = 0;

  for (const line of lines) {
    lineNumber++;
    const trimmed = line.trim();

    // Check if this is a section header (starts with /)
    if (trimmed.startsWith('/')) {
      // Save previous section if exists
      if (currentSection) {
        sections.push(currentSection);
      }
      // Start new section - extract the command path as header
      // e.g., "/interface ethernet" -> "/interface ethernet"
      // e.g., "/ip firewall filter" -> "/ip firewall filter"
      currentSection = {
        id: `section-${sections.length}`,
        header: trimmed,
        lines: [line],
        startLine: lineNumber,
        isExpanded: true,
      };
    } else if (currentSection) {
      // Add line to current section
      currentSection.lines.push(line);
    } else {
      // Lines before any section header (comments, empty lines)
      // Create a preamble section if it doesn't exist
      if (sections.length === 0 || sections[0].header !== '__preamble__') {
        if (trimmed.length > 0) {
          // Only create preamble if there's actual content
          currentSection = {
            id: 'section-preamble',
            header: '__preamble__',
            lines: [line],
            startLine: lineNumber,
            isExpanded: true,
          };
        }
      } else if (sections.length > 0 && sections[0].header === '__preamble__') {
        sections[0].lines.push(line);
      }
    }
  }

  // Don't forget the last section
  if (currentSection) {
    sections.push(currentSection);
  }

  // If no sections were created (script has no / commands), create a single section
  if (sections.length === 0 && lines.length > 0) {
    sections.push({
      id: 'section-0',
      header: '__script__',
      lines: lines,
      startLine: 1,
      isExpanded: true,
    });
  }

  return sections;
}

/**
 * Generate a download filename for the script
 *
 * @param routerName - Optional router name to include
 * @returns Filename in format: routerName-YYYY-MM-DD.rsc
 */
function generateFilename(routerName?: string): string {
  const timestamp = new Date().toISOString().slice(0, 10);
  const name = routerName?.replace(/[^a-zA-Z0-9-_]/g, '-') || 'config';
  return `${name}-${timestamp}.rsc`;
}

/**
 * Hook providing all business logic for ConfigPreview component
 *
 * Features:
 * - Script parsing into collapsible sections
 * - Diff computation between old and new scripts
 * - Section expand/collapse management
 * - Clipboard copy with toast feedback
 * - File download as .rsc
 *
 * @param config - Configuration options
 * @returns State and actions for ConfigPreview
 *
 * @example
 * ```tsx
 * const state = useConfigPreview({
 *   script: routerOsConfig,
 *   previousScript: oldConfig,
 *   showDiff: true,
 *   routerName: 'router-1',
 *   onCopy: () => console.log('Copied!'),
 * });
 *
 * return (
 *   <div>
 *     {state.sections.map(section => (
 *       <Section
 *         key={section.id}
 *         section={section}
 *         onToggle={() => state.toggleSection(section.id)}
 *       />
 *     ))}
 *   </div>
 * );
 * ```
 */
export function useConfigPreview({
  script,
  previousScript = '',
  showDiff = false,
  collapsible = true,
  routerName,
  onCopy,
  onDownload,
}: UseConfigPreviewConfig): UseConfigPreviewReturn {
  const { success, error } = useToast();

  // Parse script into sections
  const initialSections = useMemo(() => parseScriptIntoSections(script), [script]);

  // Section expand/collapse state
  const [sectionStates, setSectionStates] = useState<Record<string, boolean>>(() =>
    initialSections.reduce(
      (acc, section) => {
        acc[section.id] = section.isExpanded;
        return acc;
      },
      {} as Record<string, boolean>
    )
  );

  // Merge initial sections with current expand states
  const sections = useMemo(
    () =>
      initialSections.map((section) => ({
        ...section,
        isExpanded: sectionStates[section.id] ?? true,
      })),
    [initialSections, sectionStates]
  );

  // Compute diff if needed
  const { diffLines, hasDiff, addedCount, removedCount } = useDiff({
    oldScript: previousScript,
    newScript: script,
  });

  // Clipboard functionality
  const { copy, copied: isCopied } = useClipboard({
    onSuccess: () => {
      onCopy?.();
      success('Copied!', { message: 'Configuration copied to clipboard' });
    },
    onError: () => {
      error('Failed to copy', { message: 'Could not copy to clipboard' });
    },
  });

  // Toggle section expand/collapse
  const toggleSection = useCallback((sectionId: string) => {
    setSectionStates((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  }, []);

  // Expand all sections
  const expandAll = useCallback(() => {
    setSectionStates((prev) => {
      const newStates = { ...prev };
      for (const key of Object.keys(newStates)) {
        newStates[key] = true;
      }
      return newStates;
    });
  }, []);

  // Collapse all sections
  const collapseAll = useCallback(() => {
    setSectionStates((prev) => {
      const newStates = { ...prev };
      for (const key of Object.keys(newStates)) {
        newStates[key] = false;
      }
      return newStates;
    });
  }, []);

  // Copy to clipboard
  const copyToClipboard = useCallback(async () => {
    await copy(script);
  }, [copy, script]);

  // Download as file
  const downloadAsFile = useCallback(() => {
    const filename = generateFilename(routerName);
    const blob = new Blob([script], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    onDownload?.();
    success('Downloaded!', { message: `Saved as ${filename}` });
  }, [script, routerName, onDownload, success]);

  // Computed values
  const totalLines = useMemo(() => script.split('\n').length, [script]);
  const filename = useMemo(() => generateFilename(routerName), [routerName]);

  return {
    // Sections
    sections,

    // Diff
    diffLines: showDiff ? diffLines : [],
    hasDiff: showDiff ? hasDiff : false,
    addedCount: showDiff ? addedCount : 0,
    removedCount: showDiff ? removedCount : 0,

    // Section actions
    toggleSection,
    expandAll,
    collapseAll,

    // Copy/Download
    copyToClipboard,
    downloadAsFile,
    isCopied,

    // Computed
    totalLines,
    filename,
  };
}
