import React from 'react';
import { Laptop, SatelliteDish, Server, Wifi } from 'lucide-react';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  DualLinkFlow,
  FlowDiagram,
  RadioGroup,
} from '@nasnet/ui';
import styles from '../../EasyConfigWizard.module.scss';
import type { Action, Mode, State } from '../state';

const MODE_OPTIONS = [
  {
    value: 'dual-link',
    label: 'Dual-Link',
    description: 'Starlink + Domestic uplink (DHCP, Static, or PPPoE)',
  },
  {
    value: 'starlink-only',
    label: 'Starlink-Only',
    description: 'Only a Starlink uplink for this router',
  },
];

const STARLINK_FLOW_NODES = [
  { id: 'user', icon: <Laptop size={32} strokeWidth={1.75} />, label: 'USER' },
  { id: 'router', icon: <Wifi size={32} strokeWidth={1.75} />, label: 'Router' },
  { id: 'wan', icon: <SatelliteDish size={32} strokeWidth={1.75} />, label: 'Starlink' },
  { id: 'site', icon: <Server size={32} strokeWidth={1.75} />, label: 'Foreign Site' },
];

interface Props {
  state: State;
  dispatch: React.Dispatch<Action>;
  footer?: React.ReactNode;
}

export function ModeStep({ state, dispatch, footer }: Props) {
  const [preview, setPreview] = React.useState<Mode | null>(null);
  const activeMode: Mode = preview ?? state.mode ?? 'starlink-only';
  return (
    <Card>
      <CardHeader>
        <CardTitle>Setup mode</CardTitle>
        <CardDescription>
          Pick how your WAN is wired. We&apos;ll adapt the wizard accordingly.
        </CardDescription>
      </CardHeader>
      <div className={styles.modeLayout}>
        <div className={styles.modeSelect}>
          <RadioGroup
            name="easy-config-mode"
            ariaLabel="Mode"
            value={state.mode ?? ''}
            orientation="column"
            options={MODE_OPTIONS}
            onChange={(v) => dispatch({ type: 'setMode', mode: v as Mode })}
            onOptionHover={(v) => setPreview(v as Mode | null)}
          />
          {footer}
        </div>
        <div className={styles.flowStage}>
          <div className={`${styles.flowZoom} ${preview ? styles.flowZoomActive : ''}`}>
            <div key={activeMode} className={styles.flowItem}>
              {activeMode === 'dual-link' ? (
                <DualLinkFlow />
              ) : (
                <FlowDiagram ariaLabel="Starlink-only traffic flow" nodes={STARLINK_FLOW_NODES} />
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
