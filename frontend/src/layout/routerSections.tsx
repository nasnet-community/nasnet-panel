import {
  Activity,
  Blocks,
  Cable,
  CircleHelp,
  Globe,
  LayoutGrid,
  Network,
  Server,
  Shield,
  Wifi,
} from 'lucide-react';
import type { TabItem } from '@nasnet/ui';

export type RouterSection = TabItem & { path: string };

export const ROUTER_SECTIONS: RouterSection[] = [
  { id: 'overview', label: 'Overview', path: '', icon: <LayoutGrid size={16} /> },
  { id: 'internet', label: 'Internet', path: 'internet', icon: <Globe size={16} /> },
  { id: 'wan', label: 'WAN', path: 'wan', icon: <Cable size={16} /> },
  { id: 'lan', label: 'LAN', path: 'lan', icon: <Network size={16} /> },
  { id: 'dns', label: 'DNS', path: 'dns', icon: <Server size={16} /> },
  { id: 'wireless', label: 'WIFI', path: 'wireless', icon: <Wifi size={16} /> },
  { id: 'vpn', label: 'VPN Server', path: 'vpn', icon: <Shield size={16} /> },
  { id: 'plugins', label: 'Plugins', path: 'plugins', icon: <Blocks size={16} /> },
  { id: 'diagnostics', label: 'Diagnostics', path: 'diagnostics', icon: <Activity size={16} /> },
  { id: 'help', label: 'Help', path: 'help', icon: <CircleHelp size={16} /> },
];

export function activeRouterSectionId(pathname: string, routerId: string): string | undefined {
  return ROUTER_SECTIONS.find((t) => {
    const full = `/router/${routerId}${t.path ? `/${t.path}` : ''}`;
    return t.path === '' ? pathname === full : pathname.startsWith(full);
  })?.id;
}
