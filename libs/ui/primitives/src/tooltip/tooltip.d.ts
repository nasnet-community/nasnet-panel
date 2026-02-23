import * as React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
declare const TooltipProvider: React.FC<TooltipPrimitive.TooltipProviderProps>;
declare const Tooltip: React.FC<TooltipPrimitive.TooltipProps>;
declare const TooltipTrigger: React.ForwardRefExoticComponent<TooltipPrimitive.TooltipTriggerProps & React.RefAttributes<HTMLButtonElement>>;
/**
 * TooltipContent - Floating tooltip content panel.
 * Automatically positions itself relative to the trigger.
 * Supports placement sides (top, bottom, left, right) and keyboard accessibility.
 *
 * Respects prefers-reduced-motion: animations disabled if user prefers reduced motion.
 * Uses design token colors for 7:1 contrast ratio in both light and dark modes.
 */
declare const TooltipContent: React.MemoExoticComponent<React.ForwardRefExoticComponent<Omit<TooltipPrimitive.TooltipContentProps & React.RefAttributes<HTMLDivElement>, "ref"> & React.RefAttributes<HTMLDivElement>>>;
export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
//# sourceMappingURL=tooltip.d.ts.map