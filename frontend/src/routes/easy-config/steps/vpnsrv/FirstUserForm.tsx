import React from 'react';
import { FieldRow, Input, Label, PasswordInput } from '@nasnet/ui';
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
      </Label>
    </FieldRow>
  );
}
