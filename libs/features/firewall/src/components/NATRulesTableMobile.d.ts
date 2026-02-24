/**
 * NATRulesTableMobile Component
 * @description Card-based list view for NAT rules optimized for mobile devices
 * Epic 0.6, Story 0.6.2
 */
import type { NATRule } from '@nasnet/core/types';
export interface NATRulesTableMobileProps {
    chain?: string;
    onEditRule?: (rule: NATRule) => void;
}
export declare const NATRulesTableMobile: import("react").NamedExoticComponent<NATRulesTableMobileProps>;
//# sourceMappingURL=NATRulesTableMobile.d.ts.map