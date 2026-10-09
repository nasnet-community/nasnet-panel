import { Check, Pencil, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import styles from '../../../EasyConfigWizard.module.scss';

interface Props {
  editing: boolean;
  edited: boolean;
  applied: boolean;
  onStartEdit: () => void;
  onDone: () => void;
  onReset: () => void;
}

export function EditToolbar({ editing, edited, applied, onStartEdit, onDone, onReset }: Props) {
  const { t } = useTranslation('easyConfig');
  if (!editing) {
    return (
      <div className={styles.editActions}>
        <button
          type="button"
          className={styles.iconButton}
          onClick={onStartEdit}
          disabled={applied}
          aria-label={t('review.editScript')}
          title={t('review.editScript')}
        >
          <Pencil size={16} />
        </button>
      </div>
    );
  }
  return (
    <div className={styles.editActions}>
      {edited ? (
        <button
          type="button"
          className={styles.iconButton}
          onClick={onReset}
          aria-label={t('review.resetAria')}
          title={t('review.resetTitle')}
        >
          <RotateCcw size={16} />
        </button>
      ) : null}
      <button
        type="button"
        className={styles.iconButton}
        onClick={onDone}
        aria-label={t('review.doneEditing')}
        title={t('review.doneEditing')}
      >
        <Check size={16} />
      </button>
    </div>
  );
}
