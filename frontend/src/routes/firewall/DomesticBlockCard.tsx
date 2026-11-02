import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, ConfirmDialog, Divider, Switch, useToast } from '@nasnet/ui';
import styles from '../FirewallPage.module.scss';
import {
  ApiError,
  fetchDomesticBlock,
  setDomesticBlock,
  type DomesticAddressListInfo,
  type DomesticBlockResponse,
  type FirewallCredentials,
} from '../../api';
import { useFormat } from '../../utils/useFormat';

interface Props {
  creds: FirewallCredentials | null;
  info: DomesticAddressListInfo | null;
}

export function DomesticBlockCard({ creds, info }: Props) {
  const { t } = useTranslation('network');
  const format = useFormat();
  const toast = useToast();
  const [block, setBlock] = useState<DomesticBlockResponse | null>(null);
  const [busy, setBusy] = useState(false);
  // Blocks a second confirm click that lands before `busy` re-renders.
  const busyRef = useRef(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!creds) return;
    fetchDomesticBlock(creds)
      .then((state) => {
        setBlock(state);
        setError(null);
      })
      .catch((err: unknown) => {
        setBlock(null);
        setError(err instanceof Error ? err.message : t('firewall.domestic.blockLoadFailed'));
      });
  }, [creds, t]);

  const apply = async (next: boolean) => {
    if (!creds || busyRef.current) return;
    busyRef.current = true;
    setConfirming(false);
    setBusy(true);
    try {
      setBlock(await setDomesticBlock(creds, next));
      toast.notify({
        title: next
          ? t('firewall.domestic.toasts.blockOn')
          : t('firewall.domestic.toasts.blockOff'),
        tone: 'success',
      });
    } catch (err) {
      // 409 means the rules were already in the requested state.
      if (err instanceof ApiError && err.status === 409) {
        setBlock(await fetchDomesticBlock(creds).catch(() => block));
        return;
      }
      toast.notify({
        title: t('firewall.domestic.toasts.blockFailed'),
        description: err instanceof Error ? err.message : t('common.unknownError'),
        tone: 'danger',
      });
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  // Only one of the two rules enabled, for example after a manual change on the router.
  const partial = !!block && !block.block && block.rules.some((r) => !r.disabled);

  const summary = info
    ? [
        {
          key: 'total',
          label: t('firewall.domestic.info.total'),
          value: format.number(info.totalEntries),
        },
        {
          key: 'auto',
          label: t('firewall.domestic.info.auto'),
          value: format.number(info.autoEntries),
        },
        {
          key: 'manual',
          label: t('firewall.domestic.info.manual'),
          value: format.number(info.manualEntries),
        },
        {
          key: 'lastUpdate',
          label: t('firewall.domestic.info.lastUpdate'),
          value: info.lastUpdate || '—',
        },
      ]
    : [];

  return (
    <Card data-testid="domestic-block-card">
      <div className={styles.settingRow}>
        <span className={styles.settingTitle}>{t('firewall.domestic.block')}</span>
        <Switch
          aria-label={t('firewall.domestic.block')}
          checked={!!block?.block}
          disabled={!creds || !block || busy}
          onChange={(e) => {
            if (e.currentTarget.checked) setConfirming(true);
            else void apply(false);
          }}
        />
      </div>
      <p className={styles.settingHint}>
        {partial ? t('firewall.domestic.blockPartial') : t('firewall.domestic.blockHint')}
      </p>
      {error ? <div className={styles.errorBanner}>{error}</div> : null}

      {summary.length ? (
        <>
          <Divider className={styles.settingDivider} />
          <dl className={styles.domesticSummary}>
            {summary.map((item) => (
              <div
                key={item.key}
                className={
                  item.key === 'lastUpdate'
                    ? `${styles.domesticSummaryItem} ${styles.domesticSummaryDate}`
                    : styles.domesticSummaryItem
                }
              >
                <dt>{item.label}</dt>
                <dd dir={item.key === 'lastUpdate' ? 'ltr' : undefined}>{item.value}</dd>
              </div>
            ))}
          </dl>
        </>
      ) : null}

      <ConfirmDialog
        open={confirming}
        title={t('firewall.domestic.confirmBlock.title')}
        description={t('firewall.domestic.confirmBlock.description')}
        confirmLabel={t('firewall.domestic.confirmBlock.confirm')}
        destructive
        onConfirm={() => apply(true)}
        onCancel={() => setConfirming(false)}
      />
    </Card>
  );
}
