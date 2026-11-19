import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, FileClock, RefreshCw, SearchX } from 'lucide-react';
import styles from './LogsPage.module.scss';
import {
  Badge,
  Button,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  FieldRow,
  Input,
  Inline,
  Label,
  Select,
  Skeleton,
  Stack,
} from '@nasnet/ui';
import { fetchMonitorLogs, isAbortError, type MonitorLogEntry, type MonitorSeverity } from '../api';
import { useSession } from '../state/SessionContext';
import { useRouter } from '../state/RouterStoreContext';
import { useFormat } from '../utils/useFormat';

const SEVERITIES: MonitorSeverity[] = ['info', 'warning', 'error', 'critical'];

const RANGES = ['1h', '1d', '7d', '30d', 'all'] as const;
type Range = (typeof RANGES)[number];

const RANGE_MS: Record<Exclude<Range, 'all'>, number> = {
  '1h': 60 * 60 * 1000,
  '1d': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
};

const PAGE_SIZE = 20;

const toneForSeverity = (severity: MonitorSeverity): 'success' | 'warning' | 'danger' =>
  severity === 'critical' || severity === 'error'
    ? 'danger'
    : severity === 'warning'
      ? 'warning'
      : 'success';

export function MonitorLogsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter(id);
  const { getCredentials } = useSession();
  const { t } = useTranslation('tools');
  const format = useFormat();
  const severityLabel = (severity: MonitorSeverity) => t(`logs.levels.${severity}`);
  const [items, setItems] = useState<MonitorLogEntry[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [sources, setSources] = useState<string[]>([]);
  const [selectedSeverities, setSelectedSeverities] = useState<MonitorSeverity[]>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [range, setRange] = useState<Range>('all');
  const [search, setSearch] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [reloadKey, setReloadKey] = useState<number>(0);
  const [selected, setSelected] = useState<MonitorLogEntry | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [selectedSeverities, selectedSources, range, debouncedSearch]);

  const creds = id ? getCredentials(id) : undefined;
  const host = router?.host;

  useEffect(() => {
    if (!creds || !host) {
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    fetchMonitorLogs(
      { host, ...creds },
      {
        sources: selectedSources,
        severities: selectedSeverities,
        from: range === 'all' ? undefined : new Date(Date.now() - RANGE_MS[range]).toISOString(),
        q: debouncedSearch || undefined,
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
      },
      controller.signal,
    )
      .then((response) => {
        const rows = response.items ?? [];
        setItems(rows);
        setTotal(response.total ?? rows.length);
        const known = response.sources ?? rows.map((row) => row.source);
        setSources((prev) => Array.from(new Set([...prev, ...known])).sort());
      })
      .catch((err: unknown) => {
        if (isAbortError(err)) return;
        // The endpoint may not exist yet: show the empty state instead of an error.
        setItems([]);
        setTotal(0);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [creds, host, selectedSources, selectedSeverities, range, debouncedSearch, page, reloadKey]);

  const isSearching = loading || search.trim() !== debouncedSearch;
  const hasFilters =
    selectedSeverities.length > 0 ||
    selectedSources.length > 0 ||
    range !== 'all' ||
    debouncedSearch !== '';

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const sourceOptions = useMemo(
    () =>
      Array.from(new Set([...sources, ...selectedSources])).map((source) => ({
        value: source,
        label: source,
      })),
    [sources, selectedSources],
  );

  const formatTime = (time: string) =>
    Number.isNaN(Date.parse(time)) ? time : format.dateTime(time);

  return (
    <Stack>
      <Card>
        <CardHeader className={styles.cardHeader}>
          <div>
            <CardTitle>
              <Inline>
                <FileClock size={16} aria-hidden /> {t('monitorLogs.title')}
              </Inline>
            </CardTitle>
            <CardDescription>{t('monitorLogs.description')}</CardDescription>
          </div>
          <div className={styles.headerActions}>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setReloadKey((k) => k + 1)}
              disabled={loading}
            >
              <RefreshCw size={14} aria-hidden /> {t('common.refresh')}
            </Button>
          </div>
        </CardHeader>
        <FieldRow>
          <Label>
            <span>{t('monitorLogs.severity')}</span>
            <Select
              aria-label={t('monitorLogs.severity')}
              multiple
              placeholder={t('monitorLogs.allSeverities')}
              value={selectedSeverities}
              onChange={(v) => setSelectedSeverities(v as MonitorSeverity[])}
              options={SEVERITIES.map((severity) => ({
                value: severity,
                label: severityLabel(severity),
              }))}
            />
          </Label>
          <Label>
            <span>{t('monitorLogs.source')}</span>
            <Select
              aria-label={t('monitorLogs.source')}
              multiple
              searchable
              searchPlaceholder={t('monitorLogs.searchSource')}
              placeholder={t('monitorLogs.allSources')}
              value={selectedSources}
              onChange={(v) => setSelectedSources(v)}
              options={sourceOptions}
            />
          </Label>
          <Label>
            <span>{t('monitorLogs.timeRange')}</span>
            <Select
              aria-label={t('monitorLogs.timeRange')}
              value={range}
              onChange={(v) => setRange(v as Range)}
              options={RANGES.map((r) => ({ value: r, label: t(`monitorLogs.ranges.${r}`) }))}
            />
          </Label>
          <Label>
            <span>{t('logs.search')}</span>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('logs.keyword')}
              aria-label={t('logs.search')}
            />
          </Label>
        </FieldRow>
      </Card>

      <Card data-testid="monitor-log-stream">
        {isSearching ? (
          <div data-testid="monitor-log-skeleton" className={styles.streamScroll}>
            {['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map((k) => (
              <div key={`skeleton-${k}`} className={styles.logRow}>
                <Skeleton width={160} height={14} />
                <Skeleton width={70} height={18} radius={9} />
                <Skeleton width={110} height={12} />
                <Skeleton height={14} />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className={styles.emptyNote}>
            <SearchX size={28} aria-hidden className={styles.emptyIcon} />
            <p>{hasFilters ? t('monitorLogs.noMatch') : t('monitorLogs.empty')}</p>
          </div>
        ) : (
          <div>
            <div className={styles.streamScroll}>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={page}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  {items.map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      data-testid="monitor-log-row"
                      className={styles.logRow}
                      onClick={() => setSelected(item)}
                      aria-label={t('monitorLogs.openDetailsAria', { id: item.id })}
                    >
                      <span className={styles.timestamp}>{formatTime(item.time)}</span>
                      <Badge className={styles.logLevel} tone={toneForSeverity(item.severity)}>
                        {severityLabel(item.severity)}
                      </Badge>
                      <span className={styles.topic}>
                        <bdi>{item.source}</bdi>
                      </span>
                      <span className={styles.message}>
                        <bdi>{item.message}</bdi>
                      </span>
                    </button>
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>
            {total > PAGE_SIZE ? (
              <div className={styles.pagination}>
                <span className={styles.paginationInfo}>
                  {t('logs.showing', {
                    from: format.number((page - 1) * PAGE_SIZE + 1),
                    to: format.number(Math.min(page * PAGE_SIZE, total)),
                    total: format.number(total),
                  })}
                </span>
                <div className={styles.paginationControls}>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    aria-label={t('logs.previousPage')}
                  >
                    <ChevronLeft size={14} aria-hidden className="rtl-flip" /> {t('logs.prev')}
                  </Button>
                  <span className={styles.paginationPage}>
                    {t('logs.pageOf', {
                      page: format.number(page),
                      total: format.number(totalPages),
                    })}
                  </span>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    aria-label={t('logs.nextPage')}
                  >
                    {t('logs.next')} <ChevronRight size={14} aria-hidden className="rtl-flip" />
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </Card>

      <Dialog
        open={!!selected}
        onClose={() => setSelected(null)}
        title={t('monitorLogs.details.title')}
        size="md"
        footer={
          <Button variant="secondary" onClick={() => setSelected(null)}>
            {t('logs.details.close')}
          </Button>
        }
      >
        {selected ? (
          <div className={styles.detailGrid}>
            <div className={styles.detailLabel}>{t('logs.details.timestamp')}</div>
            <div className={styles.detailValue}>{formatTime(selected.time)}</div>

            <div className={styles.detailLabel}>{t('monitorLogs.severity')}</div>
            <div className={styles.detailValue}>
              <Badge tone={toneForSeverity(selected.severity)}>
                {severityLabel(selected.severity)}
              </Badge>
            </div>

            <div className={styles.detailLabel}>{t('monitorLogs.source')}</div>
            <div className={styles.detailValue}>
              <code className={styles.detailMono}>{selected.source}</code>
            </div>

            <div className={styles.detailLabel}>{t('logs.details.message')}</div>
            <div className={styles.detailValue}>
              <pre className={styles.detailMessage} dir="auto">
                {selected.message}
              </pre>
            </div>

            <div className={styles.detailLabel}>{t('monitorLogs.details.eventId')}</div>
            <div className={styles.detailValue}>
              <code className={styles.detailMono}>{selected.id}</code>
            </div>
          </div>
        ) : null}
      </Dialog>
    </Stack>
  );
}
