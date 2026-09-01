import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';
import styles from './Tabs.module.scss';

export interface TabMenuItem {
  id: string;
  label: string;
  href: string;
}

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  menu?: TabMenuItem[];
}

export interface TabsProps {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  ariaLabel?: string;
}

const cx = (...parts: Array<string | undefined | false>) => parts.filter(Boolean).join(' ');

export const Tabs: React.FC<TabsProps> = ({ items, activeId, onChange, ariaLabel }) => {
  const [openId, setOpenId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ left: number; top: number; minWidth: number } | null>(
    null,
  );
  const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const menuRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    if (!openId) {
      setMenuPos(null);
      return;
    }
    const reposition = () => {
      const r = triggerRefs.current[openId]?.getBoundingClientRect();
      if (r) {
        setMenuPos({
          left: r.right + window.scrollX,
          top: r.bottom + window.scrollY + 4,
          minWidth: 180,
        });
      }
    };
    reposition();
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
    return () => {
      window.removeEventListener('scroll', reposition, true);
      window.removeEventListener('resize', reposition);
    };
  }, [openId]);

  useEffect(() => {
    if (!openId) return;
    const handlePointer = (e: PointerEvent) => {
      const target = e.target as Node;
      if (menuRef.current?.contains(target)) return;
      if (triggerRefs.current[openId]?.contains(target)) return;
      setOpenId(null);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenId(null);
    };
    document.addEventListener('pointerdown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('pointerdown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [openId]);

  const openItem = items.find((t) => t.id === openId);

  return (
    <div className={styles.list} role="tablist" aria-label={ariaLabel}>
      {items.map((t) => {
        const active = activeId === t.id;
        const hasMenu = Boolean(t.menu?.length);
        const tab = (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={active}
            aria-disabled={t.disabled || undefined}
            disabled={t.disabled}
            className={cx(
              styles.tab,
              active && styles.tabActive,
              t.disabled && styles.tabDisabled,
              hasMenu && styles.tabWithMenu,
            )}
            onClick={() => {
              if (t.disabled) return;
              onChange(t.id);
            }}
          >
            {t.icon ? <span aria-hidden>{t.icon}</span> : null}
            {t.label}
          </button>
        );
        if (!hasMenu) return tab;
        const open = openId === t.id;
        return (
          <span key={t.id} role="presentation" className={styles.tabGroup}>
            {tab}
            <button
              type="button"
              ref={(el) => {
                triggerRefs.current[t.id] = el;
              }}
              className={cx(styles.menuTrigger, active && styles.menuTriggerActive)}
              aria-haspopup="menu"
              aria-expanded={open}
              aria-label={`Show ${t.label} menu`}
              onClick={() => setOpenId(open ? null : t.id)}
            >
              <ChevronDown
                size={14}
                aria-hidden
                className={open ? styles.chevronOpen : undefined}
              />
            </button>
          </span>
        );
      })}
      {openItem && menuPos
        ? createPortal(
            <div
              ref={menuRef}
              role="menu"
              aria-label={openItem.label}
              className={styles.menu}
              style={{
                position: 'absolute',
                left: menuPos.left,
                top: menuPos.top,
                minWidth: menuPos.minWidth,
                transform: 'translateX(-100%)',
                zIndex: 1100,
              }}
            >
              {openItem.menu?.map((m) => (
                <a
                  key={m.id}
                  role="menuitem"
                  href={m.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.menuItem}
                  onClick={() => setOpenId(null)}
                >
                  {m.label}
                </a>
              ))}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
};
