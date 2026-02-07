import { DocumentNode } from 'graphql';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type RouterIdentityFragment = { id: string, name: string, host: string, createdAt: any, updatedAt: any };

export type RouterPlatformFragment = { platform: RouterPlatform, model: string | null, version: string | null, uptime: any | null };

export type RouterRuntimeFragment = { status: ConnectionStatus, lastConnected: any | null };

export type RouterHealthSummaryFragment = { id: string, name: string, host: string, createdAt: any, updatedAt: any, platform: RouterPlatform, model: string | null, version: string | null, uptime: any | null, status: ConnectionStatus, lastConnected: any | null };

export type GetRouterHealthSummaryQueryVariables = Exact<{
  routerId: Scalars['ID']['input'];
}>;


export type GetRouterHealthSummaryQuery = { router: { id: string, name: string, host: string, createdAt: any, updatedAt: any, platform: RouterPlatform, model: string | null, version: string | null, uptime: any | null, status: ConnectionStatus, lastConnected: any | null } | null };

export type GetMultipleRouterHealthSummariesQueryVariables = Exact<{
  status: InputMaybe<ConnectionStatus>;
  pagination: InputMaybe<PaginationInput>;
}>;


export type GetMultipleRouterHealthSummariesQuery = { routers: { totalCount: number | null, edges: Array<{ node: { id: string, name: string, host: string, createdAt: any, updatedAt: any, platform: RouterPlatform, model: string | null, version: string | null, uptime: any | null, status: ConnectionStatus, lastConnected: any | null } }>, pageInfo: { hasNextPage: boolean, hasPreviousPage: boolean, startCursor: string | null, endCursor: string | null } } };

export type OnRouterStatusChangedSubscriptionVariables = Exact<{
  routerId: Scalars['ID']['input'];
}>;


export type OnRouterStatusChangedSubscription = { routerStatusChanged: { previousStatus: ConnectionStatus, newStatus: ConnectionStatus, timestamp: any, router: { id: string, name: string, host: string, createdAt: any, updatedAt: any, platform: RouterPlatform, model: string | null, version: string | null, uptime: any | null, status: ConnectionStatus, lastConnected: any | null } } };

export type OnAnyRouterStatusChangedSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type OnAnyRouterStatusChangedSubscription = { routerStatusChanged: { previousStatus: ConnectionStatus, newStatus: ConnectionStatus, timestamp: any, router: { id: string, name: string, host: string, createdAt: any, updatedAt: any, platform: RouterPlatform, model: string | null, version: string | null, uptime: any | null, status: ConnectionStatus, lastConnected: any | null } } };

export const RouterIdentityFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"RouterIdentity"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Router"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"host"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode;
export const RouterPlatformFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"RouterPlatform"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Router"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"platform"}},{"kind":"Field","name":{"kind":"Name","value":"model"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"uptime"}}]}}]} as unknown as DocumentNode;
export const RouterRuntimeFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"RouterRuntime"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Router"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"lastConnected"}}]}}]} as unknown as DocumentNode;
export const RouterHealthSummaryFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"RouterHealthSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Router"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"RouterIdentity"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"RouterPlatform"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"RouterRuntime"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"RouterIdentity"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Router"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"host"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"RouterPlatform"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Router"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"platform"}},{"kind":"Field","name":{"kind":"Name","value":"model"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"uptime"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"RouterRuntime"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Router"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"lastConnected"}}]}}]} as unknown as DocumentNode;
export const GetRouterHealthSummaryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetRouterHealthSummary"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"routerId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"router"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"routerId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"RouterHealthSummary"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"RouterIdentity"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Router"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"host"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"RouterPlatform"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Router"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"platform"}},{"kind":"Field","name":{"kind":"Name","value":"model"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"uptime"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"RouterRuntime"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Router"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"lastConnected"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"RouterHealthSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Router"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"RouterIdentity"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"RouterPlatform"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"RouterRuntime"}}]}}]} as unknown as DocumentNode;

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
export function useGetRouterHealthSummaryQuery(baseOptions: Apollo.QueryHookOptions<GetRouterHealthSummaryQuery, GetRouterHealthSummaryQueryVariables> & ({ variables: GetRouterHealthSummaryQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetRouterHealthSummaryQuery, GetRouterHealthSummaryQueryVariables>(GetRouterHealthSummaryDocument, options);
      }
export function useGetRouterHealthSummaryLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetRouterHealthSummaryQuery, GetRouterHealthSummaryQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetRouterHealthSummaryQuery, GetRouterHealthSummaryQueryVariables>(GetRouterHealthSummaryDocument, options);
        }
// @ts-ignore
export function useGetRouterHealthSummarySuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetRouterHealthSummaryQuery, GetRouterHealthSummaryQueryVariables>): Apollo.UseSuspenseQueryResult<GetRouterHealthSummaryQuery, GetRouterHealthSummaryQueryVariables>;
export function useGetRouterHealthSummarySuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetRouterHealthSummaryQuery, GetRouterHealthSummaryQueryVariables>): Apollo.UseSuspenseQueryResult<GetRouterHealthSummaryQuery | undefined, GetRouterHealthSummaryQueryVariables>;
export function useGetRouterHealthSummarySuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetRouterHealthSummaryQuery, GetRouterHealthSummaryQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetRouterHealthSummaryQuery, GetRouterHealthSummaryQueryVariables>(GetRouterHealthSummaryDocument, options);
        }
export type GetRouterHealthSummaryQueryHookResult = ReturnType<typeof useGetRouterHealthSummaryQuery>;
export type GetRouterHealthSummaryLazyQueryHookResult = ReturnType<typeof useGetRouterHealthSummaryLazyQuery>;
export type GetRouterHealthSummarySuspenseQueryHookResult = ReturnType<typeof useGetRouterHealthSummarySuspenseQuery>;
export type GetRouterHealthSummaryQueryResult = Apollo.QueryResult<GetRouterHealthSummaryQuery, GetRouterHealthSummaryQueryVariables>;
export const GetMultipleRouterHealthSummariesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetMultipleRouterHealthSummaries"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"status"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ConnectionStatus"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"routers"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"status"},"value":{"kind":"Variable","name":{"kind":"Name","value":"status"}}},{"kind":"Argument","name":{"kind":"Name","value":"pagination"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"RouterHealthSummary"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}},{"kind":"Field","name":{"kind":"Name","value":"hasPreviousPage"}},{"kind":"Field","name":{"kind":"Name","value":"startCursor"}},{"kind":"Field","name":{"kind":"Name","value":"endCursor"}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"RouterIdentity"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Router"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"host"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"RouterPlatform"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Router"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"platform"}},{"kind":"Field","name":{"kind":"Name","value":"model"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"uptime"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"RouterRuntime"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Router"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"lastConnected"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"RouterHealthSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Router"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"RouterIdentity"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"RouterPlatform"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"RouterRuntime"}}]}}]} as unknown as DocumentNode;

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
export function useGetMultipleRouterHealthSummariesQuery(baseOptions?: Apollo.QueryHookOptions<GetMultipleRouterHealthSummariesQuery, GetMultipleRouterHealthSummariesQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetMultipleRouterHealthSummariesQuery, GetMultipleRouterHealthSummariesQueryVariables>(GetMultipleRouterHealthSummariesDocument, options);
      }
export function useGetMultipleRouterHealthSummariesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetMultipleRouterHealthSummariesQuery, GetMultipleRouterHealthSummariesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetMultipleRouterHealthSummariesQuery, GetMultipleRouterHealthSummariesQueryVariables>(GetMultipleRouterHealthSummariesDocument, options);
        }
// @ts-ignore
export function useGetMultipleRouterHealthSummariesSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetMultipleRouterHealthSummariesQuery, GetMultipleRouterHealthSummariesQueryVariables>): Apollo.UseSuspenseQueryResult<GetMultipleRouterHealthSummariesQuery, GetMultipleRouterHealthSummariesQueryVariables>;
export function useGetMultipleRouterHealthSummariesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetMultipleRouterHealthSummariesQuery, GetMultipleRouterHealthSummariesQueryVariables>): Apollo.UseSuspenseQueryResult<GetMultipleRouterHealthSummariesQuery | undefined, GetMultipleRouterHealthSummariesQueryVariables>;
export function useGetMultipleRouterHealthSummariesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetMultipleRouterHealthSummariesQuery, GetMultipleRouterHealthSummariesQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetMultipleRouterHealthSummariesQuery, GetMultipleRouterHealthSummariesQueryVariables>(GetMultipleRouterHealthSummariesDocument, options);
        }
export type GetMultipleRouterHealthSummariesQueryHookResult = ReturnType<typeof useGetMultipleRouterHealthSummariesQuery>;
export type GetMultipleRouterHealthSummariesLazyQueryHookResult = ReturnType<typeof useGetMultipleRouterHealthSummariesLazyQuery>;
export type GetMultipleRouterHealthSummariesSuspenseQueryHookResult = ReturnType<typeof useGetMultipleRouterHealthSummariesSuspenseQuery>;
export type GetMultipleRouterHealthSummariesQueryResult = Apollo.QueryResult<GetMultipleRouterHealthSummariesQuery, GetMultipleRouterHealthSummariesQueryVariables>;
export const OnRouterStatusChangedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"OnRouterStatusChanged"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"routerId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"routerStatusChanged"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"routerId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"routerId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"router"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"RouterHealthSummary"}}]}},{"kind":"Field","name":{"kind":"Name","value":"previousStatus"}},{"kind":"Field","name":{"kind":"Name","value":"newStatus"}},{"kind":"Field","name":{"kind":"Name","value":"timestamp"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"RouterIdentity"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Router"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"host"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"RouterPlatform"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Router"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"platform"}},{"kind":"Field","name":{"kind":"Name","value":"model"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"uptime"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"RouterRuntime"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Router"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"lastConnected"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"RouterHealthSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Router"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"RouterIdentity"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"RouterPlatform"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"RouterRuntime"}}]}}]} as unknown as DocumentNode;

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
export function useOnRouterStatusChangedSubscription(baseOptions: Apollo.SubscriptionHookOptions<OnRouterStatusChangedSubscription, OnRouterStatusChangedSubscriptionVariables> & ({ variables: OnRouterStatusChangedSubscriptionVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useSubscription<OnRouterStatusChangedSubscription, OnRouterStatusChangedSubscriptionVariables>(OnRouterStatusChangedDocument, options);
      }
export type OnRouterStatusChangedSubscriptionHookResult = ReturnType<typeof useOnRouterStatusChangedSubscription>;
export type OnRouterStatusChangedSubscriptionResult = Apollo.SubscriptionResult<OnRouterStatusChangedSubscription>;
export const OnAnyRouterStatusChangedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"OnAnyRouterStatusChanged"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"routerStatusChanged"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"router"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"RouterHealthSummary"}}]}},{"kind":"Field","name":{"kind":"Name","value":"previousStatus"}},{"kind":"Field","name":{"kind":"Name","value":"newStatus"}},{"kind":"Field","name":{"kind":"Name","value":"timestamp"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"RouterIdentity"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Router"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"host"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"RouterPlatform"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Router"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"platform"}},{"kind":"Field","name":{"kind":"Name","value":"model"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"uptime"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"RouterRuntime"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Router"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"lastConnected"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"RouterHealthSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Router"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"RouterIdentity"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"RouterPlatform"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"RouterRuntime"}}]}}]} as unknown as DocumentNode;

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
export function useOnAnyRouterStatusChangedSubscription(baseOptions?: Apollo.SubscriptionHookOptions<OnAnyRouterStatusChangedSubscription, OnAnyRouterStatusChangedSubscriptionVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useSubscription<OnAnyRouterStatusChangedSubscription, OnAnyRouterStatusChangedSubscriptionVariables>(OnAnyRouterStatusChangedDocument, options);
      }
export type OnAnyRouterStatusChangedSubscriptionHookResult = ReturnType<typeof useOnAnyRouterStatusChangedSubscription>;
export type OnAnyRouterStatusChangedSubscriptionResult = Apollo.SubscriptionResult<OnAnyRouterStatusChangedSubscription>;