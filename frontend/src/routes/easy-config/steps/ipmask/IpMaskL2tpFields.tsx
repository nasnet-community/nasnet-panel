import React from 'react';
import { FieldRow, FieldStack, Input, Label, PasswordInput } from '@nasnet/ui';
import type { Action, State } from '../../state';

interface Props {
  state: State;
  dispatch: React.Dispatch<Action>;
}

export function IpMaskL2tpFields({ state, dispatch }: Props) {
  const set = (field: keyof State) => (e: React.ChangeEvent<HTMLInputElement>) =>
    dispatch({ type: 'setField', field, value: e.target.value });
  return (
    <FieldStack>
      <FieldRow>
        <Label>
          <span>Server</span>
          <Input value={state.l2tpServer} onChange={set('l2tpServer')} aria-label="Server" />
        </Label>
        <Label>
          <span>Username</span>
          <Input value={state.l2tpUsername} onChange={set('l2tpUsername')} aria-label="Username" />
        </Label>
        <Label>
          <span>Password</span>
          <PasswordInput
            value={state.l2tpPassword}
            onChange={set('l2tpPassword')}
            aria-label="Password"
          />
        </Label>
      </FieldRow>
      <FieldRow>
        <Label>
          <span>IPsec secret</span>
          <Input
            value={state.l2tpIpsecSecret}
            onChange={set('l2tpIpsecSecret')}
            aria-label="IPsec secret"
          />
        </Label>
        <Label>
          <span>Profile</span>
          <Input value={state.l2tpProfile} onChange={set('l2tpProfile')} aria-label="Profile" />
        </Label>
      </FieldRow>
    </FieldStack>
  );
}
