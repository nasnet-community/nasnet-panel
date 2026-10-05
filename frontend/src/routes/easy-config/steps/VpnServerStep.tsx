import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  FieldRow,
  FormError,
  Input,
  Label,
  PasswordInput,
  Stack,
  Switch,
} from '@nasnet/ui';
import wizardStyles from '../../EasyConfigWizard.module.scss';
import { messageText, type Action, type State } from '../state';
import { ovpnSecretProblem } from '../validation';
import { Collapsible } from './components/Collapsible';
import { CertPreview } from './vpnsrv/CertPreview';

interface Props {
  state: State;
  dispatch: React.Dispatch<Action>;
  footer?: React.ReactNode;
}

export function VpnServerStep({ state, dispatch, footer }: Props) {
  const { t } = useTranslation('easyConfig');
  const set = (field: keyof State) => (e: React.ChangeEvent<HTMLInputElement>) =>
    dispatch({ type: 'setField', field, value: e.target.value });

  const certPassphraseProblem = ovpnSecretProblem(state.vpnServerCertPassphrase, 'certPassphrase');
  const certPassphraseError = certPassphraseProblem ? messageText(certPassphraseProblem) : null;
  const firstUserKeyProblem = ovpnSecretProblem(state.firstUserKey);
  const firstUserKeyError = firstUserKeyProblem ? messageText(firstUserKeyProblem) : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('vpnServer.title')}</CardTitle>
        <CardDescription>{t('vpnServer.description')}</CardDescription>
      </CardHeader>
      <div className={wizardStyles.modeLayout}>
        <Stack>
          <Switch
            label={state.vpnServerEnabled ? t('vpnServer.enabled') : t('vpnServer.disabled')}
            checked={state.vpnServerEnabled}
            onChange={(e) =>
              dispatch({ type: 'setField', field: 'vpnServerEnabled', value: e.target.checked })
            }
          />
          <Collapsible open={state.vpnServerEnabled}>
            <Stack>
              <FieldRow>
                <Label>
                  <span>{t('vpnServer.certPassphrase')}</span>
                  <PasswordInput
                    value={state.vpnServerCertPassphrase}
                    onChange={set('vpnServerCertPassphrase')}
                    aria-label={t('vpnServer.certPassphrase')}
                    aria-invalid={!!certPassphraseError}
                  />
                  {certPassphraseError ? <FormError>{certPassphraseError}</FormError> : null}
                </Label>
              </FieldRow>
              <FieldRow>
                <Label>
                  <span>{t('vpnServer.username')}</span>
                  <Input
                    value={state.firstUserName}
                    onChange={set('firstUserName')}
                    aria-label={t('vpnServer.username')}
                  />
                </Label>
              </FieldRow>
              <FieldRow>
                <Label>
                  <span>{t('vpnServer.password')}</span>
                  <PasswordInput
                    value={state.firstUserKey}
                    onChange={set('firstUserKey')}
                    aria-label={t('vpnServer.password')}
                    aria-invalid={!!firstUserKeyError}
                  />
                  {firstUserKeyError ? <FormError>{firstUserKeyError}</FormError> : null}
                </Label>
              </FieldRow>
            </Stack>
          </Collapsible>
        </Stack>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CertPreview username={state.firstUserName} />
        </div>
      </div>
      {footer}
    </Card>
  );
}
