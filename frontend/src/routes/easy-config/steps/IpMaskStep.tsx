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
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
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

const protocolTiles = (t: TFunction<'easyConfig'>): Array<ProtocolTile<IpMaskKind>> => [
  {
    value: 'wireguard',
    label: 'WireGuard',
    description: t('ipMask.wireguardDescription'),
    icon: <Shield size={20} strokeWidth={1.75} />,
    recommended: true,
  },
  {
    value: 'l2tp',
    label: 'L2TP',
    description: t('ipMask.l2tpDescription'),
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
  t: TFunction<'easyConfig'>,
  starlinkInterface: string | undefined,
  type: State['starlinkInterfaceType'],
  kind: State['ipMaskKind'],
) {
  return [
    { id: 'user', icon: <Laptop size={32} strokeWidth={1.75} />, label: t('flow.user') },
    { id: 'router', icon: <Wifi size={32} strokeWidth={1.75} />, label: t('flow.router') },
    {
      id: 'wan',
      icon: <SatelliteDish size={32} strokeWidth={1.75} />,
      label: t('flow.starlink'),
      sublabel: starlinkInterface,
      sublabelIcon: starlinkInterface ? interfaceIcon(type) : undefined,
      selected: Boolean(starlinkInterface),
      badge: vpnBadge(kind),
    },
    { id: 'site', icon: <Server size={32} strokeWidth={1.75} />, label: t('flow.foreignSite') },
  ];
}

export function IpMaskStep({ state, dispatch, footer }: Props) {
  const { t } = useTranslation('easyConfig');
  const isDual = state.mode === 'dual-link';
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('ipMask.title')}</CardTitle>
        <CardDescription>{t('ipMask.description')}</CardDescription>
      </CardHeader>
      <div className={wizardStyles.modeLayout}>
        <Stack>
          <ProtocolTilePicker
            ariaLabel={t('ipMask.protocolAria')}
            value={state.ipMaskKind}
            tiles={protocolTiles(t)}
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
                ariaLabel={t('flow.ipMaskAria')}
                nodes={starlinkFlowNodes(
                  t,
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
