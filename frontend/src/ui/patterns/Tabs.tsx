import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
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

const MENU_MIN_WIDTH = 180;
const VIEWPORT_MARGIN = 8;
const HOVER_CLOSE_DELAY = 140;

export const Tabs: React.FC<TabsProps> = ({ items, activeId, onChange, ariaLabel }) => {
  const [openId, setOpenId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ left: number; top: number } | null>(null);
  const groupRefs = useRef<Record<string, HTMLSpanElement | null>>({});
  const menuRef = useRef<HTMLDivElement | null>(null);
  const closeTimer = useRef<number | null>(null);
  const openedByHover = useRef(false);

  const cancelClose = useCallback(() => {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    cancelClose();
    closeTimer.current = window.setTimeout(() => setOpenId(null), HOVER_CLOSE_DELAY);
  }, [cancelClose]);

  useEffect(() => cancelClose, [cancelClose]);

  useLayoutEffect(() => {
    if (!openId) {
      setMenuPos(null);
      return;
    }
    const reposition = () => {
      const anchor = groupRefs.current[openId]?.getBoundingClientRect();
      if (!anchor) return;
      const width = Math.max(menuRef.current?.offsetWidth ?? 0, MENU_MIN_WIDTH);
      const maxLeft = window.innerWidth - width - VIEWPORT_MARGIN;
      const left = Math.max(VIEWPORT_MARGIN, Math.min(anchor.left, maxLeft)) + window.scrollX;
      const top = anchor.bottom + window.scrollY;
      setMenuPos((prev) => (prev && prev.left === left && prev.top === top ? prev : { left, top }));
    };
    reposition();
    const frame = window.requestAnimationFrame(reposition);
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', reposition, true);
      window.removeEventListener('resize', reposition);
    };
  }, [openId]);

  useEffect(() => {
    if (!openId) return;
    const handlePointer = (e: PointerEvent) => {
      const target = e.target as Node;
      if (menuRef.current?.contains(target)) return;
      if (groupRefs.current[openId]?.contains(target)) return;
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
          <span
            key={t.id}
            role="presentation"
            className={cx(styles.tabGroup, open && styles.tabGroupOpen)}
            ref={(el) => {
              groupRefs.current[t.id] = el;
            }}
            onPointerEnter={(e) => {
              if (e.pointerType !== 'mouse') return;
              cancelClose();
              if (openId !== t.id) {
                openedByHover.current = true;
                setOpenId(t.id);
              }
            }}
            onPointerLeave={(e) => {
              if (e.pointerType !== 'mouse') return;
              if (openId === t.id) scheduleClose();
            }}
          >
            {tab}
            <button
              type="button"
              className={cx(styles.menuTrigger, active && styles.menuTriggerActive)}
              aria-haspopup="menu"
              aria-expanded={open}
              aria-label={`Show ${t.label} menu`}
              onClick={() => {
                cancelClose();
                if (open && !openedByHover.current) {
                  setOpenId(null);
                  return;
                }
                openedByHover.current = false;
                setOpenId(t.id);
              }}
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
                minWidth: MENU_MIN_WIDTH,
                maxWidth: `calc(100vw - ${VIEWPORT_MARGIN * 2}px)`,
                zIndex: 1100,
              }}
              onPointerEnter={(e) => {
                if (e.pointerType !== 'mouse') return;
                cancelClose();
              }}
              onPointerLeave={(e) => {
                if (e.pointerType !== 'mouse') return;
                scheduleClose();
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
