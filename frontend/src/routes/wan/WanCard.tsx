import { Badge, Button } from '@nasnet/ui';
import styles from './WanPage.module.scss';

interface Props {
  title: string;
  meta: string;
  enabled: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export function WanCard({ title, meta, enabled, onEdit, onDelete }: Props) {
  return (
    <div className={styles.card}>
      <div className={styles.cardHead}>
        <span className={styles.cardTitle}>{title}</span>
        <Badge tone={enabled ? 'success' : 'neutral'}>{enabled ? 'Enabled' : 'Disabled'}</Badge>
      </div>
      <span className={styles.cardMeta}>{meta}</span>
      <div className={styles.cardActions}>
        <Button variant="secondary" onClick={onEdit} aria-label={`edit ${title}`}>
          Edit
        </Button>
        <Button variant="ghost" onClick={onDelete} aria-label={`delete ${title}`}>
          Delete
        </Button>
      </div>
    </div>
  );
}
