import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bell, BellOff } from 'lucide-react';
import { Skeleton } from '@nasnet/ui';
import { useNotifications } from '../state/NotificationsContext';
import { useFormat } from '../utils/useFormat';
import styles from './NotificationsBell.module.scss';

const PREVIEW_COUNT = 5;

const cx = (...parts: Array<string | undefined | false>) => parts.filter(Boolean).join(' ');

export function NotificationsBell() {
  const { notifications, unreadCount, available, markRead } = useNotifications();
  const { t } = useTranslation('tools');
  const format = useFormat();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [panelTop, setPanelTop] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const handlePointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
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

  if (!available) return null;

  const toggle = () => {
    // On phones the panel spans the screen below the header instead of hanging off the bell.
    setPanelTop((triggerRef.current?.getBoundingClientRect().bottom ?? 0) + 6);
    setOpen((v) => !v);
  };

  const preview = notifications?.slice(0, PREVIEW_COUNT);
  const badge = unreadCount > 9 ? `${format.number(9)}+` : format.number(unreadCount);

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={
          unreadCount > 0
            ? t('notifications.bellUnread', { count: format.number(unreadCount) })
            : t('notifications.bell')
        }
        title={t('notifications.bell')}
        onClick={toggle}
      >
        <Bell size={18} aria-hidden />
        {unreadCount > 0 ? (
          <span className={styles.count} aria-hidden data-testid="notifications-unread-count">
            {badge}
          </span>
        ) : null}
      </button>
      {open ? (
        <div
          className={styles.panel}
          style={{ '--panel-top': `${panelTop}px` } as CSSProperties}
          data-testid="notifications-panel"
        >
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>{t('notifications.title')}</span>
            {unreadCount > 0 ? (
              <span className={styles.panelMeta}>
                {t('notifications.unread', { count: format.number(unreadCount) })}
              </span>
            ) : null}
          </div>
          {!preview ? (
            <div className={styles.loading} aria-busy aria-label={t('notifications.loading')}>
              {Array.from({ length: 3 }, (_, i) => (
                <div key={i} className={styles.loadingRow}>
                  <Skeleton width="60%" height={12} />
                  <Skeleton height={10} />
                </div>
              ))}
            </div>
          ) : preview.length === 0 ? (
            <div className={styles.empty}>
              <BellOff size={22} aria-hidden />
              <span>{t('notifications.empty')}</span>
            </div>
          ) : (
            <ul className={styles.list}>
              {preview.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    className={cx(styles.item, !n.read && styles.itemUnread)}
                    onClick={() => {
                      setOpen(false);
                      if (!n.read) void markRead(n.id);
                      navigate('/notifications');
                    }}
                  >
                    <span className={styles.itemHead}>
                      {!n.read ? <span className={styles.unreadDot} aria-hidden /> : null}
                      <span className={styles.itemTitle} dir="auto">
                        {n.title}
                      </span>
                    </span>
                    {n.message ? (
                      <span className={styles.itemMessage} dir="auto">
                        {n.message}
                      </span>
                    ) : null}
                    {Number.isNaN(Date.parse(n.createdAt)) ? null : (
                      <time className={styles.itemTime} dateTime={n.createdAt}>
                        {format.dateTime(n.createdAt, { dateStyle: 'medium', timeStyle: 'short' })}
                      </time>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <Link to="/notifications" className={styles.viewAll} onClick={() => setOpen(false)}>
            {t('notifications.viewAll')}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
