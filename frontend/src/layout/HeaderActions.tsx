import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bell, ChevronDown, KeyRound, LogOut, Menu, Moon, Sun } from 'lucide-react';
import { useAppTheme } from '../state/ThemeContext';
import { ChangePasswordDialog } from './ChangePasswordDialog';
import { LanguageSwitcher } from './LanguageSwitcher';
import type { RouterSection } from './routerSections';
import styles from './HeaderActions.module.scss';

export interface HeaderActionsProps {
  routerName?: string;
  routerId?: string;
  sections?: RouterSection[];
  activeSectionId?: string;
}

const cx = (...parts: Array<string | undefined | false>) => parts.filter(Boolean).join(' ');

export function HeaderActions({
  routerName,
  routerId,
  sections,
  activeSectionId,
}: HeaderActionsProps) {
  const { preference, resolved, setPreference } = useAppTheme();
  const navigate = useNavigate();
  const { t } = useTranslation('layout');
  const location = useLocation();
  const hideSessionActions = location.pathname === '/' || location.pathname === '/routers/new';
  const [open, setOpen] = useState(false);
  const [expandedSectionId, setExpandedSectionId] = useState<string | null>(null);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
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

  useEffect(() => {
    if (!open) setExpandedSectionId(null);
  }, [open]);

  const isLight = preference === 'light' || (preference === 'system' && resolved === 'light');

  const goAndClose = (path: string) => () => {
    setOpen(false);
    navigate(path);
  };

  if (hideSessionActions) {
    return (
      <div className={styles.landingActions}>
        <LanguageSwitcher compact />
        <button
          type="button"
          className={cx(styles.themeIconButton, !isLight && styles.themeIconButtonOff)}
          aria-label={isLight ? t('theme.lightOn') : t('theme.lightOff')}
          aria-pressed={isLight}
          title={isLight ? t('theme.switchToDark') : t('theme.switchToLight')}
          onClick={() => setPreference(isLight ? 'dark' : 'light')}
        >
          <Sun size={16} aria-hidden />
        </button>
      </div>
    );
  }

  return (
    <div className={styles.menuRoot} ref={menuRef}>
      <button
        type="button"
        className={styles.menuTrigger}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t('menu.open')}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={styles.triggerDesktop}>
          {routerName ? (
            <>
              <span className={styles.onlineDot} aria-label={t('menu.online')} role="status" />
              <span className={styles.routerName}>{routerName}</span>
            </>
          ) : null}
          <ChevronDown size={14} aria-hidden className={open ? styles.chevronOpen : undefined} />
        </span>
        <Menu size={20} aria-hidden className={styles.triggerMobile} />
      </button>
      {open ? (
        <div className={styles.menuPanel} role="menu">
          {sections && routerId ? (
            <div className={styles.sectionsMobile}>
              {sections.map((s) => {
                const item = (
                  <button
                    key={s.id}
                    type="button"
                    role="menuitem"
                    disabled={s.disabled}
                    className={cx(
                      styles.menuItem,
                      s.id === activeSectionId && styles.menuItemActive,
                    )}
                    onClick={goAndClose(`/router/${routerId}${s.path ? `/${s.path}` : ''}`)}
                  >
                    {s.icon}
                    <span>{s.label}</span>
                  </button>
                );
                if (!s.menu?.length) return item;
                const expanded = expandedSectionId === s.id;
                return (
                  <div key={s.id} role="presentation" className={styles.sectionGroup}>
                    <div role="presentation" className={styles.sectionRow}>
                      {item}
                      <button
                        type="button"
                        className={styles.subMenuToggle}
                        aria-expanded={expanded}
                        aria-label={t('menu.showSubmenu', { label: s.label })}
                        onClick={() => setExpandedSectionId(expanded ? null : s.id)}
                      >
                        <ChevronDown
                          size={16}
                          aria-hidden
                          className={expanded ? styles.chevronOpen : undefined}
                        />
                      </button>
                    </div>
                    {expanded ? (
                      <div role="presentation" className={styles.subMenu}>
                        {s.menu.map((m) => (
                          <a
                            key={m.id}
                            role="menuitem"
                            href={m.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.subMenuItem}
                            onClick={() => setOpen(false)}
                          >
                            {m.label}
                          </a>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
              <div className={styles.menuDivider} role="separator" />
            </div>
          ) : null}
          <div className={styles.themeRow}>
            <button
              type="button"
              className={cx(styles.themeLabel, !isLight && styles.themeLabelActive)}
              onClick={() => setPreference('dark')}
            >
              <Moon size={14} aria-hidden />
              <span>{t('theme.dark')}</span>
            </button>
            <button
              type="button"
              role="switch"
              aria-checked={isLight}
              aria-label={t('theme.toggle')}
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
              <span>{t('theme.light')}</span>
            </button>
          </div>
          <div className={styles.menuDivider} role="separator" />
          <LanguageSwitcher />
          <div className={styles.menuDivider} role="separator" />
          <button
            type="button"
            role="menuitem"
            className={styles.menuItem}
            onClick={goAndClose('/updates')}
          >
            <Bell size={16} aria-hidden />
            <span>{t('menu.updates')}</span>
          </button>
          <button
            type="button"
            role="menuitem"
            className={styles.menuItem}
            onClick={() => {
              setOpen(false);
              setPasswordDialogOpen(true);
            }}
          >
            <KeyRound size={16} aria-hidden />
            <span>{t('menu.changePassword')}</span>
          </button>
          <button
            type="button"
            role="menuitem"
            className={styles.menuItem}
            onClick={goAndClose('/')}
          >
            <LogOut size={16} aria-hidden />
            <span>{t('menu.logout')}</span>
          </button>
        </div>
      ) : null}
      <ChangePasswordDialog
        open={passwordDialogOpen}
        onClose={() => setPasswordDialogOpen(false)}
      />
    </div>
  );
}
