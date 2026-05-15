import { CheckCircle2, XCircle } from 'lucide-react';
import styles from './EnabledToggle.module.scss';

interface Props {
  value: boolean;
  onChange: (next: boolean) => void;
}

export function EnabledToggle({ value, onChange }: Props) {
  return (
    <div className={styles.group} role="group" aria-label="Wireless enabled state">
      <button
        type="button"
        className={`${styles.option} ${!value ? `${styles.active} ${styles.activeOff}` : ''}`}
        onClick={() => onChange(false)}
        aria-pressed={!value}
      >
        <XCircle size={14} strokeWidth={2} /> Disabled
      </button>
      <button
        type="button"
        className={`${styles.option} ${value ? `${styles.active} ${styles.activeOn}` : ''}`}
        onClick={() => onChange(true)}
        aria-pressed={value}
      >
        <CheckCircle2 size={14} strokeWidth={2} /> Enabled
      </button>
    </div>
  );
}
