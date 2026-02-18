/**
 * ConfigPreview Mobile Presenter
 *
 * Mobile-optimized presenter for ConfigPreview component.
 * Features:
 * - Simplified UI without collapsible sections
 * - Sticky header with vertically stacked buttons
 * - Full-width horizontal scroll for code
 * - 44px minimum touch targets
 *
 * @see NAS-4A.21 - Build Config Preview Component
 * @see ADR-018 - Headless + Platform Presenters
 */

import * as React from 'react';

import { Copy, Check, Download } from 'lucide-react';

import { cn, Button } from '@nasnet/ui/primitives';

import { DiffView } from './diff-view';
import { SyntaxHighlight } from './syntax-highlight';
import { useConfigPreview } from './use-config-preview';

import type { ConfigPreviewProps } from './config-preview.types';

/**
 * ConfigPreviewMobile Component
 *
 * Mobile presenter with simplified controls and optimized touch targets.
 * Does not show collapsible sections to keep UI simple on small screens.
 *
 * @example
 * ```tsx
 * <ConfigPreviewMobile
 *   script={routerOsConfig}
 *   title="Config Preview"
 * />
 * ```
 */
export function ConfigPreviewMobile({
  script,
  previousScript,
  showDiff = false,
  title = 'Config Preview',
  onCopy,
  onDownload,
  routerName,
  showLineNumbers = false, // Disabled by default on mobile for space
  maxHeight,
  className,
}: ConfigPreviewProps) {
  const state = useConfigPreview({
    script,
    previousScript,
    showDiff,
    collapsible: false, // No collapsing on mobile
    routerName,
    onCopy,
    onDownload,
  });

  // Determine max height style
  const maxHeightStyle = maxHeight
    ? typeof maxHeight === 'number'
      ? { maxHeight: `${maxHeight}px` }
      : { maxHeight }
    : undefined;

  return (
    <div
      className={cn('flex flex-col bg-background', className)}
      role="region"
      aria-label={title}
    >
      {/* Sticky header */}
      <div className="sticky top-0 z-10 flex flex-col gap-3 p-4 bg-background border-b border-border">
        {/* Title row */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{title}</span>

          {/* Stats */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {showDiff && state.hasDiff && (
              <>
                <span className="text-success">+{state.addedCount}</span>
                <span className="text-destructive">-{state.removedCount}</span>
                <span className="text-muted-foreground">|</span>
              </>
            )}
            <span>
              {state.totalLines} {state.totalLines === 1 ? 'line' : 'lines'}
            </span>
          </div>
        </div>

        {/* Action buttons - stacked on mobile for better touch targets */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="default"
            className="flex-1 min-h-[44px]"
            onClick={state.copyToClipboard}
            aria-label={state.isCopied ? 'Copied to clipboard' : 'Copy script to clipboard'}
          >
            {state.isCopied ? (
              <>
                <Check className="h-5 w-5 mr-2 text-success" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-5 w-5 mr-2" />
                Copy Script
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="default"
            className="flex-1 min-h-[44px]"
            onClick={state.downloadAsFile}
            aria-label={`Download as ${state.filename}`}
          >
            <Download className="h-5 w-5 mr-2" />
            Download .rsc
          </Button>
        </div>
      </div>

      {/* Code content - horizontal scroll */}
      <div
        className="overflow-x-auto overflow-y-auto bg-muted"
        style={maxHeightStyle}
      >
        {showDiff ? (
          <DiffView
            lines={state.diffLines}
            showLineNumbers={showLineNumbers}
          />
        ) : (
          <SyntaxHighlight
            code={script}
            showLineNumbers={showLineNumbers}
            className="text-xs"
          />
        )}
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

ConfigPreviewMobile.displayName = 'ConfigPreviewMobile';
