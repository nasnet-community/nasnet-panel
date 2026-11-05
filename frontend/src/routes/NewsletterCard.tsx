import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Loader2, Mail } from 'lucide-react';
import { Button, Card, Input, Label, Stack } from '@nasnet/ui';
import { useLanguage } from '../state/LanguageContext';
import styles from './UpdatesPage.module.scss';

// Same list as the joinnasnet.com footer form. The website keeps a separate
// endpoint for the panel because the panel runs on the router's own address.
const SUBSCRIBE_URL = 'https://joinnasnet.com/api/newsletter/panel-subscribe';
const SITE_LANGUAGES: readonly string[] = ['en', 'fa'];

type Status = 'idle' | 'sending' | 'success' | 'invalid' | 'rateLimited' | 'error';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function subscribe(email: string, locale: string, website: string): Promise<Status> {
  try {
    const response = await fetch(SUBSCRIBE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, locale, website }),
    });
    if (response.ok) return 'success';
    if (response.status === 429) return 'rateLimited';
    if (response.status === 400) return 'invalid';
    return 'error';
  } catch {
    return 'error';
  }
}

export function NewsletterCard() {
  const { t } = useTranslation('tools');
  const { language } = useLanguage();
  const locale = SITE_LANGUAGES.includes(language.code) ? language.code : 'en';
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [status, setStatus] = useState<Status>('idle');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = email.trim();
    if (trimmed.length > 254 || !EMAIL_PATTERN.test(trimmed)) {
      setStatus('invalid');
      return;
    }
    setStatus('sending');
    setStatus(await subscribe(trimmed, locale, website));
  };

  const sending = status === 'sending';
  const message =
    status === 'idle' || status === 'sending' ? null : t(`updates.newsletter.${status}`);

  return (
    <Card>
      <Stack>
        <div className={styles.cardHeader}>
          <div className={styles.cardHeaderLeft}>
            <div className={styles.cardHeaderTitleRow}>
              <span className={styles.cardHeaderIcon}>
                <Mail size={18} aria-hidden />
              </span>
              <h3 style={{ margin: 0 }}>{t('updates.newsletter.title')}</h3>
            </div>
            <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: 'var(--font-sm)' }}>
              {t('updates.newsletter.description')}
            </p>
          </div>
        </div>

        {status === 'success' ? (
          <div className={styles.upToDate} role="status">
            <CheckCircle2 size={22} aria-hidden className={styles.upToDateIcon} />
            <span>{message}</span>
          </div>
        ) : (
          <form className={styles.newsletterForm} onSubmit={submit} noValidate>
            <div className={styles.newsletterField}>
              <Label htmlFor="newsletter-email">{t('updates.newsletter.emailLabel')}</Label>
              <Input
                id="newsletter-email"
                type="email"
                name="email"
                dir="ltr"
                autoComplete="email"
                inputMode="email"
                maxLength={254}
                placeholder="you@example.com"
                aria-invalid={status === 'invalid' || undefined}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (status !== 'sending') setStatus('idle');
                }}
                disabled={sending}
              />
            </div>
            <div aria-hidden="true" className={styles.honeypot}>
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>
            <Button type="submit" variant="success" disabled={sending}>
              {sending ? (
                <>
                  <Loader2 size={14} aria-hidden /> {t('updates.newsletter.sending')}
                </>
              ) : (
                <>
                  <Mail size={14} aria-hidden /> {t('updates.newsletter.submit')}
                </>
              )}
            </Button>
          </form>
        )}

        {message && status !== 'success' ? (
          <p className={styles.newsletterError} role="alert">
            {message}
          </p>
        ) : null}

        <p className={styles.newsletterNote}>
          {t('updates.newsletter.note')}{' '}
          <a href={`https://joinnasnet.com/${locale}/privacy/`} target="_blank" rel="noreferrer">
            {t('updates.newsletter.privacyLink')}
          </a>
        </p>
      </Stack>
    </Card>
  );
}
