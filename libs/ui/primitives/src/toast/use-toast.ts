import * as React from 'react';

import type { ToastActionElement, ToastProps } from './toast';

/** Maximum number of toasts to display simultaneously (per WCAG checklist section 25) */
const TOAST_LIMIT = 3;
/** Delay before removing dismissed toast from DOM (milliseconds) */
const TOAST_REMOVE_DELAY = 1000000;

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
const actionTypes = {
  ADD_TOAST: 'ADD_TOAST',
  UPDATE_TOAST: 'UPDATE_TOAST',
  DISMISS_TOAST: 'DISMISS_TOAST',
  REMOVE_TOAST: 'REMOVE_TOAST',
} as const;

/** Auto-incrementing counter for generating unique toast IDs */
let count = 0;

/**
 * Generate a unique ID for a toast notification
 * @returns Unique string ID, wraps around at MAX_SAFE_INTEGER
 */
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

/** Action type enumeration */
type ActionType = typeof actionTypes;

/**
 * Toast reducer action union type
 * Supports: ADD, UPDATE, DISMISS, and REMOVE actions
 */
type Action =
  | {
      type: ActionType['ADD_TOAST'];
      toast: ToasterToast;
    }
  | {
      type: ActionType['UPDATE_TOAST'];
      toast: Partial<ToasterToast>;
    }
  | {
      type: ActionType['DISMISS_TOAST'];
      toastId?: ToasterToast['id'];
    }
  | {
      type: ActionType['REMOVE_TOAST'];
      toastId?: ToasterToast['id'];
    };

/** Toast state type */
interface State {
  toasts: ToasterToast[];
}

/** Map of toast IDs to removal timeouts */
const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * Schedule a toast for removal after TOAST_REMOVE_DELAY
 * @param toastId - ID of the toast to remove
 */
const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return;
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({
      type: 'REMOVE_TOAST',
      toastId: toastId,
    });
  }, TOAST_REMOVE_DELAY);

  toastTimeouts.set(toastId, timeout);
};

/**
 * Toast state reducer
 * Handles ADD, UPDATE, DISMISS, and REMOVE actions
 * @param state - Current toast state
 * @param action - Reducer action
 * @returns Updated state
 */
export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'ADD_TOAST':
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    case 'UPDATE_TOAST':
      return {
        ...state,
        toasts: state.toasts.map((t) => (t.id === action.toast.id ? { ...t, ...action.toast } : t)),
      };

    case 'DISMISS_TOAST': {
      const { toastId } = action;

      if (toastId) {
        addToRemoveQueue(toastId);
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id);
        });
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined ?
            {
              ...t,
              open: false,
            }
          : t
        ),
      };
    }
    case 'REMOVE_TOAST':
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
  }
};

/** Listeners array for state updates */
const listeners: Array<(state: State) => void> = [];

/** In-memory state store for toasts */
let memoryState: State = { toasts: [] };

/**
 * Dispatch an action to update toast state
 * @param action - The action to dispatch
 */
function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

/** Toast creation type (without id) */
type Toast = Omit<ToasterToast, 'id'>;

/**
 * Create and show a toast notification
 * @param props - Toast properties (title, description, variant, action)
 * @returns Toast control object with id, dismiss, and update methods
 */
function toast({ ...props }: Toast) {
  const id = genId();

  const update = (props: ToasterToast) =>
    dispatch({
      type: 'UPDATE_TOAST',
      toast: { ...props, id },
    });
  const dismiss = () => dispatch({ type: 'DISMISS_TOAST', toastId: id });

  dispatch({
    type: 'ADD_TOAST',
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open: boolean) => {
        if (!open) dismiss();
      },
    },
  });

  return {
    id: id,
    dismiss,
    update,
  };
}

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
function useToast() {
  const [state, setState] = React.useState<State>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: 'DISMISS_TOAST', toastId }),
  };
}

export { useToast, toast };
