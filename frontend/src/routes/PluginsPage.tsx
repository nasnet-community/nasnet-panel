import { useMemo, useState } from 'react';
import { Check, Download, Loader2, Search } from 'lucide-react';
import { Badge, Button, Input, PageShell, Stack, useToast } from '@nasnet/ui';
import {
  BitmaskLogo,
  BriarMailboxLogo,
  CabalLogo,
  CenoLogo,
  ConjureLogo,
  CwtchLogo,
  DeltaChatLogo,
  FDroidLogo,
  GlobaLeaksLogo,
  I2pdLogo,
  LanternUnboundedLogo,
  MagicWormholeLogo,
  MailpileLogo,
  OONIProbeLogo,
  OnionShareLogo,
  PsiphonConduitLogo,
  SecureDropLogo,
  SnowflakeProxyLogo,
  TelegramMtprotoLogo,
  TorBridgeLogo,
} from './plugins/PluginLogos';
import styles from './PluginsPage.module.scss';

type PluginStatus = 'available' | 'installing' | 'installed';

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
    id: 'psiphon-conduit',
    name: 'Psiphon Conduit',
    author: 'Psiphon Inc.',
    homepage: 'https://conduit.psiphon.ca',
    category: 'Proxy',
    tagline: 'Share bandwidth, expand uncensored access.',
    description:
      'Run a Conduit node to forward traffic for Psiphon users in restricted regions. Limits, schedules and quotas are configurable.',
    Logo: PsiphonConduitLogo,
  },
  {
    id: 'lantern-unbounded',
    name: 'Lantern Unbounded',
    author: 'Lantern',
    homepage: 'https://lantern.io',
    category: 'Proxy',
    tagline: 'Help others reach the open internet.',
    description:
      'Donate a portion of your uplink to the Lantern Unbounded network. Encrypted, peer-to-peer, opt-in.',
    Logo: LanternUnboundedLogo,
  },
  {
    id: 'telegram-mtproto',
    name: 'Telegram MTProto',
    author: 'Telegram',
    homepage: 'https://core.telegram.org/mtproto',
    category: 'Messaging',
    tagline: 'Self-hosted MTProto proxy for Telegram.',
    description:
      'Spin up an MTProto proxy on this router so devices on your network can reach Telegram through it.',
    Logo: TelegramMtprotoLogo,
  },
  {
    id: 'deltachat',
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
    id: 'tor-bridge',
    name: 'Tor Bridge',
    author: 'The Tor Project',
    homepage: 'https://community.torproject.org/relay/setup/bridge/',
    category: 'Bridge',
    tagline: 'Help censored users reach the Tor network.',
    description:
      'Run an obfs4 bridge container so people in heavily filtered countries can connect to Tor without revealing they are using it.',
    Logo: TorBridgeLogo,
  },
  {
    id: 'snowflake-proxy',
    name: 'Snowflake Proxy',
    author: 'The Tor Project',
    homepage: 'https://snowflake.torproject.org',
    category: 'Bridge',
    tagline: 'Volunteer WebRTC proxy for Tor users.',
    description:
      'Spin up an ephemeral WebRTC stepping stone for users behind censorship. Low bandwidth, automatic rotation, fully containerized.',
    Logo: SnowflakeProxyLogo,
  },
  {
    id: 'ooni-probe',
    name: 'OONI Probe',
    author: 'OONI',
    homepage: 'https://ooni.org',
    category: 'Measurement',
    tagline: 'Measure internet censorship from your network.',
    description:
      'Periodically probe which sites, apps and protocols are blocked from this router and publish results to the open OONI dataset.',
    Logo: OONIProbeLogo,
  },
  {
    id: 'onionshare',
    name: 'OnionShare',
    author: 'OnionShare',
    homepage: 'https://onionshare.org',
    category: 'File sharing',
    tagline: 'Share files anonymously over Tor.',
    description:
      'Host short-lived onion services for transferring files end-to-end without uploading them to any third-party service.',
    Logo: OnionShareLogo,
  },
  {
    id: 'briar-mailbox',
    name: 'Briar Mailbox',
    author: 'Briar Project',
    homepage: 'https://briarproject.org/manual/mailbox/',
    category: 'Messaging',
    tagline: 'Always-on relay for Briar messages.',
    description:
      'Store-and-forward mailbox over Tor so contacts in the Briar peer-to-peer messenger receive messages even when offline.',
    Logo: BriarMailboxLogo,
  },
  {
    id: 'ceno',
    name: 'CENO',
    author: 'eQualitie',
    homepage: 'https://censorship.no',
    category: 'Web cache',
    tagline: 'Peer-to-peer access to the open web.',
    description:
      'Ouinet-based container that caches web content and reshares it with peers, keeping pages reachable when upstream is throttled or blocked.',
    Logo: CenoLogo,
  },
  {
    id: 'mailpile',
    name: 'Mailpile',
    author: 'Mailpile',
    homepage: 'https://www.mailpile.is',
    category: 'Email',
    tagline: 'Self-hosted encrypted webmail.',
    description:
      'Privacy-respecting webmail client with built-in OpenPGP, so your inbox lives on your own router rather than a third-party server.',
    Logo: MailpileLogo,
  },
  {
    id: 'f-droid-repo',
    name: 'F-Droid Repo',
    author: 'F-Droid',
    homepage: 'https://f-droid.org',
    category: 'App store',
    tagline: 'Mirror the free Android app catalog.',
    description:
      'Host a local F-Droid repository so devices on your network can install free and open-source Android apps without going through Google Play.',
    Logo: FDroidLogo,
  },
  {
    id: 'i2pd',
    name: 'i2pd',
    author: 'PurpleI2P',
    homepage: 'https://i2pd.website',
    category: 'Anonymity',
    tagline: 'Anonymous I2P network router.',
    description:
      'Lightweight C++ daemon for the I2P garlic-routed darknet. Exposes hidden services and end-to-end encrypted tunnels for clients on your LAN.',
    Logo: I2pdLogo,
  },
  {
    id: 'cwtch',
    name: 'Cwtch',
    author: 'Open Privacy',
    homepage: 'https://cwtch.im',
    category: 'Messaging',
    tagline: 'Metadata-resistant chat over Tor.',
    description:
      'Server-optional, decentralized messenger that runs per-conversation Tor onion services. Useful as an always-on Cwtch peer for your contacts.',
    Logo: CwtchLogo,
  },
  {
    id: 'securedrop',
    name: 'SecureDrop',
    author: 'Freedom of the Press',
    homepage: 'https://securedrop.org',
    category: 'Whistleblowing',
    tagline: 'Anonymous source submission system.',
    description:
      'Run a SecureDrop instance behind Tor so journalists and sources can exchange documents without exposing identifying metadata.',
    Logo: SecureDropLogo,
  },
  {
    id: 'globaleaks',
    name: 'GlobaLeaks',
    author: 'Hermes Center',
    homepage: 'https://www.globaleaks.org',
    category: 'Whistleblowing',
    tagline: 'Free, open-source whistleblowing platform.',
    description:
      'Container-hosted secure intake portal for activists, NGOs and newsrooms collecting tips from anonymous reporters.',
    Logo: GlobaLeaksLogo,
  },
  {
    id: 'bitmask',
    name: 'Bitmask Gateway',
    author: 'LEAP',
    homepage: 'https://leap.se',
    category: 'VPN',
    tagline: 'Run your own provider-friendly VPN node.',
    description:
      'Deploys the LEAP VPN gateway stack so the router can offer a Bitmask-compatible encrypted tunnel to opted-in clients.',
    Logo: BitmaskLogo,
  },
  {
    id: 'magic-wormhole',
    name: 'Magic Wormhole',
    author: 'Brian Warner',
    homepage: 'https://magic-wormhole.readthedocs.io',
    category: 'File sharing',
    tagline: 'Send files via short, human-readable codes.',
    description:
      'Always-on relay endpoint for Magic Wormhole, so devices on your network can pair up and transfer files end-to-end encrypted with a four-word code.',
    Logo: MagicWormholeLogo,
  },
  {
    id: 'cabal',
    name: 'Cabal',
    author: 'Cabal Club',
    homepage: 'https://cabal.chat',
    category: 'Messaging',
    tagline: 'Peer-to-peer group chat without servers.',
    description:
      'Hosts an always-on Cabal peer so distributed group conversations stay reachable on your local network even when the rest of the swarm is offline.',
    Logo: CabalLogo,
  },
  {
    id: 'conjure',
    name: 'Conjure',
    author: 'Refraction Networking',
    homepage: 'https://refraction.network',
    category: 'Bridge',
    tagline: 'Refraction-based circumvention transport.',
    description:
      'Operates a Conjure station that turns ordinary unused IP addresses into pluggable transports for users facing nation-state-scale censorship.',
    Logo: ConjureLogo,
  },
];

export function PluginsPage() {
  const [query, setQuery] = useState('');
  const [statusById, setStatusById] = useState<Record<string, PluginStatus>>({});
  const toast = useToast();

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return PLUGINS;
    return PLUGINS.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.tagline.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.author.toLowerCase().includes(q),
    );
  }, [query]);

  const install = (plugin: Plugin) => {
    setStatusById((prev) => ({ ...prev, [plugin.id]: 'installing' }));
    window.setTimeout(() => {
      setStatusById((prev) => ({ ...prev, [plugin.id]: 'installed' }));
      toast.notify({ title: `${plugin.name} installed`, tone: 'success' });
    }, 900);
  };

  return (
    <PageShell>
      <div className={styles.searchRow}>
        <div className={styles.searchWrap}>
          <Search size={16} aria-hidden className={styles.searchIcon} />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search plugins"
            aria-label="Search plugins"
            className={styles.searchInput}
          />
        </div>
        <span className={styles.resultCount}>
          {visible.length} {visible.length === 1 ? 'result' : 'results'}
        </span>
      </div>

      {visible.length === 0 ? (
        <div className={styles.empty}>No plugins match &ldquo;{query}&rdquo;.</div>
      ) : (
        <div className={styles.grid}>
          {visible.map((plugin) => {
            const status = statusById[plugin.id] ?? 'available';
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
                  <Button
                    variant={status === 'installed' ? 'secondary' : 'primary'}
                    size="sm"
                    onClick={() => install(plugin)}
                    disabled={status !== 'available'}
                  >
                    {status === 'installing' ? (
                      <>
                        <Loader2 size={14} aria-hidden className={styles.spin} /> Installing
                      </>
                    ) : status === 'installed' ? (
                      <>
                        <Check size={14} aria-hidden /> Installed
                      </>
                    ) : (
                      <>
                        <Download size={14} aria-hidden /> Install
                      </>
                    )}
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
