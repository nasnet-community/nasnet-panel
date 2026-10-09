import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import styles from './Toast.module.scss';

export type ToastTone = 'info' | 'success' | 'warning' | 'danger';

interface ToastItem {
  id: string;
  title: string;
  description?: string;
  tone: ToastTone;
  durationMs: number;
}

interface ToastContextValue {
  notify: (input: Omit<ToastItem, 'id' | 'durationMs'> & { durationMs?: number }) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const cx = (...parts: Array<string | undefined | false>) => parts.filter(Boolean).join(' ');

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t: translate } = useTranslation('ui');
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const notify = useCallback<ToastContextValue['notify']>(
    (input) => {
      const id = `t_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const item: ToastItem = {
        id,
        title: input.title,
        description: input.description,
        tone: input.tone,
        durationMs: input.durationMs ?? 4500,
      };
      setToasts((prev) => [...prev, item]);
      timers.current.set(
        id,
        setTimeout(() => remove(id), item.durationMs),
      );
    },
    [remove],
  );

  useEffect(() => {
    const snapshot = timers.current;
    return () => {
      snapshot.forEach((t) => clearTimeout(t));
      snapshot.clear();
    };
  }, []);

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className={styles.viewport}
        role="region"
        aria-label={translate('toast.regionLabel')}
        aria-live="polite"
      >
        {toasts.map((t) => (
          <output key={t.id} className={cx(styles.item, styles[t.tone])}>
            <span className={styles.title}>{t.title}</span>
            {t.description ? <span className={styles.desc}>{t.description}</span> : null}
          </output>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
};
