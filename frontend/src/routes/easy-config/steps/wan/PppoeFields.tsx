import React from 'react';
import { useTranslation } from 'react-i18next';
import { FieldRow, Input, Label, PasswordInput } from '@nasnet/ui';
import type { Action, State } from '../../state';

interface Props {
  state: State;
  dispatch: React.Dispatch<Action>;
}

export function PppoeFields({ state, dispatch }: Props) {
  const { t } = useTranslation('easyConfig');
  return (
    <FieldRow>
      <Label>
        <span>{t('wan.pppoe.username')}</span>
        <Input
          value={state.pppoeUser}
          onChange={(e) =>
            dispatch({ type: 'setField', field: 'pppoeUser', value: e.target.value })
          }
          aria-label={t('wan.pppoe.username')}
        />
      </Label>
      <Label>
        <span>{t('wan.pppoe.password')}</span>
        <PasswordInput
          value={state.pppoePassword}
          onChange={(e) =>
            dispatch({ type: 'setField', field: 'pppoePassword', value: e.target.value })
          }
          aria-label={t('wan.pppoe.password')}
        />
      </Label>
    </FieldRow>
  );
}
