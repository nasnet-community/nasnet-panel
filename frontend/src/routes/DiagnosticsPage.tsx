import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import {
  Bug,
  Download,
  FileText,
  Loader2,
  MessageCircle,
  Play,
  RefreshCw,
  Trash2,
  Wand2,
} from 'lucide-react';
import {
  Button,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  ConfirmDialog,
  Inline,
  SectionGrid,
  Stack,
  Switch,
  useToast,
} from '@nasnet/ui';
import styles from './DiagnosticsPage.module.scss';
import { CableTestCard } from './CableTestCard';
import { userGuideUrl } from './help/links';
import { useLanguage } from '../state/LanguageContext';
import {
  ApiError,
  DIAG_REPORT_FILENAME,
  deleteDiagFile,
  fetchDiagReport,
  fetchDiagStatus,
  generateDiag,
  isAbortError,
  isErrorReportingEnabled,
  setErrorReportingEnabled,
  type SystemCredentials,
} from '../api';
import { useSession } from '../state/SessionContext';
import { useRouter } from '../state/RouterStoreContext';

const POLL_INTERVAL_MS = 1000;

type Phase = 'loading' | 'idle' | 'running' | 'ready' | 'error';

// Labels are catalog keys (diagnostics.steps.<key>), translated at render.
const DIAG_STEPS = [
  { at: 10, key: 'systemInfo' },
  { at: 15, key: 'installCheck' },
  { at: 25, key: 'interfaces' },
  { at: 35, key: 'wifi' },
  { at: 45, key: 'routing' },
  { at: 60, key: 'dns' },
  { at: 75, key: 'vpn' },
  { at: 90, key: 'connectivity' },
  { at: 95, key: 'logs' },
] as const;

function triggerDownload(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function DiagnosticsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter(id);
  const navigate = useNavigate();
  const { getCredentials } = useSession();
  const toast = useToast();
  const { t } = useTranslation('tools');
  const { language } = useLanguage();

  const creds = useMemo<SystemCredentials | null>(() => {
    if (!id) return null;
    const c = getCredentials(id);
    const host = router?.host;
    if (!c || !host) return null;
    return { host, username: c.username, password: c.password };
  }, [id, router?.host, getCredentials]);

  const [phase, setPhase] = useState<Phase>('loading');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [fileMeta, setFileMeta] = useState<{ time?: string; size?: string } | null>(null);
  const [reporting, setReporting] = useState(() => isErrorReportingEnabled());
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const freshRunRef = useRef(false);

  useEffect(() => {
    if (!creds) {
      setPhase('error');
      setError(t('common.missingCredentials'));
      return;
    }
    let cancelled = false;
    const controller = new AbortController();
    void (async () => {
      try {
        const status = await fetchDiagStatus(creds, controller.signal);
        if (cancelled) return;
        if (status.running) {
          setProgress(status.progress);
          setPhase('running');
        } else if (status.progress >= 100) {
          setProgress(100);
          setFileMeta({ time: status.generateTime, size: status.fileSize });
          setPhase('ready');
        } else {
          setPhase('idle');
        }
      } catch (err) {
        if (cancelled || isAbortError(err)) return;
        if (err instanceof ApiError && err.status === 404) {
          setPhase('idle');
          return;
        }
        setPhase('error');
        setError(err instanceof Error ? err.message : t('diagnostics.statusFailed'));
      }
    })();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [creds, t]);

  useEffect(() => {
    if (phase !== 'running' || !creds) return;
    let cancelled = false;
    let timer: number | undefined;
    const controller = new AbortController();
    const tick = async () => {
      try {
        const status = await fetchDiagStatus(creds, controller.signal);
        if (cancelled) return;
        if (freshRunRef.current && status.progress >= 100) {
          timer = window.setTimeout(() => {
            void tick();
          }, POLL_INTERVAL_MS);
          return;
        }
        freshRunRef.current = false;
        setProgress(status.progress);
        if (status.progress >= 100) {
          setFileMeta({ time: status.generateTime, size: status.fileSize });
          setPhase('ready');
          toast.notify({ title: t('diagnostics.toasts.complete'), tone: 'success' });
          return;
        }
        timer = window.setTimeout(() => {
          void tick();
        }, POLL_INTERVAL_MS);
      } catch (err) {
        if (cancelled || isAbortError(err)) return;
        if (err instanceof ApiError && err.status === 404) {
          freshRunRef.current = false;
          setProgress(0);
          setPhase('idle');
          toast.notify({ title: t('diagnostics.toasts.notFound'), tone: 'danger' });
          return;
        }
        setPhase('error');
        setError(err instanceof Error ? err.message : t('diagnostics.progressFailed'));
      }
    };
    void tick();
    return () => {
      cancelled = true;
      controller.abort();
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [phase, creds, toast, t]);

  const clearReport = () => {
    setFileMeta(null);
    setProgress(0);
    setPhase('idle');
  };

  const run = async () => {
    if (!creds) return;
    setStarting(true);
    setError(null);
    try {
      await generateDiag(creds);
      freshRunRef.current = true;
      setFileMeta(null);
      setProgress(0);
      setPhase('running');
    } catch (err) {
      toast.notify({
        title: t('diagnostics.toasts.startFailed'),
        description: err instanceof Error ? err.message : undefined,
        tone: 'danger',
      });
    } finally {
      setStarting(false);
    }
  };

  const download = async () => {
    if (!creds) return;
    setDownloading(true);
    try {
      triggerDownload(DIAG_REPORT_FILENAME, await fetchDiagReport(creds));
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) clearReport();
      toast.notify({
        title: t('diagnostics.toasts.downloadFailed'),
        description: err instanceof Error ? err.message : undefined,
        tone: 'danger',
      });
    } finally {
      setDownloading(false);
    }
  };

  const removeReport = async () => {
    if (!creds) return;
    setDeleting(true);
    try {
      await deleteDiagFile(creds);
      clearReport();
      toast.notify({ title: t('diagnostics.toasts.deleted'), tone: 'success' });
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) clearReport();
      toast.notify({
        title: t('diagnostics.toasts.deleteFailed'),
        description: err instanceof Error ? err.message : undefined,
        tone: 'danger',
      });
    } finally {
      setDeleting(false);
      setDeleteConfirmOpen(false);
    }
  };

  const contactSupport = () => {
    if (!id) return;
    navigate(`/router/${id}/help`);
  };

  const openWizard = () => {
    if (!id) return;
    navigate(`/router/${id}/config`);
  };

  const changeReporting = (next: boolean) => {
    setErrorReportingEnabled(next);
    setReporting(next);
  };

  const running = phase === 'running';
  const ready = phase === 'ready';
  const activeStepIndex = running ? DIAG_STEPS.findIndex((step) => progress < step.at) : -1;

  return (
    <Stack>
      <Card>
        <Stack>
          <div className={styles.timelineScroll}>
            <ol className={styles.timeline}>
              {DIAG_STEPS.map((step, index) => {
                const done = ready || (running && progress >= step.at);
                const active = running && !done && index === activeStepIndex;
                return (
                  <li key={step.at} className={styles.step}>
                    <span
                      className={`${styles.stepTitle} ${done || active ? styles.stepTitleActive : ''}`}
                    >
                      {t(`diagnostics.steps.${step.key}.label`)}
                    </span>
                    <span className={styles.stepStatus}>
                      {t(`diagnostics.steps.${step.key}.description`)}
                    </span>
                    <span className={styles.stepTrack}>
                      <span
                        className={`${styles.stepDot} ${done ? styles.stepDotDone : ''} ${
                          active ? styles.stepDotActive : ''
                        }`}
                      />
                      {index < DIAG_STEPS.length - 1 ? (
                        <span className={`${styles.stepLine} ${done ? styles.stepLineDone : ''}`} />
                      ) : null}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>
          {phase === 'error' && error ? <p className={styles.errorText}>{error}</p> : null}
          {ready ? (
            <div className={styles.fileTile}>
              <div className={styles.fileRow}>
                <span className={styles.fileIcon}>
                  <FileText size={24} aria-hidden />
                </span>
                <span className={styles.fileBody}>
                  <span className={styles.fileName}>{DIAG_REPORT_FILENAME}</span>
                  {fileMeta?.time ? (
                    <span className={styles.fileHint}>
                      {fileMeta.size
                        ? t('diagnostics.generatedWithSize', {
                            time: fileMeta.time,
                            size: fileMeta.size,
                          })
                        : t('diagnostics.generated', { time: fileMeta.time })}
                    </span>
                  ) : null}
                </span>
              </div>
              <div className={styles.fileAction}>
                <Button
                  variant="secondary"
                  onClick={() => setDeleteConfirmOpen(true)}
                  disabled={deleting || downloading}
                >
                  {deleting ? (
                    <>
                      <Loader2 size={14} aria-hidden /> {t('diagnostics.deleting')}
                    </>
                  ) : (
                    <>
                      <Trash2 size={14} aria-hidden /> {t('diagnostics.delete')}
                    </>
                  )}
                </Button>
                <Button variant="success" onClick={download} disabled={downloading || deleting}>
                  {downloading ? (
                    <>
                      <Loader2 size={14} aria-hidden /> {t('diagnostics.downloading')}
                    </>
                  ) : (
                    <>
                      <Download size={14} aria-hidden /> {t('diagnostics.download')}
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : null}
          <div className={`${styles.actions} ${ready ? '' : styles.actionsSpaced}`}>
            <Button variant="secondary" onClick={contactSupport}>
              <MessageCircle size={14} aria-hidden /> {t('diagnostics.talkToSupport')}
            </Button>
            <Button
              variant={ready ? 'primary' : 'success'}
              onClick={run}
              disabled={!creds || phase === 'loading' || running || starting || deleting}
            >
              {running || starting ? (
                <>
                  <Loader2 size={14} aria-hidden /> {t('diagnostics.running')}
                </>
              ) : ready ? (
                <>
                  <RefreshCw size={14} aria-hidden /> {t('diagnostics.runAgain')}
                </>
              ) : (
                <>
                  <Play size={14} aria-hidden /> {t('diagnostics.start')}
                </>
              )}
            </Button>
          </div>
        </Stack>
      </Card>
      <SectionGrid>
        <Card>
          <CardHeader>
            <CardTitle>
              <Inline>
                <Bug size={16} aria-hidden /> {t('diagnostics.errorReports.title')}
              </Inline>
            </CardTitle>
            <CardDescription>
              <Trans
                t={t}
                i18nKey="diagnostics.errorReports.description"
                components={{
                  anchor: (
                    // eslint-disable-next-line jsx-a11y/anchor-has-content, jsx-a11y/control-has-associated-label -- Trans fills in the text
                    <a
                      href={`${userGuideUrl(language.code)}/diagnostics/#${t('diagnostics.errorReports.guideAnchor')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    />
                  ),
                }}
              />
            </CardDescription>
          </CardHeader>
          <Switch
            label={t('diagnostics.errorReports.toggle')}
            checked={reporting}
            onChange={(e) => changeReporting(e.currentTarget.checked)}
          />
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>
              <Inline>
                <Wand2 size={16} aria-hidden /> {t('diagnostics.reset.title')}
              </Inline>
            </CardTitle>
            <CardDescription>{t('diagnostics.reset.description')}</CardDescription>
          </CardHeader>
          <Button variant="danger" onClick={() => setResetConfirmOpen(true)}>
            {t('diagnostics.reset.button')}
          </Button>
        </Card>
      </SectionGrid>
      <div className={styles.cableTestCard}>
        <CableTestCard creds={creds} />
      </div>
      <ConfirmDialog
        open={deleteConfirmOpen}
        title={t('diagnostics.confirmDelete.title')}
        description={t('diagnostics.confirmDelete.description', { file: DIAG_REPORT_FILENAME })}
        destructive
        confirmLabel={deleting ? t('diagnostics.deleting') : t('diagnostics.delete')}
        onConfirm={removeReport}
        onCancel={() => (deleting ? undefined : setDeleteConfirmOpen(false))}
      />
      <ConfirmDialog
        open={resetConfirmOpen}
        title={t('diagnostics.confirmReset.title')}
        description={t('diagnostics.confirmReset.description')}
        destructive
        confirmLabel={t('diagnostics.reset.button')}
        onConfirm={openWizard}
        onCancel={() => setResetConfirmOpen(false)}
      />
    </Stack>
  );
}
