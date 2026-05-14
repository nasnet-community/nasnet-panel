import React from 'react';
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

type BandKey = '24' | '5' | '6';
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

export function WifiStep({ state, dispatch, footer }: Props) {
  const setText = (field: keyof State) => (e: React.ChangeEvent<HTMLInputElement>) =>
    dispatch({ type: 'setField', field, value: e.target.value });
  const anyEnabled = BANDS.some((b) => state[b.enabledField]);
  const previewBands = BANDS.filter((b) => state[b.enabledField]).map((b) => ({
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
          {BANDS.map((band) => {
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
