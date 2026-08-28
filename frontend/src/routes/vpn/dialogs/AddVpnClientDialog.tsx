import { useMemo, useState } from 'react';
import { Cable, Globe, KeyRound, Shield } from 'lucide-react';
import {
  Button,
  Dialog,
  FieldRow,
  FieldStack,
  FileDrop,
  FormError,
  Input,
  Label,
  PasswordInput,
  Switch,
  Textarea,
} from '@nasnet/ui';
import { VpnTypeTilePicker, type VpnTypeTile } from './VpnTypeTilePicker';
import type {
  AddL2TPClientRequest,
  CreateWireguardClientRequest,
  ImportWireguardConfigRequest,
} from '../../../api';
import { isCIDR, isPort, validateHostOrIp, validateIdentifier } from '../../../utils/validators';

export type AddVpnType = 'l2tp' | 'wireguard';

type AddVpnTileType = AddVpnType | 'openvpn' | 'sstp';

const TYPE_TILES: Array<VpnTypeTile<AddVpnTileType>> = [
  { value: 'l2tp', label: 'L2TP', icon: <Cable size={26} strokeWidth={1.75} /> },
  { value: 'wireguard', label: 'WireGuard', icon: <Shield size={26} strokeWidth={1.75} /> },
  {
    value: 'openvpn',
    label: 'OpenVPN',
    icon: <Globe size={26} strokeWidth={1.75} />,
    disabled: true,
  },
  { value: 'sstp', label: 'SSTP', icon: <KeyRound size={26} strokeWidth={1.75} />, disabled: true },
];

interface Draft {
  name: string;
  connectTo: string;
  user: string;
  password: string;
  useIpsec: boolean;
  ipsecSecret: string;
  disabled: boolean;
  // WireGuard-specific
  publicKey: string;
  peerPrivateKey: string;
  endpoint: string;
  endpointPort: string;
  allowedAddress: string;
  interfaceLocalAddress: string;
  presharedKey: string;
  persistentKeepalive: string;
  // WireGuard import-mode
  configText: string;
}

const EMPTY_DRAFT: Draft = {
  name: '',
  connectTo: '',
  user: '',
  password: '',
  useIpsec: false,
  ipsecSecret: '',
  disabled: false,
  publicKey: '',
  peerPrivateKey: '',
  endpoint: '',
  endpointPort: '51820',
  allowedAddress: '',
  interfaceLocalAddress: '',
  presharedKey: '',
  persistentKeepalive: '',
  configText: '',
};

type WgMode = 'create' | 'import';

interface Props {
  onCancel: () => void;
  onSubmitL2TP: (req: AddL2TPClientRequest) => Promise<void>;
  onSubmitWireguard: (req: CreateWireguardClientRequest) => Promise<void>;
  onSubmitWireguardImport: (req: ImportWireguardConfigRequest) => Promise<void>;
}

export function AddVpnClientDialog({
  onCancel,
  onSubmitL2TP,
  onSubmitWireguard,
  onSubmitWireguardImport,
}: Props) {
  const [type, setType] = useState<AddVpnType>('l2tp');
  const [wgMode, setWgMode] = useState<WgMode>('import');
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const markTouched = (key: string) => setTouched((t) => (t[key] ? t : { ...t, [key]: true }));

  const errors = useMemo(() => {
    const base = {
      name: validateIdentifier(draft.name),
    } as Record<string, string | null>;

    if (type === 'l2tp') {
      base.connectTo = validateHostOrIp(draft.connectTo);
      base.user = draft.user.trim() === '' ? 'User is required.' : null;
      base.password = draft.password === '' ? 'Password is required.' : null;
    }

    if (type === 'wireguard' && wgMode === 'create') {
      base.interfaceLocalAddress = isCIDR(draft.interfaceLocalAddress)
        ? null
        : 'Enter a CIDR like 10.0.0.2/24.';
      base.endpoint = validateHostOrIp(draft.endpoint);
      base.endpointPort = isPort(draft.endpointPort) ? null : 'Port must be 1-65535.';
      base.allowedAddress =
        draft.allowedAddress.trim() === '' ? 'Allowed address is required (e.g. 0.0.0.0/0).' : null;
      base.peerKey =
        draft.publicKey.trim() === '' && draft.peerPrivateKey.trim() === ''
          ? 'Provide peer public key OR private key.'
          : null;
      base.persistentKeepalive =
        draft.persistentKeepalive.trim() === '' ||
        (Number.isInteger(Number(draft.persistentKeepalive)) &&
          Number(draft.persistentKeepalive) > 0)
          ? null
          : 'Keepalive must be a positive integer.';
    }

    if (type === 'wireguard' && wgMode === 'import') {
      base.configText = draft.configText.trim() === '' ? 'Paste a WireGuard config.' : null;
    }

    return base;
  }, [type, wgMode, draft]);

  const hasErrors = Object.values(errors).some(Boolean);
  const canSubmit = !submitting && !hasErrors;

  const handleSubmit = async () => {
    const allKeys = Object.keys(errors).reduce<Record<string, boolean>>((acc, k) => {
      acc[k] = true;
      return acc;
    }, {});
    setTouched((t) => ({ ...t, ...allKeys, name: true }));
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
      } else if (type === 'wireguard' && wgMode === 'create') {
        const body: CreateWireguardClientRequest = {
          name: draft.name.trim(),
          interfaceLocalAddress: draft.interfaceLocalAddress.trim(),
          endpointIP: draft.endpoint.trim(),
          endpointPort: Number(draft.endpointPort),
          allowedAddress: draft.allowedAddress.trim(),
          disabled: draft.disabled,
        };
        if (draft.publicKey.trim()) body.peerPublicKey = draft.publicKey.trim();
        if (draft.peerPrivateKey.trim()) body.peerPrivateKey = draft.peerPrivateKey.trim();
        if (draft.presharedKey.trim()) body.presharedKey = draft.presharedKey.trim();
        if (draft.persistentKeepalive.trim()) {
          body.persistentKeepalive = Number(draft.persistentKeepalive);
        }
        await onSubmitWireguard(body);
      } else if (type === 'wireguard' && wgMode === 'import') {
        await onSubmitWireguardImport({
          interfaceName: draft.name.trim(),
          config: draft.configText,
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
        <VpnTypeTilePicker
          ariaLabel="VPN client type"
          legend="Choose VPN client type"
          value={type}
          tiles={TYPE_TILES}
          onChange={(v) => setType(v as AddVpnType)}
        />

        <FieldRow>
          <Label>
            <span>Name</span>
            <Input
              value={draft.name}
              onChange={(e) => set('name', e.target.value)}
              onBlur={() => markTouched('name')}
              placeholder={type === 'wireguard' ? 'my-wg-client' : 'my-l2tp-client'}
              aria-label="Name"
              autoComplete="off"
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

        {type === 'wireguard' ? (
          <>
            <FieldRow>
              <Label as="div">
                <Switch
                  label="Import existing config"
                  checked={wgMode === 'import'}
                  onChange={(e) => setWgMode(e.target.checked ? 'import' : 'create')}
                />
              </Label>
            </FieldRow>
            {wgMode === 'create' ? (
              <WireguardFields
                draft={draft}
                set={set}
                errors={errors}
                touched={touched}
                markTouched={markTouched}
              />
            ) : (
              <WireguardImportFields
                draft={draft}
                set={set}
                errors={errors}
                touched={touched}
                markTouched={markTouched}
              />
            )}
          </>
        ) : null}

        {type === 'wireguard' && wgMode === 'import' ? null : (
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
                    setDraft((d) => ({
                      ...d,
                      useIpsec: on,
                      ipsecSecret: on ? d.ipsecSecret : '',
                    }));
                  }}
                />
              </Label>
            ) : null}
          </FieldRow>
        )}

        {error ? <FormError role="alert">{error}</FormError> : null}
      </FieldStack>
    </Dialog>
  );
}

type SetFn = <K extends keyof Draft>(key: K, value: Draft[K]) => void;

interface L2tpFieldsProps {
  draft: Draft;
  set: SetFn;
  errors: Record<string, string | null>;
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
            autoComplete="off"
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
            autoComplete="new-password"
            disabled={!draft.useIpsec}
          />
        </Label>
      </FieldRow>
    </>
  );
}

interface WireguardFieldsProps {
  draft: Draft;
  set: SetFn;
  errors: Record<string, string | null>;
  touched: Record<string, boolean>;
  markTouched: (key: string) => void;
}

function WireguardFields({ draft, set, errors, touched, markTouched }: WireguardFieldsProps) {
  return (
    <>
      <FieldRow>
        <Label>
          <span>Interface local address (CIDR)</span>
          <Input
            value={draft.interfaceLocalAddress}
            onChange={(e) => set('interfaceLocalAddress', e.target.value)}
            onBlur={() => markTouched('interfaceLocalAddress')}
            placeholder="10.0.0.2/24"
            aria-label="Interface local address"
            autoComplete="off"
            aria-invalid={touched.interfaceLocalAddress && !!errors.interfaceLocalAddress}
          />
          {touched.interfaceLocalAddress && errors.interfaceLocalAddress ? (
            <FormError>{errors.interfaceLocalAddress}</FormError>
          ) : null}
        </Label>
        <Label>
          <span>Allowed address (CIDR list)</span>
          <Input
            value={draft.allowedAddress}
            onChange={(e) => set('allowedAddress', e.target.value)}
            onBlur={() => markTouched('allowedAddress')}
            placeholder="0.0.0.0/0"
            aria-label="Allowed address"
            autoComplete="off"
            aria-invalid={touched.allowedAddress && !!errors.allowedAddress}
          />
          {touched.allowedAddress && errors.allowedAddress ? (
            <FormError>{errors.allowedAddress}</FormError>
          ) : null}
        </Label>
      </FieldRow>
      <FieldRow>
        <Label>
          <span>Endpoint host</span>
          <Input
            value={draft.endpoint}
            onChange={(e) => set('endpoint', e.target.value)}
            onBlur={() => markTouched('endpoint')}
            placeholder="vpn.example.com"
            aria-label="Endpoint host"
            autoComplete="off"
            aria-invalid={touched.endpoint && !!errors.endpoint}
          />
          {touched.endpoint && errors.endpoint ? <FormError>{errors.endpoint}</FormError> : null}
        </Label>
        <Label>
          <span>Endpoint port</span>
          <Input
            value={draft.endpointPort}
            onChange={(e) => set('endpointPort', e.target.value)}
            onBlur={() => markTouched('endpointPort')}
            placeholder="51820"
            inputMode="numeric"
            aria-label="Endpoint port"
            autoComplete="off"
            aria-invalid={touched.endpointPort && !!errors.endpointPort}
          />
          {touched.endpointPort && errors.endpointPort ? (
            <FormError>{errors.endpointPort}</FormError>
          ) : null}
        </Label>
      </FieldRow>
      <FieldRow>
        <Label>
          <span>Peer public key</span>
          <Input
            value={draft.publicKey}
            onChange={(e) => set('publicKey', e.target.value)}
            onBlur={() => markTouched('peerKey')}
            placeholder="leave empty if providing peer private key"
            aria-label="Peer public key"
            autoComplete="off"
            aria-invalid={touched.peerKey && !!errors.peerKey}
          />
        </Label>
        <Label>
          <span>Peer private key</span>
          <PasswordInput
            value={draft.peerPrivateKey}
            onChange={(e) => set('peerPrivateKey', e.target.value)}
            onBlur={() => markTouched('peerKey')}
            placeholder="leave empty if providing public key"
            aria-label="Peer private key"
            autoComplete="new-password"
          />
        </Label>
      </FieldRow>
      {touched.peerKey && errors.peerKey ? <FormError>{errors.peerKey}</FormError> : null}
      <FieldRow>
        <Label>
          <span>Preshared key</span>
          <PasswordInput
            value={draft.presharedKey}
            onChange={(e) => set('presharedKey', e.target.value)}
            placeholder="optional"
            aria-label="Preshared key"
            autoComplete="new-password"
          />
        </Label>
        <Label>
          <span>Persistent keepalive (s)</span>
          <Input
            value={draft.persistentKeepalive}
            onChange={(e) => set('persistentKeepalive', e.target.value)}
            onBlur={() => markTouched('persistentKeepalive')}
            placeholder="empty = off"
            inputMode="numeric"
            aria-label="Persistent keepalive"
            autoComplete="off"
            aria-invalid={touched.persistentKeepalive && !!errors.persistentKeepalive}
          />
          {touched.persistentKeepalive && errors.persistentKeepalive ? (
            <FormError>{errors.persistentKeepalive}</FormError>
          ) : null}
        </Label>
      </FieldRow>
    </>
  );
}

function WireguardImportFields({ draft, set, errors, touched, markTouched }: WireguardFieldsProps) {
  return (
    <>
      <FieldRow>
        <FileDrop
          accept=".conf,.txt,text/plain"
          label="Drop your WireGuard .conf file here, or click to browse"
          hint="The file contents are loaded into the editor below."
          onFile={(_, text) => set('configText', text)}
        />
      </FieldRow>
      <FieldRow>
        <Label>
          <span>Config text</span>
          <Textarea
            value={draft.configText}
            onChange={(e) => set('configText', e.target.value)}
            onBlur={() => markTouched('configText')}
            rows={12}
            placeholder={`[Interface]\nPrivateKey = ...\nAddress = 10.0.0.2/24\nListenPort = 51820\n\n[Peer]\nPublicKey = ...\nAllowedIPs = 0.0.0.0/0\nEndpoint = vpn.example.com:51820`}
            aria-label="Config"
            aria-invalid={touched.configText && !!errors.configText}
            style={{ fontFamily: 'monospace', minHeight: 200 }}
          />
          {touched.configText && errors.configText ? (
            <FormError>{errors.configText}</FormError>
          ) : null}
        </Label>
      </FieldRow>
    </>
  );
}
