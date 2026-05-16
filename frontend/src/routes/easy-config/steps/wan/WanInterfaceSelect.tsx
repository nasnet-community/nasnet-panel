import React, { useMemo } from 'react';
import { EthernetPort, Radio, Smartphone, Wifi } from 'lucide-react';
import { FieldRow, Label, SectionHeading, Select, Stack } from '@nasnet/ui';
import type { InterfaceResponse } from '../../../../api';
import type { Action, InterfaceType, State } from '../../state';
import { InterfaceTypePicker } from '../components/InterfaceTypePicker';
import { Collapsible } from '../components/Collapsible';
import { WanWirelessFields } from './WanWirelessFields';

const FIXED_WIRELESS = ['Wifi2.4', 'Wifi5', 'Wifi6'];
const FIXED_SFP = ['sfp1', 'sfp-sfpplus1'];
const FIXED_LTE = ['lte1'];

export function interfaceIcon(type: InterfaceType): React.ReactNode {
  if (type === 'wireless') return <Wifi size={12} strokeWidth={2} />;
  if (type === 'sfp') return <Radio size={12} strokeWidth={2} />;
  if (type === 'lte') return <Smartphone size={12} strokeWidth={2} />;
  return <EthernetPort size={12} strokeWidth={2} />;
}

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

interface Props {
  state: State;
  dispatch: React.Dispatch<Action>;
  interfaces: InterfaceResponse[];
  heading: string;
  ariaLabel: string;
  typeField: 'starlinkInterfaceType' | 'domesticInterfaceType';
  nameField: 'starlinkInterface' | 'domesticInterface';
  excludeName?: string;
  ssidField: 'starlinkWanSsid' | 'domesticWanSsid';
  passwordField: 'starlinkWanPassword' | 'domesticWanPassword';
  wirelessLabel: string;
}

export function WanInterfaceSelect({
  state,
  dispatch,
  interfaces,
  heading,
  ariaLabel,
  typeField,
  nameField,
  excludeName,
  ssidField,
  passwordField,
  wirelessLabel,
}: Props) {
  const type = state[typeField];
  const options = useMemo(
    () => ifaceOptions(interfaces, type, excludeName),
    [interfaces, type, excludeName],
  );

  return (
    <Stack>
      <SectionHeading>{heading}</SectionHeading>
      <InterfaceTypePicker
        value={type}
        onChange={(next) => {
          dispatch({ type: 'setField', field: typeField, value: next });
          dispatch({ type: 'setField', field: nameField, value: '' });
        }}
      />
      <FieldRow>
        <Label>
          <span>{interfaceLabel(type)}</span>
          <Select
            aria-label={ariaLabel}
            value={state[nameField]}
            onChange={(v) => dispatch({ type: 'setField', field: nameField, value: v })}
            options={options}
          />
        </Label>
      </FieldRow>
      <Collapsible open={type === 'wireless'}>
        <WanWirelessFields
          state={state}
          dispatch={dispatch}
          ssidField={ssidField}
          passwordField={passwordField}
          label={wirelessLabel}
        />
      </Collapsible>
    </Stack>
  );
}
