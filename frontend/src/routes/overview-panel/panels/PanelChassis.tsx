import React, { useMemo } from 'react';
import { PortSlot } from '../PortSlot';
import type { FormFactor, PanelProps } from '../types';
import { cx } from '../utils';
import styles from '../OverviewPanel.module.scss';

const FORM_CLASS: Record<FormFactor, string> = {
  rackmount: styles.formRackmount,
  tower: styles.formTower,
  desktop: styles.formDesktop,
};

export const PanelChassis: React.FC<PanelProps> = ({ descriptor, slots, onSlotActivate, bare }) => {
  const rows = useMemo(() => {
    const byRow = new Map<number, typeof slots>();
    for (const slot of slots) {
      const list = byRow.get(slot.row) ?? [];
      list.push(slot);
      byRow.set(slot.row, list);
    }
    return [...byRow.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([, list]) => [...list].sort((a, b) => a.col - b.col));
  }, [slots]);

  return (
    <div className={styles.chassisScroll}>
      <div
        className={cx(styles.chassis, bare ? styles.chassisBare : FORM_CLASS[descriptor.form])}
        role="img"
        aria-label={`${descriptor.displayName} rear panel`}
      >
        {rows.map((row, index) => (
          <div className={styles.row} key={row[0]?.id ?? `row-${index}`}>
            {row.map((slot) => (
              <PortSlot key={slot.id} slot={slot} onActivate={onSlotActivate} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
