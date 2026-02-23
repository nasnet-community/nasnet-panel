import * as React from "react";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { type VariantProps } from "class-variance-authority";
declare const Sheet: React.FC<SheetPrimitive.DialogProps>;
declare const SheetTrigger: React.ForwardRefExoticComponent<SheetPrimitive.DialogTriggerProps & React.RefAttributes<HTMLButtonElement>>;
declare const SheetClose: React.ForwardRefExoticComponent<SheetPrimitive.DialogCloseProps & React.RefAttributes<HTMLButtonElement>>;
declare const SheetPortal: React.FC<SheetPrimitive.DialogPortalProps>;
/**
 * SheetOverlay - Semi-transparent backdrop behind the sheet.
 *
 * Provides visual separation and prevents interaction with underlying content.
 * Automatically manages focus and keyboard interactions via Radix Dialog.
 *
 * @component
 * @example
 * ```tsx
 * // Typically used internally within SheetContent, not directly
 * <SheetPortal>
 *   <SheetOverlay />
 *   <SheetContent>Content</SheetContent>
 * </SheetPortal>
 * ```
 */
declare const SheetOverlay: React.MemoExoticComponent<React.ForwardRefExoticComponent<Omit<SheetPrimitive.DialogOverlayProps & React.RefAttributes<HTMLDivElement>, "ref"> & React.RefAttributes<HTMLDivElement>>>;
declare const sheetVariants: (props?: ({
    side?: "top" | "right" | "bottom" | "left" | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
/**
 * Props for SheetContent component
 */
interface SheetContentProps extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>, VariantProps<typeof sheetVariants> {
}
/**
 * SheetContent - Main container for sheet content.
 *
 * Slides in from the specified side with overlay backdrop.
 * Includes automatic close button in top-right corner with proper accessibility.
 *
 * @component
 * @prop {SheetContentProps} props - Component props
 * @prop {'top' | 'bottom' | 'left' | 'right'} [side='right'] - Direction from which sheet slides in
 * @prop {string} [className] - Optional CSS classes for custom styling
 * @example
 * ```tsx
 * <Sheet>
 *   <SheetTrigger>Open</SheetTrigger>
 *   <SheetContent side="right">
 *     <SheetHeader>
 *       <SheetTitle>Title</SheetTitle>
 *     </SheetHeader>
 *     Content here
 *   </SheetContent>
 * </Sheet>
 * ```
 */
declare const SheetContent: React.MemoExoticComponent<React.ForwardRefExoticComponent<SheetContentProps & React.RefAttributes<HTMLDivElement>>>;
/**
 * SheetHeader - Container for sheet title and description.
 *
 * Flexbox column layout with centered text on mobile, left-aligned on desktop.
 * Used to wrap SheetTitle and SheetDescription components.
 *
 * @component
 * @example
 * ```tsx
 * <SheetHeader>
 *   <SheetTitle>Settings</SheetTitle>
 *   <SheetDescription>Manage your preferences here.</SheetDescription>
 * </SheetHeader>
 * ```
 */
declare const SheetHeader: React.MemoExoticComponent<({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => import("react/jsx-runtime").JSX.Element>;
/**
 * SheetFooter - Container for sheet action buttons.
 *
 * Flexbox layout with column-reverse on mobile (buttons stack bottom-to-top),
 * row on desktop (buttons align to the right). Typically contains action buttons
 * like Save, Cancel, etc.
 *
 * @component
 * @example
 * ```tsx
 * <SheetFooter>
 *   <SheetClose asChild>
 *     <Button variant="outline">Cancel</Button>
 *   </SheetClose>
 *   <Button>Save</Button>
 * </SheetFooter>
 * ```
 */
declare const SheetFooter: React.MemoExoticComponent<({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => import("react/jsx-runtime").JSX.Element>;
/**
 * SheetTitle - Primary heading within the sheet.
 *
 * Semantic title element with appropriate text styling (text-lg, font-semibold).
 * Automatically announced to screen readers as the sheet's accessible name.
 *
 * @component
 * @example
 * ```tsx
 * <SheetHeader>
 *   <SheetTitle>Edit Settings</SheetTitle>
 * </SheetHeader>
 * ```
 */
declare const SheetTitle: React.MemoExoticComponent<React.ForwardRefExoticComponent<Omit<SheetPrimitive.DialogTitleProps & React.RefAttributes<HTMLHeadingElement>, "ref"> & React.RefAttributes<HTMLHeadingElement>>>;
/**
 * SheetDescription - Secondary text or supporting information in sheet.
 *
 * Rendered in muted color (text-muted-foreground) for visual distinction.
 * Automatically announced to screen readers after SheetTitle.
 *
 * @component
 * @example
 * ```tsx
 * <SheetHeader>
 *   <SheetTitle>Edit Settings</SheetTitle>
 *   <SheetDescription>
 *     Update your preferences and configuration options below.
 *   </SheetDescription>
 * </SheetHeader>
 * ```
 */
declare const SheetDescription: React.MemoExoticComponent<React.ForwardRefExoticComponent<Omit<SheetPrimitive.DialogDescriptionProps & React.RefAttributes<HTMLParagraphElement>, "ref"> & React.RefAttributes<HTMLParagraphElement>>>;
export { Sheet, SheetPortal, SheetOverlay, SheetTrigger, SheetClose, SheetContent, SheetHeader, SheetFooter, SheetTitle, SheetDescription, };
//# sourceMappingURL=sheet.d.ts.map