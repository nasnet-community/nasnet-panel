/**
 * Query keys for storage operations
 * Used for cache invalidation and refetching
 */
export declare const storageKeys: {
    all: readonly ["storage"];
    info: () => readonly ["storage", "info"];
    usage: (routerId?: string) => readonly ["storage", "usage", {
        readonly routerId: string | undefined;
    }];
    config: () => readonly ["storage", "config"];
    unavailableFeatures: (routerId?: string) => readonly ["storage", "unavailable", {
        readonly routerId: string | undefined;
    }];
};
//# sourceMappingURL=queryKeys.d.ts.map