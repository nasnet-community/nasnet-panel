/**
 * Firewall Utilities
 * Exports all firewall-related utility functions
 */

// Address List utilities
export {
  parseAddressList,
  validateInBatches,
  detectFormat,
  type ParseResult,
  type ParsedAddress,
} from './addressListParsers';

export {
  formatAddressList,
  formatCSV,
  formatJSON,
  formatRouterOSScript,
  getFileExtension,
  getMimeType,
  downloadFile,
  copyToClipboard,
  generateFilename,
  formatFileSize,
  estimateSize,
  type AddressListEntry,
} from './addressListFormatters';

// Template utilities (NAS-7.6)
export {
  validateTemplate,
  validateVariableValues,
  isValidTemplate,
  getRequiredVariables,
  checkRequiredVariables,
  validateTemplateNameUniqueness,
  sanitizeTemplateForExport,
  validateImportFormat,
  type ValidationError,
  type TemplateValidationResult,
  type VariableValuesValidationResult,
} from './template-validator';

export {
  exportTemplateToJSON,
  exportTemplateToYAML,
  exportTemplate,
  exportTemplates,
  downloadTemplate,
  downloadTemplates,
  copyTemplateToClipboard,
  getExportSize,
  generateTemplateId,
  type ExportFormat,
  type ExportOptions,
  type ExportResult,
} from './template-export';
