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
import { pluginViewUrl, type InstalledPluginResponse } from '../api';
import i18n from '../i18n';

export type RouterSection = TabItem & { path: string };

const ROUTER_SECTIONS = [
  { id: 'overview', labelKey: 'sections.overview', path: '', icon: <LayoutGrid size={16} /> },
  { id: 'internet', labelKey: 'sections.internet', path: 'internet', icon: <Globe size={16} /> },
  { id: 'wan', labelKey: 'sections.wan', path: 'wan', icon: <Cable size={16} /> },
  { id: 'lan', labelKey: 'sections.lan', path: 'lan', icon: <Network size={16} /> },
  { id: 'dns', labelKey: 'sections.dns', path: 'dns', icon: <Server size={16} /> },
  { id: 'wireless', labelKey: 'sections.wireless', path: 'wireless', icon: <Wifi size={16} /> },
  { id: 'vpn', labelKey: 'sections.vpn', path: 'vpn', icon: <Shield size={16} /> },
  { id: 'plugins', labelKey: 'sections.plugins', path: 'plugins', icon: <Blocks size={16} /> },
  {
    id: 'diagnostics',
    labelKey: 'sections.diagnostics',
    path: 'diagnostics',
    icon: <Activity size={16} />,
  },
  { id: 'help', labelKey: 'sections.help', path: 'help', icon: <CircleHelp size={16} /> },
] as const;

// Labels are translated on each call, so callers get the active language at render time.
const translatedSections = (): RouterSection[] =>
  ROUTER_SECTIONS.map(({ labelKey, ...section }) => ({
    ...section,
    label: i18n.t(labelKey, { ns: 'layout' }),
  }));

export function routerSectionsWithPlugins(
  installedPlugins: InstalledPluginResponse[],
): RouterSection[] {
  const sections = translatedSections();
  if (installedPlugins.length === 0) return sections;
  return sections.map((section) =>
    section.id === 'plugins'
      ? {
          ...section,
          menu: installedPlugins.map((plugin) => ({
            id: plugin.id,
            label: plugin.name,
            href: pluginViewUrl(plugin.id),
          })),
        }
      : section,
  );
}

export function activeRouterSectionId(pathname: string, routerId: string): string | undefined {
  return ROUTER_SECTIONS.find((t) => {
    const full = `/router/${routerId}${t.path ? `/${t.path}` : ''}`;
    return t.path === '' ? pathname === full : pathname.startsWith(full);
  })?.id;
}
