/**
 * NAT Rules Page Component
 *
 * Main page for managing NAT rules with chain tabs and action buttons.
 *
 * Features:
 * - Tabs for chain filtering (All / Source NAT / Destination NAT)
 * - Header with action buttons:
 *   * "Quick Masquerade" → MasqueradeQuickDialog
 *   * "Port Forward Wizard" → PortForwardWizardDialog
 *   * "Add NAT Rule" → NATRuleBuilder
 * - NATRulesTable component (desktop: DataTable, mobile: Card list)
 * - Row actions: Edit, Delete (with SafetyConfirmation), Toggle disable
 * - Loading states, error handling
 * - Empty states with helpful CTAs
 *
 * @see NAS-7.2: Implement NAT Configuration - Task 9
 */
/**
 * NATRulesPage Component
 *
 * Main page for NAT rules management with chain-based tabs.
 * Supports source NAT (masquerade), destination NAT (port forwarding), and custom rules.
 *
 * @description NAT rule configuration and management
 * @returns NAT rules page component
 */
export declare const NATRulesPage: import("react").NamedExoticComponent<object>;
export default NATRulesPage;
//# sourceMappingURL=NATRulesPage.d.ts.map