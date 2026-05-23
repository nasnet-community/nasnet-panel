import { MessagesSquare } from 'lucide-react';
import { Card, CardDescription, CardHeader, CardTitle, Inline, Stack } from '@nasnet/ui';
import styles from './HelpPage.module.scss';
import { SupportLinks } from './help/SupportLinks';

const CHATWOOT_WIDGET_URL =
  'https://app.chatwoot.com/widget?website_token=6bf25JZcWyhrbtLMgiv4oNuy';

export function HelpPage() {
  return (
    <Stack>
      <SupportLinks />

      <Card className={styles.card}>
        <CardHeader>
          <div>
            <CardTitle>
              <Inline>
                <MessagesSquare size={16} aria-hidden /> AI Assistant
              </Inline>
            </CardTitle>
            <CardDescription>
              Ask our AI assistant anything, and a support agent can join the conversation when
              needed.
            </CardDescription>
          </div>
        </CardHeader>
        <iframe
          className={styles.chatFrame}
          src={CHATWOOT_WIDGET_URL}
          title="AI Assistant chat"
          allow="microphone; camera; clipboard-write"
        />
      </Card>
    </Stack>
  );
}
