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
export declare const HelpSheet: React.NamedExoticComponent<HelpSheetProps>;
//# sourceMappingURL=help-sheet.d.ts.map