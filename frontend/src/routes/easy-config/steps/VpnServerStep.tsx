import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Globe, Lock, Server } from 'lucide-react';
import { Card, CardDescription, CardHeader, CardTitle, Inline, Stack, Switch } from '@nasnet/ui';
import type { Action, State, VpnServerProtocol } from '../state';
import { ProtocolTilePicker, type ProtocolTile } from './components/ProtocolTilePicker';
import { VpnServerFields } from './vpnsrv/VpnServerFields';
import { FirstUserForm } from './vpnsrv/FirstUserForm';

const TILES: Array<ProtocolTile<VpnServerProtocol>> = [
  {
    value: 'wireguard',
    label: 'WireGuard',
    description: 'Fast, modern VPN with state-of-the-art cryptography.',
    icon: <Lock size={20} strokeWidth={1.75} />,
    recommended: true,
  },
  {
    value: 'openvpn',
    label: 'OpenVPN',
    description: 'Battle-tested, broad client support.',
    icon: <Server size={20} strokeWidth={1.75} />,
  },
  {
    value: 'l2tp',
    label: 'L2TP',
    description: 'Widely supported protocol with IPsec encryption.',
    icon: <Globe size={20} strokeWidth={1.75} />,
  },
];

interface Props {
  state: State;
  dispatch: React.Dispatch<Action>;
  routerId?: string;
  footer?: React.ReactNode;
}

export function VpnServerStep({ state, dispatch, routerId, footer }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>VPN server</CardTitle>
        <CardDescription>
          Run this router as a VPN server. Configure the first user here; add more on the VPN page.
        </CardDescription>
      </CardHeader>
      <Stack>
        <Inline>
          <Switch
            label="Enable VPN listener"
            checked={state.vpnServerEnabled}
            onChange={(e) =>
              dispatch({ type: 'setField', field: 'vpnServerEnabled', value: e.target.checked })
            }
          />
        </Inline>
        {state.vpnServerEnabled ? (
          <>
            <ProtocolTilePicker
              ariaLabel="VPN server protocol"
              value={state.vpnServerProtocol}
              tiles={TILES}
              onChange={(next) =>
                dispatch({ type: 'setField', field: 'vpnServerProtocol', value: next })
              }
            />
            <VpnServerFields state={state} dispatch={dispatch} />
            <FirstUserForm state={state} dispatch={dispatch} />
            {routerId ? (
              <Inline>
                <Link
                  to={`/router/${routerId}/vpn`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 'var(--font-sm)',
                    color: 'var(--color-primary)',
                    textDecoration: 'none',
                  }}
                >
                  Manage additional users on the VPN page
                  <ArrowRight size={14} strokeWidth={2} />
                </Link>
              </Inline>
            ) : null}
          </>
        ) : null}
      </Stack>
      {footer}
    </Card>
  );
}
