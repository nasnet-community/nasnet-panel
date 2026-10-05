import React from 'react';
import { useTranslation } from 'react-i18next';
import { FieldRow, Input, Label } from '@nasnet/ui';
import type { Action, State } from '../../state';

interface Props {
  state: State;
  dispatch: React.Dispatch<Action>;
}

export function VpnServerFields({ state, dispatch }: Props) {
  const { t } = useTranslation('easyConfig');
  const set = (field: keyof State) => (e: React.ChangeEvent<HTMLInputElement>) =>
    dispatch({ type: 'setField', field, value: e.target.value });
  return (
    <FieldRow>
      <Label>
        <span>{t('vpnServer.fields.listenPort')}</span>
        <Input
          value={state.vpnServerPort}
          onChange={set('vpnServerPort')}
          aria-label={t('vpnServer.fields.listenPortAria')}
        />
      </Label>
      <Label>
        <span>{t('vpnServer.fields.ipPool')}</span>
        <Input
          value={state.vpnServerIpPool}
          onChange={set('vpnServerIpPool')}
          aria-label={t('vpnServer.fields.ipPoolAria')}
        />
      </Label>
      <Label>
        <span>{t('vpnServer.fields.dns')}</span>
        <Input
          value={state.vpnServerDns}
          onChange={set('vpnServerDns')}
          aria-label={t('vpnServer.fields.dnsAria')}
        />
      </Label>
    </FieldRow>
  );
}
