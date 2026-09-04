import React from 'react';
import { FieldRow, FormError, Input, Label, PasswordInput } from '@nasnet/ui';
import { validateOvpnSecret } from '../../../../utils/validators';
import type { Action, State, VpnServerProtocol } from '../../state';

interface Props {
  state: State;
  dispatch: React.Dispatch<Action>;
}

function keyLabel(protocol: VpnServerProtocol): string {
  if (protocol === 'wireguard') return 'Public key';
  return 'Password';
}

export function FirstUserForm({ state, dispatch }: Props) {
  const isPassword = state.vpnServerProtocol !== 'wireguard';
  const passwordError =
    isPassword && state.firstUserKey ? validateOvpnSecret(state.firstUserKey) : null;
  return (
    <FieldRow>
      <Label>
        <span>User name</span>
        <Input
          value={state.firstUserName}
          onChange={(e) =>
            dispatch({ type: 'setField', field: 'firstUserName', value: e.target.value })
          }
          aria-label="First user name"
        />
      </Label>
      <Label>
        <span>{keyLabel(state.vpnServerProtocol)}</span>
        {isPassword ? (
          <PasswordInput
            value={state.firstUserKey}
            onChange={(e) =>
              dispatch({ type: 'setField', field: 'firstUserKey', value: e.target.value })
            }
            aria-label="First user password"
            aria-invalid={!!passwordError}
          />
        ) : (
          <Input
            value={state.firstUserKey}
            onChange={(e) =>
              dispatch({ type: 'setField', field: 'firstUserKey', value: e.target.value })
            }
            aria-label="First user public key"
          />
        )}
        {passwordError ? <FormError>{passwordError}</FormError> : null}
      </Label>
    </FieldRow>
  );
}
