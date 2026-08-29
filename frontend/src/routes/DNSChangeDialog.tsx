import { useCallback, useEffect, useMemo, useState } from 'react';
import { TriangleAlert } from 'lucide-react';
import {
  Button,
  Dialog,
  FieldStack,
  Input,
  Label,
  RadioGroup,
  Select,
  Stack,
  Switch,
  useToast,
} from '@nasnet/ui';
import styles from './DNSChangeDialog.module.scss';
import {
  ApiError,
  changeDns,
  fetchDnsSuggestions,
  validateDnsChange,
  type DnsCredentials,
  type DnsForwarderListItem,
  type DnsSuggestion,
} from '../api';

interface DNSChangeDialogProps {
  open: boolean;
  forwarder: DnsForwarderListItem;
  creds: DnsCredentials;
  onClose: () => void;
  onChanged: () => void;
}

function splitIps(ip: string): string[] {
  return ip
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

export function DNSChangeDialog({
  open,
  forwarder,
  creds,
  onClose,
  onChanged,
}: DNSChangeDialogProps) {
  const toast = useToast();
  const currentIps = useMemo(() => splitIps(forwarder.ip), [forwarder.ip]);

  const [oldIp, setOldIp] = useState(() => currentIps[0] ?? '');
  const [newIp, setNewIp] = useState('');
  const [suggestions, setSuggestions] = useState<DnsSuggestion[]>([]);
  const [manualEntry, setManualEntry] = useState(false);
  const [busy, setBusy] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setOldIp(currentIps[0] ?? '');
    setNewIp('');
    setManualEntry(false);
    setWarning(null);
  }, [open, currentIps]);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    fetchDnsSuggestions(creds, controller.signal)
      .then((data) => {
        const list = forwarder.name === 'Domestic' ? data.domestic : data.foreign;
        setSuggestions(list ?? []);
      })
      .catch(() => setSuggestions([]));
    return () => controller.abort();
  }, [open, creds, forwarder.name]);

  const suggestionOptions = useMemo(
    () =>
      suggestions.map((s) => ({
        value: s.ip,
        label: `${s.description} - ${s.ip}`,
      })),
    [suggestions],
  );

  const showManual = manualEntry || suggestionOptions.length === 0;

  const applyChange = useCallback(async () => {
    setBusy(true);
    try {
      await changeDns(creds, { oldIp, newIp: newIp.trim() });
      toast.notify({ title: `DNS server changed to ${newIp.trim()}`, tone: 'success' });
      onChanged();
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to change DNS server.';
      toast.notify({ title: 'Failed to change DNS server', description: message, tone: 'danger' });
    } finally {
      setBusy(false);
    }
  }, [creds, oldIp, newIp, toast, onChanged, onClose]);

  const submit = async () => {
    const candidate = newIp.trim();
    if (!candidate) {
      toast.notify({ title: 'Enter a new DNS server IP', tone: 'warning' });
      return;
    }
    setBusy(true);
    setWarning(null);
    try {
      const result = await validateDnsChange(creds, oldIp, candidate);
      if (result.suitable) {
        setBusy(false);
        await applyChange();
        return;
      }
      setWarning(result.message || `${candidate} is not suitable for the ${result.oldIpType} DNS.`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        setWarning(`${err.message} Suitability could not be verified.`);
      } else {
        const message = err instanceof Error ? err.message : 'Failed to verify the new DNS server.';
        toast.notify({ title: 'Verification failed', description: message, tone: 'danger' });
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Change DNS server"
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          {warning ? (
            <Button variant="danger" onClick={applyChange} disabled={busy}>
              {busy ? 'Changing…' : 'Continue anyway'}
            </Button>
          ) : (
            <Button variant="primary" onClick={submit} disabled={busy}>
              {busy ? 'Verifying…' : 'Change'}
            </Button>
          )}
        </>
      }
    >
      <Stack $gap="var(--space-md)">
        <div className={styles.readonlyGrid}>
          <span className={styles.readonlyLabel}>Type</span>
          <span className={styles.readonlyValue}>{forwarder.name}</span>
        </div>

        {currentIps.length > 1 ? (
          <FieldStack>
            <Label as="span">Current IP to replace</Label>
            <RadioGroup
              name="dns-old-ip"
              value={oldIp}
              options={currentIps.map((ip) => ({ value: ip, label: ip }))}
              onChange={(value) => {
                setOldIp(value);
                setWarning(null);
              }}
              orientation="column"
              ariaLabel="Current IP to replace"
            />
          </FieldStack>
        ) : (
          <div className={styles.readonlyGrid}>
            <span className={styles.readonlyLabel}>Current IP</span>
            <span className={styles.readonlyValue}>{oldIp}</span>
          </div>
        )}

        <FieldStack>
          <div className={styles.fieldHeader}>
            <Label as="span" htmlFor={showManual ? 'dns-new-ip' : undefined} id="dns-new-ip-label">
              New IP
            </Label>
            <Switch
              label="Enter manually"
              checked={showManual}
              onChange={(e) => {
                setManualEntry(e.target.checked);
                setNewIp('');
                setWarning(null);
              }}
              disabled={busy || suggestionOptions.length === 0}
            />
          </div>
          {showManual ? (
            <Input
              id="dns-new-ip"
              value={newIp}
              onChange={(e) => {
                setNewIp(e.target.value);
                setWarning(null);
              }}
              placeholder={forwarder.name === 'Domestic' ? '217.218.127.127' : '1.1.1.1'}
              disabled={busy}
            />
          ) : (
            <Select
              options={suggestionOptions}
              value={suggestionOptions.some((o) => o.value === newIp.trim()) ? newIp.trim() : ''}
              onChange={(value) => {
                setNewIp(value);
                setWarning(null);
              }}
              placeholder={suggestionOptions.length > 0 ? 'Select…' : 'No suggestions available'}
              disabled={busy || suggestionOptions.length === 0}
              searchable
              searchPlaceholder="Search suggestions…"
              aria-labelledby="dns-new-ip-label"
            />
          )}
          <p className={styles.hint}>
            {showManual
              ? 'Any reachable IP can be entered.'
              : 'Turn on manual entry to type an IP that is not listed.'}
          </p>
        </FieldStack>

        {warning ? (
          <div className={styles.warning} role="alert">
            <TriangleAlert size={16} aria-hidden className={styles.warningIcon} />
            <p>{warning}</p>
          </div>
        ) : null}
      </Stack>
    </Dialog>
  );
}
