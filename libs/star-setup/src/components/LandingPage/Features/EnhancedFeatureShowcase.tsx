import { component$ } from "@builder.io/qwik";

// Import all feature sections
import { GamingOptimizationSection } from "./sections/GamingOptimizationSection";
import { LoadBalanceSection } from "./sections/LoadBalanceSection";
import { MultiWANSection } from "./sections/MultiWANSection";
import { NetworkTunnelsSection } from "./sections/NetworkTunnelsSection";
import { PortForwardingSection } from "./sections/PortForwardingSection";
import { RouterChainingSection } from "./sections/RouterChainingSection";
import { VPNClientSection } from "./sections/VPNClientSection";
import { VPNServerSection } from "./sections/VPNServerSection";
import { WirelessNetworksSection } from "./sections/WirelessNetworksSection";

export const EnhancedFeatureShowcase = component$(() => {
  return (
    <>
      {/* Render all 9 feature sections in sequence */}
      <MultiWANSection />
      <RouterChainingSection />
      <LoadBalanceSection />
      <VPNClientSection />
      <VPNServerSection />
      <WirelessNetworksSection />
      <NetworkTunnelsSection />
      <GamingOptimizationSection />
      <PortForwardingSection />
    </>
  );
});
