import React from 'react';
import { Input, Label, PasswordInput, SectionHeading } from '@nasnet/ui';
import type { Action, State } from '../../state';
import styles from './WanWirelessFields.module.scss';

type SsidField = 'starlinkWanSsid' | 'domesticWanSsid';
type PasswordField = 'starlinkWanPassword' | 'domesticWanPassword';

interface Props {
  state: State;
  dispatch: React.Dispatch<Action>;
  ssidField: SsidField;
  passwordField: PasswordField;
  label: string;
}

export function WanWirelessFields({ state, dispatch, ssidField, passwordField, label }: Props) {
  const password = state[passwordField];
  const showPasswordHint = password.length > 0 && password.length < 8;
  return (
    <div className={styles.section}>
      <SectionHeading>{label}</SectionHeading>
      <div className={styles.field}>
        <Label>
          <span>SSID (Network Name)</span>
          <Input
            value={state[ssidField]}
            onChange={(e) =>
              dispatch({ type: 'setField', field: ssidField, value: e.target.value })
            }
            aria-label={`${label} SSID`}
          />
        </Label>
      </div>
      <div className={styles.field}>
        <Label>
          <span>Password</span>
          <PasswordInput
            value={password}
            onChange={(e) =>
              dispatch({ type: 'setField', field: passwordField, value: e.target.value })
            }
            aria-label={`${label} password`}
          />
          {showPasswordHint ? (
            <span
              style={{
                fontSize: 'var(--font-xs)',
                color: 'var(--color-warning, #d97706)',
                marginTop: 4,
              }}
            >
              Password must be at least 8 characters long
            </span>
          ) : null}
        </Label>
      </div>
    </div>
  );
}
