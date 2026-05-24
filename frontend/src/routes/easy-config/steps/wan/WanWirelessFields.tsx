import React, { useState } from 'react';
import { Button } from '@nasnet/ui';
import { ScanSearch, Wifi } from 'lucide-react';
import type { Action, State } from '../../state';
import { WirelessScanDialog } from './WirelessScanDialog';
import styles from './WanWirelessFields.module.scss';

type SsidField = 'starlinkWanSsid' | 'domesticWanSsid';
type PasswordField = 'starlinkWanPassword' | 'domesticWanPassword';

interface Props {
  state: State;
  dispatch: React.Dispatch<Action>;
  ssidField: SsidField;
  passwordField: PasswordField;
  label: string;
  interfaceName: string;
}

export function WanWirelessFields({
  state,
  dispatch,
  ssidField,
  passwordField,
  label,
  interfaceName,
}: Props) {
  const interfaceSelected = Boolean(interfaceName);
  const [open, setOpen] = useState(false);
  const ssid = state[ssidField];

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
            Change
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="primary"
          onClick={() => setOpen(true)}
          disabled={!interfaceSelected}
        >
          <ScanSearch size={14} strokeWidth={2} /> Choose wireless network
        </Button>
      )}
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
