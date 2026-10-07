import React from 'react';
import { useTranslation } from 'react-i18next';
import { FieldRow, Input, Label } from '@nasnet/ui';
import type { Action, State } from '../../state';

interface Props {
  state: State;
  dispatch: React.Dispatch<Action>;
}

export function StaticFields({ state, dispatch }: Props) {
  const { t } = useTranslation('easyConfig');
  return (
    <FieldRow>
      <Label>
        <span>{t('wan.static.ipAddress')}</span>
        <Input
          value={state.staticIp}
          placeholder="192.168.1.2/24"
          onChange={(e) => dispatch({ type: 'setField', field: 'staticIp', value: e.target.value })}
          aria-label={t('wan.static.ipAria')}
        />
      </Label>
      <Label>
        <span>{t('wan.static.gateway')}</span>
        <Input
          value={state.staticGateway}
          onChange={(e) =>
            dispatch({ type: 'setField', field: 'staticGateway', value: e.target.value })
          }
          aria-label={t('wan.static.gatewayAria')}
        />
      </Label>
      <Label>
        <span>{t('wan.static.dns')}</span>
        <Input
          value={state.staticDns}
          onChange={(e) =>
            dispatch({ type: 'setField', field: 'staticDns', value: e.target.value })
          }
          aria-label={t('wan.static.dnsAria')}
        />
      </Label>
    </FieldRow>
  );
}
