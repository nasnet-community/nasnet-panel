import React from 'react';
import { useTranslation } from 'react-i18next';
import { FieldRow, FormError, Input, Label, PasswordInput } from '@nasnet/ui';
import { messageText, type Action, type State } from '../../state';
import { ovpnSecretProblem } from '../../validation';

interface Props {
  state: State;
  dispatch: React.Dispatch<Action>;
}

export function FirstUserForm({ state, dispatch }: Props) {
  const { t } = useTranslation('easyConfig');
  const isPassword = state.vpnServerProtocol !== 'wireguard';
  const passwordProblem = isPassword ? ovpnSecretProblem(state.firstUserKey) : null;
  const passwordError = passwordProblem ? messageText(passwordProblem) : null;
  return (
    <FieldRow>
      <Label>
        <span>{t('vpnServer.firstUser.userName')}</span>
        <Input
          value={state.firstUserName}
          onChange={(e) =>
            dispatch({ type: 'setField', field: 'firstUserName', value: e.target.value })
          }
          aria-label={t('vpnServer.firstUser.userNameAria')}
        />
      </Label>
      <Label>
        <span>
          {isPassword ? t('vpnServer.firstUser.password') : t('vpnServer.firstUser.publicKey')}
        </span>
        {isPassword ? (
          <PasswordInput
            value={state.firstUserKey}
            onChange={(e) =>
              dispatch({ type: 'setField', field: 'firstUserKey', value: e.target.value })
            }
            aria-label={t('vpnServer.firstUser.passwordAria')}
            aria-invalid={!!passwordError}
          />
        ) : (
          <Input
            value={state.firstUserKey}
            onChange={(e) =>
              dispatch({ type: 'setField', field: 'firstUserKey', value: e.target.value })
            }
            aria-label={t('vpnServer.firstUser.publicKeyAria')}
          />
        )}
        {passwordError ? <FormError>{passwordError}</FormError> : null}
      </Label>
    </FieldRow>
  );
}
