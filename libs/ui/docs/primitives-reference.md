# Primitives Reference (Layer 1)

Layer 1 is the foundation of the NasNetConnect component architecture. These are the lowest-level building blocks: thin wrappers over shadcn/ui and Radix UI primitives that enforce design system constraints but contain zero business logic. Every component is:

- WCAG AAA accessible (7:1 contrast ratio, 44px minimum touch targets, keyboard navigation, screen reader support)
- Dark mode compatible via CSS variables
- Built with semantic design tokens (Tier 2/3), never primitive Tailwind colors
- Platform-responsive where applicable

All imports come from `@nasnet/ui/primitives`.

---

## The `cn()` Utility

**Defined in:** `libs/ui/primitives/src/lib/utils.ts`
**Re-exported from:** `libs/ui/utils/src/index.ts`

`cn()` is the standard utility for merging and deduplicating Tailwind CSS classes. It combines `clsx` (for conditional composition) with `tailwind-merge` (for resolving conflicting utilities). Later values take precedence over earlier ones.

```tsx
import { cn } from '@nasnet/ui/primitives';
// or equivalently:
import { cn } from '@nasnet/ui/utils';

// Basic conditional classes
cn('px-2 py-1', isActive && 'bg-primary');

// Override defaults (bg-secondary wins over bg-primary)
cn('bg-primary text-white', className);

// Multiple conditions
cn(
  'base-styles',
  isDisabled && 'opacity-50 cursor-not-allowed',
  isActive && 'ring-2 ring-primary',
  dynamicClasses
);
```

Use `cn()` whenever you conditionally apply classes or need to accept a `className` prop from the outside.

---

## Input and Form Primitives

### Button

**Defined in:** `libs/ui/primitives/src/button/button.tsx`

Primary interactive element for triggering actions. Supports 7 variants, 4 sizes, a built-in loading state, and `asChild` for polymorphic rendering via Radix Slot.

```tsx
import { Button, buttonVariants } from '@nasnet/ui/primitives';
import type { ButtonProps } from '@nasnet/ui/primitives';
```

**Key props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'default' \| 'action' \| 'secondary' \| 'destructive' \| 'outline' \| 'ghost' \| 'link'` | `'default'` | Visual style of the button |
| `size` | `'default' \| 'sm' \| 'lg' \| 'icon'` | `'default'` | Size of the button (default=h-10, sm=h-8, lg=h-12, icon=44x44px) |
| `isLoading` | `boolean` | `false` | Shows a Spinner and disables the button; sets `aria-busy="true"` |
| `loadingText` | `string` | — | Text to show during loading state (falls back to children) |
| `asChild` | `boolean` | `false` | Render as a different element using Radix Slot (e.g., an anchor) |

```tsx
// Standard usage
<Button variant="default">Save Changes</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline" size="sm">Cancel</Button>
<Button variant="ghost">Dismiss</Button>

// Loading state
<Button isLoading loadingText="Applying config...">Apply Configuration</Button>

// Icon button (always add aria-label)
<Button variant="ghost" size="icon" aria-label="Close dialog">
  <X className="h-4 w-4" />
</Button>

// Polymorphic rendering as a link
<Button asChild variant="outline">
  <a href="/dashboard">Go to Dashboard</a>
</Button>
```

`buttonVariants` is a CVA helper exported separately; use it to apply button styling to non-button elements without rendering the Button component.

---

### Input

**Defined in:** `libs/ui/primitives/src/input/input.tsx`

A single-line text input with size variants and an error state. Extends all native `<input>` attributes.

```tsx
import { Input } from '@nasnet/ui/primitives';
import type { InputProps } from '@nasnet/ui/primitives';
```

**Key props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'default' \| 'error'` | `'default'` | Border color variant |
| `inputSize` | `'default' \| 'sm' \| 'lg'` | `'default'` | Height variant (default=h-10, sm=h-9, lg=h-12) |
| `error` | `boolean` | `false` | Applies error border and ring; sets `aria-invalid` |

```tsx
<Input type="text" placeholder="Router name" />
<Input type="email" error placeholder="Invalid email" aria-describedby="email-error" />
<Input type="text" inputSize="sm" placeholder="Compact..." />
<Input type="password" inputSize="lg" placeholder="Enter password..." />
```

---

### Textarea

**Defined in:** `libs/ui/primitives/src/textarea/textarea.tsx`

A multi-line text input. Extends all native `<textarea>` attributes.

```tsx
import { Textarea } from '@nasnet/ui/primitives';
import type { TextareaProps } from '@nasnet/ui/primitives';
```

```tsx
<Textarea placeholder="Enter notes..." />
<Textarea rows={5} disabled placeholder="Locked configuration" />
<Textarea readOnly defaultValue="System configuration" />
```

---

### Select

**Defined in:** `libs/ui/primitives/src/select/select.tsx`

A custom-styled select dropdown built on Radix UI Select. Use the sub-components to compose the full select widget.

```tsx
import {
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
} from '@nasnet/ui/primitives';
```

```tsx
<Select onValueChange={setValue}>
  <SelectTrigger className="w-[200px]">
    <SelectValue placeholder="Select protocol..." />
  </SelectTrigger>
  <SelectContent>
    <SelectGroup>
      <SelectLabel>VPN Protocols</SelectLabel>
      <SelectItem value="wireguard">WireGuard</SelectItem>
      <SelectItem value="openvpn">OpenVPN</SelectItem>
      <SelectSeparator />
      <SelectItem value="l2tp">L2TP</SelectItem>
    </SelectGroup>
  </SelectContent>
</Select>
```

---

### Checkbox

**Defined in:** `libs/ui/primitives/src/checkbox/checkbox.tsx`

A checkable input control. Built on Radix UI Checkbox. Wraps the 20x20px visual indicator inside a 44x44px touch target container automatically.

```tsx
import { Checkbox } from '@nasnet/ui/primitives';
```

Extends `React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>` — includes `checked`, `onCheckedChange`, `defaultChecked`, `disabled`.

```tsx
// Always pair with a Label for accessibility
<div className="flex items-center gap-2">
  <Checkbox id="terms" />
  <Label htmlFor="terms">Accept terms and conditions</Label>
</div>

// Controlled
<Checkbox
  checked={checked}
  onCheckedChange={setChecked}
  aria-label="Enable notifications"
/>
```

---

### RadioGroup

**Defined in:** `libs/ui/primitives/src/radio-group/radio-group.tsx`

A set of mutually exclusive radio buttons. Built on Radix UI RadioGroup. Keyboard navigation: Tab to enter the group, arrow keys to move between items.

```tsx
import { RadioGroup, RadioGroupItem } from '@nasnet/ui/primitives';
```

`RadioGroup` props: `value`, `defaultValue`, `onValueChange`, `disabled`, `orientation` (`'vertical' | 'horizontal'`).
`RadioGroupItem` props: `value` (required), `disabled`.

```tsx
<RadioGroup defaultValue="wireguard" onValueChange={setProtocol}>
  <div className="flex items-center gap-2">
    <RadioGroupItem value="wireguard" id="wg" />
    <Label htmlFor="wg">WireGuard</Label>
  </div>
  <div className="flex items-center gap-2">
    <RadioGroupItem value="openvpn" id="ovpn" />
    <Label htmlFor="ovpn">OpenVPN</Label>
  </div>
</RadioGroup>
```

---

### Slider

**Defined in:** `libs/ui/primitives/src/slider/slider.tsx`

A range input built on Radix UI Slider.

```tsx
import { Slider } from '@nasnet/ui/primitives';
```

Extends `React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>` — includes `min`, `max`, `step`, `value`, `defaultValue`, `onValueChange`, `disabled`.

```tsx
<Slider min={0} max={100} step={5} defaultValue={[50]} />
```

---

### Switch

**Defined in:** `libs/ui/primitives/src/switch/switch.tsx`

A toggle switch for boolean input. Uses primary color when checked, muted when unchecked. Wraps in a 44px-tall container automatically for touch targets.

```tsx
import { Switch } from '@nasnet/ui/primitives';
import type { SwitchProps } from '@nasnet/ui/primitives';
```

Extends `React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>` — includes `checked`, `defaultChecked`, `onCheckedChange`, `disabled`.

```tsx
<Switch />
<Switch defaultChecked />
<Switch disabled />
<Switch onCheckedChange={(checked) => setEnabled(checked)} />
```

---

### Form System

**Defined in:** `libs/ui/primitives/src/form/index.tsx`

A set of composable form building blocks that integrate React Hook Form with Radix UI Label and automated ARIA attribute wiring.

```tsx
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  useFormField,
} from '@nasnet/ui/primitives';
```

**Component roles:**

| Component | Role |
|-----------|------|
| `Form` | Root wrapper — re-exports `FormProvider` from `react-hook-form` |
| `FormField` | Controller wrapper for one field; wraps `react-hook-form` `Controller` |
| `FormItem` | Vertical container (label + control + description + error); generates unique ARIA IDs |
| `FormLabel` | Semantic `<label>` linked to control; turns `text-error` when field has a validation error |
| `FormControl` | Radix Slot wrapper; injects `id`, `aria-describedby`, and `aria-invalid` onto the child input |
| `FormDescription` | Helper text; announced via `aria-describedby` when input is focused |
| `FormMessage` | Error text; auto-populated from field error state; renders nothing when no error |
| `useFormField()` | Hook returning `{ id, name, formItemId, formDescriptionId, formMessageId, ...fieldState }` |

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({ hostname: z.string().min(1) });

function RouterForm() {
  const form = useForm({ resolver: zodResolver(schema) });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="hostname"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hostname</FormLabel>
              <FormControl>
                <Input placeholder="router.local" {...field} />
              </FormControl>
              <FormDescription>Must be a valid DNS hostname.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Save</Button>
      </form>
    </Form>
  );
}
```

---

### Label

**Defined in:** `libs/ui/primitives/src/label/label.tsx`

An accessible label built on Radix UI Label. Associates with form controls via `htmlFor`. Applies `opacity-70` and `cursor-not-allowed` automatically when its peer input is disabled.

```tsx
import { Label } from '@nasnet/ui/primitives';
```

```tsx
<Label htmlFor="interface-name">Interface Name</Label>
<Input id="interface-name" />
```

---

## Display and Layout Primitives

### Card

**Defined in:** `libs/ui/primitives/src/card/card.tsx`

A flexible container for grouping related content. Supports four visual variants via CVA.

```tsx
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@nasnet/ui/primitives';
```

**Card variants:** `'default'` (standard shadow), `'elevated'` (hover shadow), `'interactive'` (hover shadow + pointer cursor), `'flat'` (no shadow).

**Sub-component layout:**

| Sub-component | Element | Notes |
|---------------|---------|-------|
| `CardHeader` | `<div>` | Flex column; responsive padding (`p-component-md` mobile, `p-component-lg` desktop) |
| `CardTitle` | `<div>` | `text-lg font-semibold`; render as `h2`/`h3` semantically via `asChild` or custom wrapping |
| `CardDescription` | `<div>` | `text-sm text-muted-foreground` |
| `CardContent` | `<div>` | Responsive padding with `pt-0` |
| `CardFooter` | `<div>` | Flex row; responsive padding with `pt-0` |

```tsx
<Card variant="elevated">
  <CardHeader>
    <CardTitle>WireGuard Server</CardTitle>
    <CardDescription>Running on eth0</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Status: Online</p>
  </CardContent>
  <CardFooter>
    <Button variant="outline" size="sm">Edit</Button>
  </CardFooter>
</Card>
```

---

### Badge

**Defined in:** `libs/ui/primitives/src/badge/badge.tsx`

A small inline label for status indicators, tags, and categorization. Color is never the sole status indicator — always pair with text (and optionally an icon).

```tsx
import { Badge, badgeVariants } from '@nasnet/ui/primitives';
import type { BadgeProps } from '@nasnet/ui/primitives';
```

**Variants:**

| Variant | Color | Semantic use |
|---------|-------|-------------|
| `default` | Golden Amber (primary) | Brand emphasis |
| `secondary` | Trust Blue (secondary) | Informational |
| `success` | Green | Online, healthy, valid |
| `connected` | Green | Device/service connected (alias of `success`) |
| `warning` | Amber | Pending, degraded |
| `error` | Red | Offline, failed, invalid |
| `info` | Blue | Help, tips |
| `offline` | Gray (`bg-muted`) | Disabled, inactive |
| `outline` | Transparent + border | Lightweight label |

**Additional props:**

| Prop | Type | Description |
|------|------|-------------|
| `pulse` | `boolean` | Enables `animate-pulse-glow` for live indicators; automatically disabled when `prefers-reduced-motion` is set |

```tsx
<Badge variant="success">Online</Badge>
<Badge variant="error">Offline</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="success" pulse>Live</Badge>
<Badge variant="info" className="gap-1">
  <span className="h-2 w-2 rounded-full bg-sky-500" />
  Monitoring
</Badge>
```

---

### Alert

**Defined in:** `libs/ui/primitives/src/alert/alert.tsx`

A container for alert messages with `role="alert"` and automatic live region support. Accepts an SVG icon as a direct child; it is positioned to the left of the text content automatically.

```tsx
import { Alert, AlertTitle, AlertDescription, alertVariants } from '@nasnet/ui/primitives';
```

**Variants:** `'default'`, `'destructive'`, `'success'`, `'warning'`, `'info'`.

**Additional props on Alert:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `live` | `boolean` | `false` | If `true`, adds `aria-live="polite"` for dynamic announcements |
| `role` | `string` | `"alert"` | ARIA role override |

```tsx
import { CheckCircle2, AlertTriangle } from 'lucide-react';

<Alert variant="success">
  <CheckCircle2 className="h-4 w-4" />
  <AlertTitle>Configuration saved</AlertTitle>
  <AlertDescription>Changes will take effect on the next restart.</AlertDescription>
</Alert>

<Alert variant="warning" live>
  <AlertTriangle className="h-4 w-4" />
  <AlertTitle>Drift detected</AlertTitle>
  <AlertDescription>3 fields differ from the deployed configuration.</AlertDescription>
</Alert>
```

---

### Separator

**Defined in:** `libs/ui/primitives/src/separator/separator.tsx`

A visual 1px divider built on Radix UI Separator. Decorative by default (hidden from screen readers).

```tsx
import { Separator } from '@nasnet/ui/primitives';
import type { SeparatorProps } from '@nasnet/ui/primitives';
```

**Props:** `orientation` (`'horizontal' | 'vertical'`, default `'horizontal'`), `decorative` (boolean, default `true`).

```tsx
<Separator className="my-4" />

// Vertical separator in a flex container
<div className="flex items-center gap-4">
  <span>Interfaces</span>
  <Separator orientation="vertical" className="h-6" />
  <span>Routes</span>
</div>
```

---

### Avatar

**Defined in:** `libs/ui/primitives/src/avatar/avatar.tsx`

A circular image container with automatic fallback to text. Built on Radix UI Avatar.

```tsx
import { Avatar, AvatarImage, AvatarFallback } from '@nasnet/ui/primitives';
```

`Avatar` defaults to `h-10 w-10` (40x40px). Override with `className` for custom sizes.

```tsx
<Avatar>
  <AvatarImage src="/user.png" alt="Admin user" />
  <AvatarFallback>AD</AvatarFallback>
</Avatar>

// Custom size
<Avatar className="h-14 w-14">
  <AvatarImage src="/router.png" alt="Router icon" />
  <AvatarFallback className="bg-primary/20 text-primary font-semibold">RT</AvatarFallback>
</Avatar>
```

---

### Progress

**Defined in:** `libs/ui/primitives/src/progress/progress.tsx`

A progress bar built on Radix UI Progress. Supports three height sizes and an indeterminate animation mode.

```tsx
import { Progress } from '@nasnet/ui/primitives';
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `number` | `0` | Progress percentage (0–100, or up to `max`) |
| `max` | `number` | `100` | Maximum value |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Bar height: sm=4px, md=8px, lg=12px |
| `indeterminate` | `boolean` | `false` | Shows animated loading bar without a fixed percentage |

```tsx
<Progress value={65} />
<Progress value={75} size="lg" aria-label="Download progress" />
<Progress indeterminate size="sm" />
```

---

### Accordion

**Defined in:** `libs/ui/primitives/src/accordion.tsx`

Vertically stacked expandable/collapsible content sections. Built on Radix UI Collapsible. Supports `single` (one open at a time) or `multiple` mode. Respects `prefers-reduced-motion`.

```tsx
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@nasnet/ui/primitives';
import type {
  AccordionProps,
  AccordionItemProps,
  AccordionTriggerProps,
  AccordionContentProps,
} from '@nasnet/ui/primitives';
```

**AccordionProps:** `type` (`'single' | 'multiple'`, default `'single'`), `value`, `defaultValue`, `onValueChange`.
**AccordionItemProps:** `value` (required string).

```tsx
// Single open item (default)
<Accordion type="single" defaultValue="firewall">
  <AccordionItem value="firewall">
    <AccordionTrigger>Firewall Rules</AccordionTrigger>
    <AccordionContent>
      <p>Filter rules content...</p>
    </AccordionContent>
  </AccordionItem>
  <AccordionItem value="nat">
    <AccordionTrigger>NAT Rules</AccordionTrigger>
    <AccordionContent>
      <p>NAT rules content...</p>
    </AccordionContent>
  </AccordionItem>
</Accordion>

// Multiple items open simultaneously
<Accordion type="multiple">
  ...
</Accordion>
```

---

## Overlay Primitives

### Dialog

**Defined in:** `libs/ui/primitives/src/dialog/dialog.tsx`

A modal dialog built on Radix UI Dialog. Manages focus trapping, body scroll lock, and keyboard interactions automatically. `DialogContent` renders in a portal with a backdrop overlay and includes an automatic close button.

```tsx
import {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@nasnet/ui/primitives';
```

**Sub-components:**

| Component | Role |
|-----------|------|
| `Dialog` | Root; manages open state |
| `DialogTrigger` | Interactive element that opens the dialog |
| `DialogPortal` | Renders content at document root |
| `DialogOverlay` | Backdrop (`bg-black/50 backdrop-blur-sm`) |
| `DialogContent` | Main panel (max-w-lg, centered, auto close button at top-right) |
| `DialogHeader` | Title + description container (centered on mobile, left on desktop) |
| `DialogTitle` | Semantic title (announced to screen readers) |
| `DialogDescription` | Subtitle in `text-muted-foreground` |
| `DialogFooter` | Action buttons (stacked on mobile, row on desktop) |
| `DialogClose` | Programmatic close button |

```tsx
<Dialog>
  <DialogTrigger asChild>
    <Button>Open Settings</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Interface Settings</DialogTitle>
      <DialogDescription>Configure the network interface parameters.</DialogDescription>
    </DialogHeader>
    <div className="space-y-4 py-2">
      <Input placeholder="IP address" />
    </div>
    <DialogFooter>
      <DialogClose asChild>
        <Button variant="outline">Cancel</Button>
      </DialogClose>
      <Button>Save</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

### Sheet

**Defined in:** `libs/ui/primitives/src/sheet/sheet.tsx`

A slide-in panel built on Radix UI Dialog. Slides in from `top`, `bottom`, `left`, or `right`. Commonly used for mobile navigation, detail panels, and filter drawers. Defaults to `right`.

```tsx
import {
  Sheet,
  SheetTrigger,
  SheetPortal,
  SheetOverlay,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from '@nasnet/ui/primitives';
```

**SheetContent-specific prop:** `side` (`'top' | 'bottom' | 'left' | 'right'`, default `'right'`).

Left/right sheets are 80% viewport width on mobile, capped at 400px on larger screens.

```tsx
<Sheet>
  <SheetTrigger asChild>
    <Button variant="outline">Open Details</Button>
  </SheetTrigger>
  <SheetContent side="right">
    <SheetHeader>
      <SheetTitle>Interface Details</SheetTitle>
      <SheetDescription>Current configuration and status for eth0.</SheetDescription>
    </SheetHeader>
    <div className="py-4">
      <p>Configuration content here</p>
    </div>
    <SheetFooter>
      <SheetClose asChild>
        <Button variant="outline">Close</Button>
      </SheetClose>
    </SheetFooter>
  </SheetContent>
</Sheet>
```

---

### Popover

**Defined in:** `libs/ui/primitives/src/popover/popover.tsx`

A floating panel anchored to a trigger element. Renders in a portal. Auto-adjusts position to stay within the viewport. Default width 288px (`w-72`), max height 80vh.

```tsx
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverAnchor,
} from '@nasnet/ui/primitives';
```

**PopoverContent props:** `align` (`'start' | 'center' | 'end'`, default `'center'`), `sideOffset` (px gap, default `4`).

```tsx
<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline">Quick Settings</Button>
  </PopoverTrigger>
  <PopoverContent align="start">
    <div className="space-y-2">
      <p className="text-sm font-medium">Interface Options</p>
      <Separator />
      <Switch id="dhcp" />
    </div>
  </PopoverContent>
</Popover>
```

---

### Tooltip

**Defined in:** `libs/ui/primitives/src/tooltip/tooltip.tsx`

A short contextual hint shown on hover or keyboard focus. Requires `TooltipProvider` at the application root.

```tsx
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@nasnet/ui/primitives';
```

`TooltipContent` props: `side` (`'top' | 'bottom' | 'left' | 'right'`), `sideOffset` (default `4`).

```tsx
// Provider goes in the app root (once):
<TooltipProvider>
  <App />
</TooltipProvider>

// Usage anywhere inside the provider:
<Tooltip delayDuration={200}>
  <TooltipTrigger asChild>
    <Button variant="ghost" size="icon" aria-label="Refresh interfaces">
      <RefreshCw className="h-4 w-4" />
    </Button>
  </TooltipTrigger>
  <TooltipContent side="bottom">
    Refresh interface list
  </TooltipContent>
</Tooltip>
```

---

### DropdownMenu

**Defined in:** `libs/ui/primitives/src/dropdown-menu/dropdown-menu.tsx`

A floating context menu with full keyboard navigation. Supports nested submenus, checkbox items, and radio group items. All items have 44px minimum touch targets.

```tsx
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuRadioGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@nasnet/ui/primitives';
```

**Sub-component reference:**

| Component | Role |
|-----------|------|
| `DropdownMenu` | Root; manages open state |
| `DropdownMenuTrigger` | Element that opens the menu |
| `DropdownMenuContent` | Floating panel containing items |
| `DropdownMenuItem` | Clickable menu item; `inset` prop adds left padding for icon alignment |
| `DropdownMenuCheckboxItem` | Item with checkbox; `checked` / `onCheckedChange` props |
| `DropdownMenuRadioItem` | Item with radio indicator; must be inside `DropdownMenuRadioGroup` |
| `DropdownMenuRadioGroup` | Wraps radio items; `value` / `onValueChange` props |
| `DropdownMenuLabel` | Non-interactive section heading; `inset` for icon alignment |
| `DropdownMenuSeparator` | Visual 1px divider |
| `DropdownMenuShortcut` | Right-aligned keyboard shortcut hint (display only) |
| `DropdownMenuGroup` | Semantic grouping container |
| `DropdownMenuPortal` | Wraps submenu content at document root |
| `DropdownMenuSub` | Submenu root |
| `DropdownMenuSubTrigger` | Trigger item for a nested submenu |
| `DropdownMenuSubContent` | Content panel for a nested submenu |

```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon" aria-label="More actions">
      <MoreVertical className="h-4 w-4" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuLabel>Actions</DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuItem>
      <Edit className="mr-2 h-4 w-4" />
      Edit
    </DropdownMenuItem>
    <DropdownMenuItem>
      <Copy className="mr-2 h-4 w-4" />
      Duplicate
      <DropdownMenuShortcut>⌘D</DropdownMenuShortcut>
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem className="text-error">
      <Trash className="mr-2 h-4 w-4" />
      Delete
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

---

### ScrollArea

**Defined in:** `libs/ui/primitives/src/scroll-area/scroll-area.tsx`

A custom-styled scroll container built on Radix UI ScrollArea. Scrollbars auto-hide when not in use. Supports both vertical (default) and horizontal scrolling.

```tsx
import { ScrollArea, ScrollBar } from '@nasnet/ui/primitives';
```

`ScrollBar` props: `orientation` (`'vertical' | 'horizontal'`, default `'vertical'`).

```tsx
<ScrollArea className="h-72 w-full rounded-md border">
  <div className="p-4">
    {logEntries.map((entry) => (
      <p key={entry.id} className="text-sm">{entry.message}</p>
    ))}
  </div>
</ScrollArea>

// With horizontal scroll
<ScrollArea className="w-full whitespace-nowrap">
  <div className="flex gap-4 p-4">
    {items.map(item => <Card key={item.id}>{item.name}</Card>)}
  </div>
  <ScrollBar orientation="horizontal" />
</ScrollArea>
```

---

## Navigation and Structure

### Tabs

**Defined in:** `libs/ui/primitives/src/tabs/tabs.tsx`

Tab panels for switching between related content sections. Built on Radix UI Tabs. Keyboard: Tab to focus the list, arrow keys to move between triggers, Enter/Space to activate.

```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@nasnet/ui/primitives';
```

`Tabs` props: `defaultValue`, `value`, `onValueChange`.
`TabsTrigger` props: `value` (required), `disabled`.
`TabsContent` props: `value` (required, must match a `TabsTrigger`).

`TabsContent` is removed from the DOM when inactive (not just hidden).

```tsx
<Tabs defaultValue="overview">
  <TabsList>
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="firewall">Firewall</TabsTrigger>
    <TabsTrigger value="logs">Logs</TabsTrigger>
  </TabsList>
  <TabsContent value="overview">
    <OverviewPanel />
  </TabsContent>
  <TabsContent value="firewall">
    <FirewallPanel />
  </TabsContent>
  <TabsContent value="logs">
    <LogsPanel />
  </TabsContent>
</Tabs>
```

---

### Table

**Defined in:** `libs/ui/primitives/src/table/table.tsx`

A semantic HTML table with styling and overflow handling. Preferred for desktop views with dense data. On mobile, use the `ResourceCard` pattern instead.

```tsx
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from '@nasnet/ui/primitives';
import type {
  TableProps,
  TableSectionProps,
  TableRowProps,
  TableHeadProps,
  TableCellProps,
  TableCaptionProps,
} from '@nasnet/ui/primitives';
```

**Structure mapping:**

| Component | HTML element | Notes |
|-----------|-------------|-------|
| `Table` | `<table>` wrapped in `<div>` | Adds horizontal scroll and border |
| `TableHeader` | `<thead>` | Auto bottom border on child rows |
| `TableBody` | `<tbody>` | Removes border from last row |
| `TableFooter` | `<tfoot>` | `bg-muted/50` background for totals |
| `TableRow` | `<tr>` | Hover state, selection state (`data-[state=selected]`) |
| `TableHead` | `<th>` | `bg-muted`, uppercase, tracking-wider |
| `TableCell` | `<td>` | Standard padding and `text-sm` |
| `TableCaption` | `<caption>` | Required for accessibility; describes table content |

```tsx
<Table>
  <TableCaption>Active network interfaces on router MK-01</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>IP Address</TableHead>
      <TableHead>Status</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {interfaces.map((iface) => (
      <TableRow key={iface.id}>
        <TableCell className="font-mono">{iface.name}</TableCell>
        <TableCell className="font-mono">{iface.address}</TableCell>
        <TableCell>
          <Badge variant={iface.running ? 'success' : 'offline'}>
            {iface.running ? 'Running' : 'Disabled'}
          </Badge>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

---

### Collapsible

**Defined in:** `libs/ui/primitives/src/collapsible.tsx`

A single expand/collapse panel built on Radix UI Collapsible. For multiple mutually exclusive panels use `Accordion` instead. Content is removed from the DOM when collapsed.

```tsx
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@nasnet/ui/primitives';
```

`Collapsible` props: `open`, `defaultOpen`, `onOpenChange`, `disabled`.

```tsx
// Uncontrolled
<Collapsible>
  <CollapsibleTrigger asChild>
    <Button variant="outline" className="w-full justify-between">
      Advanced Options
      <ChevronDown className="h-4 w-4" />
    </Button>
  </CollapsibleTrigger>
  <CollapsibleContent className="space-y-3 px-1 py-2">
    <p>Advanced settings here</p>
  </CollapsibleContent>
</Collapsible>

// Controlled
const [open, setOpen] = React.useState(false);
<Collapsible open={open} onOpenChange={setOpen}>
  ...
</Collapsible>
```

---

## Feedback and Loading

### Toast System

**Defined in:**
- `libs/ui/primitives/src/toast/toast.tsx` — primitive components
- `libs/ui/primitives/src/toast/toaster.tsx` — `Toaster` convenience renderer
- `libs/ui/primitives/src/toast/use-toast.ts` — `useToast` hook and `toast` function

```tsx
import { Toaster } from '@nasnet/ui/primitives';
import {
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@nasnet/ui/primitives';
import { useToast, toast } from '@nasnet/ui/primitives';
```

**Setup — place once in the app root:**

```tsx
// apps/connect/src/app/providers/index.tsx (or similar root)
<App />
<Toaster />
```

`Toaster` handles `ToastProvider` and `ToastViewport` internally. There is no need to render them separately when using `Toaster`.

**Usage — trigger from any component:**

```tsx
const { toast, dismiss } = useToast();

// Success notification
toast({
  title: 'Configuration saved',
  description: 'Changes take effect on next restart.',
  variant: 'success',
});

// Error with action
toast({
  title: 'Connection failed',
  description: 'Could not reach router at 192.168.88.1.',
  variant: 'error',
  action: <ToastAction altText="Retry">Retry</ToastAction>,
});

// Programmatic dismiss
const { id } = toast({ title: 'Processing...' });
dismiss(id);     // dismiss specific toast
dismiss();       // dismiss all
```

**Toast variants:** `'default'`, `'success'`, `'warning'`, `'error'`, `'info'`, `'destructive'`.

Maximum 3 toasts visible simultaneously (WCAG compliance). Toasts support swipe-to-dismiss on touch devices and Escape key to close.

---

### Skeleton

**Defined in:** `libs/ui/primitives/src/skeleton/skeleton.tsx`

Loading placeholder components with animated shimmer. All variants use `aria-hidden="true"` and respect `prefers-reduced-motion`. Wrap loading sections in `aria-busy="true"` containers.

```tsx
import {
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonTable,
  SkeletonChart,
  SkeletonAvatar,
} from '@nasnet/ui/primitives';
import type {
  SkeletonProps,
  SkeletonTextProps,
  SkeletonCardProps,
  SkeletonTableProps,
  SkeletonChartProps,
  SkeletonAvatarProps,
} from '@nasnet/ui/primitives';
```

**Variants and their props:**

`Skeleton` (base) — `animate?: boolean` (default `true`). Use with `className` to set dimensions.

`SkeletonText` — multiple text lines:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `lines` | `number` | `3` | Number of text lines |
| `lastLineWidth` | `string` | `'60%'` | Width of the final line |
| `lineHeight` | `number` | `16` | Height of each line in px |
| `gap` | `number` | `8` | Vertical gap between lines in px |

`SkeletonCard` — card-shaped placeholder:

| Prop | Type | Default |
|------|------|---------|
| `showTitle` | `boolean` | `true` |
| `showDescription` | `boolean` | `false` |
| `showFooter` | `boolean` | `false` |
| `contentHeight` | `number` | `120` |

`SkeletonTable` — table-shaped placeholder:

| Prop | Type | Default |
|------|------|---------|
| `rows` | `number` | `5` |
| `columns` | `number` | `4` |
| `showHeader` | `boolean` | `true` |

`SkeletonChart` — chart placeholder:

| Prop | Type | Default |
|------|------|---------|
| `showTitle` | `boolean` | `false` |
| `showLegend` | `boolean` | `false` |
| `height` | `number` | `200` |
| `type` | `'bar' \| 'line' \| 'pie' \| 'area'` | `'bar'` |

`SkeletonAvatar` — avatar placeholder:

| Prop | Type | Default |
|------|------|---------|
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | (32/40/48/64px) |
| `shape` | `'circle' \| 'square'` | `'circle'` |

```tsx
// Basic skeleton block
<div aria-busy="true" aria-live="polite">
  <Skeleton className="h-4 w-48 mb-2" />
  <Skeleton className="h-4 w-full" />
</div>

// Multi-line text placeholder
<SkeletonText lines={4} lastLineWidth="50%" />

// Card loading state
<div className="grid grid-cols-3 gap-4" aria-busy="true">
  <SkeletonCard showTitle showDescription showFooter />
  <SkeletonCard showTitle showDescription showFooter />
  <SkeletonCard showTitle showDescription showFooter />
</div>

// Table loading state
<SkeletonTable rows={10} columns={5} />

// Chart loading state
<SkeletonChart showTitle showLegend type="area" height={300} />

// Avatar loading state
<SkeletonAvatar size="lg" />
```

---

### Spinner

**Defined in:** `libs/ui/primitives/src/spinner/Spinner.tsx`

An animated loading indicator using the `Loader2` icon from Lucide. Uses `role="status"` with a visually hidden label. Automatically disables the spin animation when `prefers-reduced-motion` is set.

```tsx
import { Spinner } from '@nasnet/ui/primitives';
import type { SpinnerProps } from '@nasnet/ui/primitives';
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | 16/24/32/48px |
| `label` | `string` | `'Loading...'` | Screen reader text (visually hidden) |

```tsx
<Spinner />
<Spinner size="sm" />   // 16px — for use inside buttons
<Spinner size="lg" />   // 32px — for overlay loading states
<Spinner size="xl" label="Loading dashboard..." />  // 48px — full-page
```

`Button` uses `Spinner` internally when `isLoading={true}`.

---

## NasNet-Specific Primitives

### CategoryAccentProvider

**Defined in:** `libs/ui/primitives/src/category-accent/category-accent-provider.tsx`

Provides contextual color theming for NasNetConnect's 14 feature categories. Each category has a distinct accent color used to visually identify feature sections throughout the UI.

```tsx
import {
  CategoryAccentProvider,
  useCategoryAccent,
  getCategoryMeta,
  isCategory,
  CATEGORIES,
  CATEGORY_META,
} from '@nasnet/ui/primitives';
import type { Category, CategoryMeta, CategoryAccentProviderProps } from '@nasnet/ui/primitives';
```

**The 14 categories:**

| Category | Label | Color token |
|----------|-------|-------------|
| `security` | Security | `--semantic-color-category-security` (Red) |
| `monitoring` | Monitoring | `--semantic-color-category-monitoring` (Purple) |
| `networking` | Networking | `--semantic-color-category-networking` (Blue) |
| `vpn` | VPN | `--semantic-color-category-vpn` (Green) |
| `wifi` | WiFi | `--semantic-color-category-wifi` (Cyan) |
| `firewall` | Firewall | `--semantic-color-category-firewall` (Orange) |
| `system` | System | `--semantic-color-category-system` (Gray) |
| `dhcp` | DHCP | `--semantic-color-category-dhcp` (Pink) |
| `routing` | Routing | `--semantic-color-category-routing` (Indigo) |
| `tunnels` | Tunnels | `--semantic-color-category-tunnels` (Teal) |
| `qos` | QoS | `--semantic-color-category-qos` (Pink) |
| `hotspot` | Hotspot | `--semantic-color-category-hotspot` (Orange) |
| `logging` | Logging | `--semantic-color-category-logging` (Gray) |
| `backup` | Backup | `--semantic-color-category-backup` (Blue) |

**CategoryMeta shape:**

```ts
interface CategoryMeta {
  id: Category;
  label: string;
  description: string;
  cssVar: string;    // CSS variable name (e.g., '--semantic-color-category-vpn')
  bgClass: string;   // Tailwind bg class (e.g., 'bg-category-vpn')
  textClass: string; // Tailwind text class (e.g., 'text-category-vpn')
  borderClass: string; // Tailwind border class (e.g., 'border-category-vpn')
}
```

**CategoryAccentProviderProps:** `children`, `defaultCategory?: Category`.

**useCategoryAccent()** returns: `{ category, meta, setCategory, getCategoryMeta, categories }`. Throws if used outside a `CategoryAccentProvider`.

**getCategoryMeta(category)** — standalone function for use outside a provider.

**isCategory(value)** — type guard checking if a string is a valid `Category`.

```tsx
// Wrap a feature section
<CategoryAccentProvider defaultCategory="vpn">
  <VPNDashboard />
</CategoryAccentProvider>

// Read the accent in a child component
function VPNDashboard() {
  const { category, meta, setCategory } = useCategoryAccent();
  return (
    <div className={cn('border-l-4 p-4', meta?.borderClass)}>
      <span className={meta?.textClass}>{meta?.label}</span>
    </div>
  );
}

// Dynamic category switching
setCategory('firewall');

// Get metadata outside a provider
const meta = getCategoryMeta('security');
// meta.bgClass === 'bg-category-security'

// Type guard
if (isCategory(routeParam)) {
  setCategory(routeParam);
}
```

---

### DriftBadge

**Defined in:** `libs/ui/primitives/src/drift-badge/DriftBadge.tsx`

A visual indicator for configuration drift — the difference between the desired configuration state and the actual deployed state. Wraps in a `Tooltip` by default to show drift details.

```tsx
import { DriftBadge, driftBadgeVariants } from '@nasnet/ui/primitives';
import type { DriftBadgeProps, DriftBadgeStatus } from '@nasnet/ui/primitives';
```

**DriftBadgeStatus values:**

| Status | Color | Meaning |
|--------|-------|---------|
| `synced` | Green | Configuration matches deployed state |
| `drifted` | Amber | Configuration differs from deployed state |
| `error` | Red | Unable to determine drift status |
| `pending` | Gray | Deployment layer not yet available |
| `checking` | Blue (pulsing) | Drift check in progress |

**Key props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `status` | `DriftBadgeStatus` | — | Required. Current drift status |
| `count` | `number` | — | Number of drifted fields (shown when `status='drifted'`) |
| `lastChecked` | `Date \| string` | — | Timestamp for tooltip display |
| `showTooltip` | `boolean` | `true` | Whether to wrap with a tooltip |
| `tooltipContent` | `React.ReactNode` | — | Custom tooltip content |
| `interactive` | `boolean` | `false` | Makes badge clickable (`role="button"`) |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Badge size |

```tsx
// Basic status indicator
<DriftBadge status="synced" />
<DriftBadge status="drifted" count={3} />
<DriftBadge status="checking" />

// With timestamp in tooltip
<DriftBadge
  status="drifted"
  count={2}
  lastChecked={new Date()}
  showTooltip
/>

// Interactive — click to open drift resolution
<DriftBadge
  status="drifted"
  count={3}
  interactive
  onClick={() => openDriftModal()}
/>
```

`driftBadgeVariants` is the CVA helper exported separately for styling purposes.

---

### Icon

**Defined in:** `libs/ui/primitives/src/icon/Icon.tsx`

A unified wrapper over any Lucide icon that enforces consistent sizing, accessibility, and semantic color usage across the application.

```tsx
import { Icon } from '@nasnet/ui/primitives';
import type { IconProps } from '@nasnet/ui/primitives';
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `icon` | `LucideIcon` | — | Required. The Lucide icon component to render |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl' \| number` | `'md'` | Preset (16/20/24/32px) or exact pixel size |
| `label` | `string` | — | If provided: sets `aria-label` and `role="img"`. If omitted: sets `aria-hidden="true"` (decorative) |
| `className` | `string` | — | Additional CSS classes; use semantic color tokens |

**Size presets:**

| Size | Pixels | Tailwind equivalent |
|------|--------|---------------------|
| `sm` | 16px | `h-4 w-4` |
| `md` | 20px | `h-5 w-5` |
| `lg` | 24px | `h-6 w-6` |
| `xl` | 32px | `h-8 w-8` |

Always use semantic color tokens for `className`:

```tsx
import { Wifi, Shield, CheckCircle, AlertTriangle } from 'lucide-react';

// Decorative icon (hidden from screen readers)
<Icon icon={Wifi} size="md" />

// Accessible icon with label
<Icon icon={Shield} size="lg" label="Security feature" />

// With semantic color
<Icon icon={CheckCircle} size="md" className="text-success" label="Connected" />
<Icon icon={AlertTriangle} size="md" className="text-warning" label="Warning" />

// Custom pixel size
<Icon icon={Wifi} size={28} />
```

Use `size="lg"` (24px) for mobile touch contexts; `size="md"` (20px) for desktop dense layouts.

---

## Utility Hooks

### useReducedMotion

**Defined in:** `libs/ui/primitives/src/hooks/useReducedMotion.ts`

Detects the user's `prefers-reduced-motion` OS accessibility setting. Returns `true` if the user has requested reduced motion. SSR-safe (defaults to `false` during server rendering). Updates reactively when the user changes the setting while the app is running.

```tsx
import { useReducedMotion } from '@nasnet/ui/primitives';

function AnimatedCard() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className={cn(
      'transition-transform',
      !prefersReducedMotion && 'hover:scale-105'
    )}>
      Content
    </div>
  );
}
```

All primitive components that include animations (`Badge` with `pulse`, `Spinner`, `Skeleton` variants, `Accordion`, `AccordionContent`) use this hook internally.

---

### useMediaQuery

**Defined in:** `libs/ui/primitives/src/hooks/useMediaQuery.ts`

A generic React hook for testing any CSS media query. Returns a boolean that updates reactively. SSR-safe (defaults to `false`).

```tsx
import { useMediaQuery } from '@nasnet/ui/primitives';

// Platform detection breakpoints
const isMobile = useMediaQuery('(max-width: 639px)');
const isTablet = useMediaQuery('(min-width: 640px) and (max-width: 1023px)');
const isDesktop = useMediaQuery('(min-width: 1024px)');

// Theme and capability detection
const isDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
const isTouchDevice = useMediaQuery('(hover: none)');

// Conditional rendering
function NetworkDashboard() {
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  return isDesktop ? <NetworkDashboardDesktop /> : <NetworkDashboardMobile />;
}
```

For platform-aware rendering in pattern components, prefer the `usePlatform()` hook from `@nasnet/ui/patterns` (which wraps `useMediaQuery` with the project-standard breakpoints). See `layouts-and-platform.md` for the full platform presenter pattern.

---

## Cross-References

- **Platform-specific rendering** (Mobile/Tablet/Desktop presenters): See `layouts-and-platform.md`
- **Design tokens and semantic color reference**: See `tokens-and-animation.md`
- **Pattern components (Layer 2)** that compose these primitives: See `patterns-status-and-data.md`
- **Library dependency rules**: `apps/` and `libs/features/` may import from `@nasnet/ui/primitives`; primitives must not import from patterns or features
