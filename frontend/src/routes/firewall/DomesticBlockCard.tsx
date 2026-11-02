import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, ConfirmDialog, Switch, useToast } from '@nasnet/ui';
import styles from '../FirewallPage.module.scss';
import {
  ApiError,
  fetchDomesticBlock,
  setDomesticBlock,
  type DomesticBlockResponse,
  type FirewallCredentials,
} from '../../api';

interface Props {
  creds: FirewallCredentials | null;
}

export function DomesticBlockCard({ creds }: Props) {
  const { t } = useTranslation('network');
  const toast = useToast();
  const [block, setBlock] = useState<DomesticBlockResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!creds) return;
    fetchDomesticBlock(creds)
      .then(setBlock)
      .catch(() => setBlock(null));
  }, [creds]);

  const apply = async (next: boolean) => {
    if (!creds) return;
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
      setBusy(false);
    }
  };

  // Only one of the two rules enabled, for example after a manual change on the router.
  const partial = !!block && !block.block && block.rules.some((r) => !r.disabled);

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
