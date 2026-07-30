import React from 'react';
import styles from './RadioGroup.module.scss';

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
  content?: React.ReactNode;
}

export interface RadioGroupProps {
  name: string;
  value: string;
  options: RadioOption[];
  onChange: (value: string) => void;
  orientation?: 'row' | 'column';
  ariaLabel?: string;
  onOptionHover?: (value: string | null) => void;
}

const cx = (...parts: Array<string | undefined | false>) => parts.filter(Boolean).join(' ');

export const RadioGroup: React.FC<RadioGroupProps> = ({
  name,
  value,
  options,
  onChange,
  orientation = 'row',
  ariaLabel,
  onOptionHover,
}) => (
  <div
    role="radiogroup"
    aria-label={ariaLabel}
    className={cx(styles.group, orientation === 'row' && styles.groupRow)}
    onMouseLeave={onOptionHover ? () => onOptionHover(null) : undefined}
  >
    {options.map((opt) => {
      const checked = opt.value === value;
      return (
        <label
          key={opt.value}
          className={cx(styles.option, checked && styles.optionChecked)}
          onMouseEnter={onOptionHover ? () => onOptionHover(opt.value) : undefined}
        >
          {opt.content ? <div className={styles.content}>{opt.content}</div> : null}
          <div className={styles.row}>
            <input
              type="radio"
              className={styles.radio}
              name={name}
              value={opt.value}
              checked={checked}
              onChange={() => onChange(opt.value)}
            />
            <div className={styles.body}>
              <span className={styles.title}>{opt.label}</span>
              {opt.description ? <span className={styles.desc}>{opt.description}</span> : null}
            </div>
          </div>
        </label>
      );
    })}
  </div>
);
