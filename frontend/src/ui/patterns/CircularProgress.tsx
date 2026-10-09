import React from 'react';
import { useFormat } from '../../utils/useFormat';
import styles from './CircularProgress.module.scss';

export interface CircularProgressProps {
  value: number; // 0..100
  size?: number;
  strokeWidth?: number;
  tone?: 'default' | 'success' | 'warning' | 'danger';
  label?: React.ReactNode;
  ariaLabel?: string;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  size = 120,
  strokeWidth = 10,
  tone = 'success',
  label,
  ariaLabel,
}) => {
  const format = useFormat();
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (clamped / 100) * circumference;
  const stroke =
    tone === 'danger'
      ? '#dc2626'
      : tone === 'warning'
        ? '#edc32c'
        : tone === 'success'
          ? '#22C55E'
          : '#edc32c';

  return (
    <div
      className={styles.wrap}
      style={{ width: `${size}px`, height: `${size}px` }}
      role="img"
      aria-label={ariaLabel ?? format.percent(clamped / 100, 2)}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.12}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dasharray 400ms ease' }}
        />
      </svg>
      <div className={styles.inner}>{label ?? format.percent(Math.round(clamped) / 100)}</div>
    </div>
  );
};
