import type { PreviewNotificationTemplateInput } from '@nasnet/api-client/generated';
export declare function usePreviewAlertTemplate(): readonly [
  (input: PreviewNotificationTemplateInput) => Promise<{
    subject: any;
    body: any;
    errors: any;
  }>,
  {
    readonly data: any;
    readonly loading: boolean;
    readonly error: import('@apollo/client').ApolloError | undefined;
  },
];
//# sourceMappingURL=usePreviewAlertTemplate.d.ts.map
