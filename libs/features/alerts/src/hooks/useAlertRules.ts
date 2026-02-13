/**
 * Hook for managing alert rules
 * Per Task 4: Uses Apollo Client for alert rule CRUD operations
 */
import { useQuery, useMutation } from '@apollo/client';
import { gql } from '@apollo/client';
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
 * Hook to fetch all alert rules
 */
export function useAlertRules(deviceId?: string) {
  return useQuery(GET_ALERT_RULES, {
    variables: { deviceId },
    fetchPolicy: 'cache-and-network',
  });
}

/**
 * Hook to fetch a single alert rule
 */
export function useAlertRule(id: string) {
  return useQuery(GET_ALERT_RULE, {
    variables: { id },
    skip: !id,
  });
}

/**
 * Hook to create an alert rule
 */
export function useCreateAlertRule() {
  const [mutate, result] = useMutation(CREATE_ALERT_RULE, {
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
 * Hook to update an alert rule
 */
export function useUpdateAlertRule() {
  const [mutate, result] = useMutation(UPDATE_ALERT_RULE, {
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
 * Hook to delete an alert rule
 */
export function useDeleteAlertRule() {
  const [mutate, result] = useMutation(DELETE_ALERT_RULE, {
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
