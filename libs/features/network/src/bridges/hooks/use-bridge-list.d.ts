/**
 * Headless hook for bridge list logic.
 * Manages bridge selection, filtering, and undo operations.
 * Implements stable callbacks and memoized filters for optimal performance.
 *
 * @param routerId - Router ID to fetch bridges for
 * @returns Bridge list state, filters, and action handlers
 */
export declare function useBridgeList(routerId: string): {
    bridges: any;
    allBridges: any;
    isLoading: boolean;
    hasError: import("@apollo/client").ApolloError | undefined;
    selectedIds: Set<string>;
    setSelectedIds: import("react").Dispatch<import("react").SetStateAction<Set<string>>>;
    handleToggleSelection: (uuid: string) => void;
    handleSelectAll: () => void;
    handleClearSelection: () => void;
    searchQuery: string;
    setSearchQuery: import("react").Dispatch<import("react").SetStateAction<string>>;
    protocolFilter: string | null;
    setProtocolFilter: import("react").Dispatch<import("react").SetStateAction<string | null>>;
    vlanFilteringFilter: boolean | null;
    setVlanFilteringFilter: import("react").Dispatch<import("react").SetStateAction<boolean | null>>;
    handleDelete: (uuid: string) => Promise<void>;
    refetch: (variables?: Partial<import("@apollo/client").OperationVariables> | undefined) => Promise<import("@apollo/client").ApolloQueryResult<any>>;
    selectedBridgeId: string | null;
    setSelectedBridgeId: import("react").Dispatch<import("react").SetStateAction<string | null>>;
};
export type UseBridgeListReturn = ReturnType<typeof useBridgeList>;
//# sourceMappingURL=use-bridge-list.d.ts.map