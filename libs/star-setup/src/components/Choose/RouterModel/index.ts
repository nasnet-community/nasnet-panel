// Main components
export { RouterModel } from "./RouterModel";
export { SlaveRouterModel } from "./SlaveRouterModel";

// Router data and constants
export {
  routers,
  getMasterRouters,
  getSlaveRouters,
  getRouterByModel,
  hasUSBPort,
  has25GigPort,
  isDockerCapable,
  isStarlinkMiniCompatible,
  isDomesticLinkAlternative,
  type RouterData,
} from "./Constants";

// Router categories
export {
  getRouterFamily,
  categorizeRouters,
  getTotalRouterCount,
  type RouterFamily,
  type RouterCategory,
} from "./RouterCategories";

// Custom router types and utilities
export type {
  EthernetSpeed,
  WifiBand,
  SfpType,
  CustomEthernetConfig,
  CustomWirelessConfig,
  CustomSfpConfig,
  CustomRouterForm,
} from "./CustomRouterTypes";
export * from "./CustomRouterUtils";

// Modals
export { CustomRouterModal } from "./CustomRouterModal";
export { RouterDetailsModal } from "./RouterDetailsModal";

// Card components
export { ClassyRouterCard } from "./ClassyRouterCard";
export { ModernRouterCard } from "./ModernRouterCard";
export { SimpleRouterCard } from "./SimpleRouterCard";
export { RouterCard } from "./RouterCard";
export { RouterCardCapabilities } from "./RouterCardCapabilities";
export { RouterCardMetrics } from "./RouterCardMetrics";

// Tabs and navigation
export { ClassyTabs } from "./ClassyTabs";
export { ModernTabs } from "./ModernTabs";

// Utilities and diagrams
export { NetworkTopologyDiagram } from "./NetworkTopologyDiagram";
