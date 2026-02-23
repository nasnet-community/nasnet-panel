/**
 * UI Primitives Library - shadcn/ui components
 * Exports all primitive UI components for the NasNetConnect application.
 *
 * This module provides foundational Layer 1 components following the three-layer
 * component architecture (Primitives → Patterns → Domain). All components are:
 * - WCAG AAA accessible (7:1 contrast, 44px touch targets on mobile)
 * - Dark mode compatible using CSS variables
 * - Using semantic design tokens (Tier 2/3), not primitive colors
 * - Platform-responsive where applicable
 *
 * @example
 * ```tsx
 * import { Button, Input, Card, Badge, Icon } from '@nasnet/ui/primitives';
 *
 * export function MyComponent() {
 *   return (
 *     <Card>
 *       <Input type="email" placeholder="Email" />
 *       <Button>Submit</Button>
 *     </Card>
 *   );
 * }
 * ```
 *
 * @see {@link https://nasnet.internal/design-tokens} for available design tokens
 * @see {@link https://nasnet.internal/component-library} for pattern components (Layer 2)
 */
export { cn } from './lib/utils';
export { Button, buttonVariants } from './button';
export type { ButtonProps } from './button';
export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, } from './card';
export { Input } from './input';
export type { InputProps } from './input';
export { Select, SelectGroup, SelectValue, SelectTrigger, SelectContent, SelectLabel, SelectItem, SelectSeparator, SelectScrollUpButton, SelectScrollDownButton, } from './select';
export { Switch } from './switch';
export type { SwitchProps } from './switch';
export { Dialog, DialogPortal, DialogOverlay, DialogTrigger, DialogClose, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription, } from './dialog';
export { Toaster } from './toast/toaster';
export { Toast, ToastAction, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport, } from './toast';
export { useToast, toast } from './toast/use-toast';
export { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs';
export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption, } from './table';
export type { TableProps, TableSectionProps, TableRowProps, TableHeadProps, TableCellProps, TableCaptionProps, } from './table';
export { Skeleton, SkeletonText, SkeletonCard, SkeletonTable, SkeletonChart, SkeletonAvatar, } from './skeleton';
export type { SkeletonProps, SkeletonTextProps, SkeletonCardProps, SkeletonTableProps, SkeletonChartProps, SkeletonAvatarProps, } from './skeleton';
export { Spinner } from './spinner';
export type { SpinnerProps } from './spinner';
export { Badge, badgeVariants } from './badge';
export type { BadgeProps } from './badge';
export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuRadioItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuGroup, DropdownMenuPortal, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuRadioGroup, } from './dropdown-menu';
export { Alert, AlertTitle, AlertDescription, alertVariants } from './alert';
export { Label } from './label';
export { Checkbox } from './checkbox';
export { Collapsible, CollapsibleTrigger, CollapsibleContent } from './collapsible';
export { RadioGroup, RadioGroupItem } from './radio-group';
export { Textarea } from './textarea';
export type { TextareaProps } from './textarea';
export { Separator } from './separator';
export type { SeparatorProps } from './separator';
export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from './tooltip';
export { Progress } from './progress';
export { Slider } from './slider';
export { Avatar, AvatarImage, AvatarFallback } from './avatar';
export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor } from './popover';
export { Sheet, SheetPortal, SheetOverlay, SheetTrigger, SheetClose, SheetContent, SheetHeader, SheetFooter, SheetTitle, SheetDescription, } from './sheet';
export { ScrollArea, ScrollBar } from './scroll-area';
export { CategoryAccentProvider, useCategoryAccent, getCategoryMeta, isCategory, CATEGORIES, CATEGORY_META, } from './category-accent';
export type { Category, CategoryMeta, CategoryAccentProviderProps } from './category-accent';
export { DriftBadge, driftBadgeVariants } from './drift-badge';
export type { DriftBadgeProps, DriftBadgeStatus } from './drift-badge';
export { Form, FormItem, FormLabel, FormControl, FormDescription, FormMessage, FormField, useFormField, } from './form';
export { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './accordion';
export type { AccordionProps, AccordionItemProps, AccordionTriggerProps, AccordionContentProps } from './accordion';
export { Icon } from './icon';
export type { IconProps } from './icon';
export { useReducedMotion } from './hooks/useReducedMotion';
export { useMediaQuery } from './hooks/useMediaQuery';
//# sourceMappingURL=index.d.ts.map