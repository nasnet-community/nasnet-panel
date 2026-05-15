import React, { useMemo, useState } from 'react';
import { EthernetPort, Laptop, Radio, SatelliteDish, Server, Smartphone, Wifi } from 'lucide-react';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  DualLinkFlow,
  FieldRow,
  FlowDiagram,
  Label,
  SectionHeading,
  Select,
  Stack,
} from '@nasnet/ui';
import wizardStyles from '../../EasyConfigWizard.module.scss';
import type { InterfaceResponse } from '../../../api';
import type { Action, InterfaceType, State } from '../state';
import { InterfaceTypePicker } from './components/InterfaceTypePicker';
import { Collapsible } from './components/Collapsible';
import { WanWirelessFields } from './wan/WanWirelessFields';

interface Props {
  state: State;
  dispatch: React.Dispatch<Action>;
  interfaces: InterfaceResponse[];
  footer?: React.ReactNode;
}

function interfaceIcon(type: InterfaceType): React.ReactNode {
  if (type === 'wireless') return <Wifi size={12} strokeWidth={2} />;
  if (type === 'sfp') return <Radio size={12} strokeWidth={2} />;
  if (type === 'lte') return <Smartphone size={12} strokeWidth={2} />;
  return <EthernetPort size={12} strokeWidth={2} />;
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

const FIXED_WIRELESS = ['Wifi2.4', 'Wifi5', 'Wifi6'];
const FIXED_SFP = ['sfp1', 'sfp-sfpplus1'];
const FIXED_LTE = ['lte1'];

function interfaceNames(list: InterfaceResponse[], type: InterfaceType): string[] {
  if (type === 'wireless') return FIXED_WIRELESS;
  if (type === 'sfp') return FIXED_SFP;
  if (type === 'lte') return FIXED_LTE;
  return list.filter((i) => i.type === 'ether').map((i) => i.name);
}

function interfaceLabel(type: InterfaceType): string {
  if (type === 'wireless') return 'Wireless interface';
  if (type === 'sfp') return 'SFP interface';
  if (type === 'lte') return 'LTE interface';
  return 'Ethernet interface';
}

function ifaceOptions(list: InterfaceResponse[], type: InterfaceType, exclude?: string) {
  return [
    { value: '', label: 'Select interface' },
    ...interfaceNames(list, type)
      .filter((name) => !exclude || name !== exclude)
      .map((name) => ({ value: name, label: name })),
  ];
}

export function WanStep({ state, dispatch, interfaces, footer }: Props) {
  const [focus, setFocus] = useState<'starlink' | 'domestic' | undefined>(undefined);
  const isDual = state.mode === 'dual-link';
  const starlinkInterfaces = useMemo(
    () => ifaceOptions(interfaces, state.starlinkInterfaceType, state.domesticInterface),
    [interfaces, state.starlinkInterfaceType, state.domesticInterface],
  );
  const domesticInterfaces = useMemo(
    () => ifaceOptions(interfaces, state.domesticInterfaceType, state.starlinkInterface),
    [interfaces, state.domesticInterfaceType, state.starlinkInterface],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isDual ? 'Dual-Link connection' : 'Starlink-Only connection'}</CardTitle>
        <CardDescription>
          Tell us which ports are wired to each uplink, starting with the Starlink interface.
        </CardDescription>
      </CardHeader>
      <div className={wizardStyles.modeLayout}>
        <Stack onMouseLeave={() => setFocus(undefined)}>
          <section onMouseEnter={() => setFocus('starlink')} onFocus={() => setFocus('starlink')}>
            <Stack>
              <SectionHeading>Starlink WAN</SectionHeading>
              <InterfaceTypePicker
                value={state.starlinkInterfaceType}
                onChange={(next) => {
                  dispatch({ type: 'setField', field: 'starlinkInterfaceType', value: next });
                  dispatch({ type: 'setField', field: 'starlinkInterface', value: '' });
                }}
              />
              <FieldRow>
                <Label>
                  <span>{interfaceLabel(state.starlinkInterfaceType)}</span>
                  <Select
                    aria-label="Starlink WAN"
                    value={state.starlinkInterface}
                    onChange={(v) =>
                      dispatch({ type: 'setField', field: 'starlinkInterface', value: v })
                    }
                    options={starlinkInterfaces}
                  />
                </Label>
              </FieldRow>
              <Collapsible open={state.starlinkInterfaceType === 'wireless'}>
                <WanWirelessFields
                  state={state}
                  dispatch={dispatch}
                  ssidField="starlinkWanSsid"
                  passwordField="starlinkWanPassword"
                  label="Starlink wireless"
                />
              </Collapsible>
            </Stack>
          </section>

          {isDual ? (
            <section onMouseEnter={() => setFocus('domestic')} onFocus={() => setFocus('domestic')}>
              <Stack>
                <SectionHeading>Domestic WAN</SectionHeading>
                <InterfaceTypePicker
                  value={state.domesticInterfaceType}
                  onChange={(next) => {
                    dispatch({ type: 'setField', field: 'domesticInterfaceType', value: next });
                    dispatch({ type: 'setField', field: 'domesticInterface', value: '' });
                  }}
                />
                <FieldRow>
                  <Label>
                    <span>{interfaceLabel(state.domesticInterfaceType)}</span>
                    <Select
                      aria-label="Domestic WAN"
                      value={state.domesticInterface}
                      onChange={(v) =>
                        dispatch({ type: 'setField', field: 'domesticInterface', value: v })
                      }
                      options={domesticInterfaces}
                    />
                  </Label>
                </FieldRow>
                <Collapsible open={state.domesticInterfaceType === 'wireless'}>
                  <WanWirelessFields
                    state={state}
                    dispatch={dispatch}
                    ssidField="domesticWanSsid"
                    passwordField="domesticWanPassword"
                    label="Domestic wireless"
                  />
                </Collapsible>
              </Stack>
            </section>
          ) : null}
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
