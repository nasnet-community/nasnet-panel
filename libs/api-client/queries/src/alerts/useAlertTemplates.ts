import { useQuery } from '@apollo/client';
import { GET_ALERT_TEMPLATES } from './alert-templates.graphql';
import type { NotificationChannel } from '@nasnet/api-client/generated';

export interface UseAlertTemplatesOptions {
  eventType?: string;
  channel?: NotificationChannel;
}

export function useAlertTemplates(options?: UseAlertTemplatesOptions) {
  const { data, loading, error, refetch } = useQuery(GET_ALERT_TEMPLATES, {
    variables: {
      eventType: options?.eventType,
      channel: options?.channel,
    },
  });

  return {
    templates: data?.alertTemplates ?? [],
    loading,
    error,
    refetch,
  };
}
