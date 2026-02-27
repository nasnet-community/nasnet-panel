import * as React from 'react';

import * as TabsPrimitive from '@radix-ui/react-tabs';

import { cn } from '../lib/utils';

/**
 * Root tabs component for organizing content into switchable panels.
 * Built on Radix UI Tabs primitive with full keyboard navigation support.
 * Use Tab key to navigate between triggers, arrow keys to move focus, Enter/Space to activate.
 *
 * @example
 * <Tabs defaultValue="account">
 *   <TabsList>
 *     <TabsTrigger value="account">Account</TabsTrigger>
 *     <TabsTrigger value="password">Password</TabsTrigger>
 *   </TabsList>
 *   <TabsContent value="account">Account content</TabsContent>
 *   <TabsContent value="password">Password content</TabsContent>
 * </Tabs>
 */
const Tabs = TabsPrimitive.Root;

/**
 * TabsList - Container for tab trigger buttons.
 * Manages the tab list styling, layout, and keyboard navigation context.
 * Includes bottom border separator and flex layout for horizontal tab arrangement.
 * Keyboard: Tab to focus first trigger, arrow keys to navigate between triggers.
 *
 * @example
 * <TabsList>
 *   <TabsTrigger value="tab1">Tab 1</TabsTrigger>
 *   <TabsTrigger value="tab2">Tab 2</TabsTrigger>
 * </TabsList>
 */
const TabsList = React.memo(
  React.forwardRef<
    React.ElementRef<typeof TabsPrimitive.List>,
    React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
  >(({ className, ...props }, ref) => (
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center bg-muted rounded-lg p-1',
        className
      )}
      {...props}
    />
  ))
);
TabsList.displayName = TabsPrimitive.List.displayName;

/**
 * TabsTrigger - Individual tab button within TabsList.
 * Keyboard accessible with full arrow key navigation, Enter/Space activation.
 * Shows active state with primary text color and bottom border accent.
 * Includes visual focus ring for keyboard navigation and disabled state support.
 *
 * @example
 * <TabsTrigger value="account">Account Settings</TabsTrigger>
 *
 * Props:
 * - value (required): Unique identifier for this tab
 * - disabled: Prevents tab from being selected
 * - className: Additional CSS classes for customization
 */
const TabsTrigger = React.memo(
  React.forwardRef<
    React.ElementRef<typeof TabsPrimitive.Trigger>,
    React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
  >(({ className, ...props }, ref) => (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap min-h-[44px] px-3 py-1.5 text-sm font-medium text-muted-foreground rounded-md transition-all duration-200 hover:text-foreground hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm',
        className
      )}
      {...props}
    />
  ))
);
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

/**
 * TabsContent - Panel content displayed when corresponding TabsTrigger is active.
 * Supports keyboard focus and full ARIA attributes from Radix UI.
 * Focus ring visible on Tab navigation for accessibility compliance.
 * Content is removed from DOM when inactive (not just hidden).
 *
 * @example
 * <TabsContent value="account">
 *   <h2>Account Settings</h2>
 *   <form>...</form>
 * </TabsContent>
 *
 * Props:
 * - value (required): Must match a TabsTrigger value prop
 * - className: Additional CSS classes for customization
 */
const TabsContent = React.memo(
  React.forwardRef<
    React.ElementRef<typeof TabsPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
  >(({ className, ...props }, ref) => (
    <TabsPrimitive.Content
      ref={ref}
      className={cn(
        'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className
      )}
      {...props}
    />
  ))
);
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
