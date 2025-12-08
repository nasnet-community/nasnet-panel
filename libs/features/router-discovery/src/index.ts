/**
 * Router Discovery Feature Library
 * Barrel export for all components, hooks, and services
 */

// Components
export { NetworkScanner } from './components/NetworkScanner';
export type { NetworkScannerProps } from './components/NetworkScanner';

export { ManualRouterEntry } from './components/ManualRouterEntry';
export type { ManualRouterEntryProps } from './components/ManualRouterEntry';

export { CredentialDialog } from './components/CredentialDialog';
export type { CredentialDialogProps } from './components/CredentialDialog';

export { RouterCard } from './components/RouterCard';
export type { RouterCardProps } from './components/RouterCard';

export { RouterList } from './components/RouterList';
export type { RouterListProps } from './components/RouterList';

// Services
export {
  startNetworkScan,
  scanResultToRouter,
  validateSubnet,
  getDefaultSubnet,
  ScanError,
} from './services/scanService';

export {
  validateCredentials,
  saveCredentials,
  loadCredentials,
  removeCredentials,
  clearAllCredentials,
  hasCredentials,
  getRoutersWithCredentials,
  DEFAULT_CREDENTIALS,
  CredentialError,
} from './services/credentialService';

export type { CredentialValidationResult } from './services/credentialService';
