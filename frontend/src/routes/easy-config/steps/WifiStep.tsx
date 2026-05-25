import React, { useEffect, useMemo } from 'react';
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
import type { WifiInterfaceResponse } from '../../../api';
import type { Action, State } from '../state';
import { generatePassword, generateSsid } from './wifi/generate';
import { GenerateButton } from './wifi/GenerateButton';
import { WirelessPreview } from './wifi/WirelessPreview';
import { Collapsible } from './components/Collapsible';

interface Props {
  state: State;
  dispatch: React.Dispatch<Action>;
  wifiInterfaces: WifiInterfaceResponse[];
  footer?: React.ReactNode;
}

type BandKey = '24' | '5' | '6';

function bandKeyFor(wi: WifiInterfaceResponse): BandKey | null {
  const b = (wi.band ?? '').toLowerCase();
  if (b.startsWith('2')) return '24';
  if (b.startsWith('5')) return '5';
  if (b.startsWith('6')) return '6';
  const f = Number(wi.frequency);
  if (Number.isFinite(f)) {
    if (f >= 2400 && f < 2500) return '24';
    if (f >= 5000 && f < 5925) return '5';
    if (f >= 5925) return '6';
  }
  return null;
}
interface BandSpec {
  key: BandKey;
  label: string;
  enabledField: 'wifi24Enabled' | 'wifi5Enabled' | 'wifi6Enabled';
  ssidField: 'ssid' | 'ssid5' | 'ssid6';
  passwordField: 'wifiPassword' | 'wifiPassword5' | 'wifiPassword6';
}

const BANDS: BandSpec[] = [
  {
    key: '24',
    label: '2.4 GHz',
    enabledField: 'wifi24Enabled',
    ssidField: 'ssid',
    passwordField: 'wifiPassword',
  },
  {
    key: '5',
    label: '5 GHz',
    enabledField: 'wifi5Enabled',
    ssidField: 'ssid5',
    passwordField: 'wifiPassword5',
  },
  {
    key: '6',
    label: '6 GHz',
    enabledField: 'wifi6Enabled',
    ssidField: 'ssid6',
    passwordField: 'wifiPassword6',
  },
];

export function WifiStep({ state, dispatch, wifiInterfaces, footer }: Props) {
  const setText = (field: keyof State) => (e: React.ChangeEvent<HTMLInputElement>) =>
    dispatch({ type: 'setField', field, value: e.target.value });

  const availableBands = useMemo<BandKey[]>(() => {
    const set = new Set<BandKey>();
    for (const wi of wifiInterfaces) {
      const key = bandKeyFor(wi);
      if (key) set.add(key);
    }
    const order: BandKey[] = ['24', '5', '6'];
    return order.filter((k) => set.has(k));
  }, [wifiInterfaces]);

  const visibleBands = BANDS.filter((b) => availableBands.includes(b.key));

  useEffect(() => {
    for (const band of BANDS) {
      if (!availableBands.includes(band.key) && state[band.enabledField]) {
        dispatch({ type: 'setField', field: band.enabledField, value: false });
      }
    }
  }, [availableBands, state, dispatch]);

  const anyEnabled = visibleBands.some((b) => state[b.enabledField]);
  const previewBands = visibleBands
    .filter((b) => state[b.enabledField])
    .map((b) => ({
      ssid: state[b.ssidField] as string,
      band: b.label,
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Wireless settings</CardTitle>
        <CardDescription>
          Toggle each band on independently. Avoid words like &quot;starlink&quot;, &quot;VPN&quot;,
          or &quot;Iran&quot; in the SSID.
        </CardDescription>
      </CardHeader>
      <div className={wizardStyles.modeLayout}>
        <Stack>
          {visibleBands.map((band) => {
            const isOn = state[band.enabledField];
            return (
              <Stack key={band.key}>
                <Inline>
                  <Switch
                    label={`${band.label} ${isOn ? 'enabled' : 'disabled'}`}
                    checked={isOn}
                    onChange={(e) =>
                      dispatch({
                        type: 'setField',
                        field: band.enabledField,
                        value: e.target.checked,
                      })
                    }
                  />
                </Inline>
                <Collapsible open={isOn}>
                  <Stack>
                    <FieldRow>
                      <Label>
                        <span>{band.label} SSID</span>
                        <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
                          <Input
                            value={state[band.ssidField]}
                            onChange={setText(band.ssidField)}
                            aria-label={`${band.label} SSID`}
                            style={{ flex: 1 }}
                          />
                          <GenerateButton
                            ariaLabel={`Generate ${band.label} SSID`}
                            onClick={() =>
                              dispatch({
                                type: 'setField',
                                field: band.ssidField,
                                value: generateSsid(),
                              })
                            }
                          />
                        </div>
                      </Label>
                    </FieldRow>
                    <FieldRow>
                      <Label>
                        <span>{band.label} password</span>
                        <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
                          <PasswordInput
                            value={state[band.passwordField]}
                            onChange={setText(band.passwordField)}
                            aria-label={`${band.label} password`}
                            style={{ flex: 1 }}
                          />
                          <GenerateButton
                            ariaLabel={`Generate ${band.label} password`}
                            onClick={() =>
                              dispatch({
                                type: 'setField',
                                field: band.passwordField,
                                value: generatePassword(),
                              })
                            }
                          />
                        </div>
                      </Label>
                    </FieldRow>
                  </Stack>
                </Collapsible>
              </Stack>
            );
          })}
        </Stack>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <WirelessPreview bands={previewBands} enabled={anyEnabled} />
        </div>
      </div>
      {footer}
    </Card>
  );
}
