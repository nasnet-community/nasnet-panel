import type { NotificationChannel } from '@nasnet/api-client/generated';
export interface UseAlertTemplatesOptions {
    eventType?: string;
    channel?: NotificationChannel;
}
export declare function useAlertTemplates(options?: UseAlertTemplatesOptions): {
    templates: any;
    loading: boolean;
    error: import("@apollo/client").ApolloError | undefined;
    refetch: (variables?: Partial<import("@apollo/client").OperationVariables> | undefined) => Promise<import("@apollo/client").ApolloQueryResult<any>>;
};
//# sourceMappingURL=useAlertTemplates.d.ts.map