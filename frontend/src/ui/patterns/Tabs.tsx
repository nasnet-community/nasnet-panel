import React from 'react';
import styles from './Tabs.module.scss';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  ariaLabel?: string;
}

const cx = (...parts: Array<string | undefined | false>) => parts.filter(Boolean).join(' ');

export const Tabs: React.FC<TabsProps> = ({ items, activeId, onChange, ariaLabel }) => (
  <div className={styles.list} role="tablist" aria-label={ariaLabel}>
    {items.map((t) => {
      const active = activeId === t.id;
      return (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={active}
          aria-disabled={t.disabled || undefined}
          disabled={t.disabled}
          className={cx(styles.tab, active && styles.tabActive, t.disabled && styles.tabDisabled)}
          onClick={() => {
            if (t.disabled) return;
            onChange(t.id);
          }}
        >
          {t.icon ? <span aria-hidden>{t.icon}</span> : null}
          {t.label}
        </button>
      );
    })}
  </div>
);
