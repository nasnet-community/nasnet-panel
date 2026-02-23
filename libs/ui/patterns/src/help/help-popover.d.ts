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
import type { HelpPopoverProps } from './help.types';
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
export declare const HelpPopover: React.NamedExoticComponent<HelpPopoverProps>;
//# sourceMappingURL=help-popover.d.ts.map