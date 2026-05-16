import { useEffect } from 'react';
import { Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
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
import { useRouter } from '../state/RouterStoreContext';
import { useSession } from '../state/SessionContext';
import styles from './RouterDashboard.module.scss';

const TABS: Array<TabItem & { path: string }> = [
  { id: 'overview', label: 'Overview', path: '', icon: <LayoutGrid size={16} /> },
  {
    id: 'internet',
    label: 'Internet',
    path: 'internet',
    icon: <Globe size={16} />,
  },
  { id: 'wan', label: 'WAN', path: 'wan', icon: <Cable size={16} /> },
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

export function RouterDashboard() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter(id);
  const location = useLocation();
  const navigate = useNavigate();
  const { setActiveRouterId } = useSession();

  useEffect(() => {
    setActiveRouterId(id ?? null);
    return () => setActiveRouterId(null);
  }, [id, setActiveRouterId]);

  if (!router) {
    return (
      <div className={styles.contentShell}>
        <div className={styles.notFound}>Router not found.</div>
      </div>
    );
  }

  const activeTab =
    TABS.find((t) => {
      const full = `/router/${router.id}${t.path ? `/${t.path}` : ''}`;
      return t.path === '' ? location.pathname === full : location.pathname.startsWith(full);
    })?.id ?? 'overview';

  return (
    <>
      <div className={styles.tabBarBand}>
        <div className={styles.tabBarInner}>
          <Tabs
            items={TABS}
            activeId={activeTab}
            onChange={(tabId) => {
              const item = TABS.find((t) => t.id === tabId);
              if (!item) return;
              navigate(`/router/${router.id}${item.path ? `/${item.path}` : ''}`);
            }}
            ariaLabel="Router sections"
          />
        </div>
      </div>
      <div className={styles.contentShell}>
        <Outlet />
      </div>
    </>
  );
}
