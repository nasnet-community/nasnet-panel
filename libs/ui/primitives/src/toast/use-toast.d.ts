import * as React from 'react';
import type { ToastActionElement, ToastProps } from './toast';
/**
 * ToasterToast - Internal type for toast state management
 * Extends ToastProps with id, title, description, and optional action
 */
type ToasterToast = ToastProps & {
    /** Unique identifier for this toast */
    id: string;
    /** Toast title/heading */
    title?: React.ReactNode;
    /** Toast description/body content */
    description?: React.ReactNode;
    /** Optional action button element */
    action?: ToastActionElement;
};
/** Action types for toast state reducer */
declare const actionTypes: {
    readonly ADD_TOAST: "ADD_TOAST";
    readonly UPDATE_TOAST: "UPDATE_TOAST";
    readonly DISMISS_TOAST: "DISMISS_TOAST";
    readonly REMOVE_TOAST: "REMOVE_TOAST";
};
/** Action type enumeration */
type ActionType = typeof actionTypes;
/**
 * Toast reducer action union type
 * Supports: ADD, UPDATE, DISMISS, and REMOVE actions
 */
type Action = {
    type: ActionType['ADD_TOAST'];
    toast: ToasterToast;
} | {
    type: ActionType['UPDATE_TOAST'];
    toast: Partial<ToasterToast>;
} | {
    type: ActionType['DISMISS_TOAST'];
    toastId?: ToasterToast['id'];
} | {
    type: ActionType['REMOVE_TOAST'];
    toastId?: ToasterToast['id'];
};
/** Toast state type */
interface State {
    toasts: ToasterToast[];
}
/**
 * Toast state reducer
 * Handles ADD, UPDATE, DISMISS, and REMOVE actions
 * @param state - Current toast state
 * @param action - Reducer action
 * @returns Updated state
 */
export declare const reducer: (state: State, action: Action) => State;
/** Toast creation type (without id) */
type Toast = Omit<ToasterToast, 'id'>;
/**
 * Create and show a toast notification
 * @param props - Toast properties (title, description, variant, action)
 * @returns Toast control object with id, dismiss, and update methods
 */
declare function toast({ ...props }: Toast): {
    id: string;
    dismiss: () => void;
    update: (props: ToasterToast) => void;
};
/**
 * useToast hook - Use toast notifications in components
 *
 * Provides access to the toast system, including:
 * - Current toast state (array of active toasts)
 * - toast() function to create new toasts
 * - dismiss() function to dismiss specific or all toasts
 *
 * Respects WCAG requirement: maximum 3 toasts visible simultaneously
 * See section 25 of COMPREHENSIVE_COMPONENT_CHECKLIST.md
 *
 * @returns Object with toasts array and toast/dismiss functions
 *
 * @example
 * ```tsx
 * const { toast } = useToast();
 *
 * // Show success notification
 * toast({
 *   title: "Success",
 *   description: "Configuration saved.",
 *   variant: "success",
 * });
 *
 * // Show error with action
 * toast({
 *   title: "Error",
 *   description: "Failed to connect.",
 *   variant: "error",
 *   action: <ToastAction altText="Retry">Retry</ToastAction>,
 * });
 * ```
 */
declare function useToast(): {
    toast: typeof toast;
    dismiss: (toastId?: string) => void;
    toasts: ToasterToast[];
};
export { useToast, toast };
//# sourceMappingURL=use-toast.d.ts.map