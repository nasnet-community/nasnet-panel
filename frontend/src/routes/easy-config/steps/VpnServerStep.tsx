import React from 'react';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  FieldRow,
  FormError,
  Input,
  Label,
  PasswordInput,
  Stack,
  Switch,
} from '@nasnet/ui';
import { validateOvpnSecret } from '../../../utils/validators';
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

  const certPassphraseError = state.vpnServerCertPassphrase
    ? validateOvpnSecret(state.vpnServerCertPassphrase, 'Certificate passphrase')
    : null;
  const firstUserKeyError = state.firstUserKey ? validateOvpnSecret(state.firstUserKey) : null;

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
                    aria-invalid={!!certPassphraseError}
                  />
                  {certPassphraseError ? <FormError>{certPassphraseError}</FormError> : null}
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
                    aria-invalid={!!firstUserKeyError}
                  />
                  {firstUserKeyError ? <FormError>{firstUserKeyError}</FormError> : null}
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
