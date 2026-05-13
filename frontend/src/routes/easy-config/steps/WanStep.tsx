import React from 'react';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  FieldRow,
  Label,
  Select,
  Stack,
} from '@nasnet/ui';
import type { Interface } from '../../../api';
import type { Action, InterfaceType, State } from '../state';
import { DomesticSection } from './wan/DomesticSection';
import { InterfaceTypePicker } from './components/InterfaceTypePicker';

interface Props {
  state: State;
  dispatch: React.Dispatch<Action>;
  interfaces: Interface[];
  footer?: React.ReactNode;
}

function filterByType(list: Interface[], type: InterfaceType): Interface[] {
  if (type === 'wireless') return list.filter((i) => i.type === 'wireless');
  return list.filter((i) => i.type === 'ether');
}

export function WanStep({ state, dispatch, interfaces, footer }: Props) {
  const filtered = filterByType(interfaces, state.interfaceType);
  const ifaceOptions = [
    { value: '', label: 'Select interface' },
    ...filtered.map((i) => ({ value: i.name, label: i.name })),
  ];
  return (
    <Card>
      <CardHeader>
        <CardTitle>Foreign network connection</CardTitle>
        <CardDescription>
          Tell us which ports are wired to each uplink, starting with the Starlink interface.
        </CardDescription>
      </CardHeader>
      <Stack>
        <InterfaceTypePicker
          value={state.interfaceType}
          onChange={(next) => {
            dispatch({ type: 'setField', field: 'interfaceType', value: next });
            dispatch({ type: 'setField', field: 'starlinkInterface', value: '' });
          }}
        />
        <FieldRow>
          <Label>
            <span>
              {state.interfaceType === 'wireless' ? 'Wireless interface' : 'Ethernet interface'}
            </span>
            <Select
              aria-label="Starlink WAN"
              value={state.starlinkInterface}
              onChange={(v) => dispatch({ type: 'setField', field: 'starlinkInterface', value: v })}
              options={ifaceOptions}
            />
          </Label>
          {state.mode === 'dual-link' ? (
            <Label>
              <span>Domestic WAN</span>
              <Select
                aria-label="Domestic WAN"
                value={state.domesticInterface}
                onChange={(v) =>
                  dispatch({ type: 'setField', field: 'domesticInterface', value: v })
                }
                options={[
                  { value: '', label: 'Select interface' },
                  ...interfaces
                    .filter((i) => i.type === 'ether')
                    .map((i) => ({ value: i.name, label: i.name })),
                ]}
              />
            </Label>
          ) : null}
        </FieldRow>
        {state.mode === 'dual-link' ? <DomesticSection state={state} dispatch={dispatch} /> : null}
      </Stack>
      {footer}
    </Card>
  );
}
