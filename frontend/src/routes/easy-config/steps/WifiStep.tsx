import React, { useMemo } from 'react';
import {
  Button,
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
import { Sparkles } from 'lucide-react';
import type { Interface } from '../../../api';
import type { Action, State } from '../state';
import { generatePassword, generateSsid } from './wifi/generate';

interface Props {
  state: State;
  dispatch: React.Dispatch<Action>;
  interfaces: Interface[];
  footer?: React.ReactNode;
}

interface RadioCapabilities {
  has24: boolean;
  has5: boolean;
}

function detectRadios(interfaces: Interface[]): RadioCapabilities {
  const radios = interfaces.filter((i) => i.type === 'wireless');
  const bands = new Set(radios.map((r) => r.band).filter(Boolean));
  if (radios.length === 0) return { has24: true, has5: true };
  return {
    has24: bands.has('2.4ghz') || radios.some((r) => !r.band),
    has5: bands.has('5ghz') || bands.has('6ghz') || radios.some((r) => !r.band),
  };
}

export function WifiStep({ state, dispatch, interfaces, footer }: Props) {
  const radios = useMemo(() => detectRadios(interfaces), [interfaces]);
  const canSplit = radios.has24 && radios.has5;
  const effectiveSplit = state.splitBands && canSplit;

  const set = (field: keyof State) => (e: React.ChangeEvent<HTMLInputElement>) =>
    dispatch({ type: 'setField', field, value: e.target.value });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Wireless settings</CardTitle>
        <CardDescription>
          Configure your wireless network. Avoid words like "starlink", "VPN", or "Iran" in the
          SSID.
        </CardDescription>
      </CardHeader>
      <Stack>
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
            <Input
              value={state.ssid}
              onChange={set('ssid')}
              aria-label={effectiveSplit ? '2.4 GHz SSID' : 'SSID'}
            />
          </Label>
          <Button
            type="button"
            variant="secondary"
            onClick={() => dispatch({ type: 'setField', field: 'ssid', value: generateSsid() })}
          >
            <Sparkles size={14} strokeWidth={2} /> Generate SSID
          </Button>
        </FieldRow>
        <FieldRow>
          <Label>
            <span>{effectiveSplit ? '2.4 GHz password' : 'Network password'}</span>
            <PasswordInput
              value={state.wifiPassword}
              onChange={set('wifiPassword')}
              aria-label={effectiveSplit ? '2.4 GHz password' : 'Password'}
            />
          </Label>
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              dispatch({ type: 'setField', field: 'wifiPassword', value: generatePassword() })
            }
          >
            <Sparkles size={14} strokeWidth={2} /> Generate pass
          </Button>
        </FieldRow>

        {effectiveSplit ? (
          <>
            <FieldRow>
              <Label>
                <span>5 GHz SSID</span>
                <Input value={state.ssid5} onChange={set('ssid5')} aria-label="5 GHz SSID" />
              </Label>
              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  dispatch({ type: 'setField', field: 'ssid5', value: generateSsid() })
                }
              >
                <Sparkles size={14} strokeWidth={2} /> Generate SSID
              </Button>
            </FieldRow>
            <FieldRow>
              <Label>
                <span>5 GHz password</span>
                <PasswordInput
                  value={state.wifiPassword5}
                  onChange={set('wifiPassword5')}
                  aria-label="5 GHz password"
                />
              </Label>
              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  dispatch({
                    type: 'setField',
                    field: 'wifiPassword5',
                    value: generatePassword(),
                  })
                }
              >
                <Sparkles size={14} strokeWidth={2} /> Generate pass
              </Button>
            </FieldRow>
          </>
        ) : null}
      </Stack>
      {footer}
    </Card>
  );
}
