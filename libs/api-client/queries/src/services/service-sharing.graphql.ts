import { gql } from '@apollo/client';

/**
 * GraphQL documents for Service Configuration Sharing (Export/Import)
 * Feature: NAS-8.11 - Service Sharing via JSON/QR Code
 */

// =============================================================================
// Mutations
// =============================================================================

/**
 * Export a service configuration as a JSON package
 * Returns a download URL with 15-minute expiry
 * Supports secret redaction and routing rule inclusion
 */
export const EXPORT_SERVICE_CONFIG = gql`
  mutation ExportServiceConfig($input: ExportServiceConfigInput!) {
    exportServiceConfig(input: $input) {
      success
      downloadURL
      package {
        version
        exportedAt
        exportedBy
        sourceRouter {
          id
          name
        }
        service {
          featureID
          instanceName
          config
          ports
          vlanID
          bindIP
        }
        routingRules {
          deviceMAC
          deviceName
          mode
        }
        redactedFields
      }
      errors {
        message
        path
      }
    }
  }
`;

/**
 * Generate a QR code for service configuration sharing
 * Returns base64-encoded PNG image (256x256 by default)
 * Enforces 2KB size limit for QR code data
 */
export const GENERATE_CONFIG_QR = gql`
  mutation GenerateConfigQR($input: GenerateConfigQRInput!) {
    generateConfigQR(input: $input) {
      imageDataBase64
      downloadURL
      imageSize
      dataSize
      errors {
        message
        path
      }
    }
  }
`;

/**
 * Import a service configuration package (validation only)
 * Performs 7-stage validation pipeline without making changes
 * Returns validation results and conflicts
 */
export const IMPORT_SERVICE_CONFIG = gql`
  mutation ImportServiceConfig($input: ImportServiceConfigInput!) {
    importServiceConfig(input: $input) {
      valid
      validationResult {
        valid
        requiresUserInput
        redactedFields
        errors {
          stage
          code
          field
          message
        }
        conflictingInstances {
          id
          featureID
          instanceName
          status
          vlanID
          bindIP
          ports
        }
      }
      errors {
        message
        path
      }
    }
  }
`;
