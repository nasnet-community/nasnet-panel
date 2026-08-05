import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import {
  Button,
  FieldRow,
  FieldStack,
  Inline,
  Input,
  Label,
  PasswordInput,
  Switch,
} from '@nasnet/ui';
import type { Action, State } from '../../state';
import { Collapsible } from '../components/Collapsible';
import { HyperSpeedClaimDialog } from './HyperSpeedClaimDialog';

interface Props {
  state: State;
  dispatch: React.Dispatch<Action>;
}

export function IpMaskL2tpFields({ state, dispatch }: Props) {
  const [claimOpen, setClaimOpen] = useState(false);
  const set = (field: keyof State) => (e: React.ChangeEvent<HTMLInputElement>) =>
    dispatch({ type: 'setField', field, value: e.target.value });
  return (
    <FieldStack>
      <FieldRow>
        <Label>
          <span>Server</span>
          <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
            <Input
              value={state.l2tpServer}
              onChange={set('l2tpServer')}
              aria-label="Server"
              style={{ flex: 1 }}
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => setClaimOpen(true)}
              style={{ whiteSpace: 'nowrap' }}
            >
              <Sparkles size={16} strokeWidth={2} />
              Claim free VPN
            </Button>
          </div>
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
      <Inline>
        <Switch
          label="Use IPsec encryption"
          checked={state.l2tpUseIpsec}
          onChange={(e) =>
            dispatch({ type: 'setField', field: 'l2tpUseIpsec', value: e.target.checked })
          }
        />
      </Inline>
      <Collapsible open={state.l2tpUseIpsec}>
        <FieldRow>
          <Label>
            <span>IPsec secret</span>
            <Input
              value={state.l2tpIpsecSecret}
              onChange={set('l2tpIpsecSecret')}
              aria-label="IPsec secret"
            />
          </Label>
          {/* <Label>
            <span>Profile</span>
            <Input value={state.l2tpProfile} onChange={set('l2tpProfile')} aria-label="Profile" />
          </Label> */}
        </FieldRow>
      </Collapsible>
      <HyperSpeedClaimDialog
        open={claimOpen}
        onClose={() => setClaimOpen(false)}
        dispatch={dispatch}
      />
    </FieldStack>
  );
}
