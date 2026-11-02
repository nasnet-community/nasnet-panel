import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Pencil, Plus, Trash2 } from 'lucide-react';
import {
  Button,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  ConfirmDialog,
  DataTable,
  Inline,
  Switch,
  useToast,
  type DataTableColumn,
} from '@nasnet/ui';
import styles from '../FirewallPage.module.scss';
import {
  ApiError,
  addDomesticAddress,
  deleteDomesticAddress,
  fetchDomesticAddresses,
  fetchDomesticAddressListInfo,
  fetchDomesticBlock,
  setDomesticBlock,
  updateDomesticAddress,
  type DomesticAddress,
  type DomesticAddressListInfo,
  type DomesticBlockResponse,
  type FirewallCredentials,
  type UpdateDomesticAddressRequest,
} from '../../api';
import { useFormat } from '../../utils/useFormat';
import { DomesticAddressDialog } from './DomesticAddressDialog';

interface Props {
  creds: FirewallCredentials | null;
}

export function DomesticAddressCard({ creds }: Props) {
  const { t } = useTranslation('network');
  const toast = useToast();
  const format = useFormat();
  const [block, setBlock] = useState<DomesticBlockResponse | null>(null);
  const [blockBusy, setBlockBusy] = useState(false);
  const [confirmingBlock, setConfirmingBlock] = useState(false);
  const [info, setInfo] = useState<DomesticAddressListInfo | null>(null);
  const [entries, setEntries] = useState<DomesticAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<DomesticAddress | null>(null);
  const [pendingDelete, setPendingDelete] = useState<DomesticAddress | null>(null);
  const [deleting, setDeleting] = useState(false);

  const reloadList = useCallback(async () => {
    if (!creds) return;
    try {
      const [list, summary] = await Promise.all([
        fetchDomesticAddresses(creds),
        fetchDomesticAddressListInfo(creds),
      ]);
      setEntries(list);
      setInfo(summary);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('firewall.domestic.loadFailed'));
    }
  }, [creds, t]);

  useEffect(() => {
    if (!creds) {
      setLoading(false);
      return;
    }
    setLoading(true);
    void Promise.all([
      fetchDomesticBlock(creds)
        .then(setBlock)
        .catch(() => setBlock(null)),
      reloadList(),
    ]).finally(() => setLoading(false));
  }, [creds, reloadList]);

  const notifyError = (title: string, err: unknown) => {
    toast.notify({
      title,
      description: err instanceof Error ? err.message : t('common.unknownError'),
      tone: 'danger',
    });
  };

  const applyBlock = async (next: boolean) => {
    if (!creds) return;
    setConfirmingBlock(false);
    setBlockBusy(true);
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
      notifyError(t('firewall.domestic.toasts.blockFailed'), err);
    } finally {
      setBlockBusy(false);
    }
  };

  const onSubmit = async (request: UpdateDomesticAddressRequest) => {
    if (!creds) return;
    const target = editing;
    try {
      if (target) {
        await updateDomesticAddress(creds, target.id, request);
      } else {
        await addDomesticAddress(creds, request.address);
      }
    } catch (err) {
      notifyError(
        target
          ? t('firewall.domestic.toasts.updateFailed')
          : t('firewall.domestic.toasts.addFailed'),
        err,
      );
      throw err;
    }
    setAdding(false);
    setEditing(null);
    toast.notify({
      title: target
        ? t('firewall.domestic.toasts.updated', { address: request.address })
        : t('firewall.domestic.toasts.added', { address: request.address }),
      tone: 'success',
    });
    await reloadList();
  };

  const confirmDelete = async () => {
    if (!creds || !pendingDelete) return;
    const target = pendingDelete;
    setDeleting(true);
    try {
      await deleteDomesticAddress(creds, target.id);
    } catch (err) {
      notifyError(t('firewall.domestic.toasts.deleteFailed'), err);
      setDeleting(false);
      return;
    }
    setDeleting(false);
    setPendingDelete(null);
    toast.notify({
      title: t('firewall.domestic.toasts.deleted', { address: target.address }),
      tone: 'info',
    });
    await reloadList();
  };

  // Only one of the two rules enabled, for example after a manual change on the router.
  const partial = !!block && !block.block && block.rules.some((r) => !r.disabled);

  const columns: DataTableColumn<DomesticAddress>[] = [
    {
      key: 'address',
      header: t('firewall.domestic.columns.address'),
      render: (row) => (
        <span className={styles.mono} dir="ltr">
          {row.address}
        </span>
      ),
      sortValue: (row) => row.address,
    },
    {
      key: 'timeout',
      header: t('firewall.domestic.columns.timeout'),
      render: (row) =>
        row.timeout ? (
          <span className={styles.mono}>{row.timeout}</span>
        ) : (
          <span className={styles.muted}>{t('firewall.domestic.never')}</span>
        ),
      sortValue: (row) => row.timeout,
    },
    {
      key: 'creationTime',
      header: t('firewall.domestic.columns.created'),
      render: (row) => (
        <span className={styles.mono} dir="ltr">
          {row.creationTime}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      sortable: false,
      width: '110px',
      render: (row) => (
        <span style={{ display: 'inline-flex', gap: 8 }}>
          <Button
            size="sm"
            variant="secondary"
            disabled={!creds}
            title={t('firewall.domestic.editFor', { address: row.address })}
            aria-label={t('firewall.domestic.editFor', { address: row.address })}
            onClick={() => setEditing(row)}
          >
            <Pencil size={14} aria-hidden />
          </Button>
          <Button
            size="sm"
            variant="danger"
            disabled={!creds}
            title={t('firewall.domestic.deleteFor', { address: row.address })}
            aria-label={t('firewall.domestic.deleteFor', { address: row.address })}
            onClick={() => setPendingDelete(row)}
          >
            <Trash2 size={14} aria-hidden />
          </Button>
        </span>
      ),
    },
  ];

  const summary: Array<{ key: string; label: string; value: string }> = info
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
    <Card data-testid="domestic-addresses">
      <CardHeader className={styles.cardHeader}>
        <div>
          <CardTitle>
            <Inline>
              <MapPin size={16} aria-hidden /> {t('firewall.domestic.title')}
            </Inline>
          </CardTitle>
          <CardDescription>{t('firewall.domestic.description')}</CardDescription>
        </div>
        <div className={styles.headerActions}>
          <Button size="sm" variant="primary" onClick={() => setAdding(true)} disabled={!creds}>
            <Plus size={14} aria-hidden /> {t('firewall.domestic.add')}
          </Button>
        </div>
      </CardHeader>

      <div className={styles.domesticBlock}>
        <div>
          <span className={styles.domesticBlockTitle}>{t('firewall.domestic.block')}</span>
          <p className={styles.domesticBlockHint}>
            {partial ? t('firewall.domestic.blockPartial') : t('firewall.domestic.blockHint')}
          </p>
        </div>
        <Switch
          aria-label={t('firewall.domestic.block')}
          checked={!!block?.block}
          disabled={!creds || !block || blockBusy}
          onChange={(e) => {
            if (e.currentTarget.checked) setConfirmingBlock(true);
            else void applyBlock(false);
          }}
        />
      </div>

      {summary.length ? (
        <dl className={styles.domesticSummary}>
          {summary.map((item) => (
            <div key={item.key} className={styles.domesticSummaryItem}>
              <dt>{item.label}</dt>
              <dd dir={item.key === 'lastUpdate' ? 'ltr' : undefined}>{item.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {error ? <div className={styles.errorBanner}>{error}</div> : null}

      <DataTable
        columns={columns}
        rows={entries}
        rowKey={(row) => row.id}
        emptyMessage={loading ? t('firewall.domestic.loading') : t('firewall.domestic.empty')}
      />

      {adding || editing ? (
        <DomesticAddressDialog
          entry={editing}
          onCancel={() => {
            setAdding(false);
            setEditing(null);
          }}
          onSubmit={onSubmit}
        />
      ) : null}

      <ConfirmDialog
        open={confirmingBlock}
        title={t('firewall.domestic.confirmBlock.title')}
        description={t('firewall.domestic.confirmBlock.description')}
        confirmLabel={t('firewall.domestic.confirmBlock.confirm')}
        destructive
        onConfirm={() => applyBlock(true)}
        onCancel={() => setConfirmingBlock(false)}
      />

      <ConfirmDialog
        open={!!pendingDelete}
        title={t('firewall.domestic.confirmDelete.title')}
        description={
          pendingDelete
            ? t('firewall.domestic.confirmDelete.description', { address: pendingDelete.address })
            : undefined
        }
        confirmLabel={deleting ? t('firewall.domestic.deleting') : t('firewall.domestic.delete')}
        destructive
        onConfirm={confirmDelete}
        onCancel={() => (deleting ? undefined : setPendingDelete(null))}
      />
    </Card>
  );
}
