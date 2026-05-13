import React from 'react';
import styles from './ProtocolTilePicker.module.scss';

export interface ProtocolTile<V extends string> {
  value: V;
  label: string;
  description: string;
  icon: React.ReactNode;
  recommended?: boolean;
}

interface Props<V extends string> {
  ariaLabel: string;
  value: V;
  tiles: Array<ProtocolTile<V>>;
  onChange: (next: V) => void;
}

export function ProtocolTilePicker<V extends string>({
  ariaLabel,
  value,
  tiles,
  onChange,
}: Props<V>) {
  return (
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
            onClick={() => onChange(tile.value)}
            className={className}
          >
            {tile.recommended ? <span className={styles.recommended}>Recommended</span> : null}
            <span className={styles.iconWrap}>{tile.icon}</span>
            <h4 className={styles.title}>{tile.label}</h4>
            <p className={styles.description}>{tile.description}</p>
          </button>
        );
      })}
    </div>
  );
}
