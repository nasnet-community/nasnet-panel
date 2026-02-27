import * as React from 'react';

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from './toast';
import { useToast } from './use-toast';

/**
 * Toaster component - Container and renderer for toast notifications
 *
 * Manages the display of all active toast notifications using the useToast hook.
 * Automatically renders toasts with their content, actions, and close buttons.
 *
 * Should be placed at the root level of your application after all providers.
 *
 * @example
 * ```tsx
 * // In your app root
 * <Root>
 *   <App />
 *   <Toaster />
 * </Root>
 * ```
 */
const Toaster = React.memo(function ToasterComponent() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast
            key={id}
            {...props}
          >
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
});

Toaster.displayName = 'Toaster';

export { Toaster };
