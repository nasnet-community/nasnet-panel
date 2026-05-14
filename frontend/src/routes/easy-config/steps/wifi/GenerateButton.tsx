import { Sparkles } from 'lucide-react';
import styles from './GenerateButton.module.scss';

interface Props {
  onClick: () => void;
  ariaLabel: string;
}

export function GenerateButton({ onClick, ariaLabel }: Props) {
  return (
    <button
      type="button"
      className={styles.button}
      onClick={(e) => {
        onClick();
        e.currentTarget.blur();
      }}
      aria-label={ariaLabel}
      title={ariaLabel}
    >
      <Sparkles size={16} strokeWidth={1.75} />
    </button>
  );
}
