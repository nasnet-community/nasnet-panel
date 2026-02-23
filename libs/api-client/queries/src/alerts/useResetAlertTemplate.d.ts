import type { NotificationChannel } from '@nasnet/api-client/generated';
export declare function useResetAlertTemplate(): readonly [(eventType: string, channel: NotificationChannel) => Promise<any>, {
    readonly loading: boolean;
    readonly error: import("@apollo/client").ApolloError | undefined;
}];
//# sourceMappingURL=useResetAlertTemplate.d.ts.map