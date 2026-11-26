import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FieldRow, FieldStack, FormError, Input, Label, Switch } from '@nasnet/ui';
import type { Action, State } from '../../state';
import { Collapsible } from '../components/Collapsible';
import type { WanFieldSet } from './fields';
import {
  WAN_IP_PLACEHOLDER,
  defaultWanGateway,
  wanGatewayProblem,
  wanStaticIpProblem,
  type WanIpMode,
} from './addressing';

interface Props {
  state: State;
  dispatch: React.Dispatch<Action>;
  fields: WanFieldSet;
}

export function WanAddressingFields({ state, dispatch, fields }: Props) {
  const { t } = useTranslation('easyConfig');
  // Names the link for screen readers, as both links can be on screen at once.
  const linkLabel = t(`wan.addressing.link.${fields.wanType}`);
  const [touched, setTouched] = useState({ ip: false, gateway: false });
  const mode = state[fields.ipModeField];
  const ip = state[fields.staticIpField];
  const gateway = state[fields.gatewayField];
  const ipProblem = wanStaticIpProblem(ip, fields.wanType);
  const gatewayProblem = wanGatewayProblem(ip, gateway, fields.wanType);
  const showIpError = touched.ip && ip.trim() !== '' && ipProblem;
  const showGatewayError = (touched.gateway || touched.ip) && gatewayProblem;

  return (
    <FieldStack>
      <Switch
        label={t('wan.addressing.manual')}
        aria-label={t('wan.addressing.modeAria', { link: linkLabel })}
        checked={mode === 'static'}
        onChange={(e) =>
          dispatch({
            type: 'setField',
            field: fields.ipModeField,
            value: (e.target.checked ? 'static' : 'dhcp') as WanIpMode,
          })
        }
      />
      <Collapsible open={mode === 'static'}>
        <FieldRow>
          <Label>
            <span>{t('wan.static.ipAddress')}</span>
            <Input
              value={ip}
              placeholder={WAN_IP_PLACEHOLDER[fields.wanType]}
              onChange={(e) =>
                dispatch({ type: 'setField', field: fields.staticIpField, value: e.target.value })
              }
              onBlur={() => setTouched((prev) => ({ ...prev, ip: true }))}
              aria-label={t('wan.addressing.ipAria', { link: linkLabel })}
              aria-invalid={!!showIpError}
              aria-required={mode === 'static'}
              dir="ltr"
              inputMode="decimal"
              autoComplete="off"
            />
            {showIpError ? <FormError>{t(`validation.${ipProblem}`)}</FormError> : null}
          </Label>
          <Label>
            <span>{t('wan.addressing.gatewayOptional')}</span>
            <Input
              value={gateway}
              placeholder={defaultWanGateway(ip, fields.wanType) ?? ''}
              onChange={(e) =>
                dispatch({ type: 'setField', field: fields.gatewayField, value: e.target.value })
              }
              onBlur={() => setTouched((prev) => ({ ...prev, gateway: true }))}
              aria-label={t('wan.addressing.gatewayAria', { link: linkLabel })}
              aria-invalid={!!showGatewayError}
              dir="ltr"
              inputMode="decimal"
              autoComplete="off"
            />
            {showGatewayError ? <FormError>{t(`validation.${gatewayProblem}`)}</FormError> : null}
          </Label>
        </FieldRow>
      </Collapsible>
    </FieldStack>
  );
}
