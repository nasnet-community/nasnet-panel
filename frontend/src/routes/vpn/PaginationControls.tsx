import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@nasnet/ui';
import { useFormat } from '../../utils/useFormat';
import styles from '../VPNPage.module.scss';

export interface PaginationControlsProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPrev: () => void;
  onNext: () => void;
}

export function PaginationControls({
  page,
  totalPages,
  total,
  pageSize,
  onPrev,
  onNext,
}: PaginationControlsProps) {
  const { t } = useTranslation('vpn');
  const format = useFormat();
  if (total <= pageSize) return null;
  return (
    <div className={styles.pagination}>
      <span className={styles.paginationInfo}>
        {t('pagination.showing', {
          from: format.number((page - 1) * pageSize + 1),
          to: format.number(Math.min(page * pageSize, total)),
          total: format.number(total),
        })}
      </span>
      <div className={styles.paginationControls}>
        <Button
          size="sm"
          variant="secondary"
          onClick={onPrev}
          disabled={page <= 1}
          aria-label={t('pagination.previousPage')}
        >
          <ChevronLeft size={14} aria-hidden className="rtl-flip" /> {t('pagination.prev')}
        </Button>
        <span className={styles.paginationPage}>
          {t('pagination.page', { page: format.number(page), total: format.number(totalPages) })}
        </span>
        <Button
          size="sm"
          variant="secondary"
          onClick={onNext}
          disabled={page >= totalPages}
          aria-label={t('pagination.nextPage')}
        >
          {t('pagination.next')} <ChevronRight size={14} aria-hidden className="rtl-flip" />
        </Button>
      </div>
    </div>
  );
}
