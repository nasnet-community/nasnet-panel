import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
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
  createL2tpServer,
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
import { isCIDR, isPort, validateOvpnSecret } from '../../../utils/validators';
import { pollSstpServerTask } from '../sstpTask';

export type AddVpnServerType = 'openvpn' | 'wireguard' | 'l2tp' | 'sstp';

const TYPE_TILES: Array<VpnTypeTile<AddVpnServerType>> = [
  { value: 'openvpn', label: 'OpenVPN', icon: <Globe size={26} strokeWidth={1.75} /> },
  { value: 'wireguard', label: 'WireGuard', icon: <Shield size={26} strokeWidth={1.75} /> },
  { value: 'l2tp', label: 'L2TP', icon: <Cable size={26} strokeWidth={1.75} /> },
  { value: 'sstp', label: 'SSTP', icon: <KeyRound size={26} strokeWidth={1.75} /> },
];

const POLL_INTERVAL_MS = 1000;

const ADVANCED_WG_SERVER_FIELDS_ID = 'wg-server-advanced-fields';

interface Props {
  creds: VPNCredentials | null;
  sstpEnabled: boolean;
  l2tpEnabled: boolean;
  onCancel: () => void;
  onCreated: () => void;
}

export function AddVpnServerDialog({
  creds,
  sstpEnabled,
  l2tpEnabled,
  onCancel,
  onCreated,
}: Props) {
  const { t } = useTranslation('vpn');
  const [type, setType] = useState<AddVpnServerType>('openvpn');

  return (
    <Dialog open onClose={onCancel} title={t('addServer.title')} size="md" footer={null}>
      <FieldStack>
        <VpnTypeTilePicker
          ariaLabel={t('addServer.typeLabel')}
          legend={t('addServer.typeLegend')}
          value={type}
          tiles={TYPE_TILES}
          onChange={(v) => setType(v as AddVpnServerType)}
        />

        {type === 'openvpn' ? (
          <OvpnServerForm creds={creds} onCancel={onCancel} onCreated={onCreated} />
        ) : type === 'l2tp' ? (
          <L2tpServerForm
            creds={creds}
            l2tpEnabled={l2tpEnabled}
            onCancel={onCancel}
            onCreated={onCreated}
          />
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
  const { t } = useTranslation('vpn');
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
          setError(status.error ?? t('addServer.ovpn.creationFailed'));
          setSubmitting(false);
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : t('addServer.taskStatusFailed'));
        setSubmitting(false);
      }
    };

    tick().catch(() => undefined);
    return () => {
      cancelled = true;
      if (timeoutId !== null) window.clearTimeout(timeoutId);
    };
  }, [taskId, t]);

  const errors = useMemo(
    () => ({
      certPassphrase: validateOvpnSecret(certPassphrase, t('addServer.ovpn.certPassphraseField')),
    }),
    [certPassphrase, t],
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
            : t('addServer.ovpn.startFailed');
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
          label={failed ? t('addServer.failed') : (progress.currentStep ?? t('addServer.working'))}
          tone={failed ? 'danger' : 'success'}
        />
        {error ? <FormError role="alert">{error}</FormError> : null}
        <div className={styles.actions}>
          <Button variant="ghost" onClick={onCancel} disabled={!failed}>
            {t('shared.close')}
          </Button>
        </div>
      </FieldStack>
    );
  }

  return (
    <FieldStack>
      <FieldRow>
        <Label>
          <span>{t('addServer.ovpn.certPassphrase')}</span>
          <PasswordInput
            value={certPassphrase}
            onChange={(e) => setCertPassphrase(e.target.value)}
            aria-label={t('addServer.ovpn.certPassphrase')}
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
          {t('shared.cancel')}
        </Button>
        <Button variant="success" onClick={submit} disabled={!canSubmit}>
          {submitting ? t('shared.creating') : t('addServer.ovpn.create')}
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
  const { t } = useTranslation('vpn');
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
          setError(status.error ?? t('addServer.sstp.setupFailed'));
          setSubmitting(false);
        }
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : t('addServer.taskStatusFailed'));
        setSubmitting(false);
      });

    return () => poll.cancel();
  }, [taskId, t]);

  const canSubmit = !!creds && !submitting && !sstpEnabled;

  const submit = async () => {
    if (!canSubmit || !creds) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await createSstpServer(creds);
      setTaskId(res.taskId);
    } catch (err) {
      const message =
        err instanceof ApiError && err.status === 409
          ? t('addServer.sstp.alreadyEnabledError')
          : err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : t('addServer.sstp.startFailed');
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
          label={failed ? t('addServer.failed') : (progress.currentStep ?? t('addServer.working'))}
          tone={failed ? 'danger' : 'success'}
        />
        {error ? <InlineAlert tone="danger">{error}</InlineAlert> : null}
        <FieldRow>
          <Button variant="ghost" onClick={onCancel} disabled={!failed}>
            {t('shared.close')}
          </Button>
        </FieldRow>
      </FieldStack>
    );
  }

  return (
    <FieldStack>
      <InlineAlert tone="info" id={alertId}>
        {sstpEnabled ? t('addServer.sstp.alreadyEnabledInfo') : t('addServer.sstp.info')}
      </InlineAlert>
      {error ? <InlineAlert tone="danger">{error}</InlineAlert> : null}
      <FieldRow>
        <Button variant="ghost" onClick={onCancel} disabled={submitting}>
          {t('shared.cancel')}
        </Button>
        <Button
          variant="success"
          onClick={submit}
          disabled={!canSubmit}
          aria-describedby={sstpEnabled ? alertId : undefined}
        >
          {sstpEnabled
            ? t('addServer.sstp.alreadyEnabled')
            : submitting
              ? t('shared.enabling')
              : t('addServer.sstp.enable')}
        </Button>
      </FieldRow>
    </FieldStack>
  );
}

interface L2tpFormProps extends FormProps {
  l2tpEnabled: boolean;
}

function L2tpServerForm({ creds, l2tpEnabled, onCancel, onCreated }: L2tpFormProps) {
  const { t } = useTranslation('vpn');
  const alertId = useId();
  const [ipsecSecret, setIpsecSecret] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const secretError = ipsecSecret.trim() === '' ? t('addServer.l2tp.secretRequired') : null;
  const canSubmit = !!creds && !submitting && !l2tpEnabled;

  const submit = async () => {
    setSubmitAttempted(true);
    if (!canSubmit || !creds || secretError) return;
    setError(null);
    setSubmitting(true);
    try {
      await createL2tpServer(creds, { ipsecSecret: ipsecSecret.trim() });
      onCreated();
    } catch (err) {
      const message =
        err instanceof ApiError && err.status === 409
          ? t('addServer.l2tp.alreadyEnabledError')
          : err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : t('addServer.l2tp.enableFailed');
      setError(message);
      setSubmitting(false);
    }
  };

  return (
    <FieldStack>
      <InlineAlert tone="info" id={alertId}>
        {l2tpEnabled ? t('addServer.l2tp.alreadyEnabledInfo') : t('addServer.l2tp.info')}
      </InlineAlert>
      {l2tpEnabled ? null : (
        <FieldRow>
          <Label>
            <span>{t('shared.ipsecSecret')}</span>
            <PasswordInput
              value={ipsecSecret}
              onChange={(e) => setIpsecSecret(e.target.value)}
              aria-label={t('shared.ipsecSecret')}
              autoComplete="new-password"
              aria-invalid={submitAttempted && !!secretError}
            />
            {submitAttempted && secretError ? <FormError>{secretError}</FormError> : null}
          </Label>
        </FieldRow>
      )}
      {error ? <InlineAlert tone="danger">{error}</InlineAlert> : null}
      <FieldRow>
        <Button variant="ghost" onClick={onCancel} disabled={submitting}>
          {t('shared.cancel')}
        </Button>
        <Button
          variant="success"
          onClick={submit}
          disabled={!canSubmit}
          aria-describedby={l2tpEnabled ? alertId : undefined}
        >
          {l2tpEnabled
            ? t('addServer.l2tp.alreadyEnabled')
            : submitting
              ? t('shared.enabling')
              : t('addServer.l2tp.enable')}
        </Button>
      </FieldRow>
    </FieldStack>
  );
}

function WireguardServerForm({ creds, onCancel, onCreated }: FormProps) {
  const { t } = useTranslation('vpn');
  const [advanced, setAdvanced] = useState(false);
  const [name, setName] = useState('');
  const [localAddress, setLocalAddress] = useState('');
  const [listenPort, setListenPort] = useState('');
  const [mtu, setMtu] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [disabled, setDisabled] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const errors = useMemo(
    () => ({
      localAddress:
        !advanced || localAddress.trim() === '' || isCIDR(localAddress)
          ? null
          : t('addServer.wg.cidrError'),
      listenPort:
        !advanced || listenPort.trim() === '' || isPort(listenPort) ? null : t('shared.portRange'),
      mtu:
        !advanced || mtu.trim() === '' || (Number.isInteger(Number(mtu)) && Number(mtu) > 0)
          ? null
          : t('shared.mtuPositive'),
    }),
    [advanced, localAddress, listenPort, mtu, t],
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
          name: '',
          localAddress: localAddress.trim() || undefined,
          listenPort: listenPort.trim() ? Number(listenPort) : undefined,
          mtu: mtu.trim() ? Number(mtu) : undefined,
          comment: name.trim() || undefined,
          privateKey: privateKey.trim() || undefined,
          disabled: disabled || undefined,
        }
      : { name: '', comment: name.trim() || undefined };
    try {
      await createWireguardServer(creds, body);
      onCreated();
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : t('addServer.wg.createFailed');
      setError(message);
      setSubmitting(false);
    }
  };

  return (
    <FieldStack>
      <FieldRow>
        <Label>
          <span>{t('shared.name')}</span>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('addServer.wg.namePlaceholder')}
            autoComplete="off"
            aria-label={t('shared.name')}
          />
        </Label>
      </FieldRow>
      <FieldRow>
        <Label as="div">
          <Switch
            label={t('shared.advancedMode')}
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
          aria-label={t('addServer.wg.advancedGroup')}
        >
          <FieldRow>
            <Label>
              <span>{t('shared.listenPort')}</span>
              <Input
                value={listenPort}
                onChange={(e) => setListenPort(e.target.value)}
                placeholder="51820"
                inputMode="numeric"
                autoComplete="off"
                aria-label={t('shared.listenPort')}
                dir="ltr"
                aria-invalid={submitAttempted && !!errors.listenPort}
              />
              {submitAttempted && errors.listenPort ? (
                <FormError>{errors.listenPort}</FormError>
              ) : null}
            </Label>
            <Label>
              <span>{t('addServer.wg.localAddressCidr')}</span>
              <Input
                value={localAddress}
                onChange={(e) => setLocalAddress(e.target.value)}
                placeholder={t('addServer.wg.localAddressPlaceholder')}
                autoComplete="off"
                aria-label={t('details.localAddress')}
                dir="ltr"
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
          </FieldRow>
          <FieldRow>
            <Label>
              <span>{t('shared.privateKey')}</span>
              <PasswordInput
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                placeholder={t('shared.autoGeneratedIfEmpty')}
                aria-label={t('shared.privateKey')}
                dir="ltr"
                autoComplete="new-password"
              />
            </Label>
          </FieldRow>
          <FieldRow>
            <Label as="div">
              <Switch
                label={t('shared.enabledOnCreation')}
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
          {t('shared.cancel')}
        </Button>
        <Button variant="success" onClick={submit} disabled={!canSubmit}>
          {submitting ? t('shared.creating') : t('addServer.wg.create')}
        </Button>
      </div>
    </FieldStack>
  );
}
