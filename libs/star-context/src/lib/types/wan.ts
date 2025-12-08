import type { VPNClient } from "../utils/VPNClientType";
import type {
  WANLinks
} from "../utils/WANLinkType";

// Re-export for convenience
export type { WANLink, WANLinkConfig, InterfaceConfig, WANLinks } from "../utils/WANLinkType";

export interface DOHConfig {
  domain?: string;
  bindingIP?: string;
}

export interface DNSConfig {
  ForeignDNS?: string;
  VPNDNS?: string;
  DomesticDNS?: string;
  SplitDNS?: string;
  DOH?: DOHConfig;
}

export interface WANState {
  WANLink: WANLinks;
  VPNClient?: VPNClient;
  DNSConfig?: DNSConfig;
}
