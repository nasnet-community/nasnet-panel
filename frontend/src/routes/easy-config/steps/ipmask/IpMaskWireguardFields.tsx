import React from 'react';
import { Button, FieldRow, FieldStack, Input, Label } from '@nasnet/ui';
import { generateWireGuardKeypair } from '../../../../utils/generate-wg-keys';
import type { Action, State } from '../../state';

interface Props {
  state: State;
  dispatch: React.Dispatch<Action>;
}

export function IpMaskWireguardFields({ state, dispatch }: Props) {
  const onGenerate = async () => {
    const { privateKey, publicKey } = await generateWireGuardKeypair();
    dispatch({ type: 'setKeys', privateKey, publicKey });
  };
  const set = (field: keyof State) => (e: React.ChangeEvent<HTMLInputElement>) =>
    dispatch({ type: 'setField', field, value: e.target.value });
  return (
    <FieldStack>
      <FieldRow>
        <Label>
          <span>Endpoint host</span>
          <Input value={state.wgEndpoint} onChange={set('wgEndpoint')} aria-label="Endpoint host" />
        </Label>
        <Label>
          <span>Endpoint port</span>
          <Input
            value={state.wgEndpointPort}
            onChange={set('wgEndpointPort')}
            aria-label="Endpoint port"
          />
        </Label>
      </FieldRow>
      <FieldRow>
        <Label>
          <span>Peer public key</span>
          <Input
            value={state.wgPeerPublicKey}
            onChange={set('wgPeerPublicKey')}
            aria-label="Peer public key"
          />
        </Label>
        <Label>
          <span>Allowed IPs</span>
          <Input
            value={state.wgAllowedIps}
            onChange={set('wgAllowedIps')}
            aria-label="Allowed IPs"
          />
        </Label>
      </FieldRow>
      <FieldRow>
        <Label>
          <span>Keepalive (s)</span>
          <Input value={state.wgKeepalive} onChange={set('wgKeepalive')} aria-label="Keepalive" />
        </Label>
        <Label>
          <span>MTU</span>
          <Input value={state.wgMtu} onChange={set('wgMtu')} aria-label="MTU" />
        </Label>
      </FieldRow>
      <FieldRow>
        <Label>
          <span>Private key</span>
          <Input readOnly value={state.wgPrivateKey} aria-label="Private key" />
        </Label>
        <Label>
          <span>Public key</span>
          <Input readOnly value={state.wgPublicKey} aria-label="Public key" />
        </Label>
        <div style={{ display: 'flex', alignItems: 'end' }}>
          <Button type="button" onClick={onGenerate} variant="secondary">
            Generate
          </Button>
        </div>
      </FieldRow>
    </FieldStack>
  );
}
