/**
 * IPAddressListMobile - Mobile Presenter
 * NAS-6.2: IP Address Management
 *
 * Card-based layout optimized for touch interaction.
 * 44px minimum touch targets, simplified UI.
 *
 * @description Mobile presenter for IP address list with card-based layout,
 * full-width touch targets (44px minimum), and streamlined action buttons.
 */
import type { IPAddressListProps } from './types';
declare function IPAddressListMobileComponent({ ipAddresses, loading, error, filters, onFiltersChange, onEdit, onDelete, onToggleDisabled, onRefresh, }: IPAddressListProps): import("react/jsx-runtime").JSX.Element;
export declare const IPAddressListMobile: import("react").MemoExoticComponent<typeof IPAddressListMobileComponent>;
export {};
//# sourceMappingURL=IPAddressListMobile.d.ts.map