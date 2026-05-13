import React from 'react';
import { FieldRow, Input, Label } from '@nasnet/ui';
import type { Action, State } from '../../state';

interface Props {
  state: State;
  dispatch: React.Dispatch<Action>;
}

export function VpnServerFields({ state, dispatch }: Props) {
  const set = (field: keyof State) => (e: React.ChangeEvent<HTMLInputElement>) =>
    dispatch({ type: 'setField', field, value: e.target.value });
  return (
    <FieldRow>
      <Label>
        <span>Listen port</span>
        <Input
          value={state.vpnServerPort}
          onChange={set('vpnServerPort')}
          aria-label="VPN server listen port"
        />
      </Label>
      <Label>
        <span>IP pool</span>
        <Input
          value={state.vpnServerIpPool}
          onChange={set('vpnServerIpPool')}
          aria-label="VPN server IP pool"
        />
      </Label>
      <Label>
        <span>DNS (optional)</span>
        <Input
          value={state.vpnServerDns}
          onChange={set('vpnServerDns')}
          aria-label="VPN server DNS"
        />
      </Label>
    </FieldRow>
  );
}
