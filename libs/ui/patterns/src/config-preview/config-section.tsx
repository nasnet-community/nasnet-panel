/**
 * ConfigSection Component
 *
 * Collapsible section for RouterOS configuration.
 * Uses Radix Collapsible for accessible expand/collapse behavior.
 *
 * @see NAS-4A.21 - Build Config Preview Component
 */

import * as React from 'react';

import * as Collapsible from '@radix-ui/react-collapsible';
import { ChevronDown, ChevronRight } from 'lucide-react';

import { cn, Button } from '@nasnet/ui/primitives';

import { SyntaxHighlight } from './syntax-highlight';

import type { ConfigSectionComponentProps } from './config-preview.types';

/**
 * Get display name for section header
 * Converts internal headers like "__preamble__" to readable names
 */
function getDisplayHeader(header: string): string {
  if (header === '__preamble__') {
    return 'Comments & Preamble';
  }
  if (header === '__script__') {
    return 'Script';
  }
  return header;
}

/**
 * ConfigSection Component
 *
 * A collapsible section that groups related RouterOS commands.
 * Shows a header with the command path and line count when collapsed.
 *
 * @example
 * ```tsx
 * <ConfigSection
 *   section={{
 *     id: 'section-1',
 *     header: '/interface ethernet',
 *     lines: ['set ...', 'add ...'],
 *     startLine: 5,
 *     isExpanded: true,
 *   }}
 *   onToggle={() => toggleSection('section-1')}
 *   showLineNumbers
 * />
 * ```
 */
export function ConfigSection({
  section,
  onToggle,
  showLineNumbers = true,
  startLineNumber,
}: ConfigSectionComponentProps) {
  const lineCount = section.lines.length;
  const displayHeader = getDisplayHeader(section.header);
  const effectiveStartLine = startLineNumber ?? section.startLine;

  return (
    <Collapsible.Root open={section.isExpanded} onOpenChange={onToggle}>
      <Collapsible.Trigger asChild>
        <Button
          variant="ghost"
          className={cn(
            'w-full justify-start px-4 py-2 h-auto',
            'hover:bg-muted/50 rounded-none',
            'font-mono text-sm text-left',
            !section.isExpanded && 'border-b border-border'
          )}
          aria-expanded={section.isExpanded}
          aria-label={`${section.isExpanded ? 'Collapse' : 'Expand'} ${displayHeader} section`}
        >
          {section.isExpanded ? (
            <ChevronDown className="h-4 w-4 mr-2 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 mr-2 shrink-0 text-muted-foreground" />
          )}

          <span className="text-primary font-medium truncate">{displayHeader}</span>

          {!section.isExpanded && (
            <span className="ml-auto text-muted-foreground text-xs">
              {lineCount} {lineCount === 1 ? 'line' : 'lines'}
            </span>
          )}
        </Button>
      </Collapsible.Trigger>

      <Collapsible.Content className="border-b border-border">
        <div className="overflow-auto">
          <SyntaxHighlight
            code={section.lines.join('\n')}
            showLineNumbers={showLineNumbers}
            startLineNumber={effectiveStartLine}
          />
        </div>
      </Collapsible.Content>
    </Collapsible.Root>
  );
}

ConfigSection.displayName = 'ConfigSection';
