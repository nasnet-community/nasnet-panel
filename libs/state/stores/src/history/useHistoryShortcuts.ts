/**
 * History Keyboard Shortcuts Hook
 *
 * Registers undo/redo keyboard shortcuts with the shortcut registry.
 * Integrates with the notification system to show feedback.
 *
 * Shortcuts:
 * - Cmd+Z / Ctrl+Z: Undo
 * - Cmd+Shift+Z / Ctrl+Y: Redo
 *
 * @see NAS-4.24: Implement Undo/Redo History
 */

import { useEffect } from 'react';
import { useShortcutRegistry } from '../command/shortcut-registry.store';
import { useNotificationStore } from '../ui/notification.store';
import {
  useHistoryStore,
  selectCanUndo,
  selectCanRedo,
  selectLastAction,
  undoLast,
  redoLast,
} from './history.store';

/**
 * Duration for undo notification (with redo action button)
 */
const UNDO_NOTIFICATION_DURATION = 10000; // 10 seconds

/**
 * Hook to register undo/redo keyboard shortcuts
 *
 * This should be called once at the app root level to enable
 * undo/redo functionality throughout the application.
 *
 * @example
 * ```tsx
 * function App() {
 *   useHistoryShortcuts();
 *   return <RouterProvider router={router} />;
 * }
 * ```
 */
export function useHistoryShortcuts(): void {
  const { register, unregister } = useShortcutRegistry();
  const { addNotification, removeNotification } = useNotificationStore();

  useEffect(() => {
    // Register undo shortcut
    register({
      id: 'undo',
      label: 'Undo',
      keys: 'cmd+z',
      group: 'editing',
      onExecute: async () => {
        const state = useHistoryStore.getState();
        const canUndo = selectCanUndo(state);

        if (!canUndo) {
          addNotification({
            type: 'info',
            title: 'Nothing to undo',
            duration: 2000,
          });
          return;
        }

        // Get the action before undoing (for notification)
        const lastAction = selectLastAction(state);
        const success = await undoLast();

        if (success && lastAction) {
          // Show notification with redo action
          const notificationId = addNotification({
            type: 'info',
            title: `Undone: ${lastAction.description}`,
            duration: UNDO_NOTIFICATION_DURATION,
            action: {
              label: 'Redo',
              onClick: async () => {
                await redoLast();
                removeNotification(notificationId);
              },
            },
          });
        }
      },
    });

    // Register redo shortcut
    register({
      id: 'redo',
      label: 'Redo',
      keys: 'cmd+shift+z',
      group: 'editing',
      onExecute: async () => {
        const state = useHistoryStore.getState();
        const canRedo = selectCanRedo(state);

        if (!canRedo) {
          addNotification({
            type: 'info',
            title: 'Nothing to redo',
            duration: 2000,
          });
          return;
        }

        // Get the action that will be redone
        const { future } = state;
        const actionToRedo = future[0];

        const success = await redoLast();

        if (success && actionToRedo) {
          addNotification({
            type: 'info',
            title: `Redone: ${actionToRedo.description}`,
            duration: 4000,
          });
        }
      },
    });

    // Also register Ctrl+Y as alternative redo (Windows convention)
    register({
      id: 'redo-alt',
      label: 'Redo',
      keys: 'ctrl+y',
      group: 'editing',
      onExecute: async () => {
        const state = useHistoryStore.getState();
        const canRedo = selectCanRedo(state);

        if (!canRedo) {
          return; // Silent fail for alternative shortcut
        }

        const { future } = state;
        const actionToRedo = future[0];

        const success = await redoLast();

        if (success && actionToRedo) {
          addNotification({
            type: 'info',
            title: `Redone: ${actionToRedo.description}`,
            duration: 4000,
          });
        }
      },
    });

    // Cleanup on unmount
    return () => {
      unregister('undo');
      unregister('redo');
      unregister('redo-alt');
    };
  }, [register, unregister, addNotification, removeNotification]);
}

/**
 * Hook to get the current undo/redo state
 *
 * @example
 * ```tsx
 * function UndoRedoButtons() {
 *   const { canUndo, canRedo, undo, redo } = useHistoryControls();
 *
 *   return (
 *     <>
 *       <Button onClick={undo} disabled={!canUndo}>Undo</Button>
 *       <Button onClick={redo} disabled={!canRedo}>Redo</Button>
 *     </>
 *   );
 * }
 * ```
 */
export function useHistoryControls() {
  const canUndo = useHistoryStore(selectCanUndo);
  const canRedo = useHistoryStore(selectCanRedo);
  const lastAction = useHistoryStore(selectLastAction);
  const { undo, redo } = useHistoryStore();

  return {
    canUndo,
    canRedo,
    lastAction,
    undo,
    redo,
  };
}
