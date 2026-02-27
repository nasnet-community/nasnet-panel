/**
 * @fileoverview Sheet (Drawer) component
 *
 * A slide-in panel component for content that slides in from any edge of the viewport.
 * Built on Radix UI Dialog primitive. Supports four entry directions: top, bottom, left, right.
 * Commonly used for mobile navigation, detail panels, and filtering interfaces.
 *
 * @example
 * ```tsx
 * <Sheet>
 *   <SheetTrigger>Open</SheetTrigger>
 *   <SheetContent side="right">
 *     <SheetHeader>
 *       <SheetTitle>Sheet Title</SheetTitle>
 *     </SheetHeader>
 *     Content here
 *   </SheetContent>
 * </Sheet>
 * ```
 */
"use client"

import * as React from "react"

import * as SheetPrimitive from "@radix-ui/react-dialog"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "../lib/utils"

const Sheet = SheetPrimitive.Root

const SheetTrigger = SheetPrimitive.Trigger

const SheetClose = SheetPrimitive.Close

const SheetPortal = SheetPrimitive.Portal

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
const SheetOverlay = React.memo(
  React.forwardRef<
    React.ElementRef<typeof SheetPrimitive.Overlay>,
    React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
  >(({ className, ...props }, ref) => (
    <SheetPrimitive.Overlay
      className={cn(
        "fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        className
      )}
      {...props}
      ref={ref}
    />
  ))
)
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName

const sheetVariants = cva(
  "fixed z-50 gap-4 bg-card text-card-foreground border-border p-6 shadow-[var(--semantic-shadow-modal)] transition ease-out data-[state=closed]:duration-300 data-[state=open]:duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
        bottom:
          "inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
        left: "inset-y-0 left-0 h-full w-[80%] border-r rounded-r-[var(--semantic-radius-modal)] data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:w-[400px]",
        right:
          "inset-y-0 right-0 h-full w-[80%] border-l rounded-l-[var(--semantic-radius-modal)] data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:w-[400px]",
      },
    },
    defaultVariants: {
      side: "right",
    },
  }
)

/**
 * Props for SheetContent component
 */
interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
    VariantProps<typeof sheetVariants> {}

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
const SheetContent = React.memo(
  React.forwardRef<
    React.ElementRef<typeof SheetPrimitive.Content>,
    SheetContentProps
  >(({ side = "right", className, children, ...props }, ref) => (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        ref={ref}
        className={cn(sheetVariants({ side }), className)}
        {...props}
      >
        {children}
        <SheetPrimitive.Close
          className="absolute right-4 top-4 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary"
          aria-label="Close panel"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPortal>
  ))
)
SheetContent.displayName = SheetPrimitive.Content.displayName

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
const SheetHeader = React.memo(
  ({
    className,
    ...props
  }: React.HTMLAttributes<HTMLDivElement>) => (
    <div
      className={cn(
        "flex flex-col space-y-2 text-left",
        className
      )}
      {...props}
    />
  )
)
SheetHeader.displayName = "SheetHeader"

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
const SheetFooter = React.memo(
  ({
    className,
    ...props
  }: React.HTMLAttributes<HTMLDivElement>) => (
    <div
      className={cn(
        "flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-6",
        className
      )}
      {...props}
    />
  )
)
SheetFooter.displayName = "SheetFooter"

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
const SheetTitle = React.memo(
  React.forwardRef<
    React.ElementRef<typeof SheetPrimitive.Title>,
    React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
  >(({ className, ...props }, ref) => (
    <SheetPrimitive.Title
      ref={ref}
      className={cn("font-display text-lg font-semibold text-card-foreground", className)}
      {...props}
    />
  ))
)
SheetTitle.displayName = SheetPrimitive.Title.displayName

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
const SheetDescription = React.memo(
  React.forwardRef<
    React.ElementRef<typeof SheetPrimitive.Description>,
    React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
  >(({ className, ...props }, ref) => (
    <SheetPrimitive.Description
      ref={ref}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  ))
)
SheetDescription.displayName = SheetPrimitive.Description.displayName

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
}
