import { gql } from '@apollo/client';

/**
 * GraphQL documents for Service Logs & Diagnostics (NAS-8.12)
 * Provides log streaming, diagnostic testing, and health monitoring
 */

// =============================================================================
// Queries
// =============================================================================

/**
 * Get recent log entries for a service instance
 */
export const GET_SERVICE_LOG_FILE = gql`
  query GetServiceLogFile($routerID: ID!, $instanceID: ID!, $maxLines: Int) {
    serviceLogFile(routerID: $routerID, instanceID: $instanceID, maxLines: $maxLines) {
      instanceID
      serviceName
      filePath
      sizeBytes
      lineCount
      entries {
        timestamp
        level
        message
        source
        rawLine
        metadata
      }
      createdAt
      lastUpdated
    }
  }
`;

/**
 * Get diagnostic history for a service instance
 */
export const GET_DIAGNOSTIC_HISTORY = gql`
  query GetDiagnosticHistory($routerID: ID!, $instanceID: ID!, $limit: Int) {
    diagnosticHistory(routerID: $routerID, instanceID: $instanceID, limit: $limit) {
      instanceID
      runGroupID
      results {
        id
        instanceID
        testName
        status
        message
        details
        durationMs
        runGroupID
        metadata
        errorMessage
        createdAt
      }
      overallStatus
      passedCount
      failedCount
      warningCount
      totalTests
      timestamp
    }
  }
`;

/**
 * Get available diagnostic tests for a service type
 */
export const GET_AVAILABLE_DIAGNOSTICS = gql`
  query GetAvailableDiagnostics($serviceName: String!) {
    availableDiagnostics(serviceName: $serviceName) {
      serviceName
      tests {
        name
        description
        category
      }
    }
  }
`;

// =============================================================================
// Mutations
// =============================================================================

/**
 * Manually run diagnostics on a service instance
 */
export const RUN_SERVICE_DIAGNOSTICS = gql`
  mutation RunServiceDiagnostics($input: RunDiagnosticsInput!) {
    runServiceDiagnostics(input: $input) {
      success
      results {
        id
        instanceID
        testName
        status
        message
        details
        durationMs
        runGroupID
        metadata
        errorMessage
        createdAt
      }
      runGroupID
      errors {
        field
        message
      }
    }
  }
`;

// =============================================================================
// Subscriptions
// =============================================================================

/**
 * Subscribe to real-time log stream for a service instance
 */
export const SUBSCRIBE_SERVICE_LOGS = gql`
  subscription ServiceLogs($routerID: ID!, $instanceID: ID!, $levelFilter: LogLevel) {
    serviceLogs(routerID: $routerID, instanceID: $instanceID, levelFilter: $levelFilter) {
      timestamp
      level
      message
      source
      rawLine
      metadata
    }
  }
`;

/**
 * Subscribe to diagnostic progress updates
 */
export const SUBSCRIBE_DIAGNOSTICS_PROGRESS = gql`
  subscription DiagnosticsProgress($routerID: ID!, $instanceID: ID!) {
    diagnosticsProgress(routerID: $routerID, instanceID: $instanceID) {
      instanceID
      runGroupID
      result {
        id
        instanceID
        testName
        status
        message
        details
        durationMs
        runGroupID
        metadata
        errorMessage
        createdAt
      }
      progress
      completedTests
      totalTests
      timestamp
    }
  }
`;
