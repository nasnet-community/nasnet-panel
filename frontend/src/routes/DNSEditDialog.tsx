import { useRef, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { Button, Dialog, Inline, Input, Label, Stack, Switch, useToast } from '@nasnet/ui';
import styles from './DNSEditDialog.module.scss';
import { ApiError, updateDnsConfig, type DnsCredentials, type DnsInfoResponse } from '../api';

interface DNSEditDialogProps {
  open: boolean;
  initial: DnsInfoResponse;
  creds: DnsCredentials;
  onClose: () => void;
  onSaved: () => void;
}

interface ServerRow {
  id: string;
  value: string;
}

export function DNSEditDialog({ open, initial, creds, onClose, onSaved }: DNSEditDialogProps) {
  const toast = useToast();
  const nextId = useRef(0);
  const makeRow = (value: string): ServerRow => {
    nextId.current += 1;
    return { id: `srv-${nextId.current}`, value };
  };
  const [servers, setServers] = useState<ServerRow[]>(() => {
    const seed = initial.servers.length > 0 ? initial.servers : [''];
    return seed.map(makeRow);
  });
  const [dohEnabled, setDohEnabled] = useState<boolean>(Boolean(initial.dohServer));
  const [dohUrl, setDohUrl] = useState<string>(initial.dohServer ?? '');
  const [saving, setSaving] = useState(false);

  const updateServer = (id: string, value: string) => {
    setServers((prev) => prev.map((row) => (row.id === id ? { ...row, value } : row)));
  };

  const removeServer = (id: string) => {
    setServers((prev) => prev.filter((row) => row.id !== id));
  };

  const addServer = () => {
    setServers((prev) => [...prev, makeRow('')]);
  };

  const save = async () => {
    setSaving(true);
    try {
      const cleaned = servers.map((row) => row.value.trim()).filter(Boolean);
      await updateDnsConfig(creds, {
        servers: cleaned.join(','),
        dohServer: dohEnabled ? dohUrl.trim() : '',
      });
      toast.notify({ title: 'DNS configuration saved', tone: 'success' });
      onSaved();
      onClose();
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Failed to update DNS configuration.';
      toast.notify({ title: 'Failed to save DNS', description: message, tone: 'danger' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Edit DNS configuration"
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </>
      }
    >
      <Stack $gap="var(--space-md)">
        <div className={styles.section}>
          <Label as="span" className={styles.sectionLabel}>
            DNS servers
          </Label>
          <Stack $gap="var(--space-xs)">
            {servers.map((row, idx) => (
              <Inline key={row.id} $gap="var(--space-xs)" $align="center">
                <Input
                  value={row.value}
                  onChange={(e) => updateServer(row.id, e.target.value)}
                  placeholder={idx === 0 ? '1.1.1.1' : '8.8.8.8'}
                  aria-label={`DNS server ${idx + 1}`}
                  disabled={saving}
                  className={styles.serverInput}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeServer(row.id)}
                  disabled={saving || servers.length === 1}
                  aria-label={`Remove DNS server ${idx + 1}`}
                >
                  <Minus size={14} aria-hidden />
                </Button>
              </Inline>
            ))}
          </Stack>
          <Inline $justify="flex-start">
            <Button size="sm" variant="secondary" onClick={addServer} disabled={saving}>
              <Plus size={14} aria-hidden /> Add server
            </Button>
          </Inline>
          <p className={styles.hint}>IPv4 or IPv6 address. Examples: 1.1.1.1, 8.8.8.8.</p>
        </div>

        <div className={styles.section}>
          <Switch
            checked={dohEnabled}
            onChange={(e) => setDohEnabled(e.target.checked)}
            label="Enable DNS over HTTPS"
            disabled={saving}
          />
          <Input
            value={dohUrl}
            onChange={(e) => setDohUrl(e.target.value)}
            placeholder="https://cloudflare-dns.com/dns-query"
            aria-label="DoH server URL"
            disabled={saving || !dohEnabled}
          />
          <p className={styles.hint}>
            DoH endpoint URL. Example: https://cloudflare-dns.com/dns-query.
          </p>
        </div>
      </Stack>
    </Dialog>
  );
}
