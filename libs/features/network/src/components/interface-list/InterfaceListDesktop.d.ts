import type { InterfaceFilters } from './InterfaceList';
export interface InterfaceListDesktopProps {
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
 * Interface List Desktop Presenter
 * Displays interfaces in a table format optimized for desktop
 */
export declare const InterfaceListDesktop: import("react").NamedExoticComponent<InterfaceListDesktopProps>;
//# sourceMappingURL=InterfaceListDesktop.d.ts.map