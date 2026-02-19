import { component$ } from "@builder.io/qwik";

import { useVPNClientMode } from "./useVPNClientMode";
import { VPNClientAdvanced } from "./VPNClientAdvanced/AdvancedVPNClient";
import { VPNClientEasy } from "./VPNClientEasy/VPNClientEasy";

import type { StepProps } from "@nas-net/core-ui-qwik";

export const VPNClient = component$<StepProps>(
  ({ isComplete, onComplete$ }) => {
    const { vpnMode } = useVPNClientMode();

    // If in advanced mode, render the advanced component
    if (vpnMode.value === "advanced") {
      return (
        <VPNClientAdvanced
          onComplete$={onComplete$}
        />
      );
    }

    // Easy mode - render easy component
    return (
      <VPNClientEasy
        isComplete={isComplete}
        onComplete$={onComplete$}
      />
    );
  },
);
