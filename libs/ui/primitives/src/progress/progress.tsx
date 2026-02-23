"use client"

import * as React from "react"

import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "../lib/utils"

/**
 * Progress bar component for showing operation progress or percentages.
 * Built on Radix UI Progress primitive with full accessibility support.
 *
 * @example
 * <Progress value={65} />
 *
 * @example
 * <Progress value={75} max={100} aria-label="Download progress" />
 */
const Progress = React.memo(
  React.forwardRef<
    React.ElementRef<typeof ProgressPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
  >(({ className, value = 0, ...props }, ref) => (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        "relative h-3 w-full overflow-hidden rounded-full bg-muted",
        className
      )}
      value={value}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className="h-full w-full flex-1 bg-primary transition-all duration-300"
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  ))
)
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
