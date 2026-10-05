import React from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { FieldStack, RadioGroup } from '@nasnet/ui';
import type { Action, State } from '../../state';
import { PppoeFields } from './PppoeFields';
import { StaticFields } from './StaticFields';

const domesticModeOptions = (t: TFunction<'easyConfig'>) =>
  (['dhcp', 'static', 'pppoe'] as const).map((value) => ({
    value,
    label: t(`wan.domestic.${value}.label`),
    description: t(`wan.domestic.${value}.description`),
  }));

interface Props {
  state: State;
  dispatch: React.Dispatch<Action>;
}

export function DomesticSection({ state, dispatch }: Props) {
  const { t } = useTranslation('easyConfig');
  return (
    <FieldStack>
      <RadioGroup
        name="easy-config-domestic-mode"
        ariaLabel={t('wan.domestic.ariaLabel')}
        value={state.domesticMode}
        orientation="row"
        options={domesticModeOptions(t)}
        onChange={(v) =>
          dispatch({
            type: 'setField',
            field: 'domesticMode',
            value: v as State['domesticMode'],
          })
        }
      />
      {state.domesticMode === 'pppoe' ? <PppoeFields state={state} dispatch={dispatch} /> : null}
      {state.domesticMode === 'static' ? <StaticFields state={state} dispatch={dispatch} /> : null}
    </FieldStack>
  );
}
