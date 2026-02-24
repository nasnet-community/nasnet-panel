import { useTranslation } from 'react-i18next';
import { useCollapsibleSidebarContext } from '@nasnet/ui/layouts';
import { Link, useRouterState } from '@tanstack/react-router';
import {
  Activity,
  BarChart3,
  Globe,
  LayoutDashboard,
  Network,
  Router,
  Settings,
  Shield,
  Wifi,
  Zap,
} from 'lucide-react';
import { cn } from '@nasnet/ui/utils';

interface NavItem {
  key: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavSection {
  titleKey: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    titleKey: 'nav.sections.overview',
    items: [
      { key: 'nav.dashboard', href: '/', icon: LayoutDashboard },
      { key: 'nav.routers', href: '/routers', icon: Router },
    ],
  },
  {
    titleKey: 'nav.sections.monitoring',
    items: [
      { key: 'nav.traffic', href: '/traffic', icon: BarChart3 },
      { key: 'nav.network', href: '/network', icon: Network },
      { key: 'nav.wifi', href: '/wifi', icon: Wifi },
    ],
  },
  {
    titleKey: 'nav.sections.configuration',
    items: [
      { key: 'nav.security', href: '/security', icon: Shield },
      { key: 'nav.services', href: '/services', icon: Zap },
    ],
  },
  {
    titleKey: 'nav.sections.advanced',
    items: [
      { key: 'nav.diagnostics', href: '/diagnostics', icon: Activity },
      { key: 'nav.internet', href: '/internet', icon: Globe },
      { key: 'nav.settings', href: '/settings', icon: Settings },
    ],
  },
];

export function AppSidebar() {
  const { t } = useTranslation('common');
  const { isCollapsed } = useCollapsibleSidebarContext();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  return (
    <nav
      aria-label={t('sidebar.navigation', { defaultValue: 'Main navigation' })}
      className="flex flex-col gap-component-sm px-component-sm py-4 h-full overflow-y-auto"
    >
      {NAV_SECTIONS.map((section) => (
        <div key={section.titleKey} className="mb-4">
          {!isCollapsed && (
            <p className="px-3 mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t(section.titleKey, { defaultValue: section.titleKey })}
            </p>
          )}
          <ul className="flex flex-col gap-0.5">
            {section.items.map((item) => {
              const isActive =
                item.href === '/'
                  ? currentPath === '/'
                  : currentPath.startsWith(item.href);
              const Icon = item.icon;
              return (
                <li key={item.key}>
                  <Link
                    to={item.href}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors',
                      'min-h-[44px]',
                      'hover:bg-accent hover:text-accent-foreground',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-foreground',
                      isCollapsed ? 'justify-center px-2' : '',
                    )}
                    title={isCollapsed ? t(item.key) : undefined}
                  >
                    <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                    {!isCollapsed && (
                      <span>{t(item.key, { defaultValue: item.key })}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
