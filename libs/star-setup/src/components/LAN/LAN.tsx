import {
  component$,
  $,
} from "@builder.io/qwik";
import { VStepper } from "@nas-net/core-ui-qwik";

import EInterface from "./EInterface/EInterface";
import { Subnets } from "./Subnets";
import { Tunnel } from "./Tunnel/Tunnel";
import { useLAN } from "./useLAN";
import { VPNServer } from "./VPNServer/VPNServer";
import { Wireless } from "./Wireless/Wireless";

import type { StepProps } from "@nas-net/core-ui-qwik";

// Define step components outside the main component to avoid serialization issues
const EInterfaceStep = component$((props: StepProps) => (
  <EInterface isComplete={props.isComplete} onComplete$={props.onComplete$} />
));

const WirelessStep = component$((props: StepProps) => (
  <Wireless
    isComplete={props.isComplete}
    onComplete$={props.onComplete$}
    // Don't advance to the next step when disabled - let the Save button handle it
    onDisabled$={$(() => {})}
  />
));

const VPNServerStep = component$((props: StepProps) => (
  <VPNServer
    isComplete={props.isComplete}
    onComplete$={props.onComplete$}
    // Don't advance to the next step when disabled - let the Save button handle it
    onDisabled$={$(() => {})}
  />
));

const TunnelStep = component$((props: StepProps) => (
  <Tunnel
    isComplete={props.isComplete}
    onComplete$={props.onComplete$}
    // Don't advance to the next step when disabled - let the Save button handle it
    onDisabled$={$(() => {})}
  />
));

const SubnetsStep = component$((props: StepProps) => (
  <Subnets isComplete={props.isComplete} onComplete$={props.onComplete$} />
));


export const LAN = component$((props: StepProps) => {
  const { stepsStore, handleStepComplete, handleStepChange } = useLAN({
    onComplete$: props.onComplete$,
    WirelessStep,
    EInterfaceStep,
    VPNServerStep,
    TunnelStep,
    SubnetsStep,
  });

  return (
    <div class="container mx-auto w-full px-4">
      <VStepper
        steps={stepsStore.steps}
        activeStep={stepsStore.activeStep}
        onStepComplete$={handleStepComplete}
        onStepChange$={handleStepChange}
        isComplete={props.isComplete}
      />
    </div>
  );
});
