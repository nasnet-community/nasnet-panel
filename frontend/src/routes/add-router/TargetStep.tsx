import React from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('addRouter');
  const valid = isRequired(state.name) && isIPv4(state.host) && isRequired(state.username);
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('target.title')}</CardTitle>
        <CardDescription>{t('target.description')}</CardDescription>
      </CardHeader>
      <Stack>
        <TargetFields state={state} dispatch={dispatch} onSubmit={onConnect} canSubmit={valid} />
        {state.error ? <FormError>{state.error}</FormError> : null}
        <Inline>
          <Button variant="ghost" onClick={onBack} disabled={state.applying}>
            {t('target.back')}
          </Button>
          <Button variant="success" onClick={onConnect} disabled={!valid} loading={state.applying}>
            {t('target.connect')}
          </Button>
        </Inline>
      </Stack>
    </Card>
  );
}
