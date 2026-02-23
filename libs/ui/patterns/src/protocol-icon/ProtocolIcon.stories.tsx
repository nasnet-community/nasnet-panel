
import { ProtocolIcon, ProtocolIconBadge } from './ProtocolIcon';

import type { ProtocolIconBadgeProps } from './ProtocolIcon';
import type { Meta, StoryObj } from '@storybook/react';

/**
 * All supported VPN protocol values.
 */
const ALL_PROTOCOLS = ['wireguard', 'openvpn', 'l2tp', 'pptp', 'sstp', 'ikev2'] as const;

// ─── ProtocolIcon meta ─────────────────────────────────────────────────────

const meta: Meta<typeof ProtocolIcon> = {
  title: 'Patterns/ProtocolIcon',
  component: ProtocolIcon,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Renders a colour-coded Lucide icon for each supported VPN protocol. `ProtocolIcon` renders a plain inline icon; `ProtocolIconBadge` wraps it in a rounded container with a tinted background — useful for list cards and detail headers.',
      },
    },
  },
  argTypes: {
    protocol: {
      control: 'select',
      options: ALL_PROTOCOLS,
      description: 'VPN protocol type',
    },
    size: {
      control: { type: 'number', min: 12, max: 48 },
      description: 'Icon size in pixels',
    },
    className: {
      control: 'text',
      description: 'Additional Tailwind classes',
    },
  },
};

export default meta;
type IconStory = StoryObj<typeof ProtocolIcon>;

// ─── ProtocolIcon stories ─────────────────────────────────────────────────

export const Default: IconStory = {
  args: {
    protocol: 'wireguard',
    size: 24,
  },
};

export const WireGuard: IconStory = {
  args: { protocol: 'wireguard', size: 24 },
};

export const OpenVPN: IconStory = {
  args: { protocol: 'openvpn', size: 24 },
};

export const L2TP: IconStory = {
  args: { protocol: 'l2tp', size: 24 },
};

export const PPTP: IconStory = {
  args: { protocol: 'pptp', size: 24 },
};

export const SSTP: IconStory = {
  args: { protocol: 'sstp', size: 24 },
};

export const IKEv2: IconStory = {
  args: { protocol: 'ikev2', size: 24 },
};

export const AllProtocols: IconStory = {
  render: () => (
    <div className="flex items-center gap-6 flex-wrap">
      {ALL_PROTOCOLS.map((protocol) => (
        <div key={protocol} className="flex flex-col items-center gap-1.5">
          <ProtocolIcon protocol={protocol} size={24} />
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wide">
            {protocol}
          </span>
        </div>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All six protocol icons with their protocol label underneath — useful as a visual token reference.',
      },
    },
  },
};

export const Sizes: IconStory = {
  render: () => (
    <div className="flex items-end gap-6">
      {([16, 20, 24, 32, 40] as const).map((size) => (
        <div key={size} className="flex flex-col items-center gap-1.5">
          <ProtocolIcon protocol="wireguard" size={size} />
          <span className="text-[10px] font-mono text-muted-foreground">{size}px</span>
        </div>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'The `size` prop accepts any pixel value. Common sizes shown: 16, 20, 24, 32, 40.',
      },
    },
  },
};

// ─── ProtocolIconBadge stories ────────────────────────────────────────────

/**
 * Wrapper component so Storybook can expose ProtocolIconBadge with argTypes.
 */
function ProtocolIconBadgeDemo(props: ProtocolIconBadgeProps) {
  return <ProtocolIconBadge {...props} />;
}

const _badgeMeta: Meta<typeof ProtocolIconBadgeDemo> = {
  title: 'Patterns/ProtocolIcon/Badge',
  component: ProtocolIconBadgeDemo,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'The `ProtocolIconBadge` variant wraps the icon in a rounded square container with a protocol-specific tinted background. Useful for VPN list cards, detail page headers, and connection wizard steps.',
      },
    },
  },
  argTypes: {
    protocol: {
      control: 'select',
      options: ALL_PROTOCOLS,
    },
    variant: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Badge size — sm (8×8), md (10×10), lg (12×12)',
    },
  },
};

// Export the badge meta as a separate default isn't possible in a single file
// so we use named render stories directly with the ProtocolIcon file.

export const BadgeDefault: IconStory = {
  render: () => <ProtocolIconBadge protocol="wireguard" variant="md" />,
  parameters: {
    docs: {
      description: {
        story: 'Default md badge for WireGuard — emerald icon on a tinted emerald background.',
      },
    },
  },
};

export const BadgeAllProtocols: IconStory = {
  render: () => (
    <div className="flex items-center gap-4 flex-wrap">
      {ALL_PROTOCOLS.map((protocol) => (
        <div key={protocol} className="flex flex-col items-center gap-1.5">
          <ProtocolIconBadge protocol={protocol} variant="md" />
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wide">
            {protocol}
          </span>
        </div>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Badge variant for all six protocols — each with its own colour scheme.',
      },
    },
  },
};

export const BadgeSizes: IconStory = {
  render: () => (
    <div className="flex items-end gap-6">
      {(['sm', 'md', 'lg'] as const).map((variant) => (
        <div key={variant} className="flex flex-col items-center gap-1.5">
          <ProtocolIconBadge protocol="wireguard" variant={variant} />
          <span className="text-[10px] font-mono text-muted-foreground">{variant}</span>
        </div>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'sm (32×32 container / 16px icon), md (40×40 / 20px), lg (48×48 / 24px).',
      },
    },
  },
};

export const InContextVPNCard: IconStory = {
  render: () => (
    <div className="w-[320px] rounded-xl border border-border bg-card p-4 space-y-4">
      {(
        [
          { protocol: 'wireguard', name: 'Office WireGuard', clients: 12, status: 'Active' },
          { protocol: 'openvpn',   name: 'Remote Access',   clients: 3,  status: 'Active' },
          { protocol: 'l2tp',      name: 'Legacy L2TP',     clients: 0,  status: 'Disabled' },
        ] as const
      ).map(({ protocol, name, clients, status }) => (
        <div key={protocol} className="flex items-center gap-3">
          <ProtocolIconBadge protocol={protocol} variant="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{name}</p>
            <p className="text-xs text-muted-foreground">{clients} clients · {status}</p>
          </div>
        </div>
      ))}
    </div>
  ),
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'Real-world example: sm ProtocolIconBadge used inside a VPN server list card.',
      },
    },
  },
};
