import React from 'react';
import { Cable, Radio, Smartphone, Wifi } from 'lucide-react';
import type { InterfaceType } from '../../state';
import styles from './InterfaceTypePicker.module.scss';

interface TileConfig {
  type: InterfaceType;
  label: string;
  icon: React.ReactNode;
  available: boolean;
}

const TILES: TileConfig[] = [
  {
    type: 'ethernet',
    label: 'Ethernet',
    icon: <Cable size={22} strokeWidth={1.75} />,
    available: true,
  },
  {
    type: 'wireless',
    label: 'Wireless',
    icon: <Wifi size={22} strokeWidth={1.75} />,
    available: true,
  },
  { type: 'sfp', label: 'SFP', icon: <Radio size={22} strokeWidth={1.75} />, available: false },
  {
    type: 'lte',
    label: 'LTE',
    icon: <Smartphone size={22} strokeWidth={1.75} />,
    available: false,
  },
];

interface Props {
  value: InterfaceType;
  onChange: (next: InterfaceType) => void;
}

export function InterfaceTypePicker({ value, onChange }: Props) {
  return (
    <div className={styles.grid} role="radiogroup" aria-label="Interface type">
      {TILES.map((tile) => {
        const active = tile.available && value === tile.type;
        const className = active ? `${styles.tile} ${styles.tileActive}` : styles.tile;
        return (
          <button
            type="button"
            key={tile.type}
            role="radio"
            aria-checked={active}
            aria-label={tile.label}
            disabled={!tile.available}
            onClick={() => tile.available && onChange(tile.type)}
            className={className}
          >
            {active ? <span className={styles.dot} aria-hidden="true" /> : null}
            <span className={styles.iconWrap}>
              {tile.available ? (
                tile.icon
              ) : (
                <span className={styles.unavailable}>Not Available</span>
              )}
            </span>
            <span className={styles.label}>{tile.label}</span>
          </button>
        );
      })}
    </div>
  );
}
