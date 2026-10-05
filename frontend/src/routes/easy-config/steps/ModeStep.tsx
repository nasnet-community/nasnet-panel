import React from 'react';
import { Laptop, SatelliteDish, Server, Wifi } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
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

const modeOptions = (t: TFunction<'easyConfig'>) => [
  {
    value: 'dual-link',
    label: t('mode.dualLink.label'),
    description: t('mode.dualLink.description'),
  },
  {
    value: 'starlink-only',
    label: t('mode.starlinkOnly.label'),
    description: t('mode.starlinkOnly.description'),
  },
];

const starlinkFlowNodes = (t: TFunction<'easyConfig'>) => [
  { id: 'user', icon: <Laptop size={32} strokeWidth={1.75} />, label: t('flow.user') },
  { id: 'router', icon: <Wifi size={32} strokeWidth={1.75} />, label: t('flow.router') },
  { id: 'wan', icon: <SatelliteDish size={32} strokeWidth={1.75} />, label: t('flow.starlink') },
  { id: 'site', icon: <Server size={32} strokeWidth={1.75} />, label: t('flow.foreignSite') },
];

interface Props {
  state: State;
  dispatch: React.Dispatch<Action>;
  footer?: React.ReactNode;
}

export function ModeStep({ state, dispatch, footer }: Props) {
  const { t } = useTranslation('easyConfig');
  const [preview, setPreview] = React.useState<Mode | null>(null);
  const activeMode: Mode = preview ?? state.mode ?? 'starlink-only';
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('mode.title')}</CardTitle>
        <CardDescription>{t('mode.description')}</CardDescription>
      </CardHeader>
      <div className={styles.modeLayout}>
        <div className={styles.modeSelect}>
          <RadioGroup
            name="easy-config-mode"
            ariaLabel={t('mode.ariaLabel')}
            value={state.mode ?? ''}
            orientation="column"
            options={modeOptions(t)}
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
                <FlowDiagram ariaLabel={t('flow.starlinkOnlyAria')} nodes={starlinkFlowNodes(t)} />
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
