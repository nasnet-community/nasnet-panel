import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LANGUAGES, type LanguageInfo } from '../i18n';
import { useLanguage } from '../state/LanguageContext';
import styles from './LanguageSwitcher.module.scss';

const cx = (...parts: Array<string | undefined | false>) => parts.filter(Boolean).join(' ');

const Flag = ({ lang }: { lang: LanguageInfo }) => (
  <img src={lang.flag} alt="" aria-hidden className={styles.flag} />
);

// Dropdown with one entry per supported language, each labelled in its own script.
export function LanguageSwitcher() {
  const { t } = useTranslation('common');
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handlePointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('pointerdown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className={styles.trigger}
        // "true" means a menu too; it keeps this distinct from the router menu trigger.
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={`${t('language.label')}: ${language.nativeName}`}
        onClick={() => setOpen((v) => !v)}
      >
        <Flag lang={language} />
        <ChevronDown size={14} aria-hidden className={open ? styles.chevronOpen : undefined} />
      </button>
      {open ? (
        <div className={styles.menu} role="menu" aria-label={t('language.label')}>
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              type="button"
              role="menuitemradio"
              aria-checked={lang.code === language.code}
              lang={lang.code}
              className={cx(styles.option, lang.code === language.code && styles.optionActive)}
              onClick={() => {
                setLanguage(lang.code);
                setOpen(false);
              }}
            >
              <Flag lang={lang} />
              <span>{lang.nativeName}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
