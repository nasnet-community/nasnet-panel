import { useEffect, useState } from 'react';
import { Cable, Loader2, Play } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  DataTable,
  Inline,
  Label,
  Select,
  Stack,
  type DataTableColumn,
} from '@nasnet/ui';
import styles from './DiagnosticsPage.module.scss';
import {
  fetchEthernetInterfaces,
  isAbortError,
  testEthernetCable,
  type CableTestResponse,
  type SystemCredentials,
} from '../api';

interface CablePair {
  index: number;
  state: string;
  distance?: string;
}

function parseCablePairs(raw?: string): CablePair[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry, i) => {
      const [state, distance] = entry.split(':');
      return { index: i + 1, state: state || 'unknown', distance: distance || undefined };
    });
}

function statusTone(status: string): 'success' | 'warning' | 'neutral' {
  if (status === 'link-ok') return 'success';
  if (status === 'no-link') return 'warning';
  return 'neutral';
}

const PAIR_COLUMNS: DataTableColumn<CablePair>[] = [
  { key: 'pair', header: 'Pair', render: (p) => `Pair ${p.index}` },
  {
    key: 'state',
    header: 'Status',
    render: (p) => (
      <Badge tone={p.state === 'normal' || p.state === 'ok' ? 'success' : 'danger'}>
        {p.state}
      </Badge>
    ),
  },
  {
    key: 'distance',
    header: 'Fault distance',
    render: (p) => (p.distance !== undefined ? `${p.distance} m` : '-'),
  },
];

export function CableTestCard({ creds }: { creds: SystemCredentials | null }) {
  const [interfaces, setInterfaces] = useState<string[]>([]);
  const [selected, setSelected] = useState('');
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<CableTestResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!creds) return;
    const controller = new AbortController();
    fetchEthernetInterfaces(creds, controller.signal)
      .then((list) => {
        const names = list.flatMap((e) => (e.name ? [e.name] : []));
        setInterfaces(names);
        setSelected((prev) => prev || names[0] || '');
      })
      .catch((err: unknown) => {
        if (isAbortError(err)) return;
        setError(err instanceof Error ? err.message : 'Failed to load ethernet interfaces.');
      });
    return () => controller.abort();
  }, [creds]);

  const run = async () => {
    if (!creds || !selected) return;
    setTesting(true);
    setError(null);
    setResult(null);
    try {
      setResult(await testEthernetCable(creds, selected));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cable test failed.');
    } finally {
      setTesting(false);
    }
  };

  const pairs = parseCablePairs(result?.cablePairs);

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Inline>
            <Cable size={16} aria-hidden /> Cable Test
          </Inline>
        </CardTitle>
        <CardDescription>
          Check an ethernet cable for open or shorted pairs and the distance to the fault. The link
          on the tested port may drop for a few seconds.
        </CardDescription>
      </CardHeader>
      <Stack>
        <div className={styles.cableTestRow}>
          <div className={styles.cableTestField}>
            <Label htmlFor="cable-test-interface">Ethernet interface</Label>
            <Select
              id="cable-test-interface"
              options={interfaces.map((name) => ({ value: name, label: name }))}
              value={selected}
              onChange={setSelected}
              placeholder="Select interface"
              disabled={!creds || testing || interfaces.length === 0}
            />
          </div>
          <Button variant="primary" onClick={run} disabled={!creds || !selected || testing}>
            {testing ? (
              <>
                <Loader2 size={14} aria-hidden /> Testing…
              </>
            ) : (
              <>
                <Play size={14} aria-hidden /> Run cable test
              </>
            )}
          </Button>
        </div>
        {error ? (
          <p className={styles.errorText} role="alert">
            {error}
          </p>
        ) : null}
        {result ? (
          <Stack>
            <Inline>
              <span>{result.name || selected}</span>
              <Badge tone={statusTone(result.status)}>{result.status}</Badge>
            </Inline>
            {pairs.length > 0 ? (
              <DataTable columns={PAIR_COLUMNS} rows={pairs} rowKey={(p) => String(p.index)} />
            ) : null}
          </Stack>
        ) : null}
      </Stack>
    </Card>
  );
}
