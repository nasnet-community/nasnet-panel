import React from 'react';
import {
  Button,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  FormError,
  Inline,
  Stack,
} from '@nasnet/ui';
import { isIPv4, isRequired } from '../../utils/validators';
import type { Action, WizardState } from './state';
import { TargetFields } from './TargetFields';

interface Props {
  state: WizardState;
  dispatch: React.Dispatch<Action>;
  onBack: () => void;
  onConnect: () => void;
}

export function TargetStep({ state, dispatch, onBack, onConnect }: Props) {
  const valid = isRequired(state.name) && isIPv4(state.host) && isRequired(state.username);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Router details</CardTitle>
        <CardDescription>Enter router information and credentials to connect.</CardDescription>
      </CardHeader>
      <Stack>
        <TargetFields state={state} dispatch={dispatch} onSubmit={onConnect} canSubmit={valid} />
        {state.error ? <FormError>{state.error}</FormError> : null}
        <Inline>
          <Button variant="ghost" onClick={onBack} disabled={state.applying}>
            Back
          </Button>
          <Button variant="success" onClick={onConnect} disabled={!valid} loading={state.applying}>
            Connect
          </Button>
        </Inline>
      </Stack>
    </Card>
  );
}
