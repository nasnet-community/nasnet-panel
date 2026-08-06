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
import type { InterfaceResponse, WifiInterfaceResponse } from '../../../api';
import type { Action, State } from '../state';
import { generatePassword, generateSsid } from './wifi/generate';
import { GenerateButton } from './wifi/GenerateButton';
import { WirelessPreview } from './wifi/WirelessPreview';
import { Collapsible } from './components/Collapsible';

interface Props {
  state: State;
  dispatch: React.Dispatch<Action>;
  interfaces: InterfaceResponse[];
  wifiInterfaces: WifiInterfaceResponse[];
  wifiSupported: boolean;
  footer?: React.ReactNode;
}

type BandKey = '24' | '5' | '6';

const BAND_LABELS: Record<BandKey, string> = {
  '24': '2.4 GHz',
  '5': '5 GHz',
  '6': '6 GHz',
};

const BAND_SUFFIXES: Record<BandKey, string> = {
  '24': '2.4G',
  '5': '5G',
  '6': '6G',
};

const WIRELESS_TYPES = ['wireless', 'wifi', 'wlan', 'w60g'];

interface WirelessEntry {
  name: string;
  label: string;
  suffix: string;
}

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

export function WifiStep({
  state,
  dispatch,
  interfaces,
  wifiInterfaces,
  wifiSupported,
  footer,
}: Props) {
  const setText = (field: keyof State) => (e: React.ChangeEvent<HTMLInputElement>) =>
    dispatch({ type: 'setField', field, value: e.target.value });

  const wirelessEntries = useMemo<WirelessEntry[]>(() => {
    const fromList = interfaces
      .filter((i) => WIRELESS_TYPES.includes(i.type))
      .map((i) => {
        const wi = wifiInterfaces.find((w) => w.name === i.name || w.interface === i.name);
        const band = wi ? bandKeyFor(wi) : null;
        return {
          name: i.name,
          label: band ? BAND_LABELS[band] : i.name,
          suffix: band ? BAND_SUFFIXES[band] : i.name,
        };
      });
    if (fromList.length > 0) return fromList;
    return wifiInterfaces.map((wi) => {
      const band = bandKeyFor(wi);
      return {
        name: wi.name,
        label: band ? BAND_LABELS[band] : wi.name,
        suffix: band ? BAND_SUFFIXES[band] : wi.name,
      };
    });
  }, [interfaces, wifiInterfaces]);

  const multiBand = wirelessEntries.length > 1;
  const split = multiBand && state.wifiSplit;
  const labels = wirelessEntries.map((e) => e.label);
  const bandList = labels.join(', ');

  const previewBands = split
    ? wirelessEntries.map((e) => ({
        id: e.name,
        ssid: state.ssid.trim() ? `${state.ssid}-${e.suffix}` : state.ssid,
        band: e.label,
      }))
    : [{ ssid: state.ssid, band: labels.length > 1 ? bandList : labels[0] }];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Wireless settings</CardTitle>
        <CardDescription>
          {wifiSupported ? (
            <>
              One network name and password for the router&apos;s Wi-Fi. Avoid words like
              &quot;starlink&quot;, &quot;VPN&quot;, or &quot;Iran&quot; in the SSID.
            </>
          ) : (
            'This router has no Wi-Fi hardware, so wireless options are unavailable.'
          )}
        </CardDescription>
      </CardHeader>
      <div className={wizardStyles.modeLayout}>
        <Stack>
          <Inline>
            <Switch
              label={
                wifiSupported
                  ? `Wi-Fi ${state.wifiEnabled ? 'enabled' : 'disabled'}`
                  : 'Wi-Fi not available'
              }
              checked={state.wifiEnabled}
              disabled={!wifiSupported}
              onChange={(e) =>
                dispatch({ type: 'setField', field: 'wifiEnabled', value: e.target.checked })
              }
            />
          </Inline>
          <Collapsible open={state.wifiEnabled}>
            <Stack>
              <FieldRow>
                <Label>
                  <span>Network name (SSID)</span>
                  <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
                    <Input
                      value={state.ssid}
                      onChange={setText('ssid')}
                      aria-label="Network name (SSID)"
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
                  <span>Password</span>
                  <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
                    <PasswordInput
                      value={state.wifiPassword}
                      onChange={setText('wifiPassword')}
                      aria-label="Wi-Fi password"
                      style={{ flex: 1 }}
                    />
                    <GenerateButton
                      ariaLabel="Generate Wi-Fi password"
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
              {multiBand ? (
                <Inline>
                  <Switch
                    label={`Split across bands (${bandList})`}
                    checked={state.wifiSplit}
                    onChange={(e) =>
                      dispatch({ type: 'setField', field: 'wifiSplit', value: e.target.checked })
                    }
                  />
                </Inline>
              ) : null}
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
