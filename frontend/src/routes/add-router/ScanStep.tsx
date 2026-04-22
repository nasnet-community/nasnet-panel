import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  DataTable,
  FormError,
  Progress,
  Stack,
} from '@nasnet/ui';
import { api, isAbortError, type DiscoveredDevice } from '../../api';
import { ScanToolbar } from './ScanToolbar';
import { useSmoothedPercent } from './useSmoothedPercent';

interface Props {
  onSelect: (device: DiscoveredDevice) => void;
}

const SCAN_COLUMNS = [
  { key: 'ip', header: 'IP', render: (d: DiscoveredDevice) => d.ip, width: '150px' },
  {
    key: 'hostname',
    header: 'Hostname',
    render: (d: DiscoveredDevice) => d.hostname ?? '—',
    width: '180px',
  },
  { key: 'vendor', header: 'Vendor', render: (d: DiscoveredDevice) => d.vendor, width: '120px' },
  { key: 'type', header: 'Type', render: (d: DiscoveredDevice) => d.type, width: '120px' },
  {
    key: 'services',
    header: 'Services',
    render: (d: DiscoveredDevice) => (d.services.length > 0 ? d.services.join(', ') : '—'),
  },
];

export function ScanStep({ onSelect }: Props) {
  const [subnet, setSubnet] = useState('192.168.1.0/24');
  const [scanning, setScanning] = useState(false);
  const [percent, setPercent] = useState(0);
  const [displayPercent, setDisplayPercent] = useSmoothedPercent(percent);
  const [devices, setDevices] = useState<DiscoveredDevice[]>([]);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const startScan = useCallback(async () => {
    try {
      controllerRef.current?.abort();
    } catch {
      /* ignore abort-on-abort throws */
    }
    const controller = new AbortController();
    controllerRef.current = controller;

    setScanning(true);
    setPercent(0);
    setDisplayPercent(0);
    setDevices([]);
    setError(null);

    try {
      for await (const event of api.scanner.start(subnet, controller.signal)) {
        if (controller.signal.aborted) break;
        setPercent(event.percent);
        setDevices(event.found);
        if (event.done) break;
      }
    } catch (err) {
      if (isAbortError(err)) return;
      setError((err as Error).message ?? 'Scan failed');
    } finally {
      if (controllerRef.current === controller) {
        setScanning(false);
        controllerRef.current = null;
      }
    }
  }, [subnet, setDisplayPercent]);

  useEffect(() => {
    void startScan();
    return () => {
      try {
        controllerRef.current?.abort();
      } catch {
        /* ignore abort-on-abort throws */
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scan your subnet</CardTitle>
        <CardDescription>
          Probing for MikroTik devices. Pick a result to continue with credentials.
        </CardDescription>
      </CardHeader>
      <Stack>
        <ScanToolbar
          subnet={subnet}
          scanning={scanning}
          onSubnetChange={setSubnet}
          onStart={startScan}
        />
        {scanning || displayPercent > 0 ? (
          <Progress
            value={displayPercent}
            label={`Scanning ${subnet} (${displayPercent}%)`}
            tone="success"
          />
        ) : null}
        {error ? <FormError>{error}</FormError> : null}
        <DataTable
          columns={SCAN_COLUMNS}
          rows={devices}
          rowKey={(d) => d.ip}
          onRowClick={onSelect}
          emptyMessage={scanning ? 'Scanning…' : 'No devices yet. Start a scan.'}
        />
      </Stack>
    </Card>
  );
}
