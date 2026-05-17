import { Bug, ExternalLink, Send, Youtube } from 'lucide-react';
import { GITHUB_ISSUES_URL, TELEGRAM_SUPPORT_URL, YOUTUBE_CHANNEL_URL } from './links';
import styles from '../HelpPage.module.scss';

export function SupportLinks() {
  return (
    <div className={styles.links}>
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
          <span className={styles.linkTitle}>Telegram support</span>
          <span className={styles.linkDesc}>Chat with the team on Telegram</span>
        </span>
        <ExternalLink size={14} aria-hidden className={styles.linkExternal} />
      </a>

      <a
        className={`${styles.linkCard} ${styles.youtube}`}
        href={YOUTUBE_CHANNEL_URL}
        target="_blank"
        rel="noopener noreferrer"
      >
        <span className={styles.linkIcon} aria-hidden>
          <Youtube size={18} />
        </span>
        <span className={styles.linkBody}>
          <span className={styles.linkTitle}>YouTube channel</span>
          <span className={styles.linkDesc}>Watch setup guides and tutorials</span>
        </span>
        <ExternalLink size={14} aria-hidden className={styles.linkExternal} />
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
          <span className={styles.linkTitle}>Report a bug on GitHub</span>
          <span className={styles.linkDesc}>Open a new issue in the project repository</span>
        </span>
        <ExternalLink size={14} aria-hidden className={styles.linkExternal} />
      </a>
    </div>
  );
}
