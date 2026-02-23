/**
 * Accordion Component
 *
 * Built on @radix-ui/react-collapsible
 * Simple accordion implementation for expanding/collapsing content sections.
 * Supports single and multiple open items simultaneously.
 *
 * Accessibility:
 * - Keyboard navigation: Tab to move between items, Enter/Space to toggle
 * - Screen reader support via semantic HTML + ARIA attributes
 * - Focus visible indicators on trigger buttons
 * - Respects prefers-reduced-motion for animations
 *
 * @module @nasnet/ui/primitives/accordion
 * @example
 * ```tsx
 * <Accordion type="single">
 *   <AccordionItem value="item-1">
 *     <AccordionTrigger>Section 1</AccordionTrigger>
 *     <AccordionContent>Content here</AccordionContent>
 *   </AccordionItem>
 * </Accordion>
 * ```
 */
import * as React from 'react';
export interface AccordionProps {
    type?: 'single' | 'multiple';
    value?: string | string[];
    defaultValue?: string | string[];
    onValueChange?: (value: string | string[]) => void;
    className?: string;
    children?: React.ReactNode;
}
declare const Accordion: React.ForwardRefExoticComponent<AccordionProps & React.RefAttributes<HTMLDivElement>>;
export interface AccordionItemProps {
    value: string;
    className?: string;
    children?: React.ReactNode;
}
declare const AccordionItem: React.ForwardRefExoticComponent<AccordionItemProps & React.RefAttributes<HTMLDivElement>>;
export interface AccordionTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    className?: string;
    children?: React.ReactNode;
}
declare const AccordionTrigger: React.ForwardRefExoticComponent<AccordionTriggerProps & React.RefAttributes<HTMLButtonElement>>;
export interface AccordionContentProps {
    className?: string;
    children?: React.ReactNode;
}
declare const AccordionContent: React.ForwardRefExoticComponent<AccordionContentProps & React.RefAttributes<HTMLDivElement>>;
export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
//# sourceMappingURL=accordion.d.ts.map