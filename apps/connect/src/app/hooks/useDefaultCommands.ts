/**
 * useDefaultCommands Hook
 * Registers default navigation commands and keyboard shortcuts
 *
 * This hook should be called once at the app root level to register
 * all default commands and shortcuts for the command palette.
 *
 * @see NAS-4.10: Implement Navigation & Command Palette
 */

import { useEffect } from 'react';

import { useNavigate } from '@tanstack/react-router';
import {
  Home,
  LayoutDashboard,
  Network,
  Shield,
  Wifi,
  Plus,
  Download,
  RefreshCw,
  Globe,
  Router,
  Server,
  HardDrive,
  Activity,
  FileText,
} from 'lucide-react';

import {
  useCommandRegistry,
  useShortcutRegistry,
  useUIStore,
  type Command,
  type Shortcut,
} from '@nasnet/state/stores';

/**
 * Default navigation commands
 */
function createNavigationCommands(navigate: ReturnType<typeof useNavigate>): Command[] {
  return [
    {
      id: 'nav-home',
      label: 'Home',
      description: 'Go to home page',
      icon: Home,
      category: 'navigation',
      shortcut: 'g h',
      onExecute: () => navigate({ to: '/' }),
    },
    {
      id: 'nav-dashboard',
      label: 'Dashboard',
      description: 'View router dashboard',
      icon: LayoutDashboard,
      category: 'navigation',
      shortcut: 'g d',
      onExecute: () => navigate({ to: '/dashboard' }),
    },
    {
      id: 'nav-routers',
      label: 'Routers',
      description: 'Manage connected routers',
      icon: Router,
      category: 'navigation',
      shortcut: 'g r',
      onExecute: () => navigate({ to: '/routers' }),
    },
    {
      id: 'nav-network',
      label: 'Network',
      description: 'Network configuration',
      icon: Network,
      category: 'navigation',
      shortcut: 'g n',
      onExecute: () => navigate({ to: '/network' }),
    },
    {
      id: 'nav-firewall',
      label: 'Firewall',
      description: 'Firewall rules and security',
      icon: Shield,
      category: 'navigation',
      shortcut: 'g f',
      onExecute: () => navigate({ to: '/network' }), // Firewall is part of network
    },
    {
      id: 'nav-wifi',
      label: 'WiFi',
      description: 'Wireless network settings',
      icon: Wifi,
      category: 'navigation',
      shortcut: 'g w',
      onExecute: () => navigate({ to: '/wifi' }),
    },
    {
      id: 'nav-discover',
      label: 'Discover Routers',
      description: 'Find routers on network',
      icon: Globe,
      category: 'navigation',
      onExecute: () => navigate({ to: '/discover' }),
    },
  ];
}

/**
 * Default action commands
 */
function createActionCommands(): Command[] {
  return [
    {
      id: 'action-add-router',
      label: 'Add Router',
      description: 'Connect a new router',
      icon: Plus,
      category: 'action',
      keywords: ['new', 'connect', 'add'],
      onExecute: () => {
        // TODO: Open add router modal
        console.log('Add router action');
      },
    },
    {
      id: 'action-backup',
      label: 'Create Backup',
      description: 'Backup router configuration',
      icon: Download,
      category: 'action',
      requiresNetwork: true,
      keywords: ['save', 'export', 'backup'],
      onExecute: () => {
        // TODO: Trigger backup
        console.log('Backup action');
      },
    },
    {
      id: 'action-refresh',
      label: 'Refresh Data',
      description: 'Reload current data',
      icon: RefreshCw,
      category: 'action',
      shortcut: 'r',
      keywords: ['reload', 'update'],
      onExecute: () => {
        window.location.reload();
      },
    },
  ];
}

/**
 * Default resource commands (for quick access to common resources)
 */
function createResourceCommands(navigate: ReturnType<typeof useNavigate>): Command[] {
  return [
    {
      id: 'resource-dhcp',
      label: 'DHCP Leases',
      description: 'View DHCP leases',
      icon: Server,
      category: 'resource',
      requiresNetwork: true,
      keywords: ['lease', 'ip', 'clients'],
      onExecute: () => {
        // Navigate to DHCP section
        console.log('DHCP leases');
      },
    },
    {
      id: 'resource-logs',
      label: 'System Logs',
      description: 'View router logs',
      icon: FileText,
      category: 'resource',
      requiresNetwork: true,
      keywords: ['log', 'events', 'history'],
      onExecute: () => {
        console.log('System logs');
      },
    },
    {
      id: 'resource-interfaces',
      label: 'Interfaces',
      description: 'Network interfaces',
      icon: Activity,
      category: 'resource',
      requiresNetwork: true,
      keywords: ['port', 'eth', 'wan', 'lan'],
      onExecute: () => {
        navigate({ to: '/network' });
      },
    },
    {
      id: 'resource-storage',
      label: 'Storage',
      description: 'Router storage info',
      icon: HardDrive,
      category: 'resource',
      requiresNetwork: true,
      keywords: ['disk', 'space', 'files'],
      onExecute: () => {
        console.log('Storage');
      },
    },
  ];
}

/**
 * Create default keyboard shortcuts
 */
function createDefaultShortcuts(
  navigate: ReturnType<typeof useNavigate>,
  toggleCommandPalette: () => void,
  toggleShortcutsOverlay: () => void
): Shortcut[] {
  return [
    // Global shortcuts
    {
      id: 'global-command-palette',
      label: 'Open Command Palette',
      keys: 'cmd+k',
      group: 'global',
      onExecute: toggleCommandPalette,
    },
    {
      id: 'global-shortcuts-help',
      label: 'Show Keyboard Shortcuts',
      keys: '?',
      group: 'global',
      onExecute: toggleShortcutsOverlay,
    },
    // Navigation shortcuts (vim-style)
    {
      id: 'nav-go-home',
      label: 'Go to Home',
      keys: 'g h',
      group: 'navigation',
      onExecute: () => navigate({ to: '/' }),
    },
    {
      id: 'nav-go-dashboard',
      label: 'Go to Dashboard',
      keys: 'g d',
      group: 'navigation',
      onExecute: () => navigate({ to: '/dashboard' }),
    },
    {
      id: 'nav-go-routers',
      label: 'Go to Routers',
      keys: 'g r',
      group: 'navigation',
      onExecute: () => navigate({ to: '/routers' }),
    },
    {
      id: 'nav-go-network',
      label: 'Go to Network',
      keys: 'g n',
      group: 'navigation',
      onExecute: () => navigate({ to: '/network' }),
    },
    {
      id: 'nav-go-firewall',
      label: 'Go to Firewall',
      keys: 'g f',
      group: 'navigation',
      onExecute: () => navigate({ to: '/network' }),
    },
    {
      id: 'nav-go-wifi',
      label: 'Go to WiFi',
      keys: 'g w',
      group: 'navigation',
      onExecute: () => navigate({ to: '/wifi' }),
    },
    // Action shortcuts
    {
      id: 'action-refresh-shortcut',
      label: 'Refresh Page',
      keys: 'r',
      group: 'actions',
      onExecute: () => window.location.reload(),
    },
  ];
}

/**
 * Hook to register default commands and shortcuts
 *
 * @example
 * ```tsx
 * function App() {
 *   useDefaultCommands();
 *   useGlobalShortcuts();
 *
 *   return (
 *     <>
 *       <RouterOutlet />
 *       <CommandPalette />
 *       <ShortcutsOverlay />
 *     </>
 *   );
 * }
 * ```
 */
export function useDefaultCommands() {
  const navigate = useNavigate();
  const { registerMany: registerCommands } = useCommandRegistry();
  const { registerMany: registerShortcuts, toggleOverlay } = useShortcutRegistry();
  const { toggleCommandPalette } = useUIStore();

  useEffect(() => {
    // Register navigation commands
    const navCommands = createNavigationCommands(navigate);
    registerCommands(navCommands);

    // Register action commands
    const actionCommands = createActionCommands();
    registerCommands(actionCommands);

    // Register resource commands
    const resourceCommands = createResourceCommands(navigate);
    registerCommands(resourceCommands);

    // Register shortcuts
    const shortcuts = createDefaultShortcuts(navigate, toggleCommandPalette, toggleOverlay);
    registerShortcuts(shortcuts);
  }, [navigate, registerCommands, registerShortcuts, toggleCommandPalette, toggleOverlay]);
}
