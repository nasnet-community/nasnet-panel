/**
 * DiffView Component
 *
 * Renders a unified diff view showing added, removed, and unchanged lines.
 * Uses semantic color tokens for proper theming.
 *
 * @see NAS-4A.21 - Build Config Preview Component
 */

import * as React from 'react';
import { useMemo } from 'react';

import { cn } from '@nasnet/ui/primitives';

import type { DiffViewProps, DiffLine } from './config-preview.types';

/**
 * Get CSS classes for a diff line based on its type
 */
function getDiffLineClasses(type: DiffLine['type']): string {
  switch (type) {
    case 'added':
      return 'bg-success/10 text-success-foreground';
    case 'removed':
      return 'bg-destructive/10 text-destructive-foreground';
    case 'unchanged':
    default:
      return '';
  }
}

/**
 * Get the prefix character for a diff line
 */
function getDiffPrefix(type: DiffLine['type']): string {
  switch (type) {
    case 'added':
      return '+';
    case 'removed':
      return '-';
    case 'unchanged':
    default:
      return ' ';
  }
}

/**
 * DiffView Component
 *
 * Displays a unified diff view with color-coded additions and deletions.
 * Shows line numbers for both old and new versions.
 *
 * @example
 * ```tsx
 * const { diffLines } = useDiff({ oldScript, newScript });
 *
 * <DiffView
 *   lines={diffLines}
 *   showLineNumbers
 * />
 * ```
 */
export function DiffView({
  lines,
  showLineNumbers = true,
  className,
}: DiffViewProps) {
  // Calculate max line number width for formatting
  const maxOldLineNumber = useMemo(
    () =>
      Math.max(
        ...lines.filter((l) => l.oldLineNumber).map((l) => l.oldLineNumber || 0),
        0
      ),
    [lines]
  );

  const maxNewLineNumber = useMemo(
    () =>
      Math.max(
        ...lines.filter((l) => l.newLineNumber).map((l) => l.newLineNumber || 0),
        0
      ),
    [lines]
  );

  const oldLineWidth = String(maxOldLineNumber).length || 1;
  const newLineWidth = String(maxNewLineNumber).length || 1;

  return (
    <pre className={cn('m-0 p-0 font-mono text-sm', className)}>
      <code className="block whitespace-pre">
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((line, index) => (
              <tr
                key={index}
                className={cn(
                  'hover:bg-muted/30',
                  getDiffLineClasses(line.type)
                )}
              >
                {/* Diff prefix (+/-/space) */}
                <td
                  className={cn(
                    'w-6 text-center select-none font-bold',
                    line.type === 'added' && 'text-success',
                    line.type === 'removed' && 'text-destructive'
                  )}
                  aria-hidden="true"
                >
                  {getDiffPrefix(line.type)}
                </td>

                {showLineNumbers && (
                  <>
                    {/* Old line number */}
                    <td
                      className="px-2 py-0.5 text-right select-none text-muted-foreground border-r border-border"
                      style={{ width: `${oldLineWidth + 1}ch` }}
                    >
                      {line.type !== 'added' ? line.oldLineNumber : ''}
                    </td>

                    {/* New line number */}
                    <td
                      className="px-2 py-0.5 text-right select-none text-muted-foreground border-r border-border"
                      style={{ width: `${newLineWidth + 1}ch` }}
                    >
                      {line.type !== 'removed' ? line.newLineNumber : ''}
                    </td>
                  </>
                )}

                {/* Content */}
                <td className="pl-4 py-0.5 text-foreground">
                  {line.content || '\u00A0'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </code>
    </pre>
  );
}

DiffView.displayName = 'DiffView';
