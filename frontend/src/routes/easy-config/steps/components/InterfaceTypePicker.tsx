import React from 'react';
import { EthernetPort, Radio, Smartphone, Wifi } from 'lucide-react';
import type { InterfaceType } from '../../state';
import styles from './InterfaceTypePicker.module.scss';

interface TileConfig {
  type: InterfaceType;
  label: string;
  icon: React.ReactNode;
}

const TILES: TileConfig[] = [
  { type: 'ethernet', label: 'Ethernet', icon: <EthernetPort size={22} strokeWidth={1.75} /> },
  { type: 'wireless', label: 'Wireless', icon: <Wifi size={22} strokeWidth={1.75} /> },
  { type: 'sfp', label: 'SFP', icon: <Radio size={22} strokeWidth={1.75} /> },
  { type: 'lte', label: 'LTE', icon: <Smartphone size={22} strokeWidth={1.75} /> },
];

interface Props {
  value: InterfaceType;
  availableTypes?: InterfaceType[];
  onChange: (next: InterfaceType) => void;
}

export function InterfaceTypePicker({ value, availableTypes, onChange }: Props) {
  const visible = availableTypes ? TILES.filter((t) => availableTypes.includes(t.type)) : TILES;

  if (visible.length === 0) return null;

  return (
    <div className={styles.grid} role="radiogroup" aria-label="Interface type">
      {visible.map((tile) => {
        const active = value === tile.type;
        const className = active ? `${styles.tile} ${styles.tileActive}` : styles.tile;
        return (
          <button
            type="button"
            key={tile.type}
            role="radio"
            aria-checked={active}
            aria-label={tile.label}
            onClick={() => onChange(tile.type)}
            className={className}
          >
            <span className={styles.iconWrap}>{tile.icon}</span>
            <span className={styles.label}>{tile.label}</span>
          </button>
        );
      })}
    </div>
  );
}
