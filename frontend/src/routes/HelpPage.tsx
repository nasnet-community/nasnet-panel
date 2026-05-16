import { LifeBuoy, MessagesSquare } from 'lucide-react';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  Inline,
  SectionHeading,
  Stack,
} from '@nasnet/ui';
import styles from './HelpPage.module.scss';
import { ChatPanel } from './help/ChatPanel';
import { SupportLinks } from './help/SupportLinks';

export function HelpPage() {
  return (
    <Stack>
      <Card className={styles.card}>
        <CardHeader>
          <div>
            <CardTitle>
              <Inline>
                <MessagesSquare size={16} aria-hidden /> AI Assistant
              </Inline>
            </CardTitle>
            <CardDescription>
              Ask our AI assistant about setup, VPN, or Wi-Fi. A support agent can join the same
              conversation when needed.
            </CardDescription>
          </div>
        </CardHeader>
        <ChatPanel />
      </Card>

      <Card className={styles.card}>
        <CardHeader>
          <div>
            <CardTitle>
              <Inline>
                <LifeBuoy size={16} aria-hidden /> More ways to get help
              </Inline>
            </CardTitle>
            <CardDescription>Reach a human or report a problem.</CardDescription>
          </div>
        </CardHeader>
        <Stack $gap="var(--space-md)">
          <SectionHeading>Direct support</SectionHeading>
          <SupportLinks />
        </Stack>
      </Card>
    </Stack>
  );
}
