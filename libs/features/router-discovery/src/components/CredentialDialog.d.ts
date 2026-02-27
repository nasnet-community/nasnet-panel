/**
 * Credential Dialog Component
 * Modal dialog for entering and validating router credentials (Story 0-1-3)
 */
import type { RouterCredentials } from '@nasnet/core/types';
export interface CredentialDialogProps {
  /**
   * Whether the dialog is open
   */
  isOpen: boolean;
  /**
   * Router IP address being connected to
   */
  routerIp: string;
  /**
   * Optional router name for display
   */
  routerName?: string;
  /**
   * Whether validation is in progress
   */
  isValidating?: boolean;
  /**
   * Validation error message
   */
  validationError?: string;
  /**
   * Callback when user submits credentials
   */
  onSubmit?: (credentials: RouterCredentials, saveCredentials: boolean) => void;
  /**
   * Callback when user cancels
   */
  onCancel?: () => void;
  /**
   * Initial credentials (for retry scenarios)
   */
  initialCredentials?: RouterCredentials;
  /**
   * Optional CSS class name
   */
  className?: string;
}
/**
 * CredentialDialog Component
 *
 * @description Modal dialog for entering router login credentials with validation.
 *
 * Features:
 * - Username and password inputs
 * - Password visibility toggle
 * - Remember credentials checkbox
 * - Loading state during validation
 * - Error display
 *
 * @example
 * ```tsx
 * <CredentialDialog
 *   isOpen={showDialog}
 *   routerIp="192.168.88.1"
 *   routerName="Home Router"
 *   onSubmit={(creds, save) => validateAndConnect(creds, save)}
 *   onCancel={() => setShowDialog(false)}
 * />
 * ```
 */
export declare const CredentialDialog: import('react').NamedExoticComponent<CredentialDialogProps>;
//# sourceMappingURL=CredentialDialog.d.ts.map
