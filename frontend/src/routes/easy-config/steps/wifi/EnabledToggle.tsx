import { CheckCircle2, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import styles from './EnabledToggle.module.scss';

interface Props {
  value: boolean;
  onChange: (next: boolean) => void;
}

export function EnabledToggle({ value, onChange }: Props) {
  const { t } = useTranslation('easyConfig');
  return (
    <div className={styles.group} role="group" aria-label={t('wifi.toggleAria')}>
      <button
        type="button"
        className={`${styles.option} ${!value ? `${styles.active} ${styles.activeOff}` : ''}`}
        onClick={() => onChange(false)}
        aria-pressed={!value}
      >
        <XCircle size={14} strokeWidth={2} /> {t('wifi.toggleDisabled')}
      </button>
      <button
        type="button"
        className={`${styles.option} ${value ? `${styles.active} ${styles.activeOn}` : ''}`}
        onClick={() => onChange(true)}
        aria-pressed={value}
      >
        <CheckCircle2 size={14} strokeWidth={2} /> {t('wifi.toggleEnabled')}
      </button>
    </div>
  );
}
