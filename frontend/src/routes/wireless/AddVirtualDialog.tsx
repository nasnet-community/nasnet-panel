import { useMemo, useState } from 'react';
import {
  Button,
  Checkbox,
  Dialog,
  FieldRow,
  FieldStack,
  Inline,
  Input,
  Label,
  PasswordInput,
  Select,
  useToast,
} from '@nasnet/ui';
import type { BridgeResponse, CreateVirtualWifiRequest, Interface } from '../../api';
import { isWifiPassword } from '../../utils/validators';
import { bridgeDescription, bridgeLabel } from '../lan/bridgeTypes';
import { SECURITY_OPTIONS } from './WirelessFields';

const LAN_BRIDGE_PREFIX = 'LANBridge';

interface Props {
  interfaces: Interface[];
  bridges: BridgeResponse[];
  onClose: () => void;
  onCreate: (request: CreateVirtualWifiRequest) => Promise<void>;
}

export function AddVirtualDialog({ interfaces, bridges, onClose, onCreate }: Props) {
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
      on ? Array.from(new Set([...prev, value])) : prev.filter((t) => t !== value),
    );

  const submit = async () => {
    const name = ssid.trim();
    if (!master || !bridge || !name) {
      toast.notify({ title: 'Master interface, bridge, and SSID are required', tone: 'warning' });
      return;
    }
    if (password && !isWifiPassword(password)) {
      toast.notify({ title: 'Password must be 8 to 63 characters', tone: 'warning' });
      return;
    }
    if (password && securityTypes.length === 0) {
      toast.notify({ title: 'Select at least one security type', tone: 'warning' });
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

  return (
    <Dialog
      open
      onClose={onClose}
      title="Add virtual wireless interface"
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="success" onClick={submit} disabled={busy}>
            {busy ? 'Creating...' : 'Create'}
          </Button>
        </>
      }
    >
      <FieldStack>
        <FieldRow>
          <Label as="div">
            <span>Master interface</span>
            <Select
              options={masterOptions}
              value={master}
              onChange={setMaster}
              placeholder="Select an interface"
              disabled={busy || masterOptions.length === 0}
              aria-label="Master interface"
            />
          </Label>
          <Label as="div">
            <span>Bridge</span>
            <Select
              options={bridgeOptions}
              value={bridge}
              onChange={setBridge}
              placeholder={bridgeOptions.length > 0 ? 'Select a bridge' : 'No bridge available'}
              disabled={busy || bridgeOptions.length === 0}
              aria-label="Bridge"
            />
          </Label>
        </FieldRow>
        <FieldRow>
          <Label>
            <span>SSID</span>
            <Input value={ssid} onChange={(e) => setSsid(e.target.value)} aria-label="SSID" />
          </Label>
          <Label>
            <span>Password</span>
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Leave empty for an open network"
              aria-label="Password"
            />
          </Label>
        </FieldRow>
        {password ? (
          <Label as="div">
            <span>Security</span>
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
