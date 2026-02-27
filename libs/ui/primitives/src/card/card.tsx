import * as React from 'react';

import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../lib/utils';

const cardVariants = cva(
  'border-border bg-card text-card-foreground rounded-[var(--semantic-radius-card)] border transition-shadow duration-200',
  {
    variants: {
      variant: {
        default: 'shadow-[var(--semantic-shadow-card)]',
        elevated: 'shadow-[var(--semantic-shadow-card)] hover:shadow-lg',
        interactive: 'cursor-pointer shadow-[var(--semantic-shadow-card)] hover:shadow-lg',
        flat: 'shadow-none',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

/**
 * CardProps interface extending HTMLDivAttributes with CVA variant support
 */
export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

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
const Card = React.memo(
  React.forwardRef<HTMLDivElement, CardProps>(({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant }), className)}
      {...props}
    />
  ))
);
Card.displayName = 'Card';

/**
 * CardHeader - Container for card title and description.
 * Typically placed at the top of a Card component.
 * Uses semantic spacing tokens: p-component-md on mobile, p-component-lg on desktop.
 */
const CardHeader = React.memo(
  React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
      <div
        ref={ref}
        className={cn('gap-component-sm p-component-md md:p-component-lg flex flex-col', className)}
        {...props}
      />
    )
  )
);
CardHeader.displayName = 'CardHeader';

/**
 * CardTitle - Primary heading within a card header.
 * Should be semantically appropriate (h2, h3, etc. based on page context).
 */
const CardTitle = React.memo(
  React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
      <div
        ref={ref}
        className={cn('text-lg font-semibold leading-none tracking-tight', className)}
        {...props}
      />
    )
  )
);
CardTitle.displayName = 'CardTitle';

/**
 * CardDescription - Secondary text or supporting description in card header.
 * Displayed in a muted color for visual distinction.
 */
const CardDescription = React.memo(
  React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
      <div
        ref={ref}
        className={cn('text-muted-foreground text-sm', className)}
        {...props}
      />
    )
  )
);
CardDescription.displayName = 'CardDescription';

/**
 * CardContent - Main content area of the card.
 * Provides consistent padding and spacing for card body content.
 * Uses semantic spacing tokens: p-component-md on mobile, p-component-lg on desktop.
 */
const CardContent = React.memo(
  React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
      <div
        ref={ref}
        className={cn('p-component-md md:p-component-lg pt-0', className)}
        {...props}
      />
    )
  )
);
CardContent.displayName = 'CardContent';

/**
 * CardFooter - Container for card footer content.
 * Typically used for action buttons or additional information at the bottom.
 * Uses semantic spacing tokens: p-component-md on mobile, p-component-lg on desktop.
 */
const CardFooter = React.memo(
  React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
      <div
        ref={ref}
        className={cn(
          'gap-component-sm p-component-md md:p-component-lg flex items-center pt-0',
          className
        )}
        {...props}
      />
    )
  )
);
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, cardVariants };
