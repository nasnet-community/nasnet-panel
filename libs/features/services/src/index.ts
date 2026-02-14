/**
 * @nasnet/features-services
 *
 * Service Instance Management feature module
 * Feature Marketplace: Tor, sing-box, Xray-core, MTProxy, Psiphon, AdGuard Home
 */

// Pages
export { ServicesPage } from './pages/ServicesPage';
export type { ServicesPageProps } from './pages/ServicesPage';

export { ServiceDetailPage } from './pages/ServiceDetailPage';
export type { ServiceDetailPageProps } from './pages/ServiceDetailPage';

export { VLANSettingsPage } from './pages/VLANSettingsPage';
export type { VLANSettingsPageProps } from './pages/VLANSettingsPage';

export { DeviceRoutingPage } from './pages/DeviceRoutingPage';
export type { DeviceRoutingPageProps } from './pages/DeviceRoutingPage';

// Components
export { InstallDialog } from './components/InstallDialog';
export type { InstallDialogProps } from './components/InstallDialog';

export { PortRegistryView } from './components/PortRegistryView';
export type { PortRegistryViewProps } from './components/PortRegistryView';

export { PortRegistryViewDesktop } from './components/PortRegistryViewDesktop';
export type { PortRegistryViewDesktopProps } from './components/PortRegistryViewDesktop';

export { PortRegistryViewMobile } from './components/PortRegistryViewMobile';
export type { PortRegistryViewMobileProps } from './components/PortRegistryViewMobile';

export { GatewayStatusCard } from './components/GatewayStatusCard';
export type { GatewayStatusCardProps } from './components/GatewayStatusCard';

export { VLANPoolConfig } from './components/VLANPoolConfig';
export type { VLANPoolConfigProps } from './components/VLANPoolConfig';

export { StopDependentsDialog } from './components/StopDependentsDialog';

// Service Logs & Diagnostics Components (NAS-8.12)
export { ServiceLogViewer } from './components/ServiceLogViewer';
export type {
  ServiceLogViewerProps,
  UseServiceLogViewerReturn,
} from './components/ServiceLogViewer';

export { DiagnosticsPanel } from './components/DiagnosticsPanel';
export type {
  DiagnosticsPanelProps,
  UseDiagnosticsPanelReturn,
} from './components/DiagnosticsPanel';

// Service Alerts Components (Task #12)
export { ServiceAlertsTab } from './components/ServiceAlertsTab';
export type { ServiceAlertsTabProps } from './components/ServiceAlertsTab';

export { ServiceAlertsTabDesktop } from './components/ServiceAlertsTabDesktop';
export { ServiceAlertsTabMobile } from './components/ServiceAlertsTabMobile';

// Service Alerts Hooks (Task #12, #13)
export { useServiceAlertsTab } from './hooks/useServiceAlertsTab';
export type {
  UseServiceAlertsTabProps,
  UseServiceAlertsTabReturn,
  AlertFilters,
  PaginationState,
} from './hooks/useServiceAlertsTab';

export { useServiceAlertToasts } from './hooks/useServiceAlertToasts';
export type { UseServiceAlertToastsProps } from './hooks/useServiceAlertToasts';

// Service Traffic Statistics Components (NAS-8.8)
export {
  ServiceTrafficPanel,
  ServiceTrafficPanelDesktop,
  ServiceTrafficPanelMobile,
  useServiceTrafficPanel,
  QuotaSettingsForm,
} from './components/service-traffic';
export type {
  ServiceTrafficPanelProps,
  ServiceTrafficState,
  TrafficQuotaCardProps,
  DeviceBreakdownTableProps,
  UseServiceTrafficPanelOptions,
  QuotaSettingsFormProps,
} from './components/service-traffic';

// Service Configuration Utilities (NAS-8.5)
export { buildZodSchema, evaluateCondition } from './utils';

// Service Configuration Hooks (NAS-8.5)
export { useServiceConfigForm } from './hooks/useServiceConfigForm';
export type {
  UseServiceConfigFormProps,
  UseServiceConfigFormReturn,
} from './hooks/useServiceConfigForm';

// Service Configuration Components (NAS-8.5)
export {
  ServiceConfigForm,
  ServiceConfigFormMobile,
  ServiceConfigFormDesktop,
  DynamicField,
} from './components/ServiceConfigForm';
export type {
  ServiceConfigFormProps,
  ServiceConfigFormMobileProps,
  ServiceConfigFormDesktopProps,
  DynamicFieldProps,
} from './components/ServiceConfigForm';

// Service Templates Components (NAS-8.9)
export {
  TemplatesBrowser,
  TemplatesBrowserMobile,
  TemplatesBrowserDesktop,
  TemplateFilters,
  TemplateInstallWizard,
  TemplateInstallWizardMobile,
  TemplateInstallWizardDesktop,
  useTemplatesBrowser,
  useTemplateInstallWizard,
  VariablesStep,
  ReviewStep,
  InstallingStep,
  RoutingStep,
} from './components/templates';
export type {
  TemplatesBrowserProps,
  TemplateFiltersProps,
  TemplateBrowserFilters,
  TemplateSortBy,
  TemplateInstallWizardProps,
  TemplateInstallContext,
  TemplateInstallEvent,
  UseTemplateInstallWizardOptions,
  UseTemplateInstallWizardReturn,
  VariablesStepProps,
  ReviewStepProps,
  InstallingStepProps,
  RoutingStepProps,
  DEFAULT_FILTERS,
} from './components/templates';
