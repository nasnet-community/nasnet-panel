import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarClock, RefreshCw } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  Divider,
  Inline,
  Progress,
  useToast,
} from '@nasnet/ui';
import styles from './SettingsPage.module.scss';
import {
  ApiError,
  fetchDomesticCountry,
  fetchDomesticListUpdateStatus,
  fetchScheduler,
  isAbortError,
  setDomesticCountry,
  startDomesticListUpdate,
  updateScheduler,
  type DomesticListUpdateStatus,
  type SchedulerResponse,
  type SystemCredentials,
} from '../../api';
import { useLanguage } from '../../state/LanguageContext';
import { DomesticScheduleForm, type DomesticSettingsChange } from './DomesticScheduleForm';
import { DOMESTIC_UPDATE_SCHEDULER, countryName } from './schedule';

const POLL_MS = 2000;
// How long to keep polling after a start for the script to report that it is running.
const START_WAIT_MS = 15000;
// How many times to retry the first status read before showing an error.
const INITIAL_STATUS_RETRIES = 3;

const STEPS = [
  'starting',
  'verifying-source',
  'preparing',
  'fetching',
  'importing',
  'validating',
  'swapping',
  'verifying',
  'completed',
] as const;

type ResultState = 'running' | 'completed' | 'failed' | 'interrupted';

const RESULT_TONES: Record<ResultState, 'info' | 'success' | 'danger' | 'warning'> = {
  running: 'info',
  completed: 'success',
  failed: 'danger',
  interrupted: 'warning',
};

interface Props {
  creds: SystemCredentials | null;
}

export function DomesticListUpdateCard({ creds }: Props) {
  const { t } = useTranslation('tools');
  const { intlLocale } = useLanguage();
  const toast = useToast();
  // Null until loaded, and stays null on backends that cannot report the country.
  const [country, setCountry] = useState<string | null>(null);
  // The header slot that the form renders its Save and Cancel buttons into.
  const [headerSlot, setHeaderSlot] = useState<HTMLDivElement | null>(null);
  const [scheduler, setScheduler] = useState<SchedulerResponse | null>(null);
  const [schedulerMissing, setSchedulerMissing] = useState(false);
  const [schedulerError, setSchedulerError] = useState<string | null>(null);
  const [status, setStatus] = useState<DomesticListUpdateStatus | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  // Bumped to (re)start the status polling loop, e.g. after starting an update.
  const [pollKey, setPollKey] = useState(0);
  // Set while waiting for a run that this page started to report back.
  const awaitingRef = useRef<{ until: number; previousStart?: string } | null>(null);
  const statusRef = useRef<DomesticListUpdateStatus | null>(null);
  // A new run clears the end time on the router, so keep the previous one to show meanwhile.
  const [lastEndTime, setLastEndTime] = useState<string | undefined>();

  const loadScheduler = useCallback(
    async (signal?: AbortSignal) => {
      if (!creds) return;
      try {
        const next = await fetchScheduler(creds, DOMESTIC_UPDATE_SCHEDULER, signal);
        setScheduler(next);
        setSchedulerMissing(false);
        setSchedulerError(null);
      } catch (err) {
        if (isAbortError(err)) return;
        if (err instanceof ApiError && err.status === 404) {
          setScheduler(null);
          setSchedulerMissing(true);
          setSchedulerError(null);
          return;
        }
        setSchedulerError(err instanceof Error ? err.message : t('settings.domestic.loadFailed'));
      }
    },
    [creds, t],
  );

  useEffect(() => {
    const controller = new AbortController();
    void loadScheduler(controller.signal);
    return () => controller.abort();
  }, [loadScheduler]);

  useEffect(() => {
    if (!creds) return;
    const controller = new AbortController();
    fetchDomesticCountry(creds, controller.signal)
      .then((res) => setCountry(res.country.toUpperCase()))
      .catch(() => {
        // Older backends cannot report it; the form then shows the default country.
      });
    return () => controller.abort();
  }, [creds]);

  useEffect(() => {
    if (!creds) return;
    const controller = new AbortController();
    let timer: number | undefined;
    let failures = 0;

    const finished = (next: DomesticListUpdateStatus) => {
      toast.notify(
        next.status === 'completed'
          ? { title: t('settings.domestic.toasts.completed'), tone: 'success' }
          : {
              title: t('settings.domestic.toasts.failed'),
              description: next.message,
              tone: 'danger',
            },
      );
      void loadScheduler(controller.signal);
    };

    const tick = async () => {
      let next: DomesticListUpdateStatus;
      try {
        next = await fetchDomesticListUpdateStatus(creds, controller.signal);
      } catch (err) {
        if (isAbortError(err)) return;
        failures += 1;
        // Keep polling through a dropped request while a run is in progress, and retry
        // the first read a few times before giving up on it.
        const retryInitial = !statusRef.current && failures <= INITIAL_STATUS_RETRIES;
        if (statusRef.current?.running || awaitingRef.current || retryInitial) {
          timer = window.setTimeout(() => {
            void tick();
          }, POLL_MS);
        } else if (!statusRef.current) {
          setStatusError(err instanceof Error ? err.message : '');
        }
        return;
      }
      failures = 0;
      setStatusError(null);
      const previous = statusRef.current;
      statusRef.current = next;
      setStatus(next);
      if (next.endTime) setLastEndTime(next.endTime);

      const awaiting = awaitingRef.current;
      if (next.running) {
        awaitingRef.current = null;
        timer = window.setTimeout(() => {
          void tick();
        }, POLL_MS);
        return;
      }
      if (awaiting) {
        // A run that finished before the first poll saw it still has a new start time.
        if (next.startTime && next.startTime !== awaiting.previousStart) {
          awaitingRef.current = null;
          finished(next);
          return;
        }
        if (Date.now() < awaiting.until) {
          timer = window.setTimeout(() => {
            void tick();
          }, POLL_MS);
        } else {
          awaitingRef.current = null;
        }
        return;
      }
      if (previous?.running) finished(next);
    };

    void tick();
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [creds, pollKey, loadScheduler, t, toast]);

  const startUpdate = async () => {
    if (!creds || starting) return;
    setStarting(true);
    awaitingRef.current = {
      until: Date.now() + START_WAIT_MS,
      previousStart: statusRef.current?.startTime,
    };
    try {
      await startDomesticListUpdate(creds);
      toast.notify({ title: t('settings.domestic.toasts.started'), tone: 'info' });
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        toast.notify({ title: t('settings.domestic.toasts.alreadyRunning'), tone: 'info' });
      } else {
        awaitingRef.current = null;
        toast.notify({
          title: t('settings.domestic.toasts.startFailed'),
          description: err instanceof Error ? err.message : undefined,
          tone: 'danger',
        });
        return;
      }
    } finally {
      setStarting(false);
    }
    setPollKey((k) => k + 1);
  };

  const saveSettings = async (change: DomesticSettingsChange) => {
    if (!creds) return;
    if (change.schedule) {
      try {
        await updateScheduler(creds, DOMESTIC_UPDATE_SCHEDULER, change.schedule);
      } catch (err) {
        toast.notify({
          title: t('settings.domestic.toasts.scheduleFailed'),
          description: err instanceof Error ? err.message : undefined,
          tone: 'danger',
        });
        throw err;
      }
      toast.notify({ title: t('settings.domestic.toasts.scheduleSaved'), tone: 'success' });
    }
    if (change.country) {
      let saved: string;
      try {
        saved = (await setDomesticCountry(creds, change.country)).country.toUpperCase();
      } catch (err) {
        toast.notify({
          title: t('settings.domestic.toasts.countryFailed'),
          description: err instanceof Error ? err.message : undefined,
          tone: 'danger',
        });
        throw err;
      }
      setCountry(saved);
      toast.notify({
        title: t('settings.domestic.toasts.countrySaved', {
          country: countryName(saved, intlLocale),
        }),
        tone: 'success',
      });
      // The list still holds the previous country's ranges until the next run.
      if (!statusRef.current?.running) await startUpdate();
    }
    // Reload last: it remounts the form, so a country that failed to save above would be lost.
    if (change.schedule) await loadScheduler();
  };

  const running = !!status?.running;
  const stepLabel =
    status?.step && (STEPS as readonly string[]).includes(status.step)
      ? t(`settings.domestic.steps.${status.step as (typeof STEPS)[number]}`)
      : t('settings.domestic.steps.starting');

  const resultState: ResultState | null = running
    ? 'running'
    : status && (RESULT_TONES as Record<string, unknown>)[status.status]
      ? (status.status as ResultState)
      : null;

  const summary = [
    {
      key: 'nextRun',
      label: t('settings.domestic.nextRun'),
      value: scheduler?.nextRun || '—',
      ltr: true,
    },
    {
      key: 'lastRun',
      label: t('settings.domestic.lastRun'),
      value: lastEndTime || '—',
      ltr: true,
    },
  ];

  return (
    <Card data-testid="domestic-list-update">
      <CardHeader className={styles.cardHeader}>
        <div>
          <CardTitle>
            <Inline>
              <CalendarClock size={16} aria-hidden /> {t('settings.domestic.title')}
            </Inline>
          </CardTitle>
          <CardDescription>{t('settings.domestic.description')}</CardDescription>
        </div>
        <div className={styles.headerActions}>
          <div ref={setHeaderSlot} className={styles.headerSlot} />
          <Button
            size="sm"
            variant="primary"
            onClick={() => {
              void startUpdate();
            }}
            disabled={!creds || starting || running}
          >
            <RefreshCw size={14} aria-hidden />{' '}
            {running || starting
              ? t('settings.domestic.updating')
              : t('settings.domestic.updateNow')}
          </Button>
        </div>
      </CardHeader>

      <div className={styles.body}>
        {!creds ? <div className={styles.errorBanner}>{t('common.missingCredentials')}</div> : null}
        {schedulerError ? <div className={styles.errorBanner}>{schedulerError}</div> : null}
        {statusError !== null ? (
          <div className={styles.errorBanner}>
            {t('settings.domestic.statusLoadFailed')} {statusError}
          </div>
        ) : null}
        {schedulerMissing ? (
          <p className={styles.hint}>{t('settings.domestic.schedulerMissing')}</p>
        ) : null}

        <DomesticScheduleForm
          key={`${scheduler?.interval}|${scheduler?.startTime}|${country}`}
          scheduler={scheduler}
          country={country}
          disabled={!creds}
          actionsContainer={headerSlot}
          onSubmit={saveSettings}
        />

        <Divider />

        <dl className={styles.summary}>
          {summary.map((item) => (
            <div key={item.key} className={styles.summaryItem}>
              <dt>{item.label}</dt>
              <dd>{item.ltr ? <span dir="ltr">{item.value}</span> : item.value}</dd>
            </div>
          ))}
          {resultState ? (
            <div className={styles.summaryItem}>
              <dt>{t('settings.domestic.status')}</dt>
              <dd>
                <Badge tone={RESULT_TONES[resultState]}>
                  {t(`settings.domestic.result.${resultState}`)}
                </Badge>
              </dd>
            </div>
          ) : null}
        </dl>

        {running ? (
          <div className={styles.progress} data-testid="domestic-update-progress">
            <Progress value={status?.progress ?? 0} label={stepLabel} tone="success" />
          </div>
        ) : null}
        {!running && resultState !== 'completed' && status?.message && resultState ? (
          <p className={styles.hint} dir="ltr">
            {status.message}
          </p>
        ) : null}
      </div>
    </Card>
  );
}
