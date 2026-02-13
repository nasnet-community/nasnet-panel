import { useQuery } from '@apollo/client';
import { GET_ALERT_TEMPLATE } from './alert-templates.graphql';

export function useAlertTemplate(id: string) {
  const { data, loading, error, refetch } = useQuery(GET_ALERT_TEMPLATE, {
    variables: { id },
    skip: !id,
  });

  return {
    template: data?.alertTemplate ?? null,
    loading,
    error,
    refetch,
  };
}
