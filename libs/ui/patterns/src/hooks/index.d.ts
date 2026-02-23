/**
 * Pattern Hooks
 *
 * Shared headless hooks for pattern components.
 * These provide reusable business logic that can be composed.
 *
 * NOTE: Platform detection hooks (usePlatform, etc.) are available from:
 * import { usePlatform } from '@nasnet/ui/layouts';
 *
 * We don't re-export them here to avoid circular dependencies.
 *
 * @see PATTERNS.md for implementation guide
 */
export { useMemoizedFilter, useMemoizedSort, useMemoizedFilterSort, useMemoizedMap, useMemoizedFind, useMemoizedGroupBy, useMemoizedReduce, useMemoizedUnique, } from './useMemoizedFilter';
export { useStableCallback, useStableEventHandler, useStableCallbackWithDeps, useDebouncedCallback, useThrottledCallback, } from './useStableCallback';
export { useFocusRestore, useFocusManagement, } from './use-focus-restore';
export type { UseFocusRestoreReturn, UseFocusRestoreOptions, UseFocusManagementOptions, UseFocusManagementReturn, } from './use-focus-restore';
export { useToast } from './useToast';
export type { ToastOptions, ProgressToastOptions, PromiseToastMessages, UseToastReturn, } from './useToast';
export { useUnsavedChanges, getUnsavedChangesMessage, } from './useUnsavedChanges';
export type { UseUnsavedChangesOptions, UseUnsavedChangesReturn, UnsavedChangesDialogProps, DialogAction, } from './useUnsavedChanges';
export { useClipboard, CLIPBOARD_TIMEOUT_MS } from './useClipboard';
export type { UseClipboardOptions, UseClipboardReturn } from './useClipboard';
export { useBulkCopy, SUPPORTED_FORMATS, FORMAT_LABELS } from './useBulkCopy';
export type { UseBulkCopyOptions, UseBulkCopyReturn, ExportFormat, } from './useBulkCopy';
export { usePasteImport } from './usePasteImport';
export type { UsePasteImportOptions, UsePasteImportReturn, ImportType, ParseResult, ParsedItem, ValidationError, } from './usePasteImport';
//# sourceMappingURL=index.d.ts.map