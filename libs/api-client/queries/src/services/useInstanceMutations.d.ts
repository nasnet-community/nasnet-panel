import type { StartInstanceInput, StopInstanceInput, RestartInstanceInput, DeleteInstanceInput } from '@nasnet/api-client/generated';
/**
 * Hook providing all service instance lifecycle mutations
 */
export declare function useInstanceMutations(): {
    startInstance: (input: StartInstanceInput) => Promise<import("@apollo/client").FetchResult<any>>;
    stopInstance: (input: StopInstanceInput) => Promise<import("@apollo/client").FetchResult<any>>;
    restartInstance: (input: RestartInstanceInput) => Promise<import("@apollo/client").FetchResult<any>>;
    deleteInstance: (input: DeleteInstanceInput) => Promise<import("@apollo/client").FetchResult<any>>;
    loading: {
        start: boolean;
        stop: boolean;
        restart: boolean;
        delete: boolean;
    };
    errors: {
        start: import("@apollo/client").ApolloError | undefined;
        stop: import("@apollo/client").ApolloError | undefined;
        restart: import("@apollo/client").ApolloError | undefined;
        delete: import("@apollo/client").ApolloError | undefined;
    };
};
//# sourceMappingURL=useInstanceMutations.d.ts.map