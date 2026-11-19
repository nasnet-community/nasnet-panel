import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BellOff, CheckCheck } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  PageActions,
  PageHeader,
  PageShell,
  PageSubtitle,
  PageTitle,
  Skeleton,
  useToast,
} from '@nasnet/ui';
import { RouterTabBar } from '../layout/RouterTabBar';
import { useNotifications } from '../state/NotificationsContext';
import { useFormat } from '../utils/useFormat';
import styles from './NotificationsPage.module.scss';

export function NotificationsPage() {
  const { notifications, unreadCount, available, markRead, markAllRead } = useNotifications();
  const { t } = useTranslation('tools');
  const format = useFormat();
  const toast = useToast();
  const [markingAll, setMarkingAll] = useState(false);

  const loading = available && notifications === null;
  const rows = notifications ?? [];

  const markOne = async (id: string) => {
    if (!(await markRead(id)))
      toast.notify({ title: t('notifications.markFailed'), tone: 'danger' });
  };

  const markEverything = async () => {
    setMarkingAll(true);
    const ok = await markAllRead();
    setMarkingAll(false);
    if (!ok) toast.notify({ title: t('notifications.markFailed'), tone: 'danger' });
  };

  return (
    <>
      <RouterTabBar />
      <PageShell>
        <PageHeader>
          <div>
            <PageTitle>{t('notifications.title')}</PageTitle>
            <PageSubtitle>{t('notifications.subtitle')}</PageSubtitle>
          </div>
          <PageActions>
            <Button
              variant="secondary"
              onClick={() => {
                void markEverything();
              }}
              disabled={unreadCount === 0 || markingAll}
              loading={markingAll}
            >
              <CheckCheck size={16} aria-hidden /> {t('notifications.markAllRead')}
            </Button>
          </PageActions>
        </PageHeader>

        <Card data-testid="notifications-card">
          {loading ? (
            <div className={styles.skeleton} aria-busy aria-label={t('notifications.loading')}>
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className={styles.skeletonRow}>
                  <Skeleton width="40%" height={14} />
                  <Skeleton height={12} />
                </div>
              ))}
            </div>
          ) : rows.length === 0 ? (
            <EmptyState
              icon={<BellOff size={28} aria-hidden className={styles.emptyIcon} />}
              title={t('notifications.empty')}
              description={t('notifications.emptyDescription')}
            />
          ) : (
            <ul className={styles.list}>
              {rows.map((n) => (
                <li key={n.id} className={styles.row} data-testid="notification-row">
                  <div className={styles.body}>
                    <span className={n.read ? styles.title : styles.titleUnread}>
                      {!n.read ? <span className={styles.unreadDot} aria-hidden /> : null}
                      <span dir="auto">{n.title}</span>
                      {!n.read ? (
                        <Badge tone="success" className={styles.newBadge}>
                          {t('notifications.new')}
                        </Badge>
                      ) : null}
                    </span>
                    {n.message ? (
                      <p className={styles.message} dir="auto">
                        {n.message}
                      </p>
                    ) : null}
                    {Number.isNaN(Date.parse(n.createdAt)) ? null : (
                      <time className={styles.time} dateTime={n.createdAt}>
                        {format.dateTime(n.createdAt, { dateStyle: 'medium', timeStyle: 'short' })}
                      </time>
                    )}
                  </div>
                  {!n.read ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      className={styles.markButton}
                      onClick={() => {
                        void markOne(n.id);
                      }}
                    >
                      {t('notifications.markRead')}
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </PageShell>
    </>
  );
}
