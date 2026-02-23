import { DocumentNode } from 'graphql';
import * as Apollo from '@apollo/client';
import type { Exact, Scalars, InputMaybe, ConnectionStatus, RouterPlatform, PaginationInput } from './types';
export type RouterIdentityFragment = {
    id: string;
    name: string;
    host: string;
    createdAt: any;
    updatedAt: any;
};
export type RouterPlatformFragment = {
    platform: RouterPlatform;
    model: string | null;
    version: string | null;
    uptime: any | null;
};
export type RouterRuntimeFragment = {
    status: ConnectionStatus;
    lastConnected: any | null;
};
export type RouterHealthSummaryFragment = {
    id: string;
    name: string;
    host: string;
    createdAt: any;
    updatedAt: any;
    platform: RouterPlatform;
    model: string | null;
    version: string | null;
    uptime: any | null;
    status: ConnectionStatus;
    lastConnected: any | null;
};
export type GetRouterHealthSummaryQueryVariables = Exact<{
    routerId: Scalars['ID']['input'];
}>;
export type GetRouterHealthSummaryQuery = {
    router: {
        id: string;
        name: string;
        host: string;
        createdAt: any;
        updatedAt: any;
        platform: RouterPlatform;
        model: string | null;
        version: string | null;
        uptime: any | null;
        status: ConnectionStatus;
        lastConnected: any | null;
    } | null;
};
export type GetMultipleRouterHealthSummariesQueryVariables = Exact<{
    status: InputMaybe<ConnectionStatus>;
    pagination: InputMaybe<PaginationInput>;
}>;
export type GetMultipleRouterHealthSummariesQuery = {
    routers: {
        totalCount: number | null;
        edges: Array<{
            node: {
                id: string;
                name: string;
                host: string;
                createdAt: any;
                updatedAt: any;
                platform: RouterPlatform;
                model: string | null;
                version: string | null;
                uptime: any | null;
                status: ConnectionStatus;
                lastConnected: any | null;
            };
        }>;
        pageInfo: {
            hasNextPage: boolean;
            hasPreviousPage: boolean;
            startCursor: string | null;
            endCursor: string | null;
        };
    };
};
export type OnRouterStatusChangedSubscriptionVariables = Exact<{
    routerId: Scalars['ID']['input'];
}>;
export type OnRouterStatusChangedSubscription = {
    routerStatusChanged: {
        previousStatus: ConnectionStatus;
        newStatus: ConnectionStatus;
        timestamp: any;
        router: {
            id: string;
            name: string;
            host: string;
            createdAt: any;
            updatedAt: any;
            platform: RouterPlatform;
            model: string | null;
            version: string | null;
            uptime: any | null;
            status: ConnectionStatus;
            lastConnected: any | null;
        };
    };
};
export type OnAnyRouterStatusChangedSubscriptionVariables = Exact<{
    [key: string]: never;
}>;
export type OnAnyRouterStatusChangedSubscription = {
    routerStatusChanged: {
        previousStatus: ConnectionStatus;
        newStatus: ConnectionStatus;
        timestamp: any;
        router: {
            id: string;
            name: string;
            host: string;
            createdAt: any;
            updatedAt: any;
            platform: RouterPlatform;
            model: string | null;
            version: string | null;
            uptime: any | null;
            status: ConnectionStatus;
            lastConnected: any | null;
        };
    };
};
export declare const RouterIdentityFragmentDoc: DocumentNode;
export declare const RouterPlatformFragmentDoc: DocumentNode;
export declare const RouterRuntimeFragmentDoc: DocumentNode;
export declare const RouterHealthSummaryFragmentDoc: DocumentNode;
export declare const GetRouterHealthSummaryDocument: DocumentNode;
/**
 * __useGetRouterHealthSummaryQuery__
 *
 * To run a query within a React component, call `useGetRouterHealthSummaryQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetRouterHealthSummaryQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetRouterHealthSummaryQuery({
 *   variables: {
 *      routerId: // value for 'routerId'
 *   },
 * });
 */
export declare function useGetRouterHealthSummaryQuery(baseOptions: Apollo.QueryHookOptions<GetRouterHealthSummaryQuery, GetRouterHealthSummaryQueryVariables> & ({
    variables: GetRouterHealthSummaryQueryVariables;
    skip?: boolean;
} | {
    skip: boolean;
})): Apollo.InteropQueryResult<GetRouterHealthSummaryQuery, Exact<{
    routerId: Scalars["ID"]["input"];
}>>;
export declare function useGetRouterHealthSummaryLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetRouterHealthSummaryQuery, GetRouterHealthSummaryQueryVariables>): Apollo.LazyQueryResultTuple<GetRouterHealthSummaryQuery, Exact<{
    routerId: Scalars["ID"]["input"];
}>>;
export declare function useGetRouterHealthSummarySuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetRouterHealthSummaryQuery, GetRouterHealthSummaryQueryVariables>): Apollo.UseSuspenseQueryResult<GetRouterHealthSummaryQuery, GetRouterHealthSummaryQueryVariables>;
export declare function useGetRouterHealthSummarySuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetRouterHealthSummaryQuery, GetRouterHealthSummaryQueryVariables>): Apollo.UseSuspenseQueryResult<GetRouterHealthSummaryQuery | undefined, GetRouterHealthSummaryQueryVariables>;
export type GetRouterHealthSummaryQueryHookResult = ReturnType<typeof useGetRouterHealthSummaryQuery>;
export type GetRouterHealthSummaryLazyQueryHookResult = ReturnType<typeof useGetRouterHealthSummaryLazyQuery>;
export type GetRouterHealthSummarySuspenseQueryHookResult = ReturnType<typeof useGetRouterHealthSummarySuspenseQuery>;
export type GetRouterHealthSummaryQueryResult = Apollo.QueryResult<GetRouterHealthSummaryQuery, GetRouterHealthSummaryQueryVariables>;
export declare const GetMultipleRouterHealthSummariesDocument: DocumentNode;
/**
 * __useGetMultipleRouterHealthSummariesQuery__
 *
 * To run a query within a React component, call `useGetMultipleRouterHealthSummariesQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetMultipleRouterHealthSummariesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetMultipleRouterHealthSummariesQuery({
 *   variables: {
 *      status: // value for 'status'
 *      pagination: // value for 'pagination'
 *   },
 * });
 */
export declare function useGetMultipleRouterHealthSummariesQuery(baseOptions?: Apollo.QueryHookOptions<GetMultipleRouterHealthSummariesQuery, GetMultipleRouterHealthSummariesQueryVariables>): Apollo.InteropQueryResult<GetMultipleRouterHealthSummariesQuery, Exact<{
    status: InputMaybe<ConnectionStatus>;
    pagination: InputMaybe<PaginationInput>;
}>>;
export declare function useGetMultipleRouterHealthSummariesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetMultipleRouterHealthSummariesQuery, GetMultipleRouterHealthSummariesQueryVariables>): Apollo.LazyQueryResultTuple<GetMultipleRouterHealthSummariesQuery, Exact<{
    status: InputMaybe<ConnectionStatus>;
    pagination: InputMaybe<PaginationInput>;
}>>;
export declare function useGetMultipleRouterHealthSummariesSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetMultipleRouterHealthSummariesQuery, GetMultipleRouterHealthSummariesQueryVariables>): Apollo.UseSuspenseQueryResult<GetMultipleRouterHealthSummariesQuery, GetMultipleRouterHealthSummariesQueryVariables>;
export declare function useGetMultipleRouterHealthSummariesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetMultipleRouterHealthSummariesQuery, GetMultipleRouterHealthSummariesQueryVariables>): Apollo.UseSuspenseQueryResult<GetMultipleRouterHealthSummariesQuery | undefined, GetMultipleRouterHealthSummariesQueryVariables>;
export type GetMultipleRouterHealthSummariesQueryHookResult = ReturnType<typeof useGetMultipleRouterHealthSummariesQuery>;
export type GetMultipleRouterHealthSummariesLazyQueryHookResult = ReturnType<typeof useGetMultipleRouterHealthSummariesLazyQuery>;
export type GetMultipleRouterHealthSummariesSuspenseQueryHookResult = ReturnType<typeof useGetMultipleRouterHealthSummariesSuspenseQuery>;
export type GetMultipleRouterHealthSummariesQueryResult = Apollo.QueryResult<GetMultipleRouterHealthSummariesQuery, GetMultipleRouterHealthSummariesQueryVariables>;
export declare const OnRouterStatusChangedDocument: DocumentNode;
/**
 * __useOnRouterStatusChangedSubscription__
 *
 * To run a query within a React component, call `useOnRouterStatusChangedSubscription` and pass it any options that fit your needs.
 * When your component renders, `useOnRouterStatusChangedSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useOnRouterStatusChangedSubscription({
 *   variables: {
 *      routerId: // value for 'routerId'
 *   },
 * });
 */
export declare function useOnRouterStatusChangedSubscription(baseOptions: Apollo.SubscriptionHookOptions<OnRouterStatusChangedSubscription, OnRouterStatusChangedSubscriptionVariables> & ({
    variables: OnRouterStatusChangedSubscriptionVariables;
    skip?: boolean;
} | {
    skip: boolean;
})): {
    restart: () => void;
    loading: boolean;
    data?: OnRouterStatusChangedSubscription | undefined;
    error?: Apollo.ApolloError;
    variables?: Exact<{
        routerId: Scalars["ID"]["input"];
    }> | undefined;
};
export type OnRouterStatusChangedSubscriptionHookResult = ReturnType<typeof useOnRouterStatusChangedSubscription>;
export type OnRouterStatusChangedSubscriptionResult = Apollo.SubscriptionResult<OnRouterStatusChangedSubscription>;
export declare const OnAnyRouterStatusChangedDocument: DocumentNode;
/**
 * __useOnAnyRouterStatusChangedSubscription__
 *
 * To run a query within a React component, call `useOnAnyRouterStatusChangedSubscription` and pass it any options that fit your needs.
 * When your component renders, `useOnAnyRouterStatusChangedSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useOnAnyRouterStatusChangedSubscription({
 *   variables: {
 *   },
 * });
 */
export declare function useOnAnyRouterStatusChangedSubscription(baseOptions?: Apollo.SubscriptionHookOptions<OnAnyRouterStatusChangedSubscription, OnAnyRouterStatusChangedSubscriptionVariables>): {
    restart: () => void;
    loading: boolean;
    data?: OnAnyRouterStatusChangedSubscription | undefined;
    error?: Apollo.ApolloError;
    variables?: Exact<{
        [key: string]: never;
    }> | undefined;
};
export type OnAnyRouterStatusChangedSubscriptionHookResult = ReturnType<typeof useOnAnyRouterStatusChangedSubscription>;
export type OnAnyRouterStatusChangedSubscriptionResult = Apollo.SubscriptionResult<OnAnyRouterStatusChangedSubscription>;
//# sourceMappingURL=operations.d.ts.map