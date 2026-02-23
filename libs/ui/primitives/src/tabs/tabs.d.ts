import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
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
declare const Tabs: React.ForwardRefExoticComponent<TabsPrimitive.TabsProps & React.RefAttributes<HTMLDivElement>>;
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
declare const TabsList: React.MemoExoticComponent<React.ForwardRefExoticComponent<Omit<TabsPrimitive.TabsListProps & React.RefAttributes<HTMLDivElement>, "ref"> & React.RefAttributes<HTMLDivElement>>>;
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
declare const TabsTrigger: React.MemoExoticComponent<React.ForwardRefExoticComponent<Omit<TabsPrimitive.TabsTriggerProps & React.RefAttributes<HTMLButtonElement>, "ref"> & React.RefAttributes<HTMLButtonElement>>>;
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
declare const TabsContent: React.MemoExoticComponent<React.ForwardRefExoticComponent<Omit<TabsPrimitive.TabsContentProps & React.RefAttributes<HTMLDivElement>, "ref"> & React.RefAttributes<HTMLDivElement>>>;
export { Tabs, TabsList, TabsTrigger, TabsContent };
//# sourceMappingURL=tabs.d.ts.map