import { useReducer, useState } from 'react';
import { Globe, Shield } from 'lucide-react';
import { Button, Dialog, FieldStack, FormError, Input, Label } from '@nasnet/ui';
import { reducer, type State } from '../../easy-config/state';
import {
  ProtocolTilePicker,
  type ProtocolTile,
} from '../../easy-config/steps/components/ProtocolTilePicker';
import { IpMaskWireguardConfig } from '../../easy-config/steps/ipmask/IpMaskWireguardConfig';
import { IpMaskL2tpFields } from '../../easy-config/steps/ipmask/IpMaskL2tpFields';
import { seedVpn, vpnFromState } from '../mappers';
import type { WanVpnFormPayload } from '../types';

type Kind = State['ipMaskKind'];

const TILES: Array<ProtocolTile<Kind>> = [
  {
    value: 'wireguard',
    label: 'WireGuard',
    description: 'Fast, modern VPN with state-of-the-art cryptography.',
    icon: <Shield size={20} strokeWidth={1.75} />,
    recommended: true,
  },
  {
    value: 'l2tp',
    label: 'L2TP',
    description: 'Widely supported protocol with IPsec encryption.',
    icon: <Globe size={20} strokeWidth={1.75} />,
  },
];

interface Props {
  entity?: WanVpnFormPayload;
  addTitle: string;
  onCancel: () => void;
  onSubmit: (payload: WanVpnFormPayload) => Promise<void>;
}

export function WanVpnDialog({ entity, addTitle, onCancel, onSubmit }: Props) {
  const [state, dispatch] = useReducer(reducer, undefined, () => seedVpn(entity));
  const [name, setName] = useState(entity?.name ?? '');
  const enabled = entity?.enabled ?? true;
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = name.trim() !== '' && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit(vpnFromState(state, name.trim(), enabled));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save VPN client.');
      setSubmitting(false);
      return;
    }
    setSubmitting(false);
  };

  return (
    <Dialog
      open
      onClose={submitting ? () => undefined : onCancel}
      title={entity ? `Edit ${entity.name}` : addTitle}
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
        <ProtocolTilePicker
          ariaLabel="VPN protocol"
          value={state.ipMaskKind}
          tiles={TILES}
          onChange={(next) => dispatch({ type: 'setField', field: 'ipMaskKind', value: next })}
        />
        {state.ipMaskKind === 'wireguard' ? (
          <IpMaskWireguardConfig state={state} dispatch={dispatch} />
        ) : (
          <IpMaskL2tpFields state={state} dispatch={dispatch} />
        )}
        {error ? <FormError role="alert">{error}</FormError> : null}
      </FieldStack>
    </Dialog>
  );
}
