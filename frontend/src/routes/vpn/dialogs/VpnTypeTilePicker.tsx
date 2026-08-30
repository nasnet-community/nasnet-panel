import React from 'react';
import styles from './VpnTypeTilePicker.module.scss';

export interface VpnTypeTile<V extends string> {
  value: V;
  label: string;
  icon: React.ReactNode;
  disabled?: boolean;
}

interface Props<V extends string> {
  ariaLabel: string;
  legend: string;
  value: V;
  tiles: Array<VpnTypeTile<V>>;
  onChange: (next: V) => void;
}

export function VpnTypeTilePicker<V extends string>({
  ariaLabel,
  legend,
  value,
  tiles,
  onChange,
}: Props<V>) {
  return (
    <div className={styles.wrap}>
      <span className={styles.legend}>{legend}</span>
      <div className={styles.grid} role="radiogroup" aria-label={ariaLabel}>
        {tiles.map((tile) => {
          const active = tile.value === value;
          const className = active ? `${styles.tile} ${styles.tileActive}` : styles.tile;
          return (
            <button
              type="button"
              key={tile.value}
              role="radio"
              aria-checked={active}
              aria-label={tile.label}
              disabled={tile.disabled}
              onClick={() => onChange(tile.value)}
              className={className}
            >
              <span className={styles.iconWrap}>{tile.icon}</span>
              <span className={styles.label}>{tile.label}</span>
              {tile.disabled ? <span className={styles.soon}>Soon</span> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
