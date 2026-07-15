import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Download, FileText, Loader2, MessageCircle, Play, RefreshCw } from 'lucide-react';
import { Button, Card, Stack, useToast } from '@nasnet/ui';
import styles from './DiagnosticsPage.module.scss';
import {
  DIAG_REPORT_FILENAME,
  fetchDiagReport,
  fetchDiagStatus,
  generateDiag,
  isAbortError,
  type SystemCredentials,
} from '../api';
import { useSession } from '../state/SessionContext';
import { useRouter } from '../state/RouterStoreContext';

const POLL_INTERVAL_MS = 1000;

type Phase = 'loading' | 'idle' | 'running' | 'ready' | 'error';

const DIAG_STEPS: Array<{ at: number; label: string; description: string }> = [
  { at: 10, label: 'System info', description: 'Resources and packages' },
  { at: 15, label: 'Installation check', description: 'Panel install status' },
  { at: 25, label: 'Interfaces', description: 'Links and addresses' },
  { at: 35, label: 'WiFi', description: 'Wireless interfaces' },
  { at: 45, label: 'Routing', description: 'Tables and rules' },
  { at: 60, label: 'DNS', description: 'Config and resolution' },
  { at: 75, label: 'VPN', description: 'Clients and servers' },
  { at: 90, label: 'Connectivity tests', description: 'WAN and VPN pings' },
  { at: 95, label: 'Logs', description: 'Recent errors' },
];

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
  const [fileMeta, setFileMeta] = useState<{ time?: string; size?: string } | null>(null);
  const freshRunRef = useRef(false);

  useEffect(() => {
    if (!creds) {
      setPhase('error');
      setError('Missing router credentials for this session.');
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
        setPhase('error');
        setError(err instanceof Error ? err.message : 'Failed to load diagnostic status.');
      }
    })();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [creds]);

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
          toast.notify({ title: 'Diagnostic complete', tone: 'success' });
          return;
        }
        timer = window.setTimeout(() => {
          void tick();
        }, POLL_INTERVAL_MS);
      } catch (err) {
        if (cancelled || isAbortError(err)) return;
        setPhase('error');
        setError(err instanceof Error ? err.message : 'Failed to check diagnostic progress.');
      }
    };
    void tick();
    return () => {
      cancelled = true;
      controller.abort();
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [phase, creds, toast]);

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
        title: 'Failed to start diagnostic',
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
      toast.notify({
        title: 'Failed to download report',
        description: err instanceof Error ? err.message : undefined,
        tone: 'danger',
      });
    } finally {
      setDownloading(false);
    }
  };

  const contactSupport = () => {
    if (!id) return;
    navigate(`/router/${id}/help`);
  };

  const running = phase === 'running';
  const ready = phase === 'ready';
  const activeStepIndex = running ? DIAG_STEPS.findIndex((step) => progress < step.at) : -1;

  return (
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
                    {step.label}
                  </span>
                  <span className={styles.stepStatus}>{step.description}</span>
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
                    {`Generated ${fileMeta.time}${fileMeta.size ? ` (${fileMeta.size})` : ''}`}
                  </span>
                ) : null}
              </span>
            </div>
            <div className={styles.fileAction}>
              <Button variant="success" onClick={download} disabled={downloading}>
                {downloading ? (
                  <>
                    <Loader2 size={14} aria-hidden /> Downloading…
                  </>
                ) : (
                  <>
                    <Download size={14} aria-hidden /> Download
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : null}
        <div className={`${styles.actions} ${ready ? '' : styles.actionsSpaced}`}>
          <Button variant="secondary" onClick={contactSupport}>
            <MessageCircle size={14} aria-hidden /> Talk to support
          </Button>
          <Button
            variant={ready ? 'primary' : 'success'}
            onClick={run}
            disabled={!creds || phase === 'loading' || running || starting}
          >
            {running || starting ? (
              <>
                <Loader2 size={14} aria-hidden /> Running…
              </>
            ) : ready ? (
              <>
                <RefreshCw size={14} aria-hidden /> Run again
              </>
            ) : (
              <>
                <Play size={14} aria-hidden /> Start
              </>
            )}
          </Button>
        </div>
      </Stack>
    </Card>
  );
}
