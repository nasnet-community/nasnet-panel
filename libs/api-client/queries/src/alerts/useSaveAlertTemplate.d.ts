import type { SaveAlertTemplateInput } from '@nasnet/api-client/generated';
export declare function useSaveAlertTemplate(): readonly [
  (input: SaveAlertTemplateInput) => Promise<any>,
  {
    readonly loading: boolean;
    readonly error: import('@apollo/client').ApolloError | undefined;
  },
];
//# sourceMappingURL=useSaveAlertTemplate.d.ts.map
