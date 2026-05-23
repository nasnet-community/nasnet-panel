import { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import {
  Button,
  Dialog,
  FieldRow,
  FieldStack,
  FormError,
  Input,
  Label,
  PasswordInput,
  Progress,
  Select,
  Switch,
} from '@nasnet/ui';
import {
  ApiError,
  createOvpnServer,
  createWireguardServer,
  fetchOvpnServerTaskStatus,
  type CreateOvpnServerRequest,
  type CreateWireguardServerRequest,
  type OvpnServerTaskStatus,
  type VPNCredentials,
  type VpnUser,
} from '../../../api';
import { isCIDR, isPort, validateIdentifier } from '../../../utils/validators';

export type AddVpnServerType = 'openvpn' | 'wireguard';

const TYPE_OPTIONS: Array<{ value: AddVpnServerType; label: string }> = [
  { value: 'openvpn', label: 'OpenVPN' },
  { value: 'wireguard', label: 'WireGuard' },
];

const POLL_INTERVAL_MS = 1000;

interface OvpnUserDraft {
  username: string;
  password: string;
}

interface Props {
  creds: VPNCredentials | null;
  onCancel: () => void;
  onCreated: () => void;
}

export function AddVpnServerDialog({ creds, onCancel, onCreated }: Props) {
  const [type, setType] = useState<AddVpnServerType>('openvpn');

  return (
    <Dialog open onClose={onCancel} title="New VPN server" size="md" footer={null}>
      <FieldStack>
        <FieldRow>
          <Label>
            <span>VPN type</span>
            <Select
              aria-label="VPN type"
              value={type}
              onChange={(v) => setType(v as AddVpnServerType)}
              options={TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
            />
          </Label>
        </FieldRow>

        {type === 'openvpn' ? (
          <OvpnServerForm creds={creds} onCancel={onCancel} onCreated={onCreated} />
        ) : (
          <WireguardServerForm creds={creds} onCancel={onCancel} onCreated={onCreated} />
        )}
      </FieldStack>
    </Dialog>
  );
}

interface FormProps {
  creds: VPNCredentials | null;
  onCancel: () => void;
  onCreated: () => void;
}

function OvpnServerForm({ creds, onCancel, onCreated }: FormProps) {
  const [certPassphrase, setCertPassphrase] = useState('');
  const [users, setUsers] = useState<OvpnUserDraft[]>([{ username: '', password: '' }]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [progress, setProgress] = useState<OvpnServerTaskStatus | null>(null);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const credsRef = useRef(creds);
  const onCreatedRef = useRef(onCreated);
  useEffect(() => {
    credsRef.current = creds;
    onCreatedRef.current = onCreated;
  });

  useEffect(() => {
    if (!taskId) return;

    let timeoutId: number | null = null;
    let cancelled = false;

    const tick = async () => {
      timeoutId = null;
      if (cancelled) return;
      const c = credsRef.current;
      if (!c) return;
      try {
        const status = await fetchOvpnServerTaskStatus(c, taskId);
        if (cancelled) return;
        setProgress(status);
        if (status.status === 'running') {
          timeoutId = window.setTimeout(() => {
            tick().catch(() => undefined);
          }, POLL_INTERVAL_MS);
        } else if (status.status === 'completed') {
          onCreatedRef.current();
        } else if (status.status === 'error') {
          setError(status.error ?? 'OpenVPN server creation failed.');
          setSubmitting(false);
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to fetch task status.');
        setSubmitting(false);
      }
    };

    tick().catch(() => undefined);
    return () => {
      cancelled = true;
      if (timeoutId !== null) window.clearTimeout(timeoutId);
    };
  }, [taskId]);

  const setUserField = (idx: number, field: keyof OvpnUserDraft, value: string) => {
    setUsers((prev) => prev.map((u, i) => (i === idx ? { ...u, [field]: value } : u)));
  };

  const addUser = () => setUsers((prev) => [...prev, { username: '', password: '' }]);
  const removeUser = (idx: number) =>
    setUsers((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx)));

  const errors = useMemo(() => {
    const dupUsernames = new Set<string>();
    const seen = new Set<string>();
    users.forEach((u) => {
      const v = u.username.trim();
      if (!v) return;
      if (seen.has(v)) dupUsernames.add(v);
      else seen.add(v);
    });
    return {
      certPassphrase: certPassphrase ? null : 'Certificate passphrase is required.',
      users: users.map((u) => ({
        username:
          u.username.trim() === ''
            ? 'Username is required.'
            : dupUsernames.has(u.username.trim())
              ? 'Duplicate username.'
              : null,
        password: u.password === '' ? 'Password is required.' : null,
      })),
    };
  }, [certPassphrase, users]);

  const hasErrors =
    errors.certPassphrase !== null ||
    errors.users.some((e) => e.username !== null || e.password !== null);

  const canSubmit = !!creds && !submitting;

  const submit = async () => {
    setSubmitAttempted(true);
    if (!canSubmit || !creds || hasErrors) return;
    setError(null);
    setSubmitting(true);
    const body: CreateOvpnServerRequest = {
      clientCertificatePassword: certPassphrase,
      users: users.map<VpnUser>((u) => ({ username: u.username.trim(), password: u.password })),
    };
    try {
      const res = await createOvpnServer(creds, body);
      setTaskId(res.taskId);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Failed to start OpenVPN server creation.';
      setError(message);
      setSubmitting(false);
    }
  };

  if (taskId && progress && progress.status !== 'completed') {
    const failed = progress.status === 'error';
    return (
      <FieldStack>
        <Progress
          value={progress.progress}
          label={failed ? 'Failed' : (progress.currentStep ?? 'Working…')}
          tone={failed ? 'danger' : 'success'}
        />
        {error ? <FormError role="alert">{error}</FormError> : null}
        <FieldRow>
          <Button variant="ghost" onClick={onCancel} disabled={!failed}>
            Close
          </Button>
        </FieldRow>
      </FieldStack>
    );
  }

  return (
    <FieldStack>
      <FieldRow>
        <Label>
          <span>Client certificate passphrase</span>
          <PasswordInput
            value={certPassphrase}
            onChange={(e) => setCertPassphrase(e.target.value)}
            aria-label="Client certificate passphrase"
            autoComplete="new-password"
          />
        </Label>
      </FieldRow>
      {users.map((u, idx) => (
        <div
          key={idx}
          style={{
            display: 'flex',
            gap: 'var(--space-lg)',
            alignItems: 'flex-start',
          }}
        >
          <Label style={{ flex: 1, minWidth: 0 }}>
            <span>Username</span>
            <Input
              value={u.username}
              onChange={(e) => setUserField(idx, 'username', e.target.value)}
              aria-label={`Username ${idx + 1}`}
              autoComplete="off"
            />
            {submitAttempted && errors.users[idx].username ? (
              <FormError>{errors.users[idx].username}</FormError>
            ) : null}
          </Label>
          <Label style={{ flex: 1, minWidth: 0 }}>
            <span>Password</span>
            <PasswordInput
              value={u.password}
              onChange={(e) => setUserField(idx, 'password', e.target.value)}
              aria-label={`Password ${idx + 1}`}
              autoComplete="new-password"
            />
            {submitAttempted && errors.users[idx].password ? (
              <FormError>{errors.users[idx].password}</FormError>
            ) : null}
          </Label>
          <div
            style={{
              flex: '0 0 auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-xs)',
            }}
          >
            <span aria-hidden style={{ fontSize: 'var(--font-sm)', visibility: 'hidden' }}>
              .
            </span>
            <Button
              variant="danger"
              onClick={() => removeUser(idx)}
              disabled={users.length <= 1}
              title={`Remove user ${idx + 1}`}
              aria-label={`Remove user ${idx + 1}`}
            >
              <Trash2 size={16} aria-hidden />
            </Button>
          </div>
        </div>
      ))}
      <div>
        <Button variant="primary" onClick={addUser}>
          <Plus size={14} aria-hidden /> Add user
        </Button>
      </div>
      {error ? <FormError role="alert">{error}</FormError> : null}
      <FieldRow>
        <Button variant="ghost" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button variant="success" onClick={submit} disabled={!canSubmit}>
          {submitting ? 'Creating…' : 'Create OpenVPN server'}
        </Button>
      </FieldRow>
    </FieldStack>
  );
}

function WireguardServerForm({ creds, onCancel, onCreated }: FormProps) {
  const [name, setName] = useState('');
  const [localAddress, setLocalAddress] = useState('');
  const [listenPort, setListenPort] = useState('');
  const [mtu, setMtu] = useState('');
  const [comment, setComment] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [disabled, setDisabled] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const errors = useMemo(
    () => ({
      name: validateIdentifier(name),
      localAddress:
        localAddress.trim() === '' || isCIDR(localAddress)
          ? null
          : 'Enter a CIDR like 10.8.0.1/24, or leave empty to auto-assign.',
      listenPort: listenPort.trim() === '' || isPort(listenPort) ? null : 'Port must be 1-65535.',
      mtu:
        mtu.trim() === '' || (Number.isInteger(Number(mtu)) && Number(mtu) > 0)
          ? null
          : 'MTU must be a positive integer.',
    }),
    [name, localAddress, listenPort, mtu],
  );

  const hasErrors = Object.values(errors).some(Boolean);
  const canSubmit = !!creds && !submitting;

  const submit = async () => {
    setSubmitAttempted(true);
    if (!canSubmit || !creds || hasErrors) return;
    setError(null);
    setSubmitting(true);
    const body: CreateWireguardServerRequest = {
      name: name.trim(),
      localAddress: localAddress.trim() || undefined,
      listenPort: listenPort.trim() ? Number(listenPort) : undefined,
      mtu: mtu.trim() ? Number(mtu) : undefined,
      comment: comment.trim() || undefined,
      privateKey: privateKey.trim() || undefined,
      disabled: disabled || undefined,
    };
    try {
      await createWireguardServer(creds, body);
      onCreated();
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Failed to create WireGuard server.';
      setError(message);
      setSubmitting(false);
    }
  };

  return (
    <FieldStack>
      <FieldRow>
        <Label>
          <span>Name</span>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="office"
            aria-label="Name"
            aria-invalid={submitAttempted && !!errors.name}
          />
          {submitAttempted && errors.name ? <FormError>{errors.name}</FormError> : null}
        </Label>
        <Label>
          <span>Listen port</span>
          <Input
            value={listenPort}
            onChange={(e) => setListenPort(e.target.value)}
            placeholder="51820"
            inputMode="numeric"
            aria-label="Listen port"
            aria-invalid={submitAttempted && !!errors.listenPort}
          />
          {submitAttempted && errors.listenPort ? <FormError>{errors.listenPort}</FormError> : null}
        </Label>
      </FieldRow>
      <FieldRow>
        <Label>
          <span>Local address (CIDR)</span>
          <Input
            value={localAddress}
            onChange={(e) => setLocalAddress(e.target.value)}
            placeholder="10.8.0.1/24 (auto if empty)"
            aria-label="Local address"
            aria-invalid={submitAttempted && !!errors.localAddress}
          />
          {submitAttempted && errors.localAddress ? (
            <FormError>{errors.localAddress}</FormError>
          ) : null}
        </Label>
        <Label>
          <span>MTU</span>
          <Input
            value={mtu}
            onChange={(e) => setMtu(e.target.value)}
            placeholder="1420"
            inputMode="numeric"
            aria-label="MTU"
            aria-invalid={submitAttempted && !!errors.mtu}
          />
          {submitAttempted && errors.mtu ? <FormError>{errors.mtu}</FormError> : null}
        </Label>
      </FieldRow>
      <FieldRow>
        <Label>
          <span>Private key</span>
          <PasswordInput
            value={privateKey}
            onChange={(e) => setPrivateKey(e.target.value)}
            placeholder="auto-generated if empty"
            aria-label="Private key"
            autoComplete="off"
          />
        </Label>
        <Label>
          <span>Comment</span>
          <Input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="optional"
            aria-label="Comment"
          />
        </Label>
      </FieldRow>
      <FieldRow>
        <Label as="div">
          <Switch
            label="Enabled on creation"
            checked={!disabled}
            onChange={(e) => setDisabled(!e.target.checked)}
          />
        </Label>
      </FieldRow>
      {error ? <FormError role="alert">{error}</FormError> : null}
      <FieldRow>
        <Button variant="ghost" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button variant="success" onClick={submit} disabled={!canSubmit}>
          {submitting ? 'Creating…' : 'Create WireGuard server'}
        </Button>
      </FieldRow>
    </FieldStack>
  );
}
