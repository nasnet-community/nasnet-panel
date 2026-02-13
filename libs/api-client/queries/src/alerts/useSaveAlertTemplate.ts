import { useMutation } from '@apollo/client';
import { SAVE_ALERT_TEMPLATE, GET_ALERT_TEMPLATES } from './alert-templates.graphql';
import type { SaveAlertTemplateInput } from '@nasnet/api-client/generated';

export function useSaveAlertTemplate() {
  const [mutate, { loading, error }] = useMutation(SAVE_ALERT_TEMPLATE, {
    refetchQueries: [{ query: GET_ALERT_TEMPLATES }],
  });

  const saveTemplate = async (input: SaveAlertTemplateInput) => {
    const result = await mutate({ variables: { input } });

    if (result.data?.saveAlertTemplate.errors?.length > 0) {
      throw new Error(result.data.saveAlertTemplate.errors.join(', '));
    }

    return result.data?.saveAlertTemplate.template;
  };

  return [saveTemplate, { loading, error }] as const;
}
