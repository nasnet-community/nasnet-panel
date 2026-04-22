import React from 'react';
import {
  Button,
  Dialog,
  FieldRow,
  FormError,
  Input,
  Label,
  PasswordInput,
  Stack,
} from '@nasnet/ui';
import type { Action, WizardState } from './state';

interface Props {
  state: WizardState;
  dispatch: React.Dispatch<Action>;
  onConnect: () => void;
}

export function CredentialsDialog({ state, dispatch, onConnect }: Props) {
  const fallbackStep = state.mode === 'scan' ? 'scan' : 'target';
  const close = () => dispatch({ type: 'step', step: fallbackStep });
  return (
    <Dialog
      open={state.currentStep === 'credentials'}
      onClose={() => {
        if (state.applying) return;
        close();
      }}
      title={state.host ? `Connect to ${state.name || state.host}` : 'Connect'}
      description={state.host ? `Enter credentials for ${state.host}.` : undefined}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={close} disabled={state.applying}>
            Cancel
          </Button>
          <Button variant="success" onClick={onConnect} loading={state.applying}>
            Connect
          </Button>
        </>
      }
    >
      <Stack>
        <Label>
          <span>Display name</span>
          <Input
            value={state.name}
            onChange={(e) => dispatch({ type: 'setField', field: 'name', value: e.target.value })}
            autoFocus
            aria-label="Display name"
          />
        </Label>
        <FieldRow>
          <Label>
            <span>Username</span>
            <Input
              value={state.username}
              onChange={(e) =>
                dispatch({ type: 'setField', field: 'username', value: e.target.value })
              }
              autoComplete="username"
              aria-label="Username"
            />
          </Label>
          <Label>
            <span>Password</span>
            <PasswordInput
              value={state.password}
              onChange={(e) =>
                dispatch({ type: 'setField', field: 'password', value: e.target.value })
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter') onConnect();
              }}
              autoComplete="current-password"
              aria-label="Password"
            />
          </Label>
        </FieldRow>
        {state.error ? <FormError>{state.error}</FormError> : null}
      </Stack>
    </Dialog>
  );
}
