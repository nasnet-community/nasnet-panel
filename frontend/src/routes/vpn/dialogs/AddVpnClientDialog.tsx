import { useMemo, useState } from 'react';
import {
  Button,
  Dialog,
  FieldRow,
  FieldStack,
  FormError,
  Input,
  Label,
  PasswordInput,
  Select,
  Switch,
} from '@nasnet/ui';
import type { AddL2TPClientRequest } from '../../../api';
import { validateHostOrIp, validateIdentifier } from '../../../utils/validators';

export type AddVpnType = 'l2tp' | 'openvpn' | 'wireguard';

const TYPE_OPTIONS: Array<{ value: AddVpnType; label: string; supported: boolean }> = [
  { value: 'l2tp', label: 'L2TP', supported: true },
  { value: 'openvpn', label: 'OpenVPN', supported: false },
  { value: 'wireguard', label: 'WireGuard', supported: false },
];

interface Draft {
  name: string;
  connectTo: string;
  user: string;
  password: string;
  useIpsec: boolean;
  ipsecSecret: string;
  disabled: boolean;
  // PPTP/SSTP/OpenVPN reuse the auth fields above; SSTP/OpenVPN add port.
  port: string;
  // WireGuard-specific.
  publicKey: string;
  endpoint: string;
  endpointPort: string;
  allowedAddress: string;
}

const EMPTY_DRAFT: Draft = {
  name: '',
  connectTo: '',
  user: '',
  password: '',
  useIpsec: false,
  ipsecSecret: '',
  disabled: false,
  port: '',
  publicKey: '',
  endpoint: '',
  endpointPort: '',
  allowedAddress: '',
};

interface Props {
  onCancel: () => void;
  onSubmitL2TP: (req: AddL2TPClientRequest) => Promise<void>;
}

export function AddVpnClientDialog({ onCancel, onSubmitL2TP }: Props) {
  const [type, setType] = useState<AddVpnType>('l2tp');
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const markTouched = (key: string) => setTouched((t) => (t[key] ? t : { ...t, [key]: true }));

  const supported = TYPE_OPTIONS.find((t) => t.value === type)?.supported ?? false;

  const errors = useMemo(
    () => ({
      name: validateIdentifier(draft.name),
      connectTo: validateHostOrIp(draft.connectTo),
      user: draft.user.trim() === '' ? 'User is required.' : null,
      password: draft.password === '' ? 'Password is required.' : null,
    }),
    [draft.name, draft.connectTo, draft.user, draft.password],
  );

  const hasErrors = Object.values(errors).some(Boolean);
  const canSubmit = supported && !submitting && !hasErrors;

  const handleSubmit = async () => {
    setTouched({ name: true, connectTo: true, user: true, password: true });
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);
    try {
      if (type === 'l2tp') {
        await onSubmitL2TP({
          name: draft.name.trim(),
          connectTo: draft.connectTo.trim(),
          user: draft.user.trim(),
          password: draft.password,
          disabled: draft.disabled,
          ipsecSecret: draft.useIpsec ? draft.ipsecSecret.trim() || undefined : undefined,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add VPN client.');
      setSubmitting(false);
      return;
    }
    setSubmitting(false);
  };

  return (
    <Dialog
      open
      onClose={submitting ? () => undefined : onCancel}
      title="New VPN client"
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {submitting ? 'Adding…' : 'Add client'}
          </Button>
        </>
      }
    >
      <FieldStack>
        <FieldRow>
          <Label>
            <span>VPN type</span>
            <Select
              aria-label="VPN type"
              value={type}
              onChange={(v) => setType(v as AddVpnType)}
              options={TYPE_OPTIONS.map((o) => ({
                value: o.value,
                label: o.label,
                disabled: !o.supported,
              }))}
            />
          </Label>
          <Label>
            <span>Name</span>
            <Input
              value={draft.name}
              onChange={(e) => set('name', e.target.value)}
              onBlur={() => markTouched('name')}
              placeholder="my-l2tp-client"
              aria-label="Name"
              aria-invalid={touched.name && !!errors.name}
            />
            {touched.name && errors.name ? <FormError>{errors.name}</FormError> : null}
          </Label>
        </FieldRow>

        {type === 'l2tp' ? (
          <L2tpFields
            draft={draft}
            set={set}
            errors={errors}
            touched={touched}
            markTouched={markTouched}
          />
        ) : null}

        {type === 'openvpn' ? <OpenVpnFields draft={draft} set={set} /> : null}

        {type === 'wireguard' ? <WireguardFields draft={draft} set={set} /> : null}

        <FieldRow>
          <Label as="div">
            <Switch
              label="Enabled on creation"
              checked={!draft.disabled}
              onChange={(e) => set('disabled', !e.target.checked)}
            />
          </Label>
          {type === 'l2tp' ? (
            <Label as="div">
              <Switch
                label="Use IPsec"
                checked={draft.useIpsec}
                onChange={(e) => {
                  const on = e.target.checked;
                  setDraft((d) => ({ ...d, useIpsec: on, ipsecSecret: on ? d.ipsecSecret : '' }));
                }}
              />
            </Label>
          ) : null}
        </FieldRow>

        {error ? <FormError role="alert">{error}</FormError> : null}
      </FieldStack>
    </Dialog>
  );
}

type SetFn = <K extends keyof Draft>(key: K, value: Draft[K]) => void;

interface FieldErrors {
  connectTo: string | null;
  user: string | null;
  password: string | null;
}

interface L2tpFieldsProps {
  draft: Draft;
  set: SetFn;
  errors: FieldErrors;
  touched: Record<string, boolean>;
  markTouched: (key: string) => void;
}

function L2tpFields({ draft, set, errors, touched, markTouched }: L2tpFieldsProps) {
  return (
    <>
      <FieldRow>
        <Label>
          <span>Connect to</span>
          <Input
            value={draft.connectTo}
            onChange={(e) => set('connectTo', e.target.value)}
            onBlur={() => markTouched('connectTo')}
            placeholder="192.168.1.1"
            aria-label="Connect to"
            aria-invalid={touched.connectTo && !!errors.connectTo}
          />
          {touched.connectTo && errors.connectTo ? <FormError>{errors.connectTo}</FormError> : null}
        </Label>
        <Label>
          <span>User</span>
          <Input
            value={draft.user}
            onChange={(e) => set('user', e.target.value)}
            onBlur={() => markTouched('user')}
            placeholder="username"
            aria-label="User"
            autoComplete="off"
            aria-invalid={touched.user && !!errors.user}
          />
          {touched.user && errors.user ? <FormError>{errors.user}</FormError> : null}
        </Label>
      </FieldRow>
      <FieldRow>
        <Label>
          <span>Password</span>
          <PasswordInput
            value={draft.password}
            onChange={(e) => set('password', e.target.value)}
            onBlur={() => markTouched('password')}
            aria-label="Password"
            autoComplete="new-password"
            aria-invalid={touched.password && !!errors.password}
          />
          {touched.password && errors.password ? <FormError>{errors.password}</FormError> : null}
        </Label>
        <Label>
          <span>IPsec secret</span>
          <PasswordInput
            value={draft.ipsecSecret}
            onChange={(e) => set('ipsecSecret', e.target.value)}
            placeholder="Pre-shared key"
            aria-label="IPsec secret"
            autoComplete="off"
            disabled={!draft.useIpsec}
          />
        </Label>
      </FieldRow>
    </>
  );
}

function OpenVpnFields({ draft, set }: { draft: Draft; set: SetFn }) {
  return (
    <>
      <FieldRow>
        <Label>
          <span>Connect to</span>
          <Input
            value={draft.connectTo}
            onChange={(e) => set('connectTo', e.target.value)}
            placeholder="vpn.example.com"
            aria-label="Connect to"
          />
        </Label>
        <Label>
          <span>Port</span>
          <Input
            value={draft.port}
            onChange={(e) => set('port', e.target.value)}
            placeholder="1194"
            inputMode="numeric"
            aria-label="Port"
          />
        </Label>
      </FieldRow>
      <FieldRow>
        <Label>
          <span>User</span>
          <Input
            value={draft.user}
            onChange={(e) => set('user', e.target.value)}
            aria-label="User"
            autoComplete="off"
          />
        </Label>
        <Label>
          <span>Password</span>
          <PasswordInput
            value={draft.password}
            onChange={(e) => set('password', e.target.value)}
            aria-label="Password"
            autoComplete="new-password"
          />
        </Label>
      </FieldRow>
    </>
  );
}

function WireguardFields({ draft, set }: { draft: Draft; set: SetFn }) {
  return (
    <>
      <FieldRow>
        <Label>
          <span>Peer public key</span>
          <Input
            value={draft.publicKey}
            onChange={(e) => set('publicKey', e.target.value)}
            placeholder="xxxxxxx="
            aria-label="Peer public key"
          />
        </Label>
        <Label>
          <span>Allowed address</span>
          <Input
            value={draft.allowedAddress}
            onChange={(e) => set('allowedAddress', e.target.value)}
            placeholder="0.0.0.0/0"
            aria-label="Allowed address"
          />
        </Label>
      </FieldRow>
      <FieldRow>
        <Label>
          <span>Endpoint host</span>
          <Input
            value={draft.endpoint}
            onChange={(e) => set('endpoint', e.target.value)}
            placeholder="vpn.example.com"
            aria-label="Endpoint host"
          />
        </Label>
        <Label>
          <span>Endpoint port</span>
          <Input
            value={draft.endpointPort}
            onChange={(e) => set('endpointPort', e.target.value)}
            placeholder="51820"
            inputMode="numeric"
            aria-label="Endpoint port"
          />
        </Label>
      </FieldRow>
    </>
  );
}
