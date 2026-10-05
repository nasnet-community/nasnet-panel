import { BookOpen, Bug, ExternalLink, Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { GITHUB_ISSUES_URL, KNOWLEDGE_BASE_URL, TELEGRAM_SUPPORT_URL } from './links';
import styles from '../HelpPage.module.scss';

export function SupportLinks() {
  const { t } = useTranslation('tools');
  return (
    <div className={styles.links}>
      <a
        className={`${styles.linkCard} ${styles.knowledgeBase}`}
        href={KNOWLEDGE_BASE_URL}
        target="_blank"
        rel="noopener noreferrer"
      >
        <span className={styles.linkIcon} aria-hidden>
          <BookOpen size={18} />
        </span>
        <span className={styles.linkBody}>
          <span className={styles.linkTitle}>{t('help.links.knowledgeBase')}</span>
          <span className={styles.linkDesc}>{t('help.links.knowledgeBaseDesc')}</span>
        </span>
        <ExternalLink size={14} aria-hidden className={`${styles.linkExternal} rtl-flip`} />
      </a>

      <a
        className={`${styles.linkCard} ${styles.telegram}`}
        href={TELEGRAM_SUPPORT_URL}
        target="_blank"
        rel="noopener noreferrer"
      >
        <span className={styles.linkIcon} aria-hidden>
          <Send size={18} />
        </span>
        <span className={styles.linkBody}>
          <span className={styles.linkTitle}>{t('help.links.telegram')}</span>
          <span className={styles.linkDesc}>{t('help.links.telegramDesc')}</span>
        </span>
        <ExternalLink size={14} aria-hidden className={`${styles.linkExternal} rtl-flip`} />
      </a>

      <a
        className={`${styles.linkCard} ${styles.github}`}
        href={GITHUB_ISSUES_URL}
        target="_blank"
        rel="noopener noreferrer"
      >
        <span className={styles.linkIcon} aria-hidden>
          <Bug size={18} />
        </span>
        <span className={styles.linkBody}>
          <span className={styles.linkTitle}>{t('help.links.github')}</span>
          <span className={styles.linkDesc}>{t('help.links.githubDesc')}</span>
        </span>
        <ExternalLink size={14} aria-hidden className={`${styles.linkExternal} rtl-flip`} />
      </a>
    </div>
  );
}
