import React from 'react';
import { useFormat } from '../../utils/useFormat';
import styles from './Progress.module.scss';

export type ProgressTone = 'primary' | 'success' | 'warning' | 'danger' | 'info';

export interface ProgressProps {
  value: number;
  max?: number;
  label?: string;
  tone?: ProgressTone;
}

const cx = (...parts: Array<string | undefined | false>) => parts.filter(Boolean).join(' ');

export const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  label,
  tone = 'primary',
}) => {
  const format = useFormat();
  const pct = (value / max) * 100;
  const clamped = Math.min(100, Math.max(0, pct));
  return (
    <div className={styles.wrap}>
      {label ? (
        <div className={styles.caption}>
          <span>{label}</span>
          <span>{format.percent(Math.round(pct) / 100)}</span>
        </div>
      ) : null}
      <div
        className={styles.track}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
      >
        <div className={cx(styles.fill, styles[tone])} style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
};
