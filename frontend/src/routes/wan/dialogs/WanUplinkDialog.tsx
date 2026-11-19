import { useMemo, useReducer, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Dialog, FieldStack, FormError } from '@nasnet/ui';
import type { InterfaceResponse, WanResponse } from '../../../api';
import { initial, reducer, type State } from '../../easy-config/state';
import {
  WanInterfaceSelect,
  availableInterfaceTypes,
  classifyInterface,
} from '../../easy-config/steps/wan/WanInterfaceSelect';
import { WAN_FIELDS } from '../../easy-config/steps/wan/fields';
import { wanAddressingPayload, wanAddressingProblem } from '../../easy-config/steps/wan/addressing';

type Variant = 'foreign' | 'domestic';

// What the backend applies when authType is empty.
const DEFAULT_AUTH_TYPE = 'wpa2-psk,wpa3-psk';

export interface WanUplinkValues {
  interfaceName: string;
  ssid?: string;
  password?: string;
  authType?: string;
  ip?: string;
  gateway?: string;
}

interface Props {
  variant: Variant;
  title: string;
  description?: string;
  submitLabel?: string;
  submittingLabel?: string;
  interfaces: InterfaceResponse[];
  excludeNames?: string[];
  interfacesLoading?: boolean;
  initialInterface?: InterfaceResponse;
  /** Current settings of the WAN being edited, used to fill the form. */
  initialWan?: WanResponse;
  onCancel: () => void;
  onSubmit: (values: WanUplinkValues) => Promise<void>;
}

const HEADING_KEY = {
  foreign: 'wan.dialog.foreignHeading',
  domestic: 'wan.dialog.domesticHeading',
} as const;

const WIRELESS_LABEL_KEY = {
  foreign: 'wan.dialog.foreignWireless',
  domestic: 'wan.dialog.domesticWireless',
} as const;

function prefill(
  base: State,
  variant: Variant,
  iface: InterfaceResponse | undefined,
  wan: WanResponse | undefined,
): State {
  const fields = WAN_FIELDS[variant];
  const next: State = { ...base };
  if (iface) {
    Object.assign(next, {
      [fields.typeField]: classifyInterface(iface) ?? 'ethernet',
      [fields.nameField]: iface.name,
    });
  }
  if (wan) {
    const authType = (wan.authType ?? '').replace(/\s/g, '');
    Object.assign(next, {
      [fields.ssidField]: wan.ssid ?? '',
      [fields.passwordField]: wan.password ?? '',
      [fields.authTypeField]: authType === DEFAULT_AUTH_TYPE ? '' : authType,
    });
    if (wan.addressType === 'static') {
      Object.assign(next, {
        [fields.ipModeField]: 'static',
        [fields.staticIpField]: wan.ip ?? '',
        [fields.gatewayField]: wan.gateway ?? '',
      });
    }
  }
  return next;
}

export function WanUplinkDialog({
  variant,
  title,
  description,
  submitLabel,
  submittingLabel,
  interfaces,
  excludeNames,
  interfacesLoading,
  initialInterface,
  initialWan,
  onCancel,
  onSubmit,
}: Props) {
  const { t } = useTranslation('internet');
  const fields = WAN_FIELDS[variant];
  const [state, dispatch] = useReducer(reducer, initial, (base) =>
    prefill(base, variant, initialInterface, initialWan),
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const availableTypes = useMemo(() => availableInterfaceTypes(interfaces), [interfaces]);
  const pickable = useMemo(() => {
    const excluded = new Set(excludeNames ?? []);
    return interfaces.filter((i) => !excluded.has(i.name));
  }, [interfaces, excludeNames]);
  const chosen = state[fields.nameField];
  const wireless = state[fields.typeField] === 'wireless';
  const ssid = state[fields.ssidField];
  const password = state[fields.passwordField];
  const ipMode = state[fields.ipModeField];
  const staticIp = state[fields.staticIpField];
  const gateway = state[fields.gatewayField];
  const addressingValid = !wanAddressingProblem(ipMode, staticIp, gateway, variant);
  const canSubmit = chosen !== '' && (!wireless || ssid !== '') && addressingValid && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);
    try {
      const authType = wireless && password ? state[fields.authTypeField] : '';
      await onSubmit({
        interfaceName: chosen,
        ssid: wireless ? ssid : undefined,
        password: wireless ? password : undefined,
        authType: authType || undefined,
        ...wanAddressingPayload(ipMode, staticIp, gateway),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('wan.dialog.saveFailed'));
      setSubmitting(false);
      return;
    }
    setSubmitting(false);
  };

  return (
    <Dialog
      open
      onClose={submitting ? () => undefined : onCancel}
      title={title}
      description={description}
      size="sm"
      labelledBy="wan-uplink-title"
      footer={
        <>
          <Button variant="ghost" onClick={onCancel} disabled={submitting}>
            {t('wan.dialog.cancel')}
          </Button>
          <Button variant="success" onClick={handleSubmit} disabled={!canSubmit}>
            {submitting
              ? (submittingLabel ?? t('wan.dialog.saving'))
              : (submitLabel ?? t('wan.dialog.save'))}
          </Button>
        </>
      }
    >
      <FieldStack>
        <WanInterfaceSelect
          state={state}
          dispatch={dispatch}
          interfaces={pickable}
          availableTypes={availableTypes}
          loading={interfacesLoading}
          heading={t(HEADING_KEY[variant])}
          ariaLabel={t(HEADING_KEY[variant])}
          fields={fields}
          wirelessLabel={t(WIRELESS_LABEL_KEY[variant])}
        />
        {error ? <FormError role="alert">{error}</FormError> : null}
      </FieldStack>
    </Dialog>
  );
}
