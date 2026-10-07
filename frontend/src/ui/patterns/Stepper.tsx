import React from 'react';
import { useTranslation } from 'react-i18next';
import styles from './Stepper.module.scss';

export interface StepperStep {
  id: string;
  title: string;
  description?: string;
}

export interface StepperProps {
  steps: StepperStep[];
  activeIndex: number;
  orientation?: 'horizontal' | 'vertical';
}

const cx = (...parts: Array<string | undefined | false>) => parts.filter(Boolean).join(' ');

const bubbleClass = (state: 'done' | 'active' | 'pending'): string =>
  state === 'active'
    ? styles.bubbleActive
    : state === 'done'
      ? styles.bubbleDone
      : styles.bubblePending;

export const Stepper: React.FC<StepperProps> = ({
  steps,
  activeIndex,
  orientation = 'horizontal',
}) => {
  const { t } = useTranslation('ui');
  return (
    <ol
      className={cx(styles.wrap, orientation === 'vertical' && styles.wrapVertical)}
      aria-label={t('stepper.ariaLabel')}
    >
      {steps.map((step, i) => {
        const state: 'done' | 'active' | 'pending' =
          i < activeIndex ? 'done' : i === activeIndex ? 'active' : 'pending';
        return (
          <li
            key={step.id}
            className={cx(
              styles.item,
              state === 'pending' && styles.itemPending,
              state === 'done' && styles.itemDone,
            )}
            aria-current={state === 'active' ? 'step' : undefined}
          >
            <span className={cx(styles.bubble, bubbleClass(state))}>{i + 1}</span>
            <div className={styles.label}>
              <span className={styles.title}>{step.title}</span>
              {step.description ? (
                <span className={styles.description}>{step.description}</span>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
};
