import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Checkbox,
  Dialog,
  FieldRow,
  FieldStack,
  FormError,
  Inline,
  Input,
  Label,
  PasswordInput,
  Select,
  useToast,
} from '@nasnet/ui';
import type { BridgeResponse, CreateVirtualWifiRequest, Interface } from '../../api';
import { isWifiPassword } from '../../utils/validators';
import { useFormat } from '../../utils/useFormat';
import { bridgeDescription, bridgeLabel } from '../lan/bridgeTypes';
import { SECURITY_OPTIONS } from './WirelessFields';

const LAN_BRIDGE_PREFIX = 'LANBridge';

interface Props {
  interfaces: Interface[];
  bridges: BridgeResponse[];
  bridgesError: string | null;
  onRetryBridges: () => void;
  onClose: () => void;
  onCreate: (request: CreateVirtualWifiRequest) => Promise<void>;
}

export function AddVirtualDialog({
  interfaces,
  bridges,
  bridgesError,
  onRetryBridges,
  onClose,
  onCreate,
}: Props) {
  const { t } = useTranslation('wireless');
  const { number } = useFormat();
  const toast = useToast();
  const masterOptions = useMemo(
    () =>
      interfaces
        .filter((i) => !i.isVirtual)
        .map((i) => ({ value: i.name, label: i.ssid ? `${i.ssid} (${i.name})` : i.name })),
    [interfaces],
  );
  const bridgeOptions = useMemo(
    () =>
      bridges
        .filter((b) => !b.disabled && b.name.startsWith(LAN_BRIDGE_PREFIX))
        .map((b) => ({
          value: b.name,
          label: bridgeLabel(b.name),
          description: bridgeDescription(b.name, b.comment),
        })),
    [bridges],
  );
  const [master, setMaster] = useState(masterOptions[0]?.value ?? '');
  const [bridge, setBridge] = useState('');
  const [ssid, setSsid] = useState('');
  const [password, setPassword] = useState('');
  const [securityTypes, setSecurityTypes] = useState<string[]>(['wpa2-psk']);
  const [busy, setBusy] = useState(false);

  const toggleType = (value: string, on: boolean) =>
    setSecurityTypes((prev) =>
      on ? Array.from(new Set([...prev, value])) : prev.filter((type) => type !== value),
    );

  const submit = async () => {
    const name = ssid.trim();
    if (!master || !bridge || !name) {
      toast.notify({ title: t('addVirtual.requiredFields'), tone: 'warning' });
      return;
    }
    if (password && !isWifiPassword(password)) {
      toast.notify({
        title: t('addVirtual.passwordLength', { min: number(8), max: number(63) }),
        tone: 'warning',
      });
      return;
    }
    if (password && securityTypes.length === 0) {
      toast.notify({ title: t('addVirtual.selectSecurityType'), tone: 'warning' });
      return;
    }
    const request: CreateVirtualWifiRequest = { masterInterface: master, ssid: name, bridge };
    if (password) {
      request.password = password;
      request.securityTypes = securityTypes.join(',');
    }
    setBusy(true);
    try {
      await onCreate(request);
    } finally {
      setBusy(false);
    }
  };

  const close = () => {
    if (busy) return;
    onClose();
  };

  return (
    <Dialog
      open
      onClose={close}
      title={t('addVirtual.title')}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={close} disabled={busy}>
            {t('common.cancel')}
          </Button>
          <Button variant="success" onClick={submit} disabled={busy}>
            {busy ? t('addVirtual.creating') : t('addVirtual.create')}
          </Button>
        </>
      }
    >
      <FieldStack>
        <FieldRow>
          <Label as="div">
            <span>{t('addVirtual.masterInterface')}</span>
            <Select
              options={masterOptions}
              value={master}
              onChange={setMaster}
              placeholder={t('addVirtual.selectInterface')}
              disabled={busy || masterOptions.length === 0}
              aria-label={t('addVirtual.masterInterface')}
            />
          </Label>
          <Label as="div">
            <span>{t('addVirtual.bridge')}</span>
            <Select
              options={bridgeOptions}
              value={bridge}
              onChange={setBridge}
              placeholder={
                bridgesError
                  ? t('toast.loadBridgesError')
                  : bridgeOptions.length > 0
                    ? t('addVirtual.selectBridge')
                    : t('addVirtual.noBridge')
              }
              disabled={busy || bridgeOptions.length === 0}
              aria-label={t('addVirtual.bridge')}
            />
            {bridgesError ? (
              <Inline $gap="8px">
                <FormError>{bridgesError}</FormError>
                <Button size="sm" variant="ghost" onClick={onRetryBridges} disabled={busy}>
                  {t('addVirtual.retry')}
                </Button>
              </Inline>
            ) : null}
          </Label>
        </FieldRow>
        <FieldRow>
          <Label>
            <span>{t('common.ssid')}</span>
            <Input
              value={ssid}
              onChange={(e) => setSsid(e.target.value)}
              aria-label={t('common.ssid')}
              dir="auto"
            />
          </Label>
          <Label>
            <span>{t('common.password')}</span>
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('addVirtual.openNetworkPlaceholder')}
              aria-label={t('common.password')}
            />
          </Label>
        </FieldRow>
        {password ? (
          <Label as="div">
            <span>{t('common.security')}</span>
            <Inline $gap="16px">
              {SECURITY_OPTIONS.map((opt) => (
                <Checkbox
                  key={opt.value}
                  label={opt.label}
                  checked={securityTypes.includes(opt.value)}
                  onChange={(e) => toggleType(opt.value, e.target.checked)}
                />
              ))}
            </Inline>
          </Label>
        ) : null}
      </FieldStack>
    </Dialog>
  );
}
