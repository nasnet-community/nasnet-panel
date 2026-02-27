/**
 * HelpPopover Component
 * Desktop presenter for contextual help content
 *
 * Features:
 * - Rich content layout (title, description, examples, link)
 * - Keyboard navigation (Escape to close)
 * - Focus trap while open
 * - Semantic design tokens
 *
 * @see NAS-4A.12: Build Help System Components
 * @see ADR-018: Headless Platform Presenters
 */

import * as React from 'react';

import { ExternalLink } from 'lucide-react';

import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  cn,
} from '@nasnet/ui/primitives';

import type { HelpPopoverProps } from './help.types';

/**
 * Map placement prop to Radix Popover side/align
 */
function getPopoverPosition(placement: HelpPopoverProps['placement'] = 'right') {
  const positionMap: Record<
    NonNullable<HelpPopoverProps['placement']>,
    { side: 'top' | 'right' | 'bottom' | 'left'; align: 'start' | 'center' | 'end' }
  > = {
    top: { side: 'top', align: 'center' },
    right: { side: 'right', align: 'start' },
    bottom: { side: 'bottom', align: 'center' },
    left: { side: 'left', align: 'start' },
  };
  return positionMap[placement];
}

/**
 * HelpPopover - Desktop presenter for help content
 *
 * Renders help content in a popover positioned relative to the trigger.
 * Content includes title, description, examples list, and optional documentation link.
 *
 * @example
 * ```tsx
 * <HelpPopover
 *   content={{
 *     title: 'Gateway',
 *     description: 'The router that connects your network to the internet',
 *     examples: ['192.168.1.1'],
 *     link: 'https://wiki.mikrotik.com/...'
 *   }}
 *   placement="right"
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 * >
 *   <HelpIcon field="gateway" />
 * </HelpPopover>
 * ```
 */
export const HelpPopover = React.memo(function HelpPopover({
  content,
  placement = 'right',
  children,
  open,
  onOpenChange,
}: HelpPopoverProps) {
  const { side, align } = getPopoverPosition(placement);

  const hasExamples = content.examples && content.examples.length > 0;
  const hasLink = content.link && content.link.trim() !== '';

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        side={side}
        align={align}
        sideOffset={8}
        className={cn(
          // Container styling per spec
          'bg-popover border border-border rounded-[var(--semantic-radius-card)]',
          'shadow-[var(--semantic-shadow-dropdown)]',
          'max-w-xs',
          'p-3',
          // Focus trap styling
          'focus:outline-none'
        )}
        // Handle Escape key - Radix handles this automatically
        onEscapeKeyDown={() => onOpenChange?.(false)}
        // Prevent focus from leaving the popover
        onInteractOutside={() => onOpenChange?.(false)}
      >
        <div className="space-y-3">
          {/* Title */}
          {content.title && (
            <h4 className="text-sm font-semibold text-foreground">
              {content.title}
            </h4>
          )}

          {/* Description */}
          {content.description && (
            <p className="text-xs text-muted-foreground leading-relaxed">
              {content.description}
            </p>
          )}

          {/* Examples */}
          {hasExamples && (
            <div className="space-y-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Examples
              </span>
              <div className="bg-muted rounded-[var(--semantic-radius-input)] p-2 space-y-1">
                {content.examples!.map((example, index) => (
                  <div key={index} className="font-mono text-xs text-muted-foreground break-all">
                    {example}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Documentation Link */}
          {hasLink && (
            <a
              href={content.link}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'inline-flex items-center gap-1',
                'text-sm text-primary hover:text-primary',
                'transition-colors duration-150',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded'
              )}
            >
              <span>Learn more</span>
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </a>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
});

HelpPopover.displayName = 'HelpPopover';
