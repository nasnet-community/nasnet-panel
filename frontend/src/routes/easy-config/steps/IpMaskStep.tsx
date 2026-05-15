import React from 'react';
import {
  EthernetPort,
  Globe,
  Laptop,
  Lock,
  SatelliteDish,
  Server,
  Shield,
  Wifi,
} from 'lucide-react';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  DualLinkFlow,
  FlowDiagram,
  Stack,
} from '@nasnet/ui';
import wizardStyles from '../../EasyConfigWizard.module.scss';
import type { Action, State } from '../state';
import { IpMaskL2tpFields } from './ipmask/IpMaskL2tpFields';
import { IpMaskWireguardConfig } from './ipmask/IpMaskWireguardConfig';
import { ProtocolTilePicker, type ProtocolTile } from './components/ProtocolTilePicker';

type IpMaskKind = State['ipMaskKind'];

const TILES: Array<ProtocolTile<IpMaskKind>> = [
  {
    value: 'wireguard',
    label: 'WireGuard',
    description: 'Fast, modern VPN with state-of-the-art cryptography.',
    icon: <Shield size={20} strokeWidth={1.75} />,
    recommended: true,
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
  footer?: React.ReactNode;
}

function vpnBadge(kind: State['ipMaskKind']) {
  return {
    icon: <Lock size={12} strokeWidth={2.5} />,
    label: kind === 'wireguard' ? 'WireGuard' : 'L2TP',
  };
}

function interfaceIcon(type: State['starlinkInterfaceType']): React.ReactNode {
  if (type === 'wireless') return <Wifi size={12} strokeWidth={2} />;
  return <EthernetPort size={12} strokeWidth={2} />;
}

function starlinkFlowNodes(
  starlinkInterface: string | undefined,
  type: State['starlinkInterfaceType'],
  kind: State['ipMaskKind'],
) {
  return [
    { id: 'user', icon: <Laptop size={32} strokeWidth={1.75} />, label: 'USER' },
    { id: 'router', icon: <Wifi size={32} strokeWidth={1.75} />, label: 'Router' },
    {
      id: 'wan',
      icon: <SatelliteDish size={32} strokeWidth={1.75} />,
      label: 'Starlink',
      sublabel: starlinkInterface,
      sublabelIcon: starlinkInterface ? interfaceIcon(type) : undefined,
      selected: Boolean(starlinkInterface),
      badge: vpnBadge(kind),
    },
    { id: 'site', icon: <Server size={32} strokeWidth={1.75} />, label: 'Foreign Site' },
  ];
}

export function IpMaskStep({ state, dispatch, footer }: Props) {
  const isDual = state.mode === 'dual-link';
  return (
    <Card>
      <CardHeader>
        <CardTitle>Starlink IP-mask VPN client</CardTitle>
        <CardDescription>
          Your use of Starlink can be traced back to your identity. Configure a single VPN client to
          conceal your Starlink IP.
        </CardDescription>
      </CardHeader>
      <div className={wizardStyles.modeLayout}>
        <Stack>
          <ProtocolTilePicker
            ariaLabel="IP-mask protocol"
            value={state.ipMaskKind}
            tiles={TILES}
            onChange={(next) => dispatch({ type: 'setField', field: 'ipMaskKind', value: next })}
          />
          {state.ipMaskKind === 'wireguard' ? (
            <IpMaskWireguardConfig state={state} dispatch={dispatch} />
          ) : (
            <IpMaskL2tpFields state={state} dispatch={dispatch} />
          )}
          {footer}
        </Stack>
        <div className={`${wizardStyles.flowStage} ${wizardStyles.flowStageLarge}`}>
          <div className={wizardStyles.flowItem}>
            {isDual ? (
              <DualLinkFlow
                focus="starlink"
                starlinkInterface={state.starlinkInterface || undefined}
                domesticInterface={state.domesticInterface || undefined}
                starlinkInterfaceIcon={
                  state.starlinkInterface ? interfaceIcon(state.starlinkInterfaceType) : undefined
                }
                domesticInterfaceIcon={
                  state.domesticInterface ? interfaceIcon(state.domesticInterfaceType) : undefined
                }
                starlinkBadge={vpnBadge(state.ipMaskKind)}
              />
            ) : (
              <FlowDiagram
                ariaLabel="Starlink IP-mask flow"
                nodes={starlinkFlowNodes(
                  state.starlinkInterface || undefined,
                  state.starlinkInterfaceType,
                  state.ipMaskKind,
                )}
              />
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
