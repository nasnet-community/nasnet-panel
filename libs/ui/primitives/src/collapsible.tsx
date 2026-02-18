/**
 * Collapsible Component
 *
 * Built on @radix-ui/react-collapsible
 * Interactive component which expands/collapses a panel
 *
 * @see https://ui.shadcn.com/docs/components/collapsible
 */

import * as CollapsiblePrimitive from '@radix-ui/react-collapsible';

/**
 * Collapsible Root
 * Manages the open/closed state
 */
const Collapsible = CollapsiblePrimitive.Root;

/**
 * Collapsible Trigger
 * Button that toggles the collapsible state
 */
const CollapsibleTrigger = CollapsiblePrimitive.Trigger;

/**
 * Collapsible Content
 * The expandable/collapsible content area
 */
const CollapsibleContent = CollapsiblePrimitive.Content;

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
