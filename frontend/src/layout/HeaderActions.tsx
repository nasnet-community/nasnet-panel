import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, LogOut, Moon, Sun } from 'lucide-react';
import { useAppTheme } from '../state/ThemeContext';
import styles from './HeaderActions.module.scss';

export interface HeaderActionsProps {
  routerName?: string;
}

const cx = (...parts: Array<string | undefined | false>) => parts.filter(Boolean).join(' ');

export function HeaderActions({ routerName }: HeaderActionsProps) {
  const { preference, resolved, setPreference } = useAppTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const hideSessionActions = location.pathname === '/' || location.pathname === '/routers/new';
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handlePointer = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('pointerdown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const isLight = preference === 'light' || (preference === 'system' && resolved === 'light');

  const goAndClose = (path: string) => () => {
    setOpen(false);
    navigate(path);
  };

  if (hideSessionActions) {
    return (
      <button
        type="button"
        className={cx(styles.themeIconButton, !isLight && styles.themeIconButtonOff)}
        aria-label={isLight ? 'Light mode on' : 'Light mode off'}
        aria-pressed={isLight}
        title={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
        onClick={() => setPreference(isLight ? 'dark' : 'light')}
      >
        <Sun size={16} aria-hidden />
      </button>
    );
  }

  return (
    <div className={styles.menuRoot} ref={menuRef}>
      <button
        type="button"
        className={styles.menuTrigger}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={routerName ? undefined : 'Open menu'}
        onClick={() => setOpen((v) => !v)}
      >
        {routerName ? (
          <>
            <span className={styles.onlineDot} aria-label="Online" role="status" />
            <span className={styles.routerName}>{routerName}</span>
          </>
        ) : null}
        <ChevronDown size={14} aria-hidden className={open ? styles.chevronOpen : undefined} />
      </button>
      {open ? (
        <div className={styles.menuPanel} role="menu">
          <div className={styles.themeRow}>
            <button
              type="button"
              className={cx(styles.themeLabel, !isLight && styles.themeLabelActive)}
              onClick={() => setPreference('dark')}
            >
              <Moon size={14} aria-hidden />
              <span>Dark</span>
            </button>
            <button
              type="button"
              role="switch"
              aria-checked={isLight}
              aria-label="Toggle light mode"
              className={cx(styles.themeSwitch, isLight && styles.themeSwitchOn)}
              onClick={() => setPreference(isLight ? 'dark' : 'light')}
            >
              <span className={styles.themeSwitchThumb} aria-hidden />
            </button>
            <button
              type="button"
              className={cx(styles.themeLabel, isLight && styles.themeLabelActive)}
              onClick={() => setPreference('light')}
            >
              <Sun size={14} aria-hidden />
              <span>Light</span>
            </button>
          </div>
          <div className={styles.menuDivider} role="separator" />
          <button
            type="button"
            role="menuitem"
            className={styles.menuItem}
            onClick={goAndClose('/updates')}
          >
            <Bell size={16} aria-hidden />
            <span>Updates &amp; notifications</span>
          </button>
          <button
            type="button"
            role="menuitem"
            className={styles.menuItem}
            onClick={goAndClose('/')}
          >
            <LogOut size={16} aria-hidden />
            <span>Logout</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
