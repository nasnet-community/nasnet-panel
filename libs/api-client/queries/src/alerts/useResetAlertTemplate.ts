import { useMutation } from '@apollo/client';
import { RESET_ALERT_TEMPLATE, GET_ALERT_TEMPLATES } from './alert-templates.graphql';
import type { NotificationChannel } from '@nasnet/core/types';

export function useResetAlertTemplate() {
  const [mutate, { loading, error }] = useMutation(RESET_ALERT_TEMPLATE, {
    refetchQueries: [{ query: GET_ALERT_TEMPLATES }],
  });

  const resetTemplate = async (eventType: string, channel: NotificationChannel) => {
    const result = await mutate({
      variables: { eventType, channel }
    });

    if (result.data?.resetAlertTemplate.errors?.length > 0) {
      throw new Error(result.data.resetAlertTemplate.errors.join(', '));
    }

    return result.data?.resetAlertTemplate.success;
  };

  return [resetTemplate, { loading, error }] as const;
}
