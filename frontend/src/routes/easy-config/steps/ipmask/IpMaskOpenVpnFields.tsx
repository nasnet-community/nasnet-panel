import React from 'react';
import { FieldRow, FieldStack, Input, Label, PasswordInput } from '@nasnet/ui';
import type { Action, State } from '../../state';

interface Props {
  state: State;
  dispatch: React.Dispatch<Action>;
}

export function IpMaskOpenVpnFields({ state, dispatch }: Props) {
  const set = (field: keyof State) => (e: React.ChangeEvent<HTMLInputElement>) =>
    dispatch({ type: 'setField', field, value: e.target.value });
  return (
    <FieldStack>
      <FieldRow>
        <Label>
          <span>Server</span>
          <Input
            value={state.ovpnServer}
            onChange={set('ovpnServer')}
            aria-label="OpenVPN server"
          />
        </Label>
        {/* <Label>
          <span>Port</span>
          <Input value={state.ovpnPort} onChange={set('ovpnPort')} aria-label="OpenVPN port" />
        </Label> */}
      </FieldRow>
      <FieldRow>
        <Label>
          <span>Username</span>
          <Input
            value={state.ovpnUsername}
            onChange={set('ovpnUsername')}
            aria-label="OpenVPN username"
          />
        </Label>
        <Label>
          <span>Password</span>
          <PasswordInput
            value={state.ovpnPassword}
            onChange={set('ovpnPassword')}
            aria-label="OpenVPN password"
          />
        </Label>
      </FieldRow>
      <FieldRow>
        <Label>
          <span>Cipher</span>
          <Input
            value={state.ovpnCipher}
            onChange={set('ovpnCipher')}
            aria-label="OpenVPN cipher"
          />
        </Label>
      </FieldRow>
    </FieldStack>
  );
}
