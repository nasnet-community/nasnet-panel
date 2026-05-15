import React from 'react';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  FieldRow,
  Input,
  Label,
  PasswordInput,
  Stack,
  Switch,
} from '@nasnet/ui';
import wizardStyles from '../../EasyConfigWizard.module.scss';
import type { Action, State } from '../state';
import { Collapsible } from './components/Collapsible';
import { CertPreview } from './vpnsrv/CertPreview';

interface Props {
  state: State;
  dispatch: React.Dispatch<Action>;
  footer?: React.ReactNode;
}

export function VpnServerStep({ state, dispatch, footer }: Props) {
  const set = (field: keyof State) => (e: React.ChangeEvent<HTMLInputElement>) =>
    dispatch({ type: 'setField', field, value: e.target.value });

  return (
    <Card>
      <CardHeader>
        <CardTitle>VPN server</CardTitle>
        <CardDescription>
          Issue OpenVPN client certificates so devices can connect back to this router.
        </CardDescription>
      </CardHeader>
      <div className={wizardStyles.modeLayout}>
        <Stack>
          <Switch
            label={state.vpnServerEnabled ? 'Enabled' : 'Disabled'}
            checked={state.vpnServerEnabled}
            onChange={(e) =>
              dispatch({ type: 'setField', field: 'vpnServerEnabled', value: e.target.checked })
            }
          />
          <Collapsible open={state.vpnServerEnabled}>
            <Stack>
              <FieldRow>
                <Label>
                  <span>Certificate passphrase</span>
                  <PasswordInput
                    value={state.vpnServerCertPassphrase}
                    onChange={set('vpnServerCertPassphrase')}
                    aria-label="Certificate passphrase"
                  />
                </Label>
              </FieldRow>
              <FieldRow>
                <Label>
                  <span>Username</span>
                  <Input
                    value={state.firstUserName}
                    onChange={set('firstUserName')}
                    aria-label="Username"
                  />
                </Label>
              </FieldRow>
              <FieldRow>
                <Label>
                  <span>Password</span>
                  <PasswordInput
                    value={state.firstUserKey}
                    onChange={set('firstUserKey')}
                    aria-label="Password"
                  />
                </Label>
              </FieldRow>
            </Stack>
          </Collapsible>
        </Stack>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CertPreview username={state.firstUserName} />
        </div>
      </div>
      {footer}
    </Card>
  );
}
