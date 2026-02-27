/**
 * Configuration Import Feature Library
 * Provides wizard for importing router configuration
 *
 * Usage:
 * 1. Use useConfigurationCheck hook in RouterPanel to detect if wizard is needed
 * 2. Render ConfigurationImportWizard when showWizard is true
 * 3. The wizard handles the full flow: input → protocol selection → execution
 */

// Components
export {
  ConfigurationImportWizard,
  ConfigurationInput,
  ProtocolSelector,
  ExecutionProgress,
} from './components';
export type {
  ConfigurationImportWizardProps,
  ConfigurationInputProps,
  ProtocolSelectorProps,
  ProtocolOption,
  ExecutionProgressProps,
} from './components';

// Hooks
export { useConfigurationCheck } from './hooks';
export type { UseConfigurationCheckResult } from './hooks';
