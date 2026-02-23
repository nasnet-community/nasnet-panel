/**
 * Stories for CommandPalette component
 *
 * The real CommandPalette connects to Zustand stores (`useUIStore`,
 * `useCommandRegistry`) and TanStack Router navigation, which are unavailable
 * in Storybook. This file provides a self-contained MockCommandPalette that
 * duplicates the visual shell so every story renders without external providers.
 */

import * as React from 'react';
import { Activity, Shield, Wifi, Network, Terminal, Globe, AlertTriangle, Zap, Settings, Clock, Sparkles, WifiOff } from 'lucide-react';

import { cn } from '@nasnet/ui/primitives';
import { Icon } from '@nasnet/ui/patterns';

import type { Meta, StoryObj } from '@storybook/react';

// ---------------------------------------------------------------------------
// Inline Command type (mirrors Command from @nasnet/state/stores)
// ---------------------------------------------------------------------------

type CommandCategory = 'navigation' | 'action' | 'resource' | 'recent';

interface MockCommand {
  /** Unique identifier for the command */
  id: string;
  /** Display label */
  label: string;
  /** Brief description of what the command does */
  description?: string;
  /** Icon component (from lucide-react) */
  icon: React.ElementType;
  /** Command category for grouping */
  category: CommandCategory;
  /** Keyboard shortcut (e.g., 'cmd+k' or 'g h') */
  shortcut?: string;
  /** Whether this command requires network connectivity */
  requiresNetwork?: boolean;
  /** Search keywords for matching */
  keywords?: string[];
}

// ---------------------------------------------------------------------------
// Kbd helper
// ---------------------------------------------------------------------------

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
      {children}
    </kbd>
  );
}

// ---------------------------------------------------------------------------
// MockCommandItem
// ---------------------------------------------------------------------------

interface MockCommandItemProps {
  command: MockCommand;
  selected: boolean;
  showShortcut?: boolean;
  isOnline?: boolean;
  onSelect: () => void;
}

function MockCommandItem({
  command,
  selected,
  showShortcut = true,
  isOnline = true,
  onSelect,
}: MockCommandItemProps) {
  const Icon = command.icon;
  const isDisabled = !!command.requiresNetwork && !isOnline;

  const shortcutKeys: string[] = command.shortcut
    ? command.shortcut
        .split('+')
        .map((k) => {
          const lk = k.toLowerCase();
          if (lk === 'cmd' || lk === 'meta') return '⌘';
          if (lk === 'shift') return '⇧';
          if (lk === 'ctrl') return 'Ctrl';
          return k.toUpperCase();
        })
    : [];

  return (
    <div
      role="option"
      aria-selected={selected}
      tabIndex={0}
      className={cn(
        'flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition-colors',
        selected ? 'bg-accent text-accent-foreground' : 'hover:bg-accent hover:text-accent-foreground',
        isDisabled && 'cursor-not-allowed opacity-50'
      )}
      onClick={() => !isDisabled && onSelect()}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !isDisabled) {
          onSelect();
        }
      }}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium">{command.label}</span>
        {command.description && (
          <span className="truncate text-xs text-muted-foreground">{command.description}</span>
        )}
      </div>

      {command.requiresNetwork && !isOnline && (
        <div className="flex items-center gap-1 rounded bg-destructive/10 px-1.5 py-0.5 text-xs text-destructive" title="This command requires network connectivity">
          <WifiOff className="h-3 w-3" aria-hidden="true" />
          <span>Offline</span>
        </div>
      )}

      {showShortcut && shortcutKeys.length > 0 && (
        <div className="flex shrink-0 items-center gap-1">
          {shortcutKeys.map((key, i) => (
            <Kbd key={i}>{key}</Kbd>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// MockCommandPalette – visual shell for Storybook
// ---------------------------------------------------------------------------

interface MockCommandPaletteProps {
  /** Initial list of commands to display */
  commands: MockCommand[];
  /** Start with specific query text pre-filled */
  initialQuery?: string;
  /** Show recent or results section header */
  mode?: 'recent' | 'results';
  /** Whether the device is online (affects network-dependent commands) */
  isOnline?: boolean;
  /** Render as mobile bottom-sheet instead of centered modal */
  mobile?: boolean;
}

function MockCommandPalette({
  commands,
  initialQuery = '',
  mode = 'recent',
  isOnline = true,
  mobile = false,
}: MockCommandPaletteProps) {
  const [query, setQuery] = React.useState(initialQuery);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [lastExecuted, setLastExecuted] = React.useState<string | null>(null);

  const filtered = React.useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        (c.description ?? '').toLowerCase().includes(q) ||
        (c.keywords ?? []).some((kw) => kw.includes(q))
    );
  }, [commands, query]);

  const isShowingRecent = mode === 'recent' || !query.trim();
  const hasResults = filtered.length > 0;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        setLastExecuted(filtered[selectedIndex].label);
      }
    }
  };

  const content = (
    <div
      className={cn(
        'flex flex-col overflow-hidden border border-border bg-popover text-popover-foreground shadow-2xl',
        mobile ? 'rounded-t-xl w-full' : 'rounded-xl w-full max-w-lg'
      )}
    >
      {/* Search Input */}
      <div className="flex items-center border-b border-border px-4">
        <Terminal className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        {/* Autofocus is acceptable here for Storybook demo; in production use useEffect */}
        {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
        <input autoFocus
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedIndex(0);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search commands..."
          className="flex h-12 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
          aria-label="Search commands"
        />
      </div>

      {/* Results */}
      <div className="max-h-[300px] overflow-y-auto p-2">
        {!hasResults ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No commands found.</p>
        ) : (
          <>
            <div className="mb-2 flex items-center gap-2 px-2 text-xs font-medium text-muted-foreground">
              {isShowingRecent ? (
                <>
                  <Clock className="h-3 w-3" aria-hidden="true" />
                  <span>Recent</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3 w-3" aria-hidden="true" />
                  <span>Results</span>
                </>
              )}
            </div>

            {filtered.map((cmd, index) => (
              <MockCommandItem
                key={cmd.id}
                command={cmd}
                selected={index === selectedIndex}
                showShortcut={!mobile}
                isOnline={isOnline}
                onSelect={() => setLastExecuted(cmd.label)}
              />
            ))}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-border px-4 py-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Kbd>↑↓</Kbd> Navigate
          </span>
          <span className="flex items-center gap-1">
            <Kbd>↵</Kbd> Select
          </span>
          <span className="flex items-center gap-1">
            <Kbd>Esc</Kbd> Close
          </span>
        </div>
        {hasResults && (
          <span>
            {filtered.length} {filtered.length === 1 ? 'result' : 'results'}
          </span>
        )}
      </div>

      {/* Feedback */}
      {lastExecuted && (
        <div className="border-t border-border px-4 py-2 text-xs text-success">
          Executed: {lastExecuted}
        </div>
      )}
    </div>
  );

  if (mobile) {
    return (
      <div className="relative w-80 h-[520px] bg-black/40 rounded-xl overflow-hidden flex items-end">
        {content}
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-lg">
      {content}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared mock command data
// ---------------------------------------------------------------------------

const SAMPLE_COMMANDS: MockCommand[] = [
  {
    id: 'nav-dashboard',
    label: 'Go to Dashboard',
    description: 'Open the main router dashboard',
    icon: Activity,
    category: 'navigation',
    shortcut: 'g+h',
    keywords: ['home', 'overview', 'stats'],
  },
  {
    id: 'nav-firewall',
    label: 'Open Firewall',
    description: 'Manage filter, NAT, and mangle rules',
    icon: Shield,
    category: 'navigation',
    shortcut: 'g+f',
    keywords: ['rules', 'iptables', 'nat', 'filter'],
    requiresNetwork: true,
  },
  {
    id: 'nav-wifi',
    label: 'Wireless Settings',
    description: 'Configure Wi-Fi interfaces and SSIDs',
    icon: Wifi,
    category: 'navigation',
    shortcut: 'g+w',
    keywords: ['wifi', 'wireless', 'ssid'],
    requiresNetwork: true,
  },
  {
    id: 'nav-network',
    label: 'Network Interfaces',
    description: 'View and configure network interfaces',
    icon: Network,
    category: 'navigation',
    shortcut: 'g+n',
    keywords: ['interface', 'ether', 'bridge', 'vlan'],
    requiresNetwork: true,
  },
  {
    id: 'action-ping',
    label: 'Ping Host',
    description: 'Run a connectivity test to any host',
    icon: Terminal,
    category: 'action',
    shortcut: 'cmd+shift+P',
    keywords: ['ping', 'test', 'connectivity', 'latency'],
    requiresNetwork: true,
  },
  {
    id: 'action-dns',
    label: 'DNS Lookup',
    description: 'Resolve a domain name on the router',
    icon: Globe,
    category: 'action',
    keywords: ['dns', 'resolve', 'nslookup', 'domain'],
    requiresNetwork: true,
  },
  {
    id: 'action-alerts',
    label: 'Create Alert Rule',
    description: 'Set up monitoring alerts for this router',
    icon: AlertTriangle,
    category: 'action',
    keywords: ['alert', 'notification', 'monitor', 'rule'],
  },
  {
    id: 'action-reboot',
    label: 'Reboot Router',
    description: 'Safely restart the router hardware',
    icon: Zap,
    category: 'action',
    keywords: ['reboot', 'restart', 'reset'],
    requiresNetwork: true,
  },
  {
    id: 'nav-settings',
    label: 'Application Settings',
    description: 'Theme, language, and preferences',
    icon: Settings,
    category: 'navigation',
    shortcut: 'cmd+,',
    keywords: ['settings', 'preferences', 'theme'],
  },
];

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof MockCommandPalette> = {
  title: 'Patterns/CommandPalette',
  component: MockCommandPalette,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Global command palette triggered by Cmd+K (desktop) or the search FAB (mobile). Supports fuzzy search across registered commands, keyboard navigation, shortcut display, recent items, and offline state. Switches between a centered modal (desktop) and a bottom-sheet (mobile) via the `usePlatform()` hook.',
      },
    },
  },
  argTypes: {
    commands: {
      description: 'Array of command definitions',
      table: { disable: true },
    },
    isOnline: {
      control: 'boolean',
      description: 'Simulate offline state – network-dependent commands are disabled',
    },
    mobile: {
      control: 'boolean',
      description: 'Render as a mobile bottom-sheet instead of a centered modal',
    },
    initialQuery: {
      control: 'text',
      description: 'Pre-fill the search input with query text',
    },
    mode: {
      table: { disable: true },
    },
  },
};

export default meta;
type Story = StoryObj<typeof MockCommandPalette>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const Default: Story = {
  name: 'Default – Recent Commands',
  args: {
    commands: SAMPLE_COMMANDS,
    initialQuery: '',
    isOnline: true,
    mobile: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'When opened with an empty query the palette shows recently-used commands under a "Recent" heading. Use arrow keys to navigate and Enter to execute.',
      },
    },
  },
};

export const WithSearchResults: Story = {
  name: 'With Search Results',
  args: {
    commands: SAMPLE_COMMANDS,
    initialQuery: 'fire',
    isOnline: true,
    mobile: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Typing filters the list in real time. Results matching "fire" surface the Firewall navigation command with its keyboard shortcut badge.',
      },
    },
  },
};

export const EmptyState: Story = {
  name: 'Empty – No Matches',
  args: {
    commands: SAMPLE_COMMANDS,
    initialQuery: 'xyznotfound',
    isOnline: true,
    mobile: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'When the query matches nothing a "No commands found." empty state is shown.',
      },
    },
  },
};

export const OfflineState: Story = {
  name: 'Offline Mode',
  args: {
    commands: SAMPLE_COMMANDS,
    initialQuery: '',
    isOnline: false,
    mobile: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'When `isOnline` is false commands marked `requiresNetwork` are dimmed and show an "Offline" badge. Local-only commands (Dashboard, Settings, Alerts) remain fully active.',
      },
    },
  },
};

export const MobileBottomSheet: Story = {
  name: 'Mobile – Bottom Sheet',
  args: {
    commands: SAMPLE_COMMANDS,
    initialQuery: '',
    isOnline: true,
    mobile: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'On mobile the palette renders as a bottom sheet. Keyboard shortcut badges are hidden to save space and touch targets are enlarged.',
      },
    },
  },
};

export const MobileWithSearch: Story = {
  name: 'Mobile – With Search',
  args: {
    commands: SAMPLE_COMMANDS,
    initialQuery: 'ping',
    isOnline: true,
    mobile: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Mobile bottom sheet with a pre-filled search query showing the "Ping Host" result.',
      },
    },
  },
};

export const MobileOfflineState: Story = {
  name: 'Mobile – Offline',
  args: {
    commands: SAMPLE_COMMANDS,
    initialQuery: '',
    isOnline: false,
    mobile: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Mobile bottom sheet with offline mode enabled. Network-dependent commands show the "Offline" badge and are disabled.',
      },
    },
  },
};

export const KeyboardNavigation: Story = {
  name: 'Keyboard Navigation Demo',
  args: {
    commands: SAMPLE_COMMANDS,
    initialQuery: '',
    isOnline: true,
    mobile: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates keyboard navigation: Use arrow keys (↑↓) to navigate commands, Enter to select, Esc to close. Shortcut badges are displayed on desktop.',
      },
    },
  },
};

export const AllCommandsDisabledOffline: Story = {
  name: 'All Commands Disabled (Network-Only)',
  args: {
    commands: SAMPLE_COMMANDS.filter((c) => c.requiresNetwork),
    initialQuery: '',
    isOnline: false,
    mobile: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Showing only network-dependent commands with offline mode enabled. All commands are disabled and show the "Offline" badge.',
      },
    },
  },
};
