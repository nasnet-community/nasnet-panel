import type { InterfaceResponse } from '../../api';
import type { PortSlot, PortStatus, ResolvedSlot, SlotKind } from './types';

const PORT_KINDS: SlotKind[] = ['ethernet', 'sfp'];

export type PowerAction = 'reboot' | 'shutdown';

export const POWER_ACTION: Partial<Record<SlotKind, PowerAction>> = {
  reset: 'reboot',
  power: 'shutdown',
};

export const STATUS_LABEL: Record<PortStatus, string> = {
  up: 'up',
  down: 'down',
  disabled: 'disabled',
  absent: 'not detected',
};

const ACTION_TOOLTIP: Record<PowerAction, string> = {
  reboot: 'Reboot router',
  shutdown: 'Shutdown router',
};

const findIface = (
  interfaces: InterfaceResponse[],
  name: string | undefined,
): InterfaceResponse | undefined => {
  if (!name) return undefined;
  const lower = name.toLowerCase();
  return interfaces.find((i) => i.name.toLowerCase() === lower);
};

const deriveStatus = (iface: InterfaceResponse | undefined): PortStatus => {
  if (!iface) return 'absent';
  if (iface.disabled) return 'disabled';
  return iface.running ? 'up' : 'down';
};

export function mapPorts(
  slots: PortSlot[],
  interfaces: InterfaceResponse[],
  disabledIfaceNames?: ReadonlySet<string>,
): ResolvedSlot[] {
  return slots.map((slot) => {
    if (!PORT_KINDS.includes(slot.kind)) {
      const action = POWER_ACTION[slot.kind];
      const actionTooltip = action ? ACTION_TOOLTIP[action] : undefined;
      return {
        ...slot,
        status: 'up',
        interactive: actionTooltip !== undefined,
        tooltip: actionTooltip ?? slot.label ?? slot.kind,
      };
    }
    const iface = findIface(interfaces, slot.ifaceName);
    const forcedDisabled =
      !!slot.ifaceName && !!disabledIfaceNames?.has(slot.ifaceName.toLowerCase());
    const status = forcedDisabled ? 'disabled' : deriveStatus(iface);
    const name = slot.ifaceName ?? slot.id;
    const rxLabel = iface?.rx;
    const txLabel = iface?.tx;
    const mtu = iface?.actualMtu;
    let tooltip: string;
    if (status === 'absent') {
      tooltip = `${name} · not detected`;
    } else {
      const parts = [name, STATUS_LABEL[status]];
      if (rxLabel) parts.push(`↓ ${rxLabel}`);
      if (txLabel) parts.push(`↑ ${txLabel}`);
      if (mtu) parts.push(`${mtu} MTU`);
      tooltip = parts.join(' · ');
    }
    return {
      ...slot,
      status,
      interactive: !forcedDisabled,
      tooltip,
      rxLabel,
      txLabel,
      mtu,
    };
  });
}
