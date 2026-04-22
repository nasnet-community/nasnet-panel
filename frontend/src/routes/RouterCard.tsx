import { Link } from 'react-router-dom';
import { Activity, Router as RouterIcon, Trash2 } from 'lucide-react';
import { Badge, Card, CardDescription, CardTitle, Inline, Skeleton, StatusDot } from '@nasnet/ui';
import type { Router } from '../api';
import styles from './RouterListPage.module.scss';

interface Props {
  router: Router;
  isProbed: boolean;
  onOpen: (router: Router) => void;
  onRemove: (router: Router) => void;
}

export function RouterCard({ router, isProbed, onOpen, onRemove }: Props) {
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
            <Badge tone="neutral">
              <Activity size={12} aria-hidden />
              {router.model ?? router.platform}
            </Badge>
            {isProbed ? (
              <Badge tone={toneFor(router.status)}>
                <StatusDot $status={router.status} aria-hidden /> {router.status}
              </Badge>
            ) : (
              <Skeleton width={78} height={20} radius={999} />
            )}
          </Inline>
          <div className={styles.cardBottomRow}>
            <span>RouterOS {router.version ?? '—'}</span>
            <span>
              {router.lastSeen
                ? `seen ${new Date(router.lastSeen).toLocaleDateString()}`
                : 'never seen'}
            </span>
          </div>
        </Card>
      </Link>
      <button
        type="button"
        className={styles.deleteButton}
        aria-label={`Remove ${router.name}`}
        title="Remove router"
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
