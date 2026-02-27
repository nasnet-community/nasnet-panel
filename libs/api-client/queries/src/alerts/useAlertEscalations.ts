/**
 * React Query hooks for alert escalations (NAS-18.9)
 * @module useAlertEscalations
 */

import { useQuery, gql } from '@apollo/client';

// GraphQL query for alert escalations
const ALERT_ESCALATIONS_QUERY = gql`
  query AlertEscalations($status: EscalationStatus, $limit: Int, $offset: Int) {
    alertEscalations(status: $status, limit: $limit, offset: $offset) {
      id
      alertId
      ruleId
      currentLevel
      maxLevel
      status
      nextEscalationAt
      resolvedAt
      resolvedBy
      createdAt
      updatedAt
    }
  }
`;

// GraphQL query for single alert with escalation
const ALERT_WITH_ESCALATION_QUERY = gql`
  query AlertWithEscalation($alertId: ID!) {
    alert(id: $alertId) {
      id
      title
      severity
      acknowledgedAt
      escalation {
        id
        currentLevel
        maxLevel
        status
        nextEscalationAt
      }
    }
  }
`;

export interface AlertEscalation {
  id: string;
  alertId: string;
  ruleId: string;
  currentLevel: number;
  maxLevel: number;
  status: 'PENDING' | 'RESOLVED' | 'MAX_REACHED';
  nextEscalationAt?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UseAlertEscalationsOptions {
  status?: 'PENDING' | 'RESOLVED' | 'MAX_REACHED';
  limit?: number;
  offset?: number;
  pollInterval?: number;
}

/**
 * Hook to fetch alert escalations with optional filtering
 *
 * @example
 * ```tsx
 * const { data, loading, error } = useAlertEscalations({
 *   status: 'PENDING',
 *   limit: 10,
 *   pollInterval: 30000 // Poll every 30 seconds
 * });
 * ```
 */
export function useAlertEscalations(options: UseAlertEscalationsOptions = {}) {
  const { status, limit = 50, offset = 0, pollInterval } = options;

  return useQuery(ALERT_ESCALATIONS_QUERY, {
    variables: {
      status,
      limit,
      offset,
    },
    pollInterval,
    fetchPolicy: 'cache-and-network',
  });
}

/**
 * Hook to fetch a single alert with its escalation status
 *
 * @example
 * ```tsx
 * const { data, loading } = useAlertWithEscalation('alert-123');
 *
 * if (data?.alert?.escalation) {
 *   console.log(`Alert at level ${data.alert.escalation.currentLevel}`);
 * }
 * ```
 */
export function useAlertWithEscalation(alertId: string) {
  return useQuery(ALERT_WITH_ESCALATION_QUERY, {
    variables: { alertId },
    skip: !alertId,
    fetchPolicy: 'cache-and-network',
  });
}

/**
 * Hook to poll for active escalations (auto-refreshing)
 *
 * @example
 * ```tsx
 * const { data, loading } = useActiveEscalations(15000); // Poll every 15s
 * ```
 */
export function useActiveEscalations(pollInterval = 30000) {
  return useAlertEscalations({
    status: 'PENDING',
    limit: 100,
    pollInterval,
  });
}
