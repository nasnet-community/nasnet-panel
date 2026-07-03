import { MessagesSquare } from 'lucide-react';
import { Card, CardDescription, CardHeader, CardTitle, Inline, Stack } from '@nasnet/ui';
import styles from './HelpPage.module.scss';
import { ChatPanel } from './help/ChatPanel';
import { SupportLinks } from './help/SupportLinks';

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
        <ChatPanel />
      </Card>
    </Stack>
  );
}
