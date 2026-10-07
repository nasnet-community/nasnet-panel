import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  FieldRow,
  FieldStack,
  Inline,
  Input,
  Label,
  PasswordInput,
  Switch,
} from '@nasnet/ui';
import type { Action, State } from '../../state';
import { Collapsible } from '../components/Collapsible';
import { HyperSpeedClaimDialog } from './HyperSpeedClaimDialog';

interface Props {
  state: State;
  dispatch: React.Dispatch<Action>;
}

export function IpMaskL2tpFields({ state, dispatch }: Props) {
  const { t } = useTranslation('easyConfig');
  const [claimOpen, setClaimOpen] = useState(false);
  const set = (field: keyof State) => (e: React.ChangeEvent<HTMLInputElement>) =>
    dispatch({ type: 'setField', field, value: e.target.value });
  return (
    <FieldStack>
      <FieldRow>
        <Label>
          <span>{t('ipMask.l2tp.server')}</span>
          <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
            <Input
              value={state.l2tpServer}
              onChange={set('l2tpServer')}
              aria-label={t('ipMask.l2tp.server')}
              style={{ flex: 1 }}
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => setClaimOpen(true)}
              style={{ whiteSpace: 'nowrap' }}
            >
              <Sparkles size={16} strokeWidth={2} />
              {t('ipMask.l2tp.claimFree')}
            </Button>
          </div>
        </Label>
        <Label>
          <span>{t('ipMask.l2tp.username')}</span>
          <Input
            value={state.l2tpUsername}
            onChange={set('l2tpUsername')}
            aria-label={t('ipMask.l2tp.username')}
          />
        </Label>
        <Label>
          <span>{t('ipMask.l2tp.password')}</span>
          <PasswordInput
            value={state.l2tpPassword}
            onChange={set('l2tpPassword')}
            aria-label={t('ipMask.l2tp.password')}
          />
        </Label>
      </FieldRow>
      <Inline>
        <Switch
          label={t('ipMask.l2tp.useIpsec')}
          checked={state.l2tpUseIpsec}
          onChange={(e) =>
            dispatch({ type: 'setField', field: 'l2tpUseIpsec', value: e.target.checked })
          }
        />
      </Inline>
      <Collapsible open={state.l2tpUseIpsec}>
        <FieldRow>
          <Label>
            <span>{t('ipMask.l2tp.ipsecSecret')}</span>
            <Input
              value={state.l2tpIpsecSecret}
              onChange={set('l2tpIpsecSecret')}
              aria-label={t('ipMask.l2tp.ipsecSecret')}
            />
          </Label>
          {/* <Label>
            <span>Profile</span>
            <Input value={state.l2tpProfile} onChange={set('l2tpProfile')} aria-label="Profile" />
          </Label> */}
        </FieldRow>
      </Collapsible>
      <HyperSpeedClaimDialog
        open={claimOpen}
        onClose={() => setClaimOpen(false)}
        onClaimed={(creds) => {
          dispatch({ type: 'setField', field: 'l2tpServer', value: creds.server });
          dispatch({ type: 'setField', field: 'l2tpUsername', value: creds.username });
          dispatch({ type: 'setField', field: 'l2tpPassword', value: creds.password });
        }}
      />
    </FieldStack>
  );
}
