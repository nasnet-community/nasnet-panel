/**
 * Interface Type Icon Component
 * Displays appropriate icon for each interface type
 */

import {
  Network,
  Layers,
  Tag,
  Wifi,
  Link,
  Shield,
  Lock,
  RefreshCw,
  Signal,
  HelpCircle,
} from 'lucide-react';

import { type InterfaceType } from '@nasnet/core/types';

interface InterfaceTypeIconProps {
  type: InterfaceType;
  className?: string;
}

export function InterfaceTypeIcon({ type, className }: InterfaceTypeIconProps) {
  const iconProps = {
    className: className || 'w-5 h-5 text-muted-foreground',
  };

  switch (type) {
    case 'ether':
      return <Network {...iconProps} />;
    case 'bridge':
      return <Layers {...iconProps} />;
    case 'vlan':
      return <Tag {...iconProps} />;
    case 'wireless':
    case 'wlan':
      return <Wifi {...iconProps} />;
    case 'pppoe':
      return <Link {...iconProps} />;
    case 'vpn':
      return <Shield {...iconProps} />;
    case 'wireguard':
      return <Lock {...iconProps} />;
    case 'loopback':
      return <RefreshCw {...iconProps} />;
    case 'lte':
      return <Signal {...iconProps} />;
    default:
      return <HelpCircle {...iconProps} />;
  }
}
