import * as React from 'react';
import { type VariantProps } from 'class-variance-authority';
declare const cardVariants: (props?: ({
    variant?: "flat" | "default" | "elevated" | "interactive" | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
/**
 * CardProps interface extending HTMLDivAttributes with CVA variant support
 */
export interface CardProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {
}
/**
 * Card component - A flexible container for grouping related content.
 * Supports four visual variants: default, elevated, interactive, and flat.
 * Use for organizing information, displaying data, or creating clickable content areas.
 *
 * @example
 * ```tsx
 * <Card variant="elevated">
 *   <CardHeader>
 *     <CardTitle>Card Title</CardTitle>
 *     <CardDescription>Card description</CardDescription>
 *   </CardHeader>
 *   <CardContent>Content here</CardContent>
 *   <CardFooter>Footer content</CardFooter>
 * </Card>
 * ```
 */
declare const Card: React.MemoExoticComponent<React.ForwardRefExoticComponent<CardProps & React.RefAttributes<HTMLDivElement>>>;
/**
 * CardHeader - Container for card title and description.
 * Typically placed at the top of a Card component.
 * Uses semantic spacing tokens: p-component-md on mobile, p-component-lg on desktop.
 */
declare const CardHeader: React.MemoExoticComponent<React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>>;
/**
 * CardTitle - Primary heading within a card header.
 * Should be semantically appropriate (h2, h3, etc. based on page context).
 */
declare const CardTitle: React.MemoExoticComponent<React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>>;
/**
 * CardDescription - Secondary text or supporting description in card header.
 * Displayed in a muted color for visual distinction.
 */
declare const CardDescription: React.MemoExoticComponent<React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>>;
/**
 * CardContent - Main content area of the card.
 * Provides consistent padding and spacing for card body content.
 * Uses semantic spacing tokens: p-component-md on mobile, p-component-lg on desktop.
 */
declare const CardContent: React.MemoExoticComponent<React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>>;
/**
 * CardFooter - Container for card footer content.
 * Typically used for action buttons or additional information at the bottom.
 * Uses semantic spacing tokens: p-component-md on mobile, p-component-lg on desktop.
 */
declare const CardFooter: React.MemoExoticComponent<React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>>;
export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, cardVariants };
//# sourceMappingURL=card.d.ts.map