import React from 'react';
import {
  Antenna,
  ArrowDown,
  ArrowUp,
  Cable,
  EthernetPort,
  Gauge,
  type LucideIcon,
  Network,
  PlugZap,
  RotateCw,
  Smartphone,
  Usb,
} from 'lucide-react';
import { Tooltip } from '@nasnet/ui';
import type { ResolvedSlot, SlotKind } from './types';
import { POWER_ACTION, STATUS_LABEL } from './mapPorts';
import { cx } from './utils';
import styles from './OverviewPanel.module.scss';

const ICONS: Partial<Record<SlotKind, LucideIcon>> = {
  ethernet: EthernetPort,
  usb: Usb,
  power: PlugZap,
  reset: RotateCw,
  sim: Smartphone,
  antenna: Antenna,
};

const STATUS_PORT_CLASS = {
  up: styles.up,
  disabled: styles.disabled,
  absent: styles.absent,
  down: styles.down,
} as const;

const statusClass = (slot: ResolvedSlot): string | undefined => {
  if (slot.kind !== 'ethernet' && slot.kind !== 'sfp') return undefined;
  if (slot.status === 'up') {
    if (slot.rateTone === 'degraded') return styles.rateDegraded;
    if (slot.rateTone === 'bad') return styles.rateBad;
  }
  return STATUS_PORT_CLASS[slot.status];
};

const testId = (slot: ResolvedSlot): string => {
  const action = POWER_ACTION[slot.kind];
  if (action) return `diagram-${action}`;
  return `port-${slot.ifaceName ?? slot.id}`;
};

export interface PortSlotProps {
  slot: ResolvedSlot;
  onActivate?: (slot: ResolvedSlot) => void;
}

export const PortSlot: React.FC<PortSlotProps> = ({ slot, onActivate }) => {
  const Icon = ICONS[slot.kind] ?? Cable;
  const isSfp = slot.kind === 'sfp';
  const isPort = slot.kind === 'ethernet' || slot.kind === 'sfp';

  const socket = (
    <span className={cx(styles.socket, isSfp && styles.sfpBox, statusClass(slot))} aria-hidden>
      {isSfp ? (slot.label ?? 'SFP') : <Icon size={20} />}
    </span>
  );

  if (isPort) {
    return (
      <span className={styles.hoverWrap}>
        <button
          type="button"
          className={cx(styles.slot, styles.interactive, slot.badge === 'poe' && styles.poe)}
          data-testid={testId(slot)}
          data-status={slot.status}
          aria-label={slot.tooltip}
          onClick={() => onActivate?.(slot)}
        >
          {socket}
          <span className={styles.slotLabel}>{slot.label ?? slot.ifaceName}</span>
        </button>
        <span className={styles.hoverCard} aria-hidden>
          <span className={styles.hoverRow}>
            <Network size={13} aria-hidden />
            {slot.ifaceName ?? slot.id}
          </span>
          <span className={styles.hoverRow}>
            <Gauge size={13} aria-hidden />
            {STATUS_LABEL[slot.status]}
            {slot.mtu ? ` · ${slot.mtu} MTU` : ''}
          </span>
          {slot.rxLabel ? (
            <span className={cx(styles.hoverRow, styles.rxRow)}>
              <ArrowDown size={13} aria-hidden />
              {slot.rxLabel}
            </span>
          ) : null}
          {slot.txLabel ? (
            <span className={cx(styles.hoverRow, styles.txRow)}>
              <ArrowUp size={13} aria-hidden />
              {slot.txLabel}
            </span>
          ) : null}
        </span>
      </span>
    );
  }

  if (slot.interactive) {
    return (
      <Tooltip label={slot.tooltip} placement="bottom">
        <button
          type="button"
          className={cx(
            styles.slot,
            styles.interactive,
            slot.kind === 'reset' && styles.actionReboot,
            slot.kind === 'power' && styles.actionShutdown,
          )}
          data-testid={testId(slot)}
          data-status={slot.status}
          aria-label={slot.tooltip}
          onClick={() => onActivate?.(slot)}
        >
          {socket}
          <span className={styles.slotLabel}>{slot.label ?? slot.kind}</span>
        </button>
      </Tooltip>
    );
  }

  return (
    <span className={styles.slot}>
      {socket}
      <span className={styles.slotLabel}>{slot.label ?? slot.kind}</span>
    </span>
  );
};
