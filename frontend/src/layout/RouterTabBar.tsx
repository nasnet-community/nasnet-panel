import { useNavigate } from 'react-router-dom';
import {
  Activity,
  Cable,
  CircleHelp,
  Cpu,
  Globe,
  LayoutGrid,
  Network,
  Shield,
  Wand2,
  Wifi,
} from 'lucide-react';
import { Tabs, type TabItem } from '@nasnet/ui';
import { useSession } from '../state/SessionContext';
import { useRouterStore } from '../state/RouterStoreContext';
import styles from './RouterTabBar.module.scss';

export const ROUTER_TABS: Array<TabItem & { path: string }> = [
  { id: 'overview', label: 'Overview', path: '', icon: <LayoutGrid size={16} /> },
  {
    id: 'internet',
    label: 'Internet',
    path: 'internet',
    icon: <Globe size={16} />,
  },
  { id: 'wan', label: 'WAN', path: 'wan', icon: <Cable size={16} />, disabled: true },
  { id: 'lan', label: 'LAN', path: 'lan', icon: <Network size={16} />, disabled: true },
  { id: 'wireless', label: 'WIFI', path: 'wireless', icon: <Wifi size={16} /> },
  { id: 'vpn', label: 'VPN Server', path: 'vpn', icon: <Shield size={16} /> },
  { id: 'system', label: 'System', path: 'system', icon: <Cpu size={16} />, disabled: true },
  { id: 'wizard', label: 'Wizard', path: 'config', icon: <Wand2 size={16} /> },
  {
    id: 'diagnostics',
    label: 'Diagnostics',
    path: 'diagnostics',
    icon: <Activity size={16} />,
    disabled: true,
  },
  { id: 'help', label: 'Help', path: 'help', icon: <CircleHelp size={16} />, disabled: true },
  // { id: 'dhcp', label: 'DHCP', path: 'dhcp', icon: <Network size={16} /> },
  // { id: 'dns', label: 'DNS', path: 'dns', icon: <Globe size={16} /> },
  // { id: 'firewall', label: 'Firewall', path: 'firewall', icon: <Flame size={16} /> },
  // { id: 'logs', label: 'Logs', path: 'logs', icon: <ScrollText size={16} /> },
];

export function RouterTabBar({
  routerId,
  activeId,
}: {
  routerId?: string | null;
  activeId?: string;
}) {
  const navigate = useNavigate();
  const { activeRouterId } = useSession();
  const { routers, lastConnectedRouterId, selectedRouterId } = useRouterStore();
  const targetId =
    routerId ??
    activeRouterId ??
    lastConnectedRouterId ??
    selectedRouterId ??
    routers[0]?.id ??
    null;

  if (!targetId) return null;

  return (
    <div className={styles.tabBarBand}>
      <div className={styles.tabBarInner}>
        <Tabs
          items={ROUTER_TABS}
          activeId={activeId ?? ''}
          onChange={(tabId) => {
            const item = ROUTER_TABS.find((t) => t.id === tabId);
            if (!item) return;
            navigate(`/router/${targetId}${item.path ? `/${item.path}` : ''}`);
          }}
          ariaLabel="Router sections"
        />
      </div>
    </div>
  );
}
