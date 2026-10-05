import { Link } from 'react-router-dom';
import { Globe, Router as RouterIcon, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { Badge, Card, CardDescription, CardTitle, Inline, Skeleton, StatusDot } from '@nasnet/ui';
import type { Router } from '../api';
import { useFormat } from '../utils/useFormat';
import styles from './RouterListPage.module.scss';

interface Props {
  router: Router;
  isProbed: boolean;
  onOpen: (router: Router) => void;
  onRemove: (router: Router) => void;
}

export function RouterCard({ router, isProbed, onOpen, onRemove }: Props) {
  const { t } = useTranslation('routerList');
  const format = useFormat();
  return (
    <div className={styles.routerCardWrap}>
      <Link
        to={`/router/${router.id}`}
        aria-label={router.name}
        className={styles.routerLink}
        onClick={(e) => {
          e.preventDefault();
          onOpen(router);
        }}
      >
        <Card className={styles.routerCard}>
          <div className={styles.header}>
            <div className={styles.iconPlate} aria-hidden>
              <RouterIcon size={22} />
            </div>
            <div>
              <CardTitle>{router.name}</CardTitle>
              <CardDescription>{router.host}</CardDescription>
            </div>
          </div>
          <Inline>
            {router.hostname || isProbed ? (
              <Badge tone="neutral" className={styles.hostnameBadge}>
                <Globe size={12} aria-hidden />
                {router.hostname ?? '—'}
              </Badge>
            ) : (
              <Skeleton width={140} height={20} radius={999} />
            )}
          </Inline>
          <div className={styles.cardBottomRow}>
            {isProbed ? (
              <Badge tone={toneFor(router.status)}>
                <StatusDot $status={router.status} aria-hidden /> {statusLabel(t, router.status)}
              </Badge>
            ) : (
              <Skeleton width={78} height={20} radius={999} />
            )}
            <span>
              {router.lastSeen
                ? t('card.seen', { date: format.date(router.lastSeen) })
                : t('card.neverSeen')}
            </span>
          </div>
        </Card>
      </Link>
      <button
        type="button"
        className={styles.deleteButton}
        aria-label={t('card.removeAriaLabel', { name: router.name })}
        title={t('card.removeTitle')}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onRemove(router);
        }}
      >
        <Trash2 size={16} aria-hidden />
      </button>
    </div>
  );
}

// Known statuses get a translated label; anything else the API sends is shown as-is.
const statusLabel = (t: TFunction<'routerList'>, status: string) => {
  switch (status) {
    case 'online':
      return t('card.status.online');
    case 'offline':
      return t('card.status.offline');
    case 'degraded':
      return t('card.status.degraded');
    case 'unknown':
      return t('card.status.unknown');
    default:
      return status;
  }
};

const toneFor = (status: string) => {
  switch (status) {
    case 'online':
      return 'success' as const;
    case 'offline':
      return 'danger' as const;
    case 'degraded':
      return 'warning' as const;
    default:
      return 'neutral' as const;
  }
};
