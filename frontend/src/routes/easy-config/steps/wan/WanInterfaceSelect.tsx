import React, { useEffect, useMemo } from 'react';
import { EthernetPort, Radio, Smartphone, Wifi } from 'lucide-react';
import { FieldRow, Label, SectionHeading, Select, Skeleton, Stack } from '@nasnet/ui';
import type { InterfaceResponse } from '../../../../api';
import type { Action, InterfaceType, State } from '../../state';
import { InterfaceTypePicker } from '../components/InterfaceTypePicker';
import { Collapsible } from '../components/Collapsible';
import { WanWirelessFields } from './WanWirelessFields';

const WIRELESS_BE_TYPES = new Set(['wifi', 'wireless', 'wlan', 'w60g']);

export function interfaceIcon(type: InterfaceType): React.ReactNode {
  if (type === 'wireless') return <Wifi size={12} strokeWidth={2} />;
  if (type === 'sfp') return <Radio size={12} strokeWidth={2} />;
  if (type === 'lte') return <Smartphone size={12} strokeWidth={2} />;
  return <EthernetPort size={12} strokeWidth={2} />;
}

function isSfp(iface: InterfaceResponse): boolean {
  const haystack = `${iface.defaultName ?? ''} ${iface.name ?? ''}`.toLowerCase();
  return haystack.includes('sfp');
}

export function classifyInterface(iface: InterfaceResponse): InterfaceType | null {
  const beType = (iface.type ?? '').toLowerCase();
  if (beType === 'ether') return isSfp(iface) ? 'sfp' : 'ethernet';
  if (WIRELESS_BE_TYPES.has(beType)) return 'wireless';
  if (beType === 'lte') return 'lte';
  return null;
}

export function interfacesOfType(
  list: InterfaceResponse[],
  type: InterfaceType,
): InterfaceResponse[] {
  return list.filter((i) => classifyInterface(i) === type);
}

const TYPE_ORDER: InterfaceType[] = ['ethernet', 'wireless', 'sfp', 'lte'];

export function availableInterfaceTypes(list: InterfaceResponse[]): InterfaceType[] {
  return TYPE_ORDER.filter((t) => interfacesOfType(list, t).length > 0);
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
    ...interfacesOfType(list, type)
      .filter((i) => !exclude || i.name !== exclude)
      .map((i) => ({ value: i.name, label: i.name })),
  ];
}

interface Props {
  state: State;
  dispatch: React.Dispatch<Action>;
  interfaces: InterfaceResponse[];
  availableTypes: InterfaceType[];
  loading?: boolean;
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
  availableTypes,
  loading,
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

  useEffect(() => {
    if (availableTypes.length === 0) return;
    if (!availableTypes.includes(type)) {
      dispatch({ type: 'setField', field: typeField, value: availableTypes[0] });
      dispatch({ type: 'setField', field: nameField, value: '' });
    }
  }, [availableTypes, type, dispatch, typeField, nameField]);

  if (loading) {
    return (
      <Stack>
        <SectionHeading>{heading}</SectionHeading>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            gap: 'var(--space-md)',
          }}
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height={72} radius="var(--radius-md)" />
          ))}
        </div>
        <Skeleton height={14} width={120} />
        <Skeleton height={40} radius="var(--radius-md)" />
      </Stack>
    );
  }

  return (
    <Stack>
      <SectionHeading>{heading}</SectionHeading>
      <InterfaceTypePicker
        value={type}
        availableTypes={availableTypes}
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
          interfaceName={state[nameField]}
        />
      </Collapsible>
    </Stack>
  );
}
