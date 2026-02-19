import { createContextId, type QRL } from "@builder.io/qwik";

import type { ChooseState } from "./types/choose";
import type { VPNType } from "./types/common";
import type { ExtraConfigState } from "./types/extra";
import type { LANState } from "./types/lan";
import type { WANState } from "./types/wan";

export interface StarState {
  Choose: ChooseState;
  WAN: WANState;
  LAN: LANState;
  ExtraConfig: ExtraConfigState;
  ShowConfig: Record<string, unknown>;
}

export interface StarContextType {
  state: StarState;
  updateChoose$: QRL<(data: Partial<ChooseState>) => void>;
  updateWAN$: QRL<(data: Partial<WANState>) => void>;
  updateLAN$: QRL<(data: Partial<StarState["LAN"]>) => void>;
  updateExtraConfig$: QRL<(data: Partial<ExtraConfigState>) => void>;
  updateShowConfig$: QRL<(data: Partial<StarState["ShowConfig"]>) => void>;
}

export const StarContext = createContextId<StarContextType>("star-context");

export type { VPNType };
