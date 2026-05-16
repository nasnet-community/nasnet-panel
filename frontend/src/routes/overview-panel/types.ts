export type SlotKind = 'ethernet' | 'sfp' | 'usb' | 'power' | 'reset' | 'sim' | 'antenna';

export type PortStatus = 'up' | 'down' | 'disabled' | 'absent';

export interface PortSlot {
  id: string;
  kind: SlotKind;
  ifaceName?: string;
  label?: string;
  nominalSpeed?: string;
  badge?: 'poe';
  row: number;
  col: number;
}

export type ModelKey = 'hap-ax2' | 'hap-ax3' | 'rb4011' | 'rb5009' | 'chateau-lte12';

export type FormFactor = 'tower' | 'desktop' | 'rackmount';

export interface RouterModelDescriptor {
  key: ModelKey;
  displayName: string;
  aliases: string[];
  form: FormFactor;
  slots: PortSlot[];
}

export interface ResolvedSlot extends PortSlot {
  status: PortStatus;
  speedLabel?: string;
  tooltip: string;
  interactive: boolean;
  rxMbps?: number;
  txMbps?: number;
}

export interface PanelProps {
  descriptor: RouterModelDescriptor;
  slots: ResolvedSlot[];
  onSlotActivate?: (slot: ResolvedSlot) => void;
  bare?: boolean;
}
