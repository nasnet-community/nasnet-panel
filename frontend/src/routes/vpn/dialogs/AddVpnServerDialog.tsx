import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { Cable, Globe, Info, KeyRound, Shield, TriangleAlert } from 'lucide-react';
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
  Switch,
} from '@nasnet/ui';
import { VpnTypeTilePicker, type VpnTypeTile } from './VpnTypeTilePicker';
import styles from './AddVpnServerDialog.module.scss';
import {
  ApiError,
  createOvpnServer,
  createSstpServer,
  createWireguardServer,
  fetchOvpnServerTaskStatus,
  type CreateOvpnServerRequest,
  type CreateWireguardServerRequest,
  type OvpnServerTaskStatus,
  type SstpServerTaskStatus,
  type VPNCredentials,
} from '../../../api';
import { isCIDR, isPort, validateIdentifier, validateOvpnSecret } from '../../../utils/validators';
import { pollSstpServerTask } from '../sstpTask';

export type AddVpnServerType = 'openvpn' | 'wireguard' | 'sstp';

type AddVpnServerTileType = AddVpnServerType | 'l2tp';

const TYPE_TILES: Array<VpnTypeTile<AddVpnServerTileType>> = [
  { value: 'openvpn', label: 'OpenVPN', icon: <Globe size={26} strokeWidth={1.75} /> },
  { value: 'wireguard', label: 'WireGuard', icon: <Shield size={26} strokeWidth={1.75} /> },
  { value: 'l2tp', label: 'L2TP', icon: <Cable size={26} strokeWidth={1.75} />, disabled: true },
  { value: 'sstp', label: 'SSTP', icon: <KeyRound size={26} strokeWidth={1.75} /> },
];

const POLL_INTERVAL_MS = 1000;

const ADVANCED_WG_SERVER_FIELDS_ID = 'wg-server-advanced-fields';

interface Props {
  creds: VPNCredentials | null;
  sstpEnabled: boolean;
  onCancel: () => void;
  onCreated: () => void;
}

export function AddVpnServerDialog({ creds, sstpEnabled, onCancel, onCreated }: Props) {
  const [type, setType] = useState<AddVpnServerType>('openvpn');

  return (
    <Dialog open onClose={onCancel} title="New VPN server" size="md" footer={null}>
      <FieldStack>
        <VpnTypeTilePicker
          ariaLabel="VPN server type"
          legend="Choose VPN server type"
          value={type}
          tiles={TYPE_TILES}
          onChange={(v) => setType(v as AddVpnServerType)}
        />

        {type === 'openvpn' ? (
          <OvpnServerForm creds={creds} onCancel={onCancel} onCreated={onCreated} />
        ) : type === 'sstp' ? (
          <SstpServerForm
            creds={creds}
            sstpEnabled={sstpEnabled}
            onCancel={onCancel}
            onCreated={onCreated}
          />
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

  const errors = useMemo(
    () => ({
      certPassphrase: validateOvpnSecret(certPassphrase, 'Certificate passphrase'),
    }),
    [certPassphrase],
  );

  const hasErrors = errors.certPassphrase !== null;

  const canSubmit = !!creds && !submitting;

  const submit = async () => {
    setSubmitAttempted(true);
    if (!canSubmit || !creds || hasErrors) return;
    setError(null);
    setSubmitting(true);
    const body: CreateOvpnServerRequest = {
      clientCertificatePassword: certPassphrase,
      users: [],
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
        <div className={styles.actions}>
          <Button variant="ghost" onClick={onCancel} disabled={!failed}>
            Close
          </Button>
        </div>
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
            aria-invalid={submitAttempted && !!errors.certPassphrase}
          />
          {submitAttempted && errors.certPassphrase ? (
            <FormError>{errors.certPassphrase}</FormError>
          ) : null}
        </Label>
      </FieldRow>
      {error ? <FormError role="alert">{error}</FormError> : null}
      <div className={styles.actions}>
        <Button variant="ghost" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button variant="success" onClick={submit} disabled={!canSubmit}>
          {submitting ? 'Creating…' : 'Create OpenVPN server'}
        </Button>
      </div>
    </FieldStack>
  );
}

function InlineAlert({
  tone,
  id,
  children,
}: {
  tone: 'info' | 'danger';
  id?: string;
  children: ReactNode;
}) {
  const Icon = tone === 'danger' ? TriangleAlert : Info;
  return (
    <div
      id={id}
      className={`${styles.alert} ${tone === 'danger' ? styles.alertDanger : styles.alertInfo}`}
      role={tone === 'danger' ? 'alert' : undefined}
    >
      <Icon size={16} className={styles.alertIcon} aria-hidden />
      <span>{children}</span>
    </div>
  );
}

interface SstpFormProps extends FormProps {
  sstpEnabled: boolean;
}

function SstpServerForm({ creds, sstpEnabled, onCancel, onCreated }: SstpFormProps) {
  const alertId = useId();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [progress, setProgress] = useState<SstpServerTaskStatus | null>(null);

  const credsRef = useRef(creds);
  const onCreatedRef = useRef(onCreated);
  useEffect(() => {
    credsRef.current = creds;
    onCreatedRef.current = onCreated;
  });

  useEffect(() => {
    if (!taskId) return;
    const c = credsRef.current;
    if (!c) return;

    const poll = pollSstpServerTask(c, taskId, setProgress);
    poll.done
      .then((status) => {
        if (status.status === 'completed') {
          onCreatedRef.current();
        } else {
          setError(status.error ?? 'SSTP server setup failed.');
          setSubmitting(false);
        }
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to fetch task status.');
        setSubmitting(false);
      });

    return () => poll.cancel();
  }, [taskId]);

  const canSubmit = !!creds && !submitting && !sstpEnabled;

  const submit = async () => {
    if (!canSubmit || !creds) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await createSstpServer(creds, { enabled: true });
      setTaskId(res.taskId);
    } catch (err) {
      const message =
        err instanceof ApiError && err.status === 409
          ? 'The SSTP server is already enabled on this router.'
          : err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : 'Failed to start SSTP server setup.';
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
        {error ? <InlineAlert tone="danger">{error}</InlineAlert> : null}
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
      <InlineAlert tone="info" id={alertId}>
        {sstpEnabled
          ? 'The SSTP server is already enabled on this router. Disable it from the VPN servers list before enabling it again.'
          : 'Enabling SSTP issues a server certificate, starts the SSTP server on port 4433 and adds a firewall rule accepting inbound connections. Existing VPN users can sign in over SSTP.'}
      </InlineAlert>
      {error ? <InlineAlert tone="danger">{error}</InlineAlert> : null}
      <FieldRow>
        <Button variant="ghost" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button
          variant="success"
          onClick={submit}
          disabled={!canSubmit}
          aria-describedby={sstpEnabled ? alertId : undefined}
        >
          {sstpEnabled
            ? 'SSTP server already enabled'
            : submitting
              ? 'Enabling…'
              : 'Enable SSTP server'}
        </Button>
      </FieldRow>
    </FieldStack>
  );
}

function WireguardServerForm({ creds, onCancel, onCreated }: FormProps) {
  const [advanced, setAdvanced] = useState(false);
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
        !advanced || localAddress.trim() === '' || isCIDR(localAddress)
          ? null
          : 'Enter a CIDR like 10.8.0.1/24, or leave empty to auto-assign.',
      listenPort:
        !advanced || listenPort.trim() === '' || isPort(listenPort)
          ? null
          : 'Port must be 1-65535.',
      mtu:
        !advanced || mtu.trim() === '' || (Number.isInteger(Number(mtu)) && Number(mtu) > 0)
          ? null
          : 'MTU must be a positive integer.',
    }),
    [advanced, name, localAddress, listenPort, mtu],
  );

  const hasErrors = Object.values(errors).some(Boolean);
  const canSubmit = !!creds && !submitting;

  const submit = async () => {
    setSubmitAttempted(true);
    if (!canSubmit || !creds || hasErrors) return;
    setError(null);
    setSubmitting(true);
    const body: CreateWireguardServerRequest = advanced
      ? {
          name: name.trim(),
          localAddress: localAddress.trim() || undefined,
          listenPort: listenPort.trim() ? Number(listenPort) : undefined,
          mtu: mtu.trim() ? Number(mtu) : undefined,
          comment: comment.trim() || undefined,
          privateKey: privateKey.trim() || undefined,
          disabled: disabled || undefined,
        }
      : { name: name.trim() };
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
            autoComplete="off"
            aria-label="Name"
            aria-invalid={submitAttempted && !!errors.name}
          />
          {submitAttempted && errors.name ? <FormError>{errors.name}</FormError> : null}
        </Label>
      </FieldRow>
      <FieldRow>
        <Label as="div">
          <Switch
            label="Advanced mode"
            checked={advanced}
            onChange={(e) => setAdvanced(e.target.checked)}
            aria-expanded={advanced}
            aria-controls={ADVANCED_WG_SERVER_FIELDS_ID}
          />
        </Label>
      </FieldRow>
      {advanced ? (
        <FieldStack
          id={ADVANCED_WG_SERVER_FIELDS_ID}
          role="group"
          aria-label="Advanced WireGuard server settings"
        >
          <FieldRow>
            <Label>
              <span>Listen port</span>
              <Input
                value={listenPort}
                onChange={(e) => setListenPort(e.target.value)}
                placeholder="51820"
                inputMode="numeric"
                autoComplete="off"
                aria-label="Listen port"
                aria-invalid={submitAttempted && !!errors.listenPort}
              />
              {submitAttempted && errors.listenPort ? (
                <FormError>{errors.listenPort}</FormError>
              ) : null}
            </Label>
            <Label>
              <span>Local address (CIDR)</span>
              <Input
                value={localAddress}
                onChange={(e) => setLocalAddress(e.target.value)}
                placeholder="10.8.0.1/24 (auto if empty)"
                autoComplete="off"
                aria-label="Local address"
                aria-invalid={submitAttempted && !!errors.localAddress}
              />
              {submitAttempted && errors.localAddress ? (
                <FormError>{errors.localAddress}</FormError>
              ) : null}
            </Label>
          </FieldRow>
          <FieldRow>
            <Label>
              <span>MTU</span>
              <Input
                value={mtu}
                onChange={(e) => setMtu(e.target.value)}
                placeholder="1420"
                inputMode="numeric"
                autoComplete="off"
                aria-label="MTU"
                aria-invalid={submitAttempted && !!errors.mtu}
              />
              {submitAttempted && errors.mtu ? <FormError>{errors.mtu}</FormError> : null}
            </Label>
            <Label>
              <span>Comment</span>
              <Input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="optional"
                autoComplete="off"
                aria-label="Comment"
              />
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
                autoComplete="new-password"
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
        </FieldStack>
      ) : null}
      {error ? <FormError role="alert">{error}</FormError> : null}
      <div className={styles.actions}>
        <Button variant="ghost" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button variant="success" onClick={submit} disabled={!canSubmit}>
          {submitting ? 'Creating…' : 'Create WireGuard server'}
        </Button>
      </div>
    </FieldStack>
  );
}
