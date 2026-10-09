import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, Filter, RefreshCw, ScrollText, SearchX } from 'lucide-react';
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
import { fetchLogs, type LogEntryResponse, type LogSeverity } from '../api';
import { useSession } from '../state/SessionContext';
import { useRouter } from '../state/RouterStoreContext';
import { useFormat } from '../utils/useFormat';

const LEVELS: LogSeverity[] = ['info', 'warning', 'error', 'critical', 'debug'];

const toneForLevel = (
  level: LogEntryResponse['level'],
): 'success' | 'warning' | 'danger' | 'info' =>
  level === 'critical' || level === 'error'
    ? 'danger'
    : level === 'warning'
      ? 'warning'
      : level === 'debug'
        ? 'info'
        : 'success';

export function LogsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter(id);
  const { getCredentials } = useSession();
  const { t } = useTranslation('tools');
  const format = useFormat();
  const levelLabel = (level: LogSeverity) => t(`logs.levels.${level}`);
  const [logs, setLogs] = useState<LogEntryResponse[]>([]);
  const [availableTopics, setAvailableTopics] = useState<string[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<LogSeverity[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [search, setSearch] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const pageSize = 20;
  const [selected, setSelected] = useState<LogEntryResponse | null>(null);

  const reload = useCallback(async () => {
    if (!id) return;
    const creds = getCredentials(id);
    const host = router?.host;
    if (!creds || !host) {
      setLoading(false);
      setError(t('common.missingCredentials'));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetchLogs(
        { host, ...creds },
        {
          limit: 200,
          text: debouncedSearch || undefined,
          topic: selectedTopics.length > 0 ? selectedTopics.join(',') : undefined,
          severity: selectedLevels.length === 1 ? selectedLevels[0] : undefined,
        },
      );
      setLogs(response.entries ?? []);
      setAvailableTopics(response.availableTopics ?? []);
    } catch (err) {
      const message = err instanceof Error ? err.message : t('logs.loadFailed');
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [id, router?.host, getCredentials, selectedLevels, selectedTopics, debouncedSearch, t]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const visibleLogs = useMemo(() => {
    if (selectedLevels.length <= 1) return logs;
    return logs.filter((l) => selectedLevels.includes(l.level));
  }, [logs, selectedLevels]);

  const counts = useMemo(() => {
    const c: Record<LogSeverity, number> = {
      info: 0,
      warning: 0,
      error: 0,
      debug: 0,
      critical: 0,
    };
    for (const l of visibleLogs) c[l.level] += 1;
    return c;
  }, [visibleLogs]);

  const isSearching = loading || search !== debouncedSearch;

  const totalPages = Math.max(1, Math.ceil(visibleLogs.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedLogs = useMemo(
    () => visibleLogs.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [visibleLogs, currentPage],
  );

  useEffect(() => {
    setPage(1);
  }, [selectedLevels, selectedTopics, debouncedSearch]);

  return (
    <Stack>
      <Card>
        <CardHeader className={styles.cardHeader}>
          <div>
            <CardTitle>
              <Inline>
                <ScrollText size={16} aria-hidden /> {t('logs.title')}
              </Inline>
            </CardTitle>
            <CardDescription>{t('logs.description')}</CardDescription>
          </div>
          <div className={styles.headerActions}>
            <Button size="sm" variant="secondary" onClick={reload} disabled={loading}>
              <RefreshCw size={14} aria-hidden /> {t('common.refresh')}
            </Button>
          </div>
        </CardHeader>
        <Stack>
          <FieldRow>
            <Label>
              <span>{t('logs.level')}</span>
              <Select
                aria-label={t('logs.level')}
                multiple
                searchable
                searchPlaceholder={t('logs.searchLevel')}
                placeholder={t('logs.allLevels')}
                value={selectedLevels}
                onChange={(v) => setSelectedLevels(v as LogSeverity[])}
                options={LEVELS.map((level) => ({ value: level, label: levelLabel(level) }))}
              />
            </Label>
            <Label>
              <span>{t('logs.topic')}</span>
              <Select
                aria-label={t('logs.topic')}
                multiple
                searchable
                searchPlaceholder={t('logs.searchTopic')}
                placeholder={t('logs.allTopics')}
                value={selectedTopics}
                onChange={(v) => setSelectedTopics(v)}
                options={availableTopics.map((topic) => ({ value: topic, label: topic }))}
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
          <Inline>
            <Filter size={14} aria-hidden />
            <Badge tone="success">
              {levelLabel('info')} · {format.number(counts.info)}
            </Badge>
            <Badge tone="warning">
              {levelLabel('warning')} · {format.number(counts.warning)}
            </Badge>
            <Badge tone="danger">
              {levelLabel('error')} · {format.number(counts.error)}
            </Badge>
            <Badge tone="danger">
              {levelLabel('critical')} · {format.number(counts.critical)}
            </Badge>
            <Badge tone="info">
              {levelLabel('debug')} · {format.number(counts.debug)}
            </Badge>
          </Inline>
        </Stack>
      </Card>

      <Card data-testid="log-stream">
        {isSearching ? (
          <div data-testid="log-skeleton" className={styles.streamScroll}>
            {['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map((k) => (
              <div key={`skeleton-${k}`} className={styles.logRow}>
                <Skeleton width={160} height={14} />
                <Skeleton width={70} height={18} radius={9} />
                <Skeleton width={110} height={12} />
                <Skeleton height={14} />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className={styles.emptyNote}>
            <SearchX size={28} aria-hidden className={styles.emptyIcon} />
            <p>{error}</p>
          </div>
        ) : visibleLogs.length === 0 ? (
          <div className={styles.emptyNote}>
            <SearchX size={28} aria-hidden className={styles.emptyIcon} />
            <p>{t('logs.empty')}</p>
          </div>
        ) : (
          <div>
            {/* Router log lines are LTR text whatever the UI direction. */}
            <div className={styles.streamScroll} dir="ltr">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={currentPage}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  {pagedLogs.map((log) => (
                    <button
                      type="button"
                      key={log.id}
                      data-testid="log-row"
                      className={styles.logRow}
                      onClick={() => setSelected(log)}
                      aria-label={t('logs.openDetailsAria', { id: log.id })}
                    >
                      <span className={styles.timestamp}>{log.time}</span>
                      <Badge className={styles.logLevel} tone={toneForLevel(log.level)}>
                        {levelLabel(log.level)}
                      </Badge>
                      <span className={styles.topic}>{log.topic}</span>
                      <span className={styles.message}>{log.message}</span>
                    </button>
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>
            {visibleLogs.length > pageSize ? (
              <div className={styles.pagination}>
                <span className={styles.paginationInfo}>
                  {t('logs.showing', {
                    from: format.number((currentPage - 1) * pageSize + 1),
                    to: format.number(Math.min(currentPage * pageSize, visibleLogs.length)),
                    total: format.number(visibleLogs.length),
                  })}
                </span>
                <div className={styles.paginationControls}>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    aria-label={t('logs.previousPage')}
                  >
                    <ChevronLeft size={14} aria-hidden className="rtl-flip" /> {t('logs.prev')}
                  </Button>
                  <span className={styles.paginationPage}>
                    {t('logs.pageOf', {
                      page: format.number(currentPage),
                      total: format.number(totalPages),
                    })}
                  </span>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
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
        title={t('logs.details.title')}
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
            <div className={styles.detailValue} dir="ltr">
              <div>{selected.time}</div>
            </div>

            <div className={styles.detailLabel}>{t('logs.details.level')}</div>
            <div className={styles.detailValue}>
              <Badge tone={toneForLevel(selected.level)}>{levelLabel(selected.level)}</Badge>
            </div>

            <div className={styles.detailLabel}>{t('logs.details.topic')}</div>
            <div className={styles.detailValue}>
              <code className={styles.detailMono}>{selected.topic}</code>
            </div>

            <div className={styles.detailLabel}>{t('logs.details.message')}</div>
            <div className={styles.detailValue}>
              <pre className={styles.detailMessage} dir="ltr">
                {selected.message}
              </pre>
            </div>

            <div className={styles.detailLabel}>{t('logs.details.logId')}</div>
            <div className={styles.detailValue}>
              <code className={styles.detailMono}>{selected.id}</code>
            </div>

            {selected.prefix ? (
              <>
                <div className={styles.detailLabel}>{t('logs.details.prefix')}</div>
                <div className={styles.detailValue}>
                  <code className={styles.detailMono}>{selected.prefix}</code>
                </div>
              </>
            ) : null}

            {selected.account ? (
              <>
                <div className={styles.detailLabel}>{t('logs.details.account')}</div>
                <div className={styles.detailValue}>
                  <code className={styles.detailMono}>{selected.account}</code>
                </div>
              </>
            ) : null}

            {selected.count && selected.count > 1 ? (
              <>
                <div className={styles.detailLabel}>{t('logs.details.count')}</div>
                <div className={styles.detailValue}>{format.number(selected.count)}</div>
              </>
            ) : null}
          </div>
        ) : null}
      </Dialog>
    </Stack>
  );
}
