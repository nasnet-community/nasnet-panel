import React from 'react';
import { EthernetPort, Radio, Smartphone, Wifi } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { InterfaceType } from '../../state';
import styles from './InterfaceTypePicker.module.scss';

interface TileConfig {
  type: InterfaceType;
  icon: React.ReactNode;
}

// Labels come from `wan.types.<type>` at render.
const TILES: TileConfig[] = [
  { type: 'ethernet', icon: <EthernetPort size={22} strokeWidth={1.75} /> },
  { type: 'wireless', icon: <Wifi size={22} strokeWidth={1.75} /> },
  { type: 'sfp', icon: <Radio size={22} strokeWidth={1.75} /> },
  { type: 'lte', icon: <Smartphone size={22} strokeWidth={1.75} /> },
];

interface Props {
  value: InterfaceType;
  availableTypes?: InterfaceType[];
  onChange: (next: InterfaceType) => void;
}

export function InterfaceTypePicker({ value, availableTypes, onChange }: Props) {
  const { t } = useTranslation('easyConfig');
  const visible = availableTypes
    ? TILES.filter((tile) => availableTypes.includes(tile.type))
    : TILES;

  if (visible.length === 0) return null;

  return (
    <div className={styles.grid} role="radiogroup" aria-label={t('wan.interfaceType')}>
      {visible.map((tile) => {
        const active = value === tile.type;
        const label = t(`wan.types.${tile.type}`);
        const className = active ? `${styles.tile} ${styles.tileActive}` : styles.tile;
        return (
          <button
            type="button"
            key={tile.type}
            role="radio"
            aria-checked={active}
            aria-label={label}
            onClick={() => onChange(tile.type)}
            className={className}
          >
            <span className={styles.iconWrap}>{tile.icon}</span>
            <span className={styles.label}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
