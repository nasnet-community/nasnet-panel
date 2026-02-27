# Primitives Catalog

Layer 1 of the component architecture. All components are from `libs/ui/primitives/src/` and
imported via `@nasnet/ui/primitives`.

These are zero-business-logic building blocks based on shadcn/ui and Radix UI, extended with
NasNetConnect design tokens, dark mode support, and WCAG AAA accessibility.

**Source:** `libs/ui/primitives/src/index.ts`

## Form Controls

| Component                       | Source         | Base Library    | Description                                           |
| ------------------------------- | -------------- | --------------- | ----------------------------------------------------- |
| `Button`                        | `button/`      | shadcn/ui       | Primary interactive element with `buttonVariants` CVA |
| `Input`                         | `input/`       | shadcn/ui       | Text input field with focus ring                      |
| `Textarea`                      | `textarea/`    | shadcn/ui       | Multi-line text input                                 |
| `Checkbox`                      | `checkbox/`    | Radix UI        | Accessible checkbox with custom styling               |
| `RadioGroup` / `RadioGroupItem` | `radio-group/` | Radix UI        | Radio button group                                    |
| `Switch`                        | `switch/`      | Radix UI        | Toggle switch (boolean input)                         |
| `Select` + sub-components       | `select/`      | Radix UI        | Dropdown select with searchable options               |
| `Slider`                        | `slider/`      | Radix UI        | Range slider                                          |
| `Label`                         | `label/`       | Radix UI        | Accessible form label                                 |
| `Form` + sub-components         | `form/`        | React Hook Form | Form wrapper with field error display                 |

The `Form` family integrates React Hook Form and provides `FormField`, `FormItem`, `FormLabel`,
`FormControl`, `FormDescription`, `FormMessage`, and `useFormField`. See
`../forms-validation/overview.md` for usage.

## Display

| Component                                   | Source       | Base Library | Description                                                                              |
| ------------------------------------------- | ------------ | ------------ | ---------------------------------------------------------------------------------------- |
| `Card` + sub-components                     | `card/`      | shadcn/ui    | Container with `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter` |
| `Badge`                                     | `badge/`     | shadcn/ui    | Inline status/label chip with CVA variants                                               |
| `Alert` / `AlertTitle` / `AlertDescription` | `alert/`     | shadcn/ui    | Inline alert message with variants                                                       |
| `Avatar` / `AvatarImage` / `AvatarFallback` | `avatar/`    | Radix UI     | User/device avatar with fallback                                                         |
| `Progress`                                  | `progress/`  | Radix UI     | Progress bar (0-100%)                                                                    |
| `Separator`                                 | `separator/` | Radix UI     | Horizontal/vertical divider line                                                         |
| `Skeleton` + variants                       | `skeleton/`  | Custom       | Loading placeholder with variants below                                                  |
| `Spinner`                                   | `spinner/`   | Custom       | Animated loading spinner                                                                 |

### Skeleton Variants

| Export           | Purpose                              |
| ---------------- | ------------------------------------ |
| `Skeleton`       | Base animated shimmer block          |
| `SkeletonText`   | Text line placeholder                |
| `SkeletonCard`   | Card-shaped placeholder              |
| `SkeletonTable`  | Table placeholder with header + rows |
| `SkeletonChart`  | Chart area placeholder               |
| `SkeletonAvatar` | Avatar circle placeholder            |

## Navigation

| Component                                           | Source            | Base Library | Description                        |
| --------------------------------------------------- | ----------------- | ------------ | ---------------------------------- |
| `Tabs` / `TabsList` / `TabsTrigger` / `TabsContent` | `tabs/`           | Radix UI     | Horizontal tab navigation          |
| `Accordion` + sub-components                        | `accordion.tsx`   | Radix UI     | Collapsible accordion sections     |
| `Collapsible` + sub-components                      | `collapsible.tsx` | Radix UI     | Simple expand/collapse container   |
| `ScrollArea` / `ScrollBar`                          | `scroll-area/`    | Radix UI     | Custom-styled scrollable container |

## Data Display

| Component                | Source   | Base Library  | Description                                                                                                           |
| ------------------------ | -------- | ------------- | --------------------------------------------------------------------------------------------------------------------- |
| `Table` + sub-components | `table/` | Custom (HTML) | Accessible table with `TableHeader`, `TableBody`, `TableFooter`, `TableRow`, `TableHead`, `TableCell`, `TableCaption` |

## Overlays

| Component                       | Source           | Base Library | Description                                       |
| ------------------------------- | ---------------- | ------------ | ------------------------------------------------- |
| `Dialog` + sub-components       | `dialog/`        | Radix UI     | Modal dialog with portal, overlay, header, footer |
| `Sheet` + sub-components        | `sheet/`         | Radix UI     | Slide-in drawer panel (replaces modals on mobile) |
| `Popover` + sub-components      | `popover/`       | Radix UI     | Floating content anchored to trigger              |
| `Tooltip` / `TooltipProvider`   | `tooltip/`       | Radix UI     | Hover tooltip with provider                       |
| `DropdownMenu` + sub-components | `dropdown-menu/` | Radix UI     | Context menu with full sub-menu support           |

## Feedback

| Component      | Source              | Base Library | Description                                                     |
| -------------- | ------------------- | ------------ | --------------------------------------------------------------- |
| `Toast` family | `toast/`            | shadcn/ui    | Notification toasts with `useToast` hook and `toast()` function |
| `Toaster`      | `toast/toaster.tsx` | shadcn/ui    | Toast container (placed at app root)                            |

## Specialized

| Component                        | Source             | Base Library | Description                                       |
| -------------------------------- | ------------------ | ------------ | ------------------------------------------------- |
| `Icon`                           | `icon/`            | lucide-react | Typed icon wrapper with size normalization        |
| `DriftBadge`                     | `drift-badge/`     | Custom       | Indicates configuration drift state with variants |
| `CategoryAccentProvider` + hooks | `category-accent/` | Custom       | Context-based category color theming system       |

## Utility Exports

| Export           | Description                                                            |
| ---------------- | ---------------------------------------------------------------------- |
| `cn()`           | `clsx` + `tailwind-merge` utility for conditional class names          |
| `buttonVariants` | CVA variant function for Button (use in custom button implementations) |
| `badgeVariants`  | CVA variant function for Badge                                         |

## Hooks

| Hook                   | Source                   | Description                                          |
| ---------------------- | ------------------------ | ---------------------------------------------------- |
| `useReducedMotion()`   | `hooks/useReducedMotion` | Returns `true` if user prefers reduced motion        |
| `useMediaQuery(query)` | `hooks/useMediaQuery`    | Returns `true` if CSS media query matches            |
| `useToast()`           | `toast/use-toast`        | Access toast queue and `toast()` function            |
| `useFormField()`       | `form/`                  | Access form field context (for custom form controls) |

## CategoryAccentProvider

The category accent system is a custom primitive unique to NasNetConnect. It provides context-based
color theming for the 14 feature categories.

```tsx
import {
  CategoryAccentProvider,
  useCategoryAccent,
  CATEGORIES, // readonly array of all 14 category strings
  CATEGORY_META, // record mapping category -> { label, cssVar, bgClass, textClass, borderClass }
  getCategoryMeta, // function(category) -> CategoryMeta (no context required)
  isCategory, // type guard: (string) -> category is Category
} from '@nasnet/ui/primitives';
```

**Usage pattern:**

```tsx
// Wrap a feature section
<CategoryAccentProvider defaultCategory="security">
  <SecurityFeatureArea />
</CategoryAccentProvider>;

// Access in child components
function SecurityHeader() {
  const { category, meta } = useCategoryAccent();
  return <div className={cn('border-l-4 pl-4', meta?.borderClass)}>{meta?.label} Settings</div>;
}
```

## DriftBadge

Custom primitive for showing configuration drift status (differences between stored config and live
router state):

```tsx
import { DriftBadge } from '@nasnet/ui/primitives';

<DriftBadge status="drifted" />     // amber badge — config drifted from live
<DriftBadge status="in-sync" />     // green badge — matches live
<DriftBadge status="unknown" />     // gray badge — status not yet checked
<DriftBadge status="error" />       // red badge — check failed
```

## Usage Guidelines

- Import from `@nasnet/ui/primitives` (not from individual files)
- Always use `cn()` for conditional class names
- Use semantic tokens, not raw Tailwind colors
- Respect `useReducedMotion()` in any animated components
- Minimum 44px touch targets on mobile for all interactive elements
