import { Download } from 'lucide-react';
import { Badge, Button, PageShell, Stack, useToast } from '@nasnet/ui';
import {
  DeltaChatLogo,
  NasnetMonitorLogo,
  OONIProbeLogo,
  TelegramMtprotoLogo,
  XrayLogo,
} from './plugins/PluginLogos';
import styles from './PluginsPage.module.scss';

interface Plugin {
  id: string;
  name: string;
  author: string;
  homepage: string;
  category: string;
  tagline: string;
  description: string;
  Logo: React.FC<{ size?: number }>;
}

const PLUGINS: Plugin[] = [
  {
    id: 'telegram-mtproto',
    name: 'Telegram MTProto',
    author: 'Telegram',
    homepage: 'https://github.com/TelegramMessenger/MTProxy',
    category: 'Proxy',
    tagline: 'Self-hosted MTProto proxy for Telegram.',
    description:
      'Spin up an MTProto proxy on this router so devices on your network can reach Telegram through it.',
    Logo: TelegramMtprotoLogo,
  },
  {
    id: 'xray-server',
    name: 'V2Ray / Xray',
    author: 'Project X',
    homepage: 'https://github.com/XTLS/Xray-core',
    category: 'Proxy',
    tagline: 'Self-hosted V2Ray/Xray proxy server.',
    description:
      'Run an Xray (V2Ray-compatible) server on this router for VLESS or VMess proxying, with TCP or WebSocket transport.',
    Logo: XrayLogo,
  },
  {
    id: 'deltachat-madmail',
    name: 'DeltaChat',
    author: 'DeltaChat Team',
    homepage: 'https://delta.chat',
    category: 'Messaging',
    tagline: 'Decentralized email-based chat relay.',
    description:
      'Bring up a DeltaChat relay endpoint for offline-friendly, end-to-end encrypted messaging over standard email.',
    Logo: DeltaChatLogo,
  },
  {
    id: 'ooni-probe',
    name: 'OONI Probe',
    author: 'OONI',
    homepage: 'https://ooni.org',
    category: 'Measurement',
    tagline: 'Measure internet censorship from your network.',
    description:
      'Run scheduled OONI Probe tests from this router to detect blocking of websites and apps, and contribute open measurement data to the OONI network.',
    Logo: OONIProbeLogo,
  },
  {
    id: 'nasnet-monitor',
    name: 'NASNET Monitor',
    author: 'NASNET Community',
    homepage: 'https://github.com/nasnet-community',
    category: 'Monitoring',
    tagline: 'Router and network health monitoring.',
    description:
      'Collect router metrics, container status and connectivity checks on this router, with a local dashboard and optional alert webhooks.',
    Logo: NasnetMonitorLogo,
  },
];

export function PluginsPage() {
  const toast = useToast();

  const install = (plugin: Plugin) => {
    toast.notify({
      title: `${plugin.name} is not available yet`,
      description: 'Plugin installation is coming in a future release.',
      tone: 'info',
    });
  };

  return (
    <PageShell>
      <div className={styles.grid}>
        {PLUGINS.map((plugin) => {
          const { Logo } = plugin;
          return (
            <article key={plugin.id} className={styles.card}>
              <div className={styles.cardTop}>
                <Logo size={56} />
                <Stack $gap="4px" className={styles.cardHead}>
                  <h3 className={styles.cardTitle} title={plugin.name}>
                    {plugin.name}
                  </h3>
                  <p className={styles.cardAuthor}>
                    by{' '}
                    <a
                      href={plugin.homepage}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.cardAuthorLink}
                    >
                      {plugin.author}
                    </a>
                  </p>
                </Stack>
              </div>
              <p className={styles.cardTagline}>{plugin.tagline}</p>
              <p className={styles.cardDesc}>{plugin.description}</p>
              <div className={styles.cardActions}>
                <Badge tone="neutral" className={styles.categoryBadge}>
                  {plugin.category}
                </Badge>
                <Button variant="primary" size="sm" onClick={() => install(plugin)}>
                  <Download size={14} aria-hidden /> Install
                </Button>
              </div>
            </article>
          );
        })}
      </div>
    </PageShell>
  );
}
