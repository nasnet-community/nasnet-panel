/**
 * Diagnostics GraphQL Operations
 * Query and mutation documents for internet troubleshooting (NAS-5.11)
 */

import { gql } from '@apollo/client';

// -----------------------------------------------------------------------------
// Fragments
// -----------------------------------------------------------------------------

export const TROUBLESHOOT_STEP_RESULT_FRAGMENT = gql`
  fragment TroubleshootStepResultFields on TroubleshootStepResult {
    success
    message
    details
    executionTimeMs
    issueCode
    target
  }
`;

export const TROUBLESHOOT_FIX_SUGGESTION_FRAGMENT = gql`
  fragment TroubleshootFixSuggestionFields on TroubleshootFixSuggestion {
    issueCode
    title
    explanation
    confidence
    requiresConfirmation
    isManualFix
    manualSteps
    command
    rollbackCommand
  }
`;

export const ISP_INFO_FRAGMENT = gql`
  fragment ISPInfoFields on ISPInfo {
    name
    phone
    url
  }
`;

export const TROUBLESHOOT_STEP_FRAGMENT = gql`
  fragment TroubleshootStepFields on TroubleshootStep {
    id
    name
    description
    status
    result {
      ...TroubleshootStepResultFields
    }
    fix {
      ...TroubleshootFixSuggestionFields
    }
    startedAt
    completedAt
  }
  ${TROUBLESHOOT_STEP_RESULT_FRAGMENT}
  ${TROUBLESHOOT_FIX_SUGGESTION_FRAGMENT}
`;

export const TROUBLESHOOT_SESSION_FRAGMENT = gql`
  fragment TroubleshootSessionFields on TroubleshootSession {
    id
    routerId
    steps {
      ...TroubleshootStepFields
    }
    currentStepIndex
    status
    wanInterface
    gateway
    ispInfo {
      ...ISPInfoFields
    }
    appliedFixes
    startedAt
    completedAt
  }
  ${TROUBLESHOOT_STEP_FRAGMENT}
  ${ISP_INFO_FRAGMENT}
`;

// -----------------------------------------------------------------------------
// Queries
// -----------------------------------------------------------------------------

export const GET_TROUBLESHOOT_SESSION = gql`
  query GetTroubleshootSession($id: ID!) {
    troubleshootSession(id: $id) {
      ...TroubleshootSessionFields
    }
  }
  ${TROUBLESHOOT_SESSION_FRAGMENT}
`;

export const DETECT_WAN_INTERFACE = gql`
  query DetectWanInterface($routerId: ID!) {
    detectWanInterface(routerId: $routerId)
  }
`;

export const DETECT_GATEWAY = gql`
  query DetectGateway($routerId: ID!) {
    detectGateway(routerId: $routerId)
  }
`;

export const DETECT_ISP = gql`
  query DetectISP($routerId: ID!) {
    detectISP(routerId: $routerId) {
      ...ISPInfoFields
    }
  }
  ${ISP_INFO_FRAGMENT}
`;

// -----------------------------------------------------------------------------
// Mutations
// -----------------------------------------------------------------------------

export const START_TROUBLESHOOT = gql`
  mutation StartTroubleshoot($routerId: ID!) {
    startTroubleshoot(routerId: $routerId) {
      session {
        ...TroubleshootSessionFields
      }
      errors {
        code
        message
        field
      }
    }
  }
  ${TROUBLESHOOT_SESSION_FRAGMENT}
`;

export const RUN_TROUBLESHOOT_STEP = gql`
  mutation RunTroubleshootStep($sessionId: ID!, $stepType: TroubleshootStepType!) {
    runTroubleshootStep(sessionId: $sessionId, stepType: $stepType) {
      step {
        ...TroubleshootStepFields
      }
      errors {
        code
        message
        field
      }
    }
  }
  ${TROUBLESHOOT_STEP_FRAGMENT}
`;

export const APPLY_TROUBLESHOOT_FIX = gql`
  mutation ApplyTroubleshootFix($sessionId: ID!, $issueCode: String!) {
    applyTroubleshootFix(sessionId: $sessionId, issueCode: $issueCode) {
      success
      message
      status
      errors {
        code
        message
        field
      }
    }
  }
`;

export const VERIFY_TROUBLESHOOT_FIX = gql`
  mutation VerifyTroubleshootFix($sessionId: ID!, $stepType: TroubleshootStepType!) {
    verifyTroubleshootFix(sessionId: $sessionId, stepType: $stepType) {
      step {
        ...TroubleshootStepFields
      }
      errors {
        code
        message
        field
      }
    }
  }
  ${TROUBLESHOOT_STEP_FRAGMENT}
`;

export const CANCEL_TROUBLESHOOT = gql`
  mutation CancelTroubleshoot($sessionId: ID!) {
    cancelTroubleshoot(sessionId: $sessionId) {
      ...TroubleshootSessionFields
    }
  }
  ${TROUBLESHOOT_SESSION_FRAGMENT}
`;

// -----------------------------------------------------------------------------
// Subscriptions
// -----------------------------------------------------------------------------

export const TROUBLESHOOT_PROGRESS = gql`
  subscription TroubleshootProgress($sessionId: ID!) {
    troubleshootProgress(sessionId: $sessionId) {
      ...TroubleshootSessionFields
    }
  }
  ${TROUBLESHOOT_SESSION_FRAGMENT}
`;
