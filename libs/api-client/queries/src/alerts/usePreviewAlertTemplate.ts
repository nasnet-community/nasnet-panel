import { useLazyQuery } from '@apollo/client';
import { PREVIEW_NOTIFICATION_TEMPLATE } from './alert-templates.graphql';
import type { PreviewNotificationTemplateInput } from '@nasnet/api-client/generated';

export function usePreviewAlertTemplate() {
  const [executePreview, { data, loading, error }] = useLazyQuery(PREVIEW_NOTIFICATION_TEMPLATE);

  const previewTemplate = async (input: PreviewNotificationTemplateInput) => {
    const result = await executePreview({ variables: { input } });
    return {
      subject: result.data?.previewNotificationTemplate.subject,
      body: result.data?.previewNotificationTemplate.body,
      errors: result.data?.previewNotificationTemplate.errors ?? [],
    };
  };

  return [previewTemplate, { data, loading, error }] as const;
}
