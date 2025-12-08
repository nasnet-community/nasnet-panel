import type { QRL } from "@builder.io/qwik";
import type { StepProps } from "@nas-net/core-ui-qwik";
import type { RouterInterfaces } from "@nas-net/star-context";

export interface WANInterfaceProps extends StepProps {
  mode: "Foreign" | "Domestic";
}

export interface WirelessSettingsProps {
  ssid: string;
  password: string;
  onSSIDChange: QRL<(value: string) => void>;
  onPasswordChange: QRL<(value: string) => void>;
}

export interface FooterProps {
  isComplete: boolean;
  isValid: boolean;
  onComplete: QRL<() => void>;
}

export interface InterfaceSelectorProps {
  selectedInterface: string;
  selectedInterfaceType: string;
  availableInterfaces: RouterInterfaces;
  onSelect: QRL<(value: string) => void>;
  mode: "Foreign" | "Domestic";
}
