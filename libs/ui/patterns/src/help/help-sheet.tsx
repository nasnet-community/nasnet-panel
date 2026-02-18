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
export function HelpSheet({ content, open, onOpenChange }: HelpSheetProps) {
  const hasExamples = content.examples && content.examples.length > 0;
  const hasLink = content.link && content.link.trim() !== '';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className={cn(
          // Auto height with max constraint
          'h-auto max-h-[80vh]',
          // Mobile-optimized padding
          'px-6 pb-8 pt-6',
          // Rounded top corners for bottom sheet aesthetic
          'rounded-t-2xl'
        )}
      >
        {/* Drag Handle Indicator */}
        <div className="absolute left-1/2 top-3 -translate-x-1/2">
          <div className="h-1.5 w-12 rounded-full bg-muted-foreground/30" />
        </div>

        <SheetHeader className="text-left pb-4">
          {/* Title - larger for mobile */}
          {content.title && (
            <SheetTitle className="text-lg font-semibold">
              {content.title}
            </SheetTitle>
          )}

          {/* Description - readable size for mobile */}
          {content.description && (
            <SheetDescription className="text-base text-muted-foreground leading-relaxed">
              {content.description}
            </SheetDescription>
          )}
        </SheetHeader>

        <div className="space-y-6">
          {/* Examples - full width, larger touch targets */}
          {hasExamples && (
            <div className="space-y-3">
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Examples
              </span>
              <ul className="space-y-2">
                {content.examples!.map((example, index) => (
                  <li
                    key={index}
                    className={cn(
                      'flex items-center gap-3',
                      'p-3 rounded-lg bg-muted/50',
                      // Touch-friendly height
                      'min-h-[44px]'
                    )}
                  >
                    <span className="text-muted-foreground select-none">•</span>
                    <code className="font-mono text-sm break-all">
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
                'w-full py-3 px-4 rounded-lg',
                'bg-primary text-primary-foreground',
                'text-base font-medium',
                'transition-colors duration-150',
                'hover:bg-primary/90',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                // Minimum touch target
                'min-h-[44px]'
              )}
            >
              <span>Learn more</span>
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
