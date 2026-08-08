import React, { useMemo, useState } from 'react';
import { Laptop, SatelliteDish, Server, Wifi } from 'lucide-react';
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
import type { InterfaceResponse } from '../../../api';
import type { Action, InterfaceType, State } from '../state';
import {
  WanInterfaceSelect,
  availableInterfaceTypes,
  interfaceIcon,
} from './wan/WanInterfaceSelect';

interface Props {
  state: State;
  dispatch: React.Dispatch<Action>;
  interfaces: InterfaceResponse[];
  interfacesLoading?: boolean;
  footer?: React.ReactNode;
}

function starlinkFlowNodes(starlinkInterface: string | undefined, type: InterfaceType) {
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
    },
    { id: 'site', icon: <Server size={32} strokeWidth={1.75} />, label: 'Foreign Site' },
  ];
}

export function WanStep({ state, dispatch, interfaces, interfacesLoading, footer }: Props) {
  const [focus, setFocus] = useState<'starlink' | 'domestic' | undefined>(undefined);
  const isDual = state.mode === 'dual-link';
  const availableTypes = useMemo(() => availableInterfaceTypes(interfaces), [interfaces]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isDual ? 'Dual-Link connection' : 'Starlink-Only connection'}</CardTitle>
        <CardDescription>
          Tell us which ports are wired to each uplink, starting with the{' '}
          {isDual ? 'Domestic' : 'Starlink'} interface.
        </CardDescription>
      </CardHeader>
      <div className={wizardStyles.modeLayout}>
        <Stack onMouseLeave={() => setFocus(undefined)}>
          {isDual ? (
            <section onMouseEnter={() => setFocus('domestic')} onFocus={() => setFocus('domestic')}>
              <WanInterfaceSelect
                state={state}
                dispatch={dispatch}
                interfaces={interfaces}
                availableTypes={availableTypes}
                loading={interfacesLoading}
                heading="Domestic WAN"
                ariaLabel="Domestic WAN"
                typeField="domesticInterfaceType"
                nameField="domesticInterface"
                excludeName={state.starlinkInterface}
                ssidField="domesticWanSsid"
                passwordField="domesticWanPassword"
                wirelessLabel="Domestic wireless"
              />
            </section>
          ) : null}

          <section onMouseEnter={() => setFocus('starlink')} onFocus={() => setFocus('starlink')}>
            <WanInterfaceSelect
              state={state}
              dispatch={dispatch}
              interfaces={interfaces}
              availableTypes={availableTypes}
              loading={interfacesLoading}
              heading="Starlink WAN"
              ariaLabel="Starlink WAN"
              typeField="starlinkInterfaceType"
              nameField="starlinkInterface"
              excludeName={state.domesticInterface}
              ssidField="starlinkWanSsid"
              passwordField="starlinkWanPassword"
              wirelessLabel="Starlink wireless"
            />
          </section>
          {footer}
        </Stack>
        <div
          className={
            isDual
              ? `${wizardStyles.flowStage} ${wizardStyles.flowStageLarge}`
              : wizardStyles.flowStage
          }
        >
          <div className={wizardStyles.flowItem}>
            {isDual ? (
              <DualLinkFlow
                focus={focus}
                starlinkInterface={state.starlinkInterface || undefined}
                domesticInterface={state.domesticInterface || undefined}
                starlinkInterfaceIcon={
                  state.starlinkInterface ? interfaceIcon(state.starlinkInterfaceType) : undefined
                }
                domesticInterfaceIcon={
                  state.domesticInterface ? interfaceIcon(state.domesticInterfaceType) : undefined
                }
              />
            ) : (
              <FlowDiagram
                ariaLabel="Starlink-only traffic flow"
                nodes={starlinkFlowNodes(
                  state.starlinkInterface || undefined,
                  state.starlinkInterfaceType,
                )}
              />
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
