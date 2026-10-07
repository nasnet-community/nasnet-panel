import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Cable, Globe, KeyRound, Shield, Sparkles } from 'lucide-react';
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
import {
  HyperSpeedClaimDialog,
  type ClaimedVpnCredentials,
} from '../../easy-config/steps/ipmask/HyperSpeedClaimDialog';
import type {
  AddL2TPClientRequest,
  CreateWireguardClientRequest,
  ImportWireguardConfigRequest,
} from '../../../api';
import { isCIDR, isPort, isWireGuardKey, validateHostOrIp } from '../../../utils/validators';

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
  comment: string;
  connectTo: string;
  user: string;
  password: string;
  useIpsec: boolean;
  ipsecSecret: string;
  disabled: boolean;
  // WireGuard-specific
  interfacePrivateKey: string;
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
  comment: '',
  connectTo: '',
  user: '',
  password: '',
  useIpsec: false,
  ipsecSecret: '',
  disabled: false,
  interfacePrivateKey: '',
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
  const { t } = useTranslation('vpn');
  const [type, setType] = useState<AddVpnType>('l2tp');
  const [wgMode, setWgMode] = useState<WgMode>('import');
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const markTouched = (key: string) =>
    setTouched((prev) => (prev[key] ? prev : { ...prev, [key]: true }));

  const errors = useMemo(() => {
    const base = {} as Record<string, string | null>;

    if (type === 'l2tp') {
      base.connectTo = validateHostOrIp(draft.connectTo);
      base.user = draft.user.trim() === '' ? t('l2tpEdit.userRequired') : null;
      base.password = draft.password === '' ? t('shared.passwordRequired') : null;
    }

    if (type === 'wireguard' && wgMode === 'create') {
      base.interfaceLocalAddress = isCIDR(draft.interfaceLocalAddress)
        ? null
        : t('addClient.errors.cidr');
      base.interfacePrivateKey =
        draft.interfacePrivateKey.trim() === '' || isWireGuardKey(draft.interfacePrivateKey)
          ? null
          : t('shared.wgKeyInvalid');
      base.endpoint = validateHostOrIp(draft.endpoint);
      base.endpointPort = isPort(draft.endpointPort) ? null : t('shared.portRange');
      base.allowedAddress =
        draft.allowedAddress.trim() === '' ? t('addClient.errors.allowedAddress') : null;
      base.peerKey =
        draft.publicKey.trim() === '' && draft.peerPrivateKey.trim() === ''
          ? t('addClient.errors.peerKey')
          : null;
      base.persistentKeepalive =
        draft.persistentKeepalive.trim() === '' ||
        (Number.isInteger(Number(draft.persistentKeepalive)) &&
          Number(draft.persistentKeepalive) > 0)
          ? null
          : t('shared.keepalivePositive');
    }

    if (type === 'wireguard' && wgMode === 'import') {
      base.configText = draft.configText.trim() === '' ? t('addClient.errors.configText') : null;
    }

    return base;
  }, [type, wgMode, draft, t]);

  const hasErrors = Object.values(errors).some(Boolean);
  const canSubmit = !submitting && !hasErrors;

  const handleSubmit = async () => {
    const allKeys = Object.keys(errors).reduce<Record<string, boolean>>((acc, k) => {
      acc[k] = true;
      return acc;
    }, {});
    setTouched((prev) => ({ ...prev, ...allKeys }));
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);
    try {
      if (type === 'l2tp') {
        await onSubmitL2TP({
          connectTo: draft.connectTo.trim(),
          user: draft.user.trim(),
          password: draft.password,
          disabled: draft.disabled,
          ipsecSecret: draft.useIpsec ? draft.ipsecSecret.trim() || undefined : undefined,
          comment: draft.comment.trim() || undefined,
        });
      } else if (type === 'wireguard' && wgMode === 'create') {
        const body: CreateWireguardClientRequest = {
          interfaceLocalAddress: draft.interfaceLocalAddress.trim(),
          endpointIP: draft.endpoint.trim(),
          endpointPort: Number(draft.endpointPort),
          allowedAddress: draft.allowedAddress.trim(),
          disabled: draft.disabled,
        };
        if (draft.comment.trim()) body.comment = draft.comment.trim();
        if (draft.interfacePrivateKey.trim()) {
          body.interfacePrivateKey = draft.interfacePrivateKey.trim();
        }
        if (draft.publicKey.trim()) body.peerPublicKey = draft.publicKey.trim();
        if (draft.peerPrivateKey.trim()) body.peerPrivateKey = draft.peerPrivateKey.trim();
        if (draft.presharedKey.trim()) body.presharedKey = draft.presharedKey.trim();
        if (draft.persistentKeepalive.trim()) {
          body.persistentKeepalive = Number(draft.persistentKeepalive);
        }
        await onSubmitWireguard(body);
      } else if (type === 'wireguard' && wgMode === 'import') {
        await onSubmitWireguardImport({
          config: draft.configText,
          comment: draft.comment.trim() || undefined,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('addClient.failed'));
      setSubmitting(false);
      return;
    }
    setSubmitting(false);
  };

  return (
    <Dialog
      open
      onClose={submitting ? () => undefined : onCancel}
      title={t('clients.form.newTitle')}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onCancel} disabled={submitting}>
            {t('shared.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {submitting ? t('shared.adding') : t('addClient.submit')}
          </Button>
        </>
      }
    >
      <FieldStack>
        <VpnTypeTilePicker
          ariaLabel={t('addClient.typeLabel')}
          legend={t('addClient.typeLegend')}
          value={type}
          tiles={TYPE_TILES}
          onChange={(v) => setType(v as AddVpnType)}
        />

        <FieldRow>
          <Label>
            <span>{t('shared.name')}</span>
            <Input
              value={draft.comment}
              onChange={(e) => set('comment', e.target.value)}
              placeholder={t('shared.optional')}
              aria-label={t('shared.name')}
              autoComplete="off"
            />
          </Label>
        </FieldRow>

        {type === 'l2tp' ? (
          <L2tpFields
            draft={draft}
            set={set}
            errors={errors}
            touched={touched}
            markTouched={markTouched}
            onClaimed={(creds) =>
              setDraft((d) => ({
                ...d,
                connectTo: creds.server,
                user: creds.username,
                password: creds.password,
              }))
            }
          />
        ) : null}

        {type === 'wireguard' ? (
          <>
            <FieldRow>
              <Label as="div">
                <Switch
                  label={t('addClient.importExisting')}
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
                label={t('shared.enabledOnCreation')}
                checked={!draft.disabled}
                onChange={(e) => set('disabled', !e.target.checked)}
              />
            </Label>
            {type === 'l2tp' ? (
              <Label as="div">
                <Switch
                  label={t('shared.useIpsec')}
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
  onClaimed: (creds: ClaimedVpnCredentials) => void;
}

function L2tpFields({ draft, set, errors, touched, markTouched, onClaimed }: L2tpFieldsProps) {
  const { t } = useTranslation('vpn');
  const [claimOpen, setClaimOpen] = useState(false);
  return (
    <>
      <FieldRow>
        <Label>
          <span>{t('shared.connectTo')}</span>
          <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
            <Input
              value={draft.connectTo}
              onChange={(e) => set('connectTo', e.target.value)}
              onBlur={() => markTouched('connectTo')}
              placeholder="192.168.1.1"
              aria-label={t('shared.connectTo')}
              dir="ltr"
              autoComplete="off"
              aria-invalid={touched.connectTo && !!errors.connectTo}
              style={{ flex: 1 }}
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => setClaimOpen(true)}
              style={{ whiteSpace: 'nowrap' }}
            >
              <Sparkles size={16} strokeWidth={2} />
              {t('addClient.claimFree')}
            </Button>
          </div>
          {touched.connectTo && errors.connectTo ? <FormError>{errors.connectTo}</FormError> : null}
        </Label>
      </FieldRow>
      <FieldRow>
        <Label>
          <span>{t('shared.user')}</span>
          <Input
            value={draft.user}
            onChange={(e) => set('user', e.target.value)}
            onBlur={() => markTouched('user')}
            placeholder={t('shared.usernamePlaceholder')}
            aria-label={t('shared.user')}
            autoComplete="off"
            aria-invalid={touched.user && !!errors.user}
          />
          {touched.user && errors.user ? <FormError>{errors.user}</FormError> : null}
        </Label>
        <Label>
          <span>{t('shared.password')}</span>
          <PasswordInput
            value={draft.password}
            onChange={(e) => set('password', e.target.value)}
            onBlur={() => markTouched('password')}
            aria-label={t('shared.password')}
            autoComplete="new-password"
            aria-invalid={touched.password && !!errors.password}
          />
          {touched.password && errors.password ? <FormError>{errors.password}</FormError> : null}
        </Label>
      </FieldRow>
      <FieldRow>
        <Label>
          <span>{t('shared.ipsecSecret')}</span>
          <PasswordInput
            value={draft.ipsecSecret}
            onChange={(e) => set('ipsecSecret', e.target.value)}
            placeholder={t('shared.preSharedKeyPlaceholder')}
            aria-label={t('shared.ipsecSecret')}
            autoComplete="new-password"
            disabled={!draft.useIpsec}
          />
        </Label>
      </FieldRow>
      <HyperSpeedClaimDialog
        open={claimOpen}
        onClose={() => setClaimOpen(false)}
        onClaimed={onClaimed}
      />
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
  const { t } = useTranslation('vpn');
  return (
    <>
      <FieldRow>
        <Label>
          <span>{t('addClient.localAddressCidr')}</span>
          <Input
            value={draft.interfaceLocalAddress}
            onChange={(e) => set('interfaceLocalAddress', e.target.value)}
            onBlur={() => markTouched('interfaceLocalAddress')}
            placeholder="10.0.0.2/24"
            aria-label={t('addClient.localAddress')}
            dir="ltr"
            autoComplete="off"
            aria-invalid={touched.interfaceLocalAddress && !!errors.interfaceLocalAddress}
          />
          {touched.interfaceLocalAddress && errors.interfaceLocalAddress ? (
            <FormError>{errors.interfaceLocalAddress}</FormError>
          ) : null}
        </Label>
        <Label>
          <span>{t('addClient.allowedAddressCidr')}</span>
          <Input
            value={draft.allowedAddress}
            onChange={(e) => set('allowedAddress', e.target.value)}
            onBlur={() => markTouched('allowedAddress')}
            placeholder="0.0.0.0/0"
            aria-label={t('addClient.allowedAddress')}
            dir="ltr"
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
          <span>{t('addClient.interfacePrivateKey')}</span>
          <PasswordInput
            value={draft.interfacePrivateKey}
            onChange={(e) => set('interfacePrivateKey', e.target.value)}
            onBlur={() => markTouched('interfacePrivateKey')}
            placeholder={t('addClient.optionalGenerated')}
            aria-label={t('addClient.interfacePrivateKey')}
            dir="ltr"
            autoComplete="new-password"
            aria-invalid={touched.interfacePrivateKey && !!errors.interfacePrivateKey}
          />
          {touched.interfacePrivateKey && errors.interfacePrivateKey ? (
            <FormError>{errors.interfacePrivateKey}</FormError>
          ) : null}
        </Label>
      </FieldRow>
      <FieldRow>
        <Label>
          <span>{t('clients.form.endpointHost')}</span>
          <Input
            value={draft.endpoint}
            onChange={(e) => set('endpoint', e.target.value)}
            onBlur={() => markTouched('endpoint')}
            placeholder="vpn.example.com"
            aria-label={t('clients.form.endpointHost')}
            dir="ltr"
            autoComplete="off"
            aria-invalid={touched.endpoint && !!errors.endpoint}
          />
          {touched.endpoint && errors.endpoint ? <FormError>{errors.endpoint}</FormError> : null}
        </Label>
        <Label>
          <span>{t('clients.form.endpointPort')}</span>
          <Input
            value={draft.endpointPort}
            onChange={(e) => set('endpointPort', e.target.value)}
            onBlur={() => markTouched('endpointPort')}
            placeholder="51820"
            inputMode="numeric"
            aria-label={t('clients.form.endpointPort')}
            dir="ltr"
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
          <span>{t('shared.peerPublicKey')}</span>
          <Input
            value={draft.publicKey}
            onChange={(e) => set('publicKey', e.target.value)}
            onBlur={() => markTouched('peerKey')}
            placeholder={t('addClient.publicKeyPlaceholder')}
            aria-label={t('shared.peerPublicKey')}
            dir="ltr"
            autoComplete="off"
            aria-invalid={touched.peerKey && !!errors.peerKey}
          />
        </Label>
        <Label>
          <span>{t('shared.peerPrivateKey')}</span>
          <PasswordInput
            value={draft.peerPrivateKey}
            onChange={(e) => set('peerPrivateKey', e.target.value)}
            onBlur={() => markTouched('peerKey')}
            placeholder={t('addClient.privateKeyPlaceholder')}
            aria-label={t('shared.peerPrivateKey')}
            dir="ltr"
            autoComplete="new-password"
          />
        </Label>
      </FieldRow>
      {touched.peerKey && errors.peerKey ? <FormError>{errors.peerKey}</FormError> : null}
      <FieldRow>
        <Label>
          <span>{t('shared.presharedKey')}</span>
          <PasswordInput
            value={draft.presharedKey}
            onChange={(e) => set('presharedKey', e.target.value)}
            placeholder={t('shared.optional')}
            aria-label={t('shared.presharedKey')}
            dir="ltr"
            autoComplete="new-password"
          />
        </Label>
        <Label>
          <span>{t('shared.keepaliveSeconds')}</span>
          <Input
            value={draft.persistentKeepalive}
            onChange={(e) => set('persistentKeepalive', e.target.value)}
            onBlur={() => markTouched('persistentKeepalive')}
            placeholder={t('shared.keepalivePlaceholder')}
            inputMode="numeric"
            aria-label={t('shared.keepalive')}
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
  const { t } = useTranslation('vpn');
  return (
    <>
      <FieldRow>
        <FileDrop
          accept=".conf,.txt,text/plain"
          label={t('addClient.dropConf')}
          hint={t('addClient.dropHint')}
          onFile={(_, text) => set('configText', text)}
        />
      </FieldRow>
      <FieldRow>
        <Label>
          <span>{t('addClient.configText')}</span>
          <Textarea
            value={draft.configText}
            onChange={(e) => set('configText', e.target.value)}
            onBlur={() => markTouched('configText')}
            rows={12}
            placeholder={`[Interface]\nPrivateKey = ...\nAddress = 10.0.0.2/24\nListenPort = 51820\n\n[Peer]\nPublicKey = ...\nAllowedIPs = 0.0.0.0/0\nEndpoint = vpn.example.com:51820`}
            aria-label={t('addClient.config')}
            dir="ltr"
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
