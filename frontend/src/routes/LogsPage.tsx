import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
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
      setError('Missing router credentials for this session.');
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
      const message = err instanceof Error ? err.message : 'Failed to load logs.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [id, router?.host, getCredentials, selectedLevels, selectedTopics, debouncedSearch]);

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
                <ScrollText size={16} aria-hidden /> Logs
              </Inline>
            </CardTitle>
            <CardDescription>
              RouterOS event stream. Filter by level or topic, search anywhere in the message.
            </CardDescription>
          </div>
          <div className={styles.headerActions}>
            <Button size="sm" variant="secondary" onClick={reload} disabled={loading}>
              <RefreshCw size={14} aria-hidden /> Refresh
            </Button>
          </div>
        </CardHeader>
        <Stack>
          <FieldRow>
            <Label>
              <span>Level</span>
              <Select
                aria-label="Level"
                multiple
                searchable
                searchPlaceholder="Search level…"
                placeholder="All levels"
                value={selectedLevels}
                onChange={(v) => setSelectedLevels(v as LogSeverity[])}
                options={[
                  { value: 'info', label: 'info' },
                  { value: 'warning', label: 'warning' },
                  { value: 'error', label: 'error' },
                  { value: 'critical', label: 'critical' },
                  { value: 'debug', label: 'debug' },
                ]}
              />
            </Label>
            <Label>
              <span>Topic</span>
              <Select
                aria-label="Topic"
                multiple
                searchable
                searchPlaceholder="Search topic…"
                placeholder="All topics"
                value={selectedTopics}
                onChange={(v) => setSelectedTopics(v)}
                options={availableTopics.map((t) => ({ value: t, label: t }))}
              />
            </Label>
            <Label>
              <span>Search</span>
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="keyword…"
                aria-label="Search"
              />
            </Label>
          </FieldRow>
          <Inline>
            <Filter size={14} aria-hidden />
            <Badge tone="success">info · {counts.info}</Badge>
            <Badge tone="warning">warning · {counts.warning}</Badge>
            <Badge tone="danger">error · {counts.error}</Badge>
            <Badge tone="danger">critical · {counts.critical}</Badge>
            <Badge tone="info">debug · {counts.debug}</Badge>
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
            <p>No logs match the current filters.</p>
          </div>
        ) : (
          <div>
            <div className={styles.streamScroll}>
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
                      aria-label={`Open details for log ${log.id}`}
                    >
                      <span className={styles.timestamp}>{log.time}</span>
                      <Badge className={styles.logLevel} tone={toneForLevel(log.level)}>
                        {log.level}
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
                  Showing {(currentPage - 1) * pageSize + 1}–
                  {Math.min(currentPage * pageSize, visibleLogs.length)} of {visibleLogs.length}
                </span>
                <div className={styles.paginationControls}>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    aria-label="Previous page"
                  >
                    <ChevronLeft size={14} aria-hidden /> Prev
                  </Button>
                  <span className={styles.paginationPage}>
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    aria-label="Next page"
                  >
                    Next <ChevronRight size={14} aria-hidden />
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
        title="Log details"
        size="md"
        footer={
          <Button variant="secondary" onClick={() => setSelected(null)}>
            Close
          </Button>
        }
      >
        {selected ? (
          <div className={styles.detailGrid}>
            <div className={styles.detailLabel}>Timestamp</div>
            <div className={styles.detailValue}>
              <div>{selected.time}</div>
            </div>

            <div className={styles.detailLabel}>Level</div>
            <div className={styles.detailValue}>
              <Badge tone={toneForLevel(selected.level)}>{selected.level}</Badge>
            </div>

            <div className={styles.detailLabel}>Topic</div>
            <div className={styles.detailValue}>
              <code className={styles.detailMono}>{selected.topic}</code>
            </div>

            <div className={styles.detailLabel}>Message</div>
            <div className={styles.detailValue}>
              <pre className={styles.detailMessage}>{selected.message}</pre>
            </div>

            <div className={styles.detailLabel}>Log ID</div>
            <div className={styles.detailValue}>
              <code className={styles.detailMono}>{selected.id}</code>
            </div>

            {selected.prefix ? (
              <>
                <div className={styles.detailLabel}>Prefix</div>
                <div className={styles.detailValue}>
                  <code className={styles.detailMono}>{selected.prefix}</code>
                </div>
              </>
            ) : null}

            {selected.account ? (
              <>
                <div className={styles.detailLabel}>Account</div>
                <div className={styles.detailValue}>
                  <code className={styles.detailMono}>{selected.account}</code>
                </div>
              </>
            ) : null}

            {selected.count && selected.count > 1 ? (
              <>
                <div className={styles.detailLabel}>Count</div>
                <div className={styles.detailValue}>{selected.count}</div>
              </>
            ) : null}
          </div>
        ) : null}
      </Dialog>
    </Stack>
  );
}
