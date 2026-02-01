// UI Primitives Library - shadcn/ui components
// Exports all primitive UI components for the NasNetConnect application

// Utilities
export { cn } from './lib/utils';

// Button
export { Button, buttonVariants } from './button';
export type { ButtonProps } from './button';

// Card
export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from './card';

// Input
export { Input } from './input';
export type { InputProps } from './input';

// Select
export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
} from './select';

// Switch
export { Switch } from './switch';

// Dialog
export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from './dialog';

// Toast
export { Toaster } from './toast/toaster';
export {
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from './toast';
export { useToast, toast } from './toast/use-toast';

// Tabs
export { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs';

// Table
export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from './table';

// Skeleton
export {
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonTable,
  SkeletonChart,
  SkeletonAvatar,
} from './skeleton';
export type {
  SkeletonProps,
  SkeletonTextProps,
  SkeletonCardProps,
  SkeletonTableProps,
  SkeletonChartProps,
  SkeletonAvatarProps,
} from './skeleton';

// Spinner
export { Spinner } from './spinner';
export type { SpinnerProps } from './spinner';

// Badge
export { Badge, badgeVariants } from './badge';
export type { BadgeProps } from './badge';

// DropdownMenu
export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
} from './dropdown-menu';

// Alert
export { Alert, AlertTitle, AlertDescription, alertVariants } from './alert';

// Label
export { Label } from './label';

// Checkbox
export { Checkbox } from './checkbox';

// RadioGroup
export { RadioGroup, RadioGroupItem } from './radio-group';

// Textarea
export { Textarea } from './textarea';
export type { TextareaProps } from './textarea';

// Separator
export { Separator } from './separator';

// Tooltip
export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from './tooltip';

// Progress
export { Progress } from './progress';

// Slider
export { Slider } from './slider';

// Avatar
export { Avatar, AvatarImage, AvatarFallback } from './avatar';

// Popover
export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor } from './popover';

// Sheet (Drawer)
export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
} from './sheet';

// ScrollArea
export { ScrollArea, ScrollBar } from './scroll-area';

// Category Accent System
export {
  CategoryAccentProvider,
  useCategoryAccent,
  getCategoryMeta,
  isCategory,
  CATEGORIES,
  CATEGORY_META,
} from './category-accent';
export type { Category, CategoryMeta, CategoryAccentProviderProps } from './category-accent';

// Drift Badge
export { DriftBadge, driftBadgeVariants } from './drift-badge';
export type { DriftBadgeProps, DriftBadgeStatus } from './drift-badge';

// Hooks
export { useReducedMotion } from './hooks';
