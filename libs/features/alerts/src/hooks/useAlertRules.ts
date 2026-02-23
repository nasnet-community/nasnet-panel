/**
 * Hook for managing alert rules
 * Per Task 4: Uses Apollo Client for alert rule CRUD operations
 */
import { useQuery, useMutation, gql, type MutationResult } from '@apollo/client';
import type { AlertRuleFormData } from '../schemas/alert-rule.schema';

// GraphQL queries and mutations
const GET_ALERT_RULES = gql`
  query GetAlertRules($deviceId: ID) {
    alertRules(deviceId: $deviceId) {
      id
      name
      description
      eventType
      conditions {
        field
        operator
        value
      }
      severity
      channels
      throttle {
        maxAlerts
        periodSeconds
        groupByField
      }
      quietHours {
        startTime
        endTime
        timezone
        bypassCritical
        daysOfWeek
      }
      deviceId
      enabled
      createdAt
      updatedAt
    }
  }
`;

const GET_ALERT_RULE = gql`
  query GetAlertRule($id: ID!) {
    alertRule(id: $id) {
      id
      name
      description
      eventType
      conditions {
        field
        operator
        value
      }
      severity
      channels
      throttle {
        maxAlerts
        periodSeconds
        groupByField
      }
      quietHours {
        startTime
        endTime
        timezone
        bypassCritical
        daysOfWeek
      }
      deviceId
      enabled
      createdAt
      updatedAt
    }
  }
`;

const CREATE_ALERT_RULE = gql`
  mutation CreateAlertRule($input: CreateAlertRuleInput!) {
    createAlertRule(input: $input) {
      alertRule {
        id
        name
        description
        eventType
        severity
        channels
        enabled
      }
      errors {
        code
        message
        field
      }
    }
  }
`;

const UPDATE_ALERT_RULE = gql`
  mutation UpdateAlertRule($id: ID!, $input: UpdateAlertRuleInput!) {
    updateAlertRule(id: $id, input: $input) {
      alertRule {
        id
        name
        description
        eventType
        severity
        channels
        enabled
      }
      errors {
        code
        message
        field
      }
    }
  }
`;

const DELETE_ALERT_RULE = gql`
  mutation DeleteAlertRule($id: ID!) {
    deleteAlertRule(id: $id) {
      success
      deletedId
      errors {
        code
        message
      }
    }
  }
`;

/**
 * Hook to fetch all alert rules.
 *
 * @description Fetches all alert rules for an optional device, using
 * cache-and-network policy for fresh data on every load.
 *
 * @param deviceId - Optional device ID to filter rules
 * @returns Apollo query result with alert rules array
 *
 * @example
 * ```tsx
 * const { data, loading, error } = useAlertRules(routerId);
 * ```
 */
export function useAlertRules(deviceId?: string) {
  return useQuery(GET_ALERT_RULES, {
    variables: { deviceId },
    fetchPolicy: 'cache-and-network',
  });
}

/**
 * Hook to fetch a single alert rule by ID.
 *
 * @description Fetches a specific alert rule. Query is skipped if ID is not provided.
 *
 * @param id - Alert rule ID (skips query if falsy)
 * @returns Apollo query result with single alert rule
 *
 * @example
 * ```tsx
 * const { data, loading } = useAlertRule(selectedRuleId);
 * ```
 */
export function useAlertRule(id: string) {
  return useQuery(GET_ALERT_RULE, {
    variables: { id },
    skip: !id,
  });
}

/**
 * Hook to create an alert rule.
 *
 * @description Provides mutation function to create a new alert rule.
 * Automatically refetches all alert rules after successful creation.
 *
 * @returns Object with createRule function and mutation result state
 *
 * @example
 * ```tsx
 * const { createRule, loading, error } = useCreateAlertRule();
 * await createRule(formData);
 * ```
 */
export function useCreateAlertRule() {
  const [mutate, result] = useMutation<any, any>(CREATE_ALERT_RULE, {
    refetchQueries: [{ query: GET_ALERT_RULES }],
  });

  const createRule = async (input: AlertRuleFormData) => {
    const { data } = await mutate({
      variables: { input },
    });

    if (data?.createAlertRule?.errors?.length > 0) {
      throw new Error(data.createAlertRule.errors[0].message);
    }

    return data?.createAlertRule?.alertRule;
  };

  return {
    createRule,
    ...result,
  };
}

/**
 * Hook to update an alert rule.
 *
 * @description Provides mutation function to update an existing alert rule.
 * Automatically refetches all alert rules after successful update.
 *
 * @returns Object with updateRule function and mutation result state
 *
 * @example
 * ```tsx
 * const { updateRule, loading, error } = useUpdateAlertRule();
 * await updateRule(ruleId, updatedFormData);
 * ```
 */
export function useUpdateAlertRule() {
  const [mutate, result] = useMutation<any, any>(UPDATE_ALERT_RULE, {
    refetchQueries: [{ query: GET_ALERT_RULES }],
  });

  const updateRule = async (id: string, input: Partial<AlertRuleFormData>) => {
    const { data } = await mutate({
      variables: { id, input },
    });

    if (data?.updateAlertRule?.errors?.length > 0) {
      throw new Error(data.updateAlertRule.errors[0].message);
    }

    return data?.updateAlertRule?.alertRule;
  };

  return {
    updateRule,
    ...result,
  };
}

/**
 * Hook to delete an alert rule.
 *
 * @description Provides mutation function to delete an alert rule.
 * Automatically refetches all alert rules after successful deletion.
 *
 * @returns Object with deleteRule function and mutation result state
 *
 * @example
 * ```tsx
 * const { deleteRule, loading, error } = useDeleteAlertRule();
 * await deleteRule(ruleId);
 * ```
 */
export function useDeleteAlertRule() {
  const [mutate, result] = useMutation<any, any>(DELETE_ALERT_RULE, {
    refetchQueries: [{ query: GET_ALERT_RULES }],
  });

  const deleteRule = async (id: string) => {
    const { data } = await mutate({
      variables: { id },
    });

    if (data?.deleteAlertRule?.errors?.length > 0) {
      throw new Error(data.deleteAlertRule.errors[0].message);
    }

    return data?.deleteAlertRule?.success;
  };

  return {
    deleteRule,
    ...result,
  };
}
