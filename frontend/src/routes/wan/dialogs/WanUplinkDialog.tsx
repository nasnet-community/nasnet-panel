import { useMemo, useReducer, useState } from 'react';
import { Button, Dialog, FieldStack, FormError } from '@nasnet/ui';
import type { InterfaceResponse } from '../../../api';
import { initial, reducer } from '../../easy-config/state';
import {
  WanInterfaceSelect,
  availableInterfaceTypes,
} from '../../easy-config/steps/wan/WanInterfaceSelect';

type Variant = 'foreign' | 'domestic';

interface Props {
  variant: Variant;
  title: string;
  interfaces: InterfaceResponse[];
  excludeNames?: string[];
  interfacesLoading?: boolean;
  onCancel: () => void;
  onSubmit: (interfaceName: string) => Promise<void>;
}

const FIELD_MAP = {
  foreign: {
    heading: 'Starlink WAN',
    ariaLabel: 'Starlink WAN',
    typeField: 'starlinkInterfaceType' as const,
    nameField: 'starlinkInterface' as const,
    ssidField: 'starlinkWanSsid' as const,
    passwordField: 'starlinkWanPassword' as const,
    wirelessLabel: 'Starlink wireless',
  },
  domestic: {
    heading: 'Domestic WAN',
    ariaLabel: 'Domestic WAN',
    typeField: 'domesticInterfaceType' as const,
    nameField: 'domesticInterface' as const,
    ssidField: 'domesticWanSsid' as const,
    passwordField: 'domesticWanPassword' as const,
    wirelessLabel: 'Domestic wireless',
  },
};

export function WanUplinkDialog({
  variant,
  title,
  interfaces,
  excludeNames,
  interfacesLoading,
  onCancel,
  onSubmit,
}: Props) {
  const fields = FIELD_MAP[variant];
  const [state, dispatch] = useReducer(reducer, initial);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const availableTypes = useMemo(() => availableInterfaceTypes(interfaces), [interfaces]);
  const pickable = useMemo(() => {
    const excluded = new Set(excludeNames ?? []);
    return interfaces.filter((i) => !excluded.has(i.name));
  }, [interfaces, excludeNames]);
  const chosen = state[fields.nameField];
  const canSubmit = chosen !== '' && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit(chosen);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save uplink.');
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
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="success" onClick={handleSubmit} disabled={!canSubmit}>
            {submitting ? 'Saving…' : 'Save'}
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
          heading={fields.heading}
          ariaLabel={fields.ariaLabel}
          typeField={fields.typeField}
          nameField={fields.nameField}
          ssidField={fields.ssidField}
          passwordField={fields.passwordField}
          wirelessLabel={fields.wirelessLabel}
        />
        {error ? <FormError role="alert">{error}</FormError> : null}
      </FieldStack>
    </Dialog>
  );
}
