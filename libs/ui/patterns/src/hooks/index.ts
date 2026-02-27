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

// Memoization utilities
export {
  useMemoizedFilter,
  useMemoizedSort,
  useMemoizedFilterSort,
  useMemoizedMap,
  useMemoizedFind,
  useMemoizedGroupBy,
  useMemoizedReduce,
  useMemoizedUnique,
} from './useMemoizedFilter';

// Stable callback utilities
export {
  useStableCallback,
  useStableEventHandler,
  useStableCallbackWithDeps,
  useDebouncedCallback,
  useThrottledCallback,
} from './useStableCallback';

// Pattern-specific hooks will be added here as patterns are created
// Example: export { useResourceCard } from '../common/resource-card/useResourceCard';

// Focus Management - @see NAS-4.17
export { useFocusRestore, useFocusManagement } from './use-focus-restore';
export type {
  UseFocusRestoreReturn,
  UseFocusRestoreOptions,
  UseFocusManagementOptions,
  UseFocusManagementReturn,
} from './use-focus-restore';

// Toast/Notification - @see NAS-4.19
export { useToast } from './useToast';
export type {
  ToastOptions,
  ProgressToastOptions,
  PromiseToastMessages,
  UseToastReturn,
} from './useToast';

// Unsaved Changes - @see NAS-4.24
export { useUnsavedChanges, getUnsavedChangesMessage } from './useUnsavedChanges';
export type {
  UseUnsavedChangesOptions,
  UseUnsavedChangesReturn,
  UnsavedChangesDialogProps,
  DialogAction,
} from './useUnsavedChanges';

// Clipboard Integration - @see NAS-4.23
export { useClipboard, CLIPBOARD_TIMEOUT_MS } from './useClipboard';
export type { UseClipboardOptions, UseClipboardReturn } from './useClipboard';

export { useBulkCopy, SUPPORTED_FORMATS, FORMAT_LABELS } from './useBulkCopy';
export type { UseBulkCopyOptions, UseBulkCopyReturn, ExportFormat } from './useBulkCopy';

export { usePasteImport } from './usePasteImport';
export type {
  UsePasteImportOptions,
  UsePasteImportReturn,
  ImportType,
  ParseResult,
  ParsedItem,
  ValidationError,
} from './usePasteImport';
