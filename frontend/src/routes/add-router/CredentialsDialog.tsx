import React from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('addRouter');
  const fallbackStep = state.mode === 'scan' ? 'scan' : 'target';
  const close = () => dispatch({ type: 'step', step: fallbackStep });
  return (
    <Dialog
      open={state.currentStep === 'credentials'}
      onClose={() => {
        if (state.applying) return;
        close();
      }}
      title={
        state.host
          ? t('credentials.title', { name: state.name || state.host })
          : t('credentials.titleFallback')
      }
      description={state.host ? t('credentials.description', { host: state.host }) : undefined}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={close} disabled={state.applying}>
            {t('credentials.cancel')}
          </Button>
          <Button variant="success" onClick={onConnect} loading={state.applying}>
            {t('credentials.connect')}
          </Button>
        </>
      }
    >
      <Stack>
        <Label>
          <span>{t('fields.displayName')}</span>
          <Input
            value={state.name}
            onChange={(e) => dispatch({ type: 'setField', field: 'name', value: e.target.value })}
            autoFocus
            aria-label={t('fields.displayName')}
          />
        </Label>
        <FieldRow>
          <Label>
            <span>{t('fields.username')}</span>
            <Input
              value={state.username}
              onChange={(e) =>
                dispatch({ type: 'setField', field: 'username', value: e.target.value })
              }
              autoComplete="username"
              aria-label={t('fields.username')}
            />
          </Label>
          <Label>
            <span>{t('fields.password')}</span>
            <PasswordInput
              value={state.password}
              onChange={(e) =>
                dispatch({ type: 'setField', field: 'password', value: e.target.value })
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter') onConnect();
              }}
              autoComplete="current-password"
              aria-label={t('fields.password')}
            />
          </Label>
        </FieldRow>
        {state.error ? <FormError>{state.error}</FormError> : null}
      </Stack>
    </Dialog>
  );
}
