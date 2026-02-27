/**
 * ConfigPreview Desktop Presenter
 *
 * Desktop-optimized presenter for ConfigPreview component.
 * Features:
 * - Card-based layout with header toolbar
 * - Collapsible sections with expand/collapse all
 * - Full diff view support
 * - Copy and download buttons in header
 *
 * @see NAS-4A.21 - Build Config Preview Component
 * @see ADR-018 - Headless + Platform Presenters
 */

import * as React from 'react';

import { Copy, Check, Download, ChevronDown, ChevronUp } from 'lucide-react';

import { cn, Button } from '@nasnet/ui/primitives';

import { ConfigSection } from './config-section';
import { DiffView } from './diff-view';
import { SyntaxHighlight } from './syntax-highlight';
import { useConfigPreview } from './use-config-preview';

import type { ConfigPreviewProps } from './config-preview.types';

/**
 * ConfigPreviewDesktop Component
 *
 * Desktop presenter with full feature set including collapsible sections,
 * diff view, and header toolbar with copy/download actions.
 *
 * @example
 * ```tsx
 * <ConfigPreviewDesktop
 *   script={routerOsConfig}
 *   title="Configuration Preview"
 *   showLineNumbers
 *   collapsible
 * />
 * ```
 */
export function ConfigPreviewDesktop({
  script,
  previousScript,
  showDiff = false,
  title = 'Configuration Preview',
  onCopy,
  onDownload,
  routerName,
  collapsible = true,
  showLineNumbers = true,
  maxHeight = '500px',
  className,
}: ConfigPreviewProps) {
  const state = useConfigPreview({
    script,
    previousScript,
    showDiff,
    collapsible,
    routerName,
    onCopy,
    onDownload,
  });

  // Determine max height style
  const maxHeightStyle =
    typeof maxHeight === 'number' ? { maxHeight: `${maxHeight}px` } : { maxHeight };

  return (
    <div
      className={cn(
        'bg-card border-border rounded-[var(--semantic-radius-card)] border',
        'overflow-hidden shadow-[var(--semantic-shadow-card)]',
        className
      )}
      role="region"
      aria-label={title}
    >
      {/* Header with toolbar */}
      <div className="bg-muted border-border flex flex-row items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <h3 className="text-foreground text-sm font-semibold">{title}</h3>

          {/* Diff stats */}
          {showDiff && state.hasDiff && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-success">+{state.addedCount}</span>
              <span className="text-destructive">-{state.removedCount}</span>
            </div>
          )}

          {/* Total lines */}
          <span className="text-muted-foreground text-xs">
            {state.totalLines} {state.totalLines === 1 ? 'line' : 'lines'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Expand/Collapse all (only for sectioned view) */}
          {collapsible && !showDiff && state.sections.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={state.expandAll}
                className="h-8 text-xs"
                aria-label="Expand all sections"
              >
                <ChevronDown className="mr-1 h-4 w-4" />
                Expand All
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={state.collapseAll}
                className="h-8 text-xs"
                aria-label="Collapse all sections"
              >
                <ChevronUp className="mr-1 h-4 w-4" />
                Collapse All
              </Button>
            </>
          )}

          {/* Copy button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={state.copyToClipboard}
            className="h-8 text-xs"
            aria-label={state.isCopied ? 'Copied to clipboard' : 'Copy to clipboard'}
          >
            {state.isCopied ?
              <>
                <Check className="text-success mr-1.5 h-4 w-4" />
                Copied
              </>
            : <>
                <Copy className="mr-1.5 h-4 w-4" />
                Copy
              </>
            }
          </Button>

          {/* Download button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={state.downloadAsFile}
            className="h-8 text-xs"
            aria-label={`Download as ${state.filename}`}
          >
            <Download className="mr-1.5 h-4 w-4" />
            Download
          </Button>
        </div>
      </div>

      {/* Content area - dark background for code */}
      <div
        className="overflow-auto bg-slate-950 dark:bg-slate-900"
        style={maxHeightStyle}
      >
        {showDiff ?
          // Diff view
          <DiffView
            lines={state.diffLines}
            showLineNumbers={showLineNumbers}
          />
        : collapsible && state.sections.length > 1 ?
          // Sectioned view with collapsible sections
          <div
            role="list"
            aria-label="Configuration sections"
          >
            {state.sections.map((section) => (
              <ConfigSection
                key={section.id}
                section={section}
                onToggle={() => state.toggleSection(section.id)}
                showLineNumbers={showLineNumbers}
              />
            ))}
          </div>
          // Simple syntax highlighted view
        : <SyntaxHighlight
            code={script}
            showLineNumbers={showLineNumbers}
          />
        }
      </div>

      {/* Screen reader live region for copy/download feedback */}
      <div
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {state.isCopied && 'Configuration copied to clipboard'}
      </div>
    </div>
  );
}

ConfigPreviewDesktop.displayName = 'ConfigPreviewDesktop';
