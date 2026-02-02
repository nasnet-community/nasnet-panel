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

import { cn, Button, Card, CardHeader, CardTitle, CardContent } from '@nasnet/ui/primitives';

import type { ConfigPreviewProps } from './config-preview.types';
import { useConfigPreview } from './use-config-preview';
import { ConfigSection } from './config-section';
import { DiffView } from './diff-view';
import { SyntaxHighlight } from './syntax-highlight';

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
    <Card
      className={cn('overflow-hidden', className)}
      role="region"
      aria-label={title}
    >
      {/* Header with toolbar */}
      <CardHeader className="flex flex-row items-center justify-between py-3 px-4 bg-muted/50 border-b border-border">
        <div className="flex items-center gap-3">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>

          {/* Diff stats */}
          {showDiff && state.hasDiff && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-success">+{state.addedCount}</span>
              <span className="text-destructive">-{state.removedCount}</span>
            </div>
          )}

          {/* Total lines */}
          <span className="text-xs text-muted-foreground">
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
                className="text-xs h-8"
                aria-label="Expand all sections"
              >
                <ChevronDown className="h-4 w-4 mr-1" />
                Expand All
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={state.collapseAll}
                className="text-xs h-8"
                aria-label="Collapse all sections"
              >
                <ChevronUp className="h-4 w-4 mr-1" />
                Collapse All
              </Button>
            </>
          )}

          {/* Copy button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={state.copyToClipboard}
            className="text-xs h-8"
            aria-label={state.isCopied ? 'Copied to clipboard' : 'Copy to clipboard'}
          >
            {state.isCopied ? (
              <>
                <Check className="h-4 w-4 mr-1.5 text-success" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-1.5" />
                Copy
              </>
            )}
          </Button>

          {/* Download button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={state.downloadAsFile}
            className="text-xs h-8"
            aria-label={`Download as ${state.filename}`}
          >
            <Download className="h-4 w-4 mr-1.5" />
            Download
          </Button>
        </div>
      </CardHeader>

      {/* Content area */}
      <CardContent className="p-0">
        <div className="overflow-auto bg-muted" style={maxHeightStyle}>
          {showDiff ? (
            // Diff view
            <DiffView
              lines={state.diffLines}
              showLineNumbers={showLineNumbers}
            />
          ) : collapsible && state.sections.length > 1 ? (
            // Sectioned view with collapsible sections
            <div role="list" aria-label="Configuration sections">
              {state.sections.map((section) => (
                <ConfigSection
                  key={section.id}
                  section={section}
                  onToggle={() => state.toggleSection(section.id)}
                  showLineNumbers={showLineNumbers}
                />
              ))}
            </div>
          ) : (
            // Simple syntax highlighted view
            <SyntaxHighlight
              code={script}
              showLineNumbers={showLineNumbers}
            />
          )}
        </div>
      </CardContent>

      {/* Screen reader live region for copy/download feedback */}
      <div
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {state.isCopied && 'Configuration copied to clipboard'}
      </div>
    </Card>
  );
}

ConfigPreviewDesktop.displayName = 'ConfigPreviewDesktop';
