import { Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LANGUAGES } from '../i18n';
import { useLanguage } from '../state/LanguageContext';
import styles from './LanguageSwitcher.module.scss';

const cx = (...parts: Array<string | undefined | false>) => parts.filter(Boolean).join(' ');

// One button per supported language, each labelled in its own script.
export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation('common');
  const { language, setLanguage, digits, setDigits } = useLanguage();

  return (
    <div className={cx(styles.root, compact && styles.compact)}>
      <div className={styles.row} role="group" aria-label={t('language.label')}>
        <Languages size={14} aria-hidden className={styles.icon} />
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            type="button"
            lang={lang.code}
            dir={lang.dir}
            aria-pressed={lang.code === language.code}
            className={cx(styles.option, lang.code === language.code && styles.optionActive)}
            onClick={() => setLanguage(lang.code)}
          >
            {lang.nativeName}
          </button>
        ))}
      </div>
      {language.code === 'fa' && !compact ? (
        <label className={styles.digits}>
          <input
            type="checkbox"
            checked={digits === 'persian'}
            onChange={(e) => setDigits(e.target.checked ? 'persian' : 'latin')}
          />
          <span>{t('language.persianDigits')}</span>
        </label>
      ) : null}
    </div>
  );
}
