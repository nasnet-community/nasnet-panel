import type { InterfaceFilters } from './InterfaceList';
export interface InterfaceListMobileProps {
    interfaces: any[];
    allInterfaces: any[];
    loading: boolean;
    error: any;
    selectedIds: Set<string>;
    onSelect: (ids: Set<string>) => void;
    filters: InterfaceFilters;
    onFilterChange: (filters: InterfaceFilters) => void;
    onRefresh: () => void;
    routerId: string;
    onOpenDetail: (interfaceId: string) => void;
}
/**
 * Interface List Mobile Presenter
 * Displays interfaces as cards optimized for mobile/touch
 */
export declare const InterfaceListMobile: import("react").NamedExoticComponent<InterfaceListMobileProps>;
//# sourceMappingURL=InterfaceListMobile.d.ts.map