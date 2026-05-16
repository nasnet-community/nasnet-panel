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

export const formatMbps = (n: number): string => `${n.toFixed(2)} Mb/s`;

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

export function mapPorts(slots: PortSlot[], interfaces: InterfaceResponse[]): ResolvedSlot[] {
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
    const status = deriveStatus(iface);
    const speedLabel = iface?.speed || slot.nominalSpeed;
    const name = slot.ifaceName ?? slot.id;
    const hasTraffic =
      status === 'up' && (iface?.rxMbps !== undefined || iface?.txMbps !== undefined);
    const traffic = hasTraffic
      ? ` · ↓ ${formatMbps(iface?.rxMbps ?? 0)} ↑ ${formatMbps(iface?.txMbps ?? 0)}`
      : '';
    const tooltip =
      status === 'absent'
        ? `${name} · not detected`
        : `${name} · ${speedLabel ?? '—'} · ${STATUS_LABEL[status]}${traffic}`;
    return {
      ...slot,
      status,
      speedLabel,
      interactive: true,
      tooltip,
      rxMbps: status === 'up' ? iface?.rxMbps : undefined,
      txMbps: status === 'up' ? iface?.txMbps : undefined,
    };
  });
}
