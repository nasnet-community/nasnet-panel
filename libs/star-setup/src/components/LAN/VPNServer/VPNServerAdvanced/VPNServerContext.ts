import { createStepperContext } from "@nas-net/core-ui-qwik";

import type { VPNType , VSCredentials } from "@nas-net/star-context";

// Context data for VPN Server settings
export interface VPNServerContextData {
  enabledProtocols: Record<VPNType, boolean>;
  expandedSections: Record<string, boolean>;
  users: VSCredentials[];
  isValid: { value: boolean };
  stepState: {
    protocols: boolean;
    config: boolean;
    users: boolean;
  };
  preventStepRecalculation?: boolean;
  savedStepIndex?: number;
}

export const VPNServerContextId =
  createStepperContext<VPNServerContextData>("vpn-server");