import React, { useMemo } from 'react';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  FieldRow,
  Inline,
  Input,
  Label,
  PasswordInput,
  Stack,
  Switch,
} from '@nasnet/ui';
import wizardStyles from '../../EasyConfigWizard.module.scss';
import type { InterfaceResponse } from '../../../api';
import type { Action, State } from '../state';
import { generatePassword, generateSsid } from './wifi/generate';
import { GenerateButton } from './wifi/GenerateButton';
import { WirelessPreview } from './wifi/WirelessPreview';
import { Collapsible } from './components/Collapsible';

interface Props {
  state: State;
  dispatch: React.Dispatch<Action>;
  interfaces: InterfaceResponse[];
  footer?: React.ReactNode;
}

interface RadioCapabilities {
  has24: boolean;
  has5: boolean;
}

function detectRadios(interfaces: InterfaceResponse[]): RadioCapabilities {
  const hasWireless = interfaces.some((i) => i.type === 'wireless');
  return { has24: hasWireless, has5: hasWireless };
}

export function WifiStep({ state, dispatch, interfaces, footer }: Props) {
  const radios = useMemo(() => detectRadios(interfaces), [interfaces]);
  const canSplit = radios.has24 && radios.has5;
  const effectiveSplit = state.splitBands && canSplit;

  const set = (field: keyof State) => (e: React.ChangeEvent<HTMLInputElement>) =>
    dispatch({ type: 'setField', field, value: e.target.value });

  const previewBands = effectiveSplit
    ? [
        { ssid: state.ssid, band: '2.4 GHz' },
        { ssid: state.ssid5, band: '5 GHz' },
      ]
    : [{ ssid: state.ssid }];

  return (
    <Card>
      <CardHeader>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 'var(--space-md)',
            width: '100%',
          }}
        >
          <div>
            <CardTitle>Wireless settings</CardTitle>
            <CardDescription>Configure your wireless network.</CardDescription>
          </div>
          <Switch
            label={state.wifiEnabled ? 'Enabled' : 'Disabled'}
            checked={state.wifiEnabled}
            onChange={(e) =>
              dispatch({ type: 'setField', field: 'wifiEnabled', value: e.target.checked })
            }
          />
        </div>
      </CardHeader>
      <div className={wizardStyles.modeLayout}>
        <Stack>
          <Collapsible open={state.wifiEnabled}>
            <Stack>
              {/* <FieldRow>
                <Label>
                  <span>Select Wireless Interface</span>
                  <Select
                    aria-label="Wireless interface"
                    value={state.wifiInterface}
                    onChange={(v) =>
                      dispatch({ type: 'setField', field: 'wifiInterface', value: v })
                    }
                    options={wirelessOptions}
                  />
                </Label>
              </FieldRow> */}
              <Inline>
                <Switch
                  label="Split 2.4 / 5 GHz"
                  checked={effectiveSplit}
                  disabled={!canSplit}
                  onChange={(e) =>
                    dispatch({ type: 'setField', field: 'splitBands', value: e.target.checked })
                  }
                />
              </Inline>

              <FieldRow>
                <Label>
                  <span>{effectiveSplit ? '2.4 GHz SSID' : 'Network name (SSID)'}</span>
                  <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
                    <Input
                      value={state.ssid}
                      onChange={set('ssid')}
                      aria-label={effectiveSplit ? '2.4 GHz SSID' : 'SSID'}
                      style={{ flex: 1 }}
                    />
                    <GenerateButton
                      ariaLabel="Generate SSID"
                      onClick={() =>
                        dispatch({ type: 'setField', field: 'ssid', value: generateSsid() })
                      }
                    />
                  </div>
                </Label>
              </FieldRow>
              <FieldRow>
                <Label>
                  <span>{effectiveSplit ? '2.4 GHz password' : 'Network password'}</span>
                  <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
                    <PasswordInput
                      value={state.wifiPassword}
                      onChange={set('wifiPassword')}
                      aria-label={effectiveSplit ? '2.4 GHz password' : 'Password'}
                      style={{ flex: 1 }}
                    />
                    <GenerateButton
                      ariaLabel="Generate password"
                      onClick={() =>
                        dispatch({
                          type: 'setField',
                          field: 'wifiPassword',
                          value: generatePassword(),
                        })
                      }
                    />
                  </div>
                </Label>
              </FieldRow>

              <Collapsible open={effectiveSplit}>
                <>
                  <FieldRow>
                    <Label>
                      <span>5 GHz SSID</span>
                      <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
                        <Input
                          value={state.ssid5}
                          onChange={set('ssid5')}
                          aria-label="5 GHz SSID"
                          style={{ flex: 1 }}
                        />
                        <GenerateButton
                          ariaLabel="Generate 5 GHz SSID"
                          onClick={() =>
                            dispatch({ type: 'setField', field: 'ssid5', value: generateSsid() })
                          }
                        />
                      </div>
                    </Label>
                  </FieldRow>
                  <FieldRow>
                    <Label>
                      <span>5 GHz password</span>
                      <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
                        <PasswordInput
                          value={state.wifiPassword5}
                          onChange={set('wifiPassword5')}
                          aria-label="5 GHz password"
                          style={{ flex: 1 }}
                        />
                        <GenerateButton
                          ariaLabel="Generate 5 GHz password"
                          onClick={() =>
                            dispatch({
                              type: 'setField',
                              field: 'wifiPassword5',
                              value: generatePassword(),
                            })
                          }
                        />
                      </div>
                    </Label>
                  </FieldRow>
                </>
              </Collapsible>
            </Stack>
          </Collapsible>
        </Stack>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <WirelessPreview bands={previewBands} enabled={state.wifiEnabled} />
        </div>
      </div>
      {footer}
    </Card>
  );
}
