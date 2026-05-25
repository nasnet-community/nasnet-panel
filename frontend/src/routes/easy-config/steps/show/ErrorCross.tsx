import styles from '../../../EasyConfigWizard.module.scss';

export function ErrorCross() {
  return (
    <div className={styles.errorCheck} aria-hidden="true">
      <svg viewBox="0 0 72 72" width="96" height="96">
        <circle className={styles.errorCircle} cx="36" cy="36" r="32" fill="none" strokeWidth="4" />
        <path
          className={styles.errorCross}
          d="M24 24 L48 48"
          fill="none"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          className={styles.errorCrossAlt}
          d="M48 24 L24 48"
          fill="none"
          strokeWidth="5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
