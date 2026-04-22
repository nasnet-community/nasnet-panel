import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, type Variants } from 'framer-motion';
import { Plus, Router as RouterIcon, Server } from 'lucide-react';
import {
  Card,
  ConfirmDialog,
  PageHeader,
  PageShell,
  PageSubtitle,
  PageTitle,
  useToast,
} from '@nasnet/ui';
import { api, type Router } from '../api';
import { useRouterStore } from '../state/RouterStoreContext';
import { AppShell } from '../layout/AppShell';
import { BrandSplash } from './splash/BrandSplash';
import { RouterCard } from './RouterCard';
import { useRouterStatusPolling } from './useRouterStatusPolling';
import styles from './RouterListPage.module.scss';

const SPLASH_PHRASES = ['Enterprise MikroTik Router Management Platform'];
const SPLASH_FLAG = 'nasnet:splashSeen';
const CONNECT_DELAY_MS = 2000;
const STATUS_POLL_INTERVAL_MS = 5000;

const listVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};
const cardVariants: Variants = {
  hidden: { opacity: 0, y: 12, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.22, ease: 'easeOut' } },
  exit: { opacity: 0, y: -8, scale: 0.98, transition: { duration: 0.14 } },
  hover: { y: -3, transition: { duration: 0.15 } },
};

export function RouterListPage() {
  const navigate = useNavigate();
  const { routers, removeRouter, upsertRouter } = useRouterStore();
  const [initialLoad, setInitialLoad] = useState(true);
  const [pendingRemoval, setPendingRemoval] = useState<Router | null>(null);
  const [connecting, setConnecting] = useState<Router | null>(null);
  const [phase, setPhase] = useState<'splash' | 'ready'>(() => {
    if (typeof window === 'undefined') return 'splash';
    return window.localStorage.getItem(SPLASH_FLAG) ? 'ready' : 'splash';
  });
  const toast = useToast();

  const probedIds = useRouterStatusPolling(routers, upsertRouter, {
    intervalMs: STATUS_POLL_INTERVAL_MS,
    enabled: phase === 'ready',
  });

  useEffect(() => {
    let cancelled = false;
    void api.routers.list().then(() => {
      if (!cancelled) setInitialLoad(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!connecting) return;
    const t = setTimeout(() => {
      navigate(`/router/${connecting.id}`);
    }, CONNECT_DELAY_MS);
    return () => clearTimeout(t);
  }, [connecting, navigate]);

  useEffect(() => {
    if (phase !== 'splash') return;
    try {
      window.localStorage.setItem(SPLASH_FLAG, '1');
    } catch {
      /* ignore */
    }
    const toReady = setTimeout(() => setPhase('ready'), 4200);
    return () => clearTimeout(toReady);
  }, [phase]);

  const sorted = useMemo(
    () => [...routers].sort((a, b) => a.name.localeCompare(b.name)),
    [routers],
  );

  const goScan = () => navigate('/routers/new?mode=scan');

  const confirmRemove = async () => {
    if (!pendingRemoval) return;
    const target = pendingRemoval;
    setPendingRemoval(null);
    await api.routers.remove(target.id);
    removeRouter(target.id);
    toast.notify({
      title: 'Router removed',
      description: `${target.name} was removed from the list.`,
      tone: 'info',
    });
  };

  const subtitle =
    routers.length === 0
      ? 'No routers yet. Start by scanning the network or adding one manually.'
      : 'Pick a router to open its dashboard.';

  return (
    <>
      <AnimatePresence mode="wait">
        {phase === 'splash' ? (
          <motion.div
            key="splash"
            className={styles.splashStage}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
          >
            <BrandSplash phase="splash" phrases={SPLASH_PHRASES} />
          </motion.div>
        ) : (
          <motion.div
            key="app"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
          >
            <AppShell>
              <PageShell>
                <PageHeader>
                  <div>
                    <PageTitle>Routers</PageTitle>
                    <PageSubtitle>{subtitle}</PageSubtitle>
                  </div>
                </PageHeader>

                {initialLoad && routers.length === 0 ? (
                  <Card>
                    <p aria-busy="true">Loading routers…</p>
                  </Card>
                ) : (
                  <motion.div
                    className={styles.motionGrid}
                    initial="hidden"
                    animate="visible"
                    variants={listVariants}
                    layout
                  >
                    <AnimatePresence mode="popLayout">
                      {sorted.map((r) => (
                        <motion.div
                          key={r.id}
                          layout
                          variants={cardVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          whileHover="hover"
                        >
                          <RouterCard
                            router={r}
                            isProbed={probedIds.has(r.id)}
                            onOpen={setConnecting}
                            onRemove={setPendingRemoval}
                          />
                        </motion.div>
                      ))}
                      <motion.div
                        key="new-router-tile"
                        layout
                        variants={cardVariants}
                        initial="hidden"
                        animate="visible"
                        whileHover="hover"
                      >
                        <button
                          type="button"
                          className={styles.newRouterTile}
                          onClick={goScan}
                          aria-label="New router"
                        >
                          <div className={styles.newRouterIcon} aria-hidden>
                            <Plus size={22} />
                          </div>
                          <span className={styles.newRouterLabel}>New Router</span>
                          <span className={styles.newRouterHint}>
                            Scan the network to find devices
                          </span>
                        </button>
                      </motion.div>
                    </AnimatePresence>
                  </motion.div>
                )}
              </PageShell>
            </AppShell>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {connecting ? (
          <motion.div
            key="connecting-overlay"
            className={styles.connectingOverlay}
            role="status"
            aria-live="polite"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <motion.div
              className={styles.connectingInner}
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            >
              <div className={styles.connectingGraphic} aria-hidden>
                <div className={`${styles.connectingNode} ${styles.connectingNodeClient}`}>
                  <RouterIcon size={26} />
                </div>
                <div className={styles.connectingBeam}>
                  <span className={styles.connectingPulse} />
                  <span className={styles.connectingPulse} />
                  <span className={styles.connectingPulse} />
                </div>
                <div className={`${styles.connectingNode} ${styles.connectingNodeServer}`}>
                  <Server size={26} />
                </div>
              </div>
              <div className={styles.connectingTitle}>Connecting to {connecting.name}</div>
              <div className={styles.connectingSubtitle}>
                Establishing secure session with {connecting.host}…
              </div>
              <div className={styles.connectingBar} aria-hidden>
                <span />
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
      <ConfirmDialog
        open={!!pendingRemoval}
        title="Remove router"
        description={
          pendingRemoval
            ? `Remove ${pendingRemoval.name} (${pendingRemoval.host}) from the list? This does not touch the device itself.`
            : undefined
        }
        confirmLabel="Remove"
        destructive
        onConfirm={confirmRemove}
        onCancel={() => setPendingRemoval(null)}
      />
    </>
  );
}
