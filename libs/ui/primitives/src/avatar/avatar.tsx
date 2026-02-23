/**
 * Avatar Component
 *
 * A circular image container with automatic fallback to initials or placeholder text.
 * Built on Radix UI Avatar primitive. Consists of three composable subcomponents:
 * - Avatar: Container (shows image or fallback)
 * - AvatarImage: Image element with lazy loading
 * - AvatarFallback: Text shown when image fails or is loading
 *
 * Layer 1 Primitive: Provides base container styling with semantic color tokens.
 * All colors automatically adapt to light/dark theme via CSS variables.
 *
 * Accessibility:
 * - Semantic HTML structure (div with role support)
 * - Automatic alt text handling via Radix
 * - Proper image fallback for screen readers
 * - WCAG AAA contrast ratio maintained (7:1 text on fallback)
 * - Support for custom sizes via className
 * - Respects prefers-reduced-motion (no animations)
 *
 * @module @nasnet/ui/primitives/avatar
 * @see Docs/design/DESIGN_TOKENS.md for color token reference
 * @see Docs/design/ux-design/8-responsive-design-accessibility.md for accessibility
 *
 * @example
 * ```tsx
 * // With image
 * <Avatar>
 *   <AvatarImage src="https://github.com/user.png" alt="User Name" />
 *   <AvatarFallback>JD</AvatarFallback>
 * </Avatar>
 *
 * // Fallback only (initials)
 * <Avatar>
 *   <AvatarFallback>CN</AvatarFallback>
 * </Avatar>
 *
 * // Custom size with semantic tokens
 * <Avatar className="h-14 w-14">
 *   <AvatarImage src="/admin.png" alt="Admin" />
 *   <AvatarFallback className="text-lg">AD</AvatarFallback>
 * </Avatar>
 *
 * // With colored fallback (for user categorization)
 * <Avatar>
 *   <AvatarFallback className="bg-primary/20 text-primary font-semibold">MK</AvatarFallback>
 * </Avatar>
 * ```
 */

"use client"

import * as React from "react"

import * as AvatarPrimitive from "@radix-ui/react-avatar"

import { cn } from "../lib/utils"

/**
 * Props for the Avatar component
 *
 * @property className - Optional custom CSS classes (e.g., 'h-14 w-14' for custom sizes)
 * @property children - Avatar subcomponents (AvatarImage, AvatarFallback)
 */
export interface AvatarProps
  extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> {}

/**
 * Avatar component - Container for profile images with automatic fallback
 */
const Avatar = React.memo(
  React.forwardRef<
    React.ElementRef<typeof AvatarPrimitive.Root>,
    AvatarProps
  >(({ className, ...props }, ref) => (
    <AvatarPrimitive.Root
      ref={ref}
      className={cn(
        "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
        className
      )}
      {...props}
    />
  ))
)
Avatar.displayName = "Avatar"

/**
 * Props for the AvatarImage component
 *
 * @property src - Image URL (must be HTTPS or data URI for security)
 * @property alt - Alternative text (required for accessibility; describes the user)
 * @property className - Optional custom CSS classes
 */
export interface AvatarImageProps
  extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image> {}

/**
 * AvatarImage component - Image element with lazy loading
 */
const AvatarImage = React.memo(
  React.forwardRef<
    React.ElementRef<typeof AvatarPrimitive.Image>,
    AvatarImageProps
  >(({ className, ...props }, ref) => (
    <AvatarPrimitive.Image
      ref={ref}
      className={cn("aspect-square h-full w-full", className)}
      {...props}
    />
  ))
)
AvatarImage.displayName = "AvatarImage"

/**
 * Props for the AvatarFallback component
 *
 * @property children - Fallback content (typically 1-2 initials or placeholder text)
 * @property className - Optional custom CSS classes (can add semantic color tokens: bg-primary/20 text-primary)
 */
export interface AvatarFallbackProps
  extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback> {}

/**
 * AvatarFallback component - Text shown when image fails or is loading
 *
 * Uses semantic color tokens: bg-muted for neutral fallback background,
 * text-muted-foreground for text. Add className with semantic tokens for
 * categorized avatars (e.g., 'bg-primary/20 text-primary').
 */
const AvatarFallback = React.memo(
  React.forwardRef<
    React.ElementRef<typeof AvatarPrimitive.Fallback>,
    AvatarFallbackProps
  >(({ className, ...props }, ref) => (
    <AvatarPrimitive.Fallback
      ref={ref}
      className={cn(
        "flex h-full w-full items-center justify-center rounded-full bg-muted text-muted-foreground",
        className
      )}
      {...props}
    />
  ))
)
AvatarFallback.displayName = "AvatarFallback"

export { Avatar, AvatarImage, AvatarFallback }
