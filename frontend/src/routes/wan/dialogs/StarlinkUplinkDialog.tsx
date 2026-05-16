import { useReducer, useState } from 'react';
import { Button, Dialog, FieldStack, FormError, Input, Label } from '@nasnet/ui';
import type { InterfaceResponse, StarlinkUplink } from '../../../api';
import { reducer } from '../../easy-config/state';
import { WanInterfaceSelect } from '../../easy-config/steps/wan/WanInterfaceSelect';
import { seedStarlink, starlinkFromState } from '../mappers';

interface Props {
  entity?: StarlinkUplink;
  interfaces: InterfaceResponse[];
  routerId: string;
  onCancel: () => void;
  onSubmit: (payload: Omit<StarlinkUplink, 'id'>) => Promise<void>;
}

export function StarlinkUplinkDialog({ entity, interfaces, routerId, onCancel, onSubmit }: Props) {
  const [state, dispatch] = useReducer(reducer, undefined, () => seedStarlink(entity));
  const [name, setName] = useState(entity?.name ?? '');
  const enabled = entity?.enabled ?? true;
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = name.trim() !== '' && state.starlinkInterface !== '' && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit(starlinkFromState(state, routerId, name.trim(), enabled));
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
      title={entity ? `Edit ${entity.name}` : 'Add Starlink uplink'}
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
          heading="Starlink WAN"
          ariaLabel="Starlink WAN"
          typeField="starlinkInterfaceType"
          nameField="starlinkInterface"
          ssidField="starlinkWanSsid"
          passwordField="starlinkWanPassword"
          wirelessLabel="Starlink wireless"
        />
        {error ? <FormError role="alert">{error}</FormError> : null}
      </FieldStack>
    </Dialog>
  );
}
