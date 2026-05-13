import React from 'react';
import { Globe, Lock } from 'lucide-react';
import { Card, CardDescription, CardHeader, CardTitle, Stack } from '@nasnet/ui';
import type { Action, State } from '../state';
import { IpMaskL2tpFields } from './ipmask/IpMaskL2tpFields';
import { IpMaskWireguardFields } from './ipmask/IpMaskWireguardFields';
import { HyperSpeedPromoCard } from './ipmask/HyperSpeedPromoCard';
import { ProtocolTilePicker, type ProtocolTile } from './components/ProtocolTilePicker';

type IpMaskKind = State['ipMaskKind'];

const TILES: Array<ProtocolTile<IpMaskKind>> = [
  {
    value: 'wireguard',
    label: 'WireGuard',
    description: 'Fast, modern VPN with state-of-the-art cryptography.',
    icon: <Lock size={20} strokeWidth={1.75} />,
    recommended: true,
  },
  {
    value: 'l2tp',
    label: 'L2TP',
    description: 'Widely supported protocol with IPSec encryption.',
    icon: <Globe size={20} strokeWidth={1.75} />,
  },
];

interface Props {
  state: State;
  dispatch: React.Dispatch<Action>;
  footer?: React.ReactNode;
}

export function IpMaskStep({ state, dispatch, footer }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Starlink IP-mask VPN client</CardTitle>
        <CardDescription>
          Your use of Starlink can be traced back to your identity. Configure a single VPN client to
          conceal your Starlink IP.
        </CardDescription>
      </CardHeader>
      <Stack>
        <HyperSpeedPromoCard />
        <ProtocolTilePicker
          ariaLabel="IP-mask protocol"
          value={state.ipMaskKind}
          tiles={TILES}
          onChange={(next) => dispatch({ type: 'setField', field: 'ipMaskKind', value: next })}
        />
        {state.ipMaskKind === 'wireguard' ? (
          <IpMaskWireguardFields state={state} dispatch={dispatch} />
        ) : (
          <IpMaskL2tpFields state={state} dispatch={dispatch} />
        )}
      </Stack>
      {footer}
    </Card>
  );
}
