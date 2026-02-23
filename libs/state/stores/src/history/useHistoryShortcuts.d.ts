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
export declare function useHistoryShortcuts(): void;
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
export declare function useHistoryControls(): {
    canUndo: boolean;
    canRedo: boolean;
    lastAction: import("./types").UndoableAction | undefined;
    undo: () => Promise<boolean>;
    redo: () => Promise<boolean>;
};
//# sourceMappingURL=useHistoryShortcuts.d.ts.map