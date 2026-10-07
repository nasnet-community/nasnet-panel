import { useEffect, useMemo, useState } from 'react';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
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

// Fallback messages are kept as keys and translated at render, so they follow a language change.
type CableTestError = { key: 'cableTest.loadFailed' | 'cableTest.failed' } | { message: string };

const pairColumns = (t: TFunction<'overview'>): DataTableColumn<CablePair>[] => [
  {
    key: 'pair',
    header: t('cableTest.pairHeader'),
    render: (p) => t('cableTest.pairN', { index: p.index }),
  },
  {
    key: 'state',
    header: t('cableTest.statusHeader'),
    render: (p) => (
      <Badge tone={p.state === 'normal' || p.state === 'ok' ? 'success' : 'danger'}>
        {p.state}
      </Badge>
    ),
  },
  {
    key: 'distance',
    header: t('cableTest.distanceHeader'),
    render: (p) =>
      p.distance !== undefined ? t('cableTest.distance', { value: p.distance }) : '-',
  },
];

export function CableTestCard({ creds }: { creds: SystemCredentials | null }) {
  const { t } = useTranslation('overview');
  const columns = useMemo(() => pairColumns(t), [t]);
  const [interfaces, setInterfaces] = useState<string[]>([]);
  const [selected, setSelected] = useState('');
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<CableTestResponse | null>(null);
  const [error, setError] = useState<CableTestError | null>(null);

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
        setError(err instanceof Error ? { message: err.message } : { key: 'cableTest.loadFailed' });
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
      setError(err instanceof Error ? { message: err.message } : { key: 'cableTest.failed' });
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
            <Cable size={16} aria-hidden /> {t('cableTest.title')}
          </Inline>
        </CardTitle>
        <CardDescription>{t('cableTest.description')}</CardDescription>
      </CardHeader>
      <Stack>
        <div className={styles.cableTestRow}>
          <div className={styles.cableTestField}>
            <Label htmlFor="cable-test-interface">{t('cableTest.interfaceLabel')}</Label>
            <Select
              id="cable-test-interface"
              options={interfaces.map((name) => ({ value: name, label: name }))}
              value={selected}
              onChange={setSelected}
              placeholder={t('cableTest.selectPlaceholder')}
              disabled={!creds || testing || interfaces.length === 0}
            />
          </div>
          <Button variant="primary" onClick={run} disabled={!creds || !selected || testing}>
            {testing ? (
              <>
                <Loader2 size={14} aria-hidden /> {t('cableTest.testing')}
              </>
            ) : (
              <>
                <Play size={14} aria-hidden /> {t('cableTest.run')}
              </>
            )}
          </Button>
        </div>
        {error ? (
          <p className={styles.errorText} role="alert">
            {'message' in error ? error.message : t(error.key)}
          </p>
        ) : null}
        {result ? (
          <Stack>
            <Inline>
              <span>{result.name || selected}</span>
              <Badge tone={statusTone(result.status)}>{result.status}</Badge>
            </Inline>
            {pairs.length > 0 ? (
              <DataTable columns={columns} rows={pairs} rowKey={(p) => String(p.index)} />
            ) : null}
          </Stack>
        ) : null}
      </Stack>
    </Card>
  );
}
