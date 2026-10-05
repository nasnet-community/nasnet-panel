import React from 'react';
import { useTranslation } from 'react-i18next';
import { FieldRow, Input, Label, PasswordInput } from '@nasnet/ui';
import type { Action, WizardState } from './state';

interface Props {
  state: WizardState;
  dispatch: React.Dispatch<Action>;
  onSubmit: () => void;
  canSubmit: boolean;
}

export function TargetFields({ state, dispatch, onSubmit, canSubmit }: Props) {
  const { t } = useTranslation('addRouter');
  return (
    <>
      <FieldRow>
        <Label>
          <span>{t('fields.displayName')}</span>
          <Input
            value={state.name}
            onChange={(e) => dispatch({ type: 'setField', field: 'name', value: e.target.value })}
            aria-label={t('fields.displayName')}
          />
        </Label>
        <Label>
          <span>{t('fields.ipAddress')}</span>
          <Input
            value={state.host}
            onChange={(e) => dispatch({ type: 'setField', field: 'host', value: e.target.value })}
            placeholder="192.168.1.1"
            aria-label={t('fields.ipAddress')}
          />
        </Label>
      </FieldRow>
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
              if (e.key === 'Enter' && canSubmit) onSubmit();
            }}
            autoComplete="current-password"
            aria-label={t('fields.password')}
          />
        </Label>
      </FieldRow>
    </>
  );
}
