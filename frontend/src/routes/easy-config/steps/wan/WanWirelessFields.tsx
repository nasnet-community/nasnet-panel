import React, { useState } from 'react';
import { Button, FieldRow, Label, Select, type SelectOption } from '@nasnet/ui';
import { ScanSearch, Wifi } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Action, State } from '../../state';
import { WirelessScanDialog } from './WirelessScanDialog';
import styles from './WanWirelessFields.module.scss';

type SsidField = 'starlinkWanSsid' | 'domesticWanSsid';
type PasswordField = 'starlinkWanPassword' | 'domesticWanPassword';
type AuthTypeField = 'starlinkWanAuthType' | 'domesticWanAuthType';

// An empty auth type lets the backend pick its default, WPA2 and WPA3. Select treats an
// empty value as no selection, so the list uses DEFAULT_OPTION for it.
const DEFAULT_OPTION = 'default';
const AUTH_TYPES = [DEFAULT_OPTION, 'wpa2-psk', 'wpa3-psk', 'wpa-psk,wpa2-psk'] as const;
const AUTH_TYPE_LABEL_KEY = {
  [DEFAULT_OPTION]: 'wan.wireless.security.wpa2wpa3',
  'wpa2-psk': 'wan.wireless.security.wpa2',
  'wpa3-psk': 'wan.wireless.security.wpa3',
  'wpa-psk,wpa2-psk': 'wan.wireless.security.wpawpa2',
} as const;

interface Props {
  state: State;
  dispatch: React.Dispatch<Action>;
  ssidField: SsidField;
  passwordField: PasswordField;
  authTypeField: AuthTypeField;
  label: string;
  interfaceName: string;
}

export function WanWirelessFields({
  state,
  dispatch,
  ssidField,
  passwordField,
  authTypeField,
  label,
  interfaceName,
}: Props) {
  const { t } = useTranslation('easyConfig');
  const interfaceSelected = Boolean(interfaceName);
  const [open, setOpen] = useState(false);
  const ssid = state[ssidField];
  const hasPassword = state[passwordField] !== '';
  const authType = state[authTypeField] || DEFAULT_OPTION;
  const authOptions: SelectOption[] = AUTH_TYPES.map((value) => ({
    value,
    label: t(AUTH_TYPE_LABEL_KEY[value]),
  }));
  // A type read back from the router may be a combination the list does not offer.
  if (!AUTH_TYPES.some((value) => value === authType)) {
    authOptions.push({ value: authType, label: authType });
  }

  const onConnected = (nextSsid: string, nextPassword: string) => {
    dispatch({ type: 'setField', field: ssidField, value: nextSsid });
    dispatch({ type: 'setField', field: passwordField, value: nextPassword });
  };

  return (
    <div className={styles.section}>
      {ssid ? (
        <div className={styles.selected}>
          <span className={styles.selectedIcon}>
            <Wifi size={16} strokeWidth={2} />
          </span>
          <span className={styles.selectedSsid}>{ssid}</span>
          <Button type="button" variant="ghost" onClick={() => setOpen(true)}>
            {t('wan.wireless.change')}
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="primary"
          onClick={() => setOpen(true)}
          disabled={!interfaceSelected}
        >
          <ScanSearch size={14} strokeWidth={2} /> {t('wan.wireless.choose')}
        </Button>
      )}
      {ssid && hasPassword ? (
        <FieldRow>
          <Label>
            <span>{t('wan.wireless.security.label')}</span>
            <Select
              aria-label={t('wan.wireless.security.aria', { link: label })}
              value={authType}
              onChange={(v) =>
                dispatch({
                  type: 'setField',
                  field: authTypeField,
                  value: v === DEFAULT_OPTION ? '' : v,
                })
              }
              options={authOptions}
            />
          </Label>
        </FieldRow>
      ) : null}
      <WirelessScanDialog
        open={open}
        interfaceName={interfaceName}
        onClose={() => setOpen(false)}
        onConnected={onConnected}
      />
      <span hidden aria-hidden="true">
        {label}
      </span>
    </div>
  );
}
