/**
 * HelpSheet Component
 * Mobile presenter for contextual help content
 *
 * Features:
 * - Bottom sheet with drag handle
 * - Touch-friendly content layout
 * - Larger font sizes for mobile readability
 * - Full-width examples section
 * - Swipe-to-dismiss (handled by Radix Sheet)
 *
 * @see NAS-4A.12: Build Help System Components
 * @see ADR-018: Headless Platform Presenters
 */

import * as React from 'react';

import { ExternalLink } from 'lucide-react';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  cn,
} from '@nasnet/ui/primitives';

import type { HelpSheetProps } from './help.types';

/**
 * HelpSheet - Mobile presenter for help content
 *
 * Renders help content in a bottom sheet optimized for touch interaction.
 * Content is displayed with larger fonts and full-width layout for mobile usability.
 *
 * @example
 * ```tsx
 * <HelpSheet
 *   content={{
 *     title: 'Gateway',
 *     description: 'The router that connects your network to the internet',
 *     examples: ['192.168.1.1'],
 *     link: 'https://wiki.mikrotik.com/...'
 *   }}
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 * />
 * ```
 */
export const HelpSheet = React.memo(function HelpSheet({
  content,
  open,
  onOpenChange,
}: HelpSheetProps) {
  const hasExamples = content.examples && content.examples.length > 0;
  const hasLink = content.link && content.link.trim() !== '';

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
    >
      <SheetContent
        side="bottom"
        aria-label={content.title || 'Help information'}
        className={cn(
          // Auto height with max constraint
          'h-auto max-h-[80vh]',
          // Mobile-optimized padding per spec
          'p-4',
          // Rounded top corners for bottom sheet aesthetic
          'rounded-t-[var(--semantic-radius-card)]'
        )}
      >
        {/* Drag Handle Indicator */}
        <div className="absolute left-1/2 top-3 -translate-x-1/2">
          <div className="bg-muted-foreground/30 h-1.5 w-12 rounded-full" />
        </div>

        <SheetHeader className="pb-4 text-left">
          {/* Title - larger for mobile per spec */}
          {content.title && (
            <SheetTitle className="text-foreground text-base font-semibold">
              {content.title}
            </SheetTitle>
          )}

          {/* Description - readable size for mobile per spec */}
          {content.description && (
            <SheetDescription className="text-muted-foreground text-sm leading-relaxed">
              {content.description}
            </SheetDescription>
          )}
        </SheetHeader>

        <div className="space-y-4">
          {/* Examples - full width, larger touch targets */}
          {hasExamples && (
            <div className="space-y-2">
              <span className="text-muted-foreground text-sm font-semibold uppercase tracking-wide">
                Examples
              </span>
              <ul className="space-y-2">
                {content.examples!.map((example, index) => (
                  <li
                    key={index}
                    className={cn(
                      'flex items-center gap-2',
                      'bg-muted rounded-[var(--semantic-radius-input)] p-3',
                      // Touch-friendly height per spec (44px minimum)
                      'min-h-[44px]'
                    )}
                  >
                    <code className="text-muted-foreground flex-1 break-all font-mono text-sm">
                      {example}
                    </code>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Documentation Link - large touch target */}
          {hasLink && (
            <a
              href={content.link}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'flex items-center justify-center gap-2',
                'w-full px-4 py-3',
                'rounded-[var(--semantic-radius-button)]',
                'bg-primary text-primary-foreground',
                'text-sm font-medium',
                'transition-colors duration-150',
                'hover:bg-primary-hover',
                'focus-visible:ring-ring focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                // Minimum touch target per WCAG AAA spec
                'min-h-[44px]'
              )}
            >
              <span>Learn more</span>
              <ExternalLink
                className="h-4 w-4"
                aria-hidden="true"
              />
            </a>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
});

HelpSheet.displayName = 'HelpSheet';
