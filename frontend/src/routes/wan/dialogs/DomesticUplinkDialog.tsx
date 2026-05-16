import { useReducer, useState } from 'react';
import { Button, Dialog, FieldStack, FormError, Input, Label } from '@nasnet/ui';
import type { DomesticUplink, InterfaceResponse } from '../../../api';
import { reducer } from '../../easy-config/state';
import { WanInterfaceSelect } from '../../easy-config/steps/wan/WanInterfaceSelect';
import { seedDomestic, domesticFromState } from '../mappers';

interface Props {
  entity?: DomesticUplink;
  interfaces: InterfaceResponse[];
  routerId: string;
  onCancel: () => void;
  onSubmit: (payload: Omit<DomesticUplink, 'id'>) => Promise<void>;
}

export function DomesticUplinkDialog({ entity, interfaces, routerId, onCancel, onSubmit }: Props) {
  const [state, dispatch] = useReducer(reducer, undefined, () => seedDomestic(entity));
  const [name, setName] = useState(entity?.name ?? '');
  const enabled = entity?.enabled ?? true;
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = name.trim() !== '' && state.domesticInterface !== '' && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit(domesticFromState(state, routerId, name.trim(), enabled));
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
      title={entity ? `Edit ${entity.name}` : 'Add domestic uplink'}
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
        <Label>
          <span>Name</span>
          <Input value={name} onChange={(e) => setName(e.target.value)} aria-label="Name" />
        </Label>
        <WanInterfaceSelect
          state={state}
          dispatch={dispatch}
          interfaces={interfaces}
          heading="Domestic WAN"
          ariaLabel="Domestic WAN"
          typeField="domesticInterfaceType"
          nameField="domesticInterface"
          ssidField="domesticWanSsid"
          passwordField="domesticWanPassword"
          wirelessLabel="Domestic wireless"
        />
        {error ? <FormError role="alert">{error}</FormError> : null}
      </FieldStack>
    </Dialog>
  );
}
