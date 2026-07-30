import { useMemo, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button, Code, Dialog, FieldRow, FieldStack, Input, Label, useToast } from '@nasnet/ui';
import {
  buildWireguardClientConfig,
  wireguardConfigFilename,
} from '../../../utils/wireguard-client-config';

interface Props {
  peerName: string;
  privateKey: string;
  serverPublicKey: string;
  presharedKey?: string;
  defaultEndpoint?: string;
  defaultAddress?: string;
  defaultAllowedIps?: string;
  persistentKeepalive?: string;
  onClose: () => void;
}

export function WgClientConfigDialog({
  peerName,
  privateKey,
  serverPublicKey,
  presharedKey,
  defaultEndpoint,
  defaultAddress,
  defaultAllowedIps,
  persistentKeepalive,
  onClose,
}: Props) {
  const [endpoint, setEndpoint] = useState(defaultEndpoint ?? '');
  const [address, setAddress] = useState(defaultAddress ?? '');
  const [dns, setDns] = useState('');
  const [allowedIps, setAllowedIps] = useState(defaultAllowedIps ?? '0.0.0.0/0');
  const toast = useToast();

  const config = useMemo(
    () =>
      buildWireguardClientConfig({
        privateKey,
        address,
        dns,
        serverPublicKey,
        presharedKey,
        allowedIps,
        endpoint,
        persistentKeepalive: normalizeKeepalive(persistentKeepalive),
      }),
    [
      privateKey,
      address,
      dns,
      serverPublicKey,
      presharedKey,
      allowedIps,
      endpoint,
      persistentKeepalive,
    ],
  );

  const download = () => {
    const blob = new Blob([config], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = wireguardConfigFilename(peerName);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(config);
      toast.notify({ title: 'Config copied to clipboard', tone: 'success' });
    } catch {
      toast.notify({ title: 'Failed to copy config', tone: 'danger' });
    }
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title={`Client config - ${peerName}`}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button variant="secondary" onClick={copy}>
            Copy
          </Button>
          <Button onClick={download}>Download .conf</Button>
        </>
      }
    >
      <FieldStack>
        <FieldRow>
          <Label>
            <span>Server endpoint</span>
            <Input
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              placeholder="vpn.example.com:13231"
              aria-label="Server endpoint"
            />
          </Label>
          <Label>
            <span>Client address</span>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="10.8.0.2/24"
              aria-label="Client address"
            />
          </Label>
        </FieldRow>
        <FieldRow>
          <Label>
            <span>DNS (optional)</span>
            <Input
              value={dns}
              onChange={(e) => setDns(e.target.value)}
              placeholder="1.1.1.1"
              aria-label="DNS"
            />
          </Label>
          <Label>
            <span>Allowed IPs (client)</span>
            <Input
              value={allowedIps}
              onChange={(e) => setAllowedIps(e.target.value)}
              placeholder="0.0.0.0/0"
              aria-label="Allowed IPs"
            />
          </Label>
        </FieldRow>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ background: '#fff', padding: 12, borderRadius: 8 }}>
            <QRCodeSVG value={config} size={216} marginSize={0} />
          </div>
        </div>
        <Code style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{config}</Code>
      </FieldStack>
    </Dialog>
  );
}

function normalizeKeepalive(value?: string): string | undefined {
  const match = value?.trim().match(/^\d+/);
  return match ? match[0] : undefined;
}
