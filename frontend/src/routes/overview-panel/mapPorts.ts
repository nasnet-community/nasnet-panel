import type { InterfaceResponse } from '../../api';
import type { TFunction } from 'i18next';
import type { IfaceLink, PortSlot, PortStatus, RateTone, ResolvedSlot, SlotKind } from './types';

const PORT_KINDS: SlotKind[] = ['ethernet', 'sfp'];

export type PowerAction = 'reboot' | 'shutdown';

export const POWER_ACTION: Partial<Record<SlotKind, PowerAction>> = {
  reset: 'reboot',
  power: 'shutdown',
};

type OverviewT = TFunction<'overview'>;

export const statusLabel = (status: PortStatus, t: OverviewT): string =>
  t(`ports.status.${status}`);

const actionTooltip = (action: PowerAction, t: OverviewT): string =>
  t(action === 'reboot' ? 'ports.rebootRouter' : 'ports.shutdownRouter');

const findIface = (
  interfaces: InterfaceResponse[],
  name: string | undefined,
): InterfaceResponse | undefined => {
  if (!name) return undefined;
  const lower = name.toLowerCase();
  return interfaces.find((i) => i.name.toLowerCase() === lower);
};

const speedToMbps = (value: string | undefined): number | undefined => {
  if (!value) return undefined;
  const match = /^([\d.]+)\s*(m|g)/i.exec(value.trim());
  if (!match) return undefined;
  const num = Number.parseFloat(match[1]);
  if (Number.isNaN(num)) return undefined;
  return match[2].toLowerCase() === 'g' ? num * 1000 : num;
};

const deriveRateTone = (
  rate: string | undefined,
  nominalSpeed: string | undefined,
): RateTone | undefined => {
  const actual = speedToMbps(rate);
  const nominal = speedToMbps(nominalSpeed);
  if (actual === undefined || nominal === undefined) return undefined;
  if (actual >= nominal) return 'ok';
  return actual >= nominal / 10 ? 'degraded' : 'bad';
};

const formatLinkSpeed = (link: IfaceLink | undefined, t: OverviewT): string | undefined => {
  if (!link) return undefined;
  if (link.fullDuplex === undefined) return link.rate;
  return t(link.fullDuplex ? 'ports.duplexFull' : 'ports.duplexHalf', { rate: link.rate });
};

const deriveStatus = (iface: InterfaceResponse | undefined): PortStatus => {
  if (!iface) return 'absent';
  if (iface.disabled) return 'disabled';
  return iface.running ? 'up' : 'down';
};

export function mapPorts(
  slots: PortSlot[],
  interfaces: InterfaceResponse[],
  ifaceRates: Readonly<Record<string, IfaceLink>> | undefined,
  t: OverviewT,
): ResolvedSlot[] {
  return slots.map((slot) => {
    if (!PORT_KINDS.includes(slot.kind)) {
      const action = POWER_ACTION[slot.kind];
      const tooltip = action ? actionTooltip(action, t) : undefined;
      return {
        ...slot,
        status: 'up',
        interactive: tooltip !== undefined,
        tooltip: tooltip ?? slot.label ?? slot.kind,
      };
    }
    const iface = findIface(interfaces, slot.ifaceName);
    const status = deriveStatus(iface);
    const name = slot.ifaceName ?? slot.id;
    const rxLabel = iface?.rx;
    const txLabel = iface?.tx;
    const mtu = iface?.actualMtu;
    const link = status === 'up' ? ifaceRates?.[name.toLowerCase()] : undefined;
    const rate = link?.rate;
    const linkSpeed = formatLinkSpeed(link, t);
    const rateTone = deriveRateTone(rate, slot.nominalSpeed);
    let tooltip: string;
    if (status === 'absent') {
      tooltip = `${name} · ${statusLabel('absent', t)}`;
    } else {
      const parts = [name, statusLabel(status, t)];
      if (linkSpeed) parts.push(linkSpeed);
      if (rxLabel) parts.push(`↓ ${rxLabel}`);
      if (txLabel) parts.push(`↑ ${txLabel}`);
      if (mtu) parts.push(`${mtu} MTU`);
      tooltip = parts.join(' · ');
    }
    return {
      ...slot,
      status,
      interactive: true,
      tooltip,
      rxLabel,
      txLabel,
      mtu,
      rate,
      linkSpeed,
      rateTone,
    };
  });
}
