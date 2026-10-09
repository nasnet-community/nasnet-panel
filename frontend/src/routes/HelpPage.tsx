import { MessagesSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card, CardDescription, CardHeader, CardTitle, Inline, Stack } from '@nasnet/ui';
import styles from './HelpPage.module.scss';
import { ChatPanel } from './help/ChatPanel';
import { SupportLinks } from './help/SupportLinks';

export function HelpPage() {
  const { t } = useTranslation('tools');
  return (
    <Stack>
      <SupportLinks />

      <Card className={styles.card}>
        <CardHeader>
          <div>
            <CardTitle>
              <Inline>
                <MessagesSquare size={16} aria-hidden /> {t('help.assistant.title')}
              </Inline>
            </CardTitle>
            <CardDescription>{t('help.assistant.description')}</CardDescription>
          </div>
        </CardHeader>
        <ChatPanel />
      </Card>
    </Stack>
  );
}
