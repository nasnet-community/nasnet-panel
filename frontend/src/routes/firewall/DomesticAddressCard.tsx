import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Pencil, Plus, Trash2 } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  ConfirmDialog,
  DataTable,
  Inline,
  useToast,
  type DataTableColumn,
} from '@nasnet/ui';
import styles from '../FirewallPage.module.scss';
import {
  addDomesticAddress,
  deleteDomesticAddress,
  fetchDomesticAddresses,
  fetchDomesticAddressListInfo,
  updateDomesticAddress,
  type DomesticAddress,
  type DomesticAddressListInfo,
  type FirewallCredentials,
  type UpdateDomesticAddressRequest,
} from '../../api';
import { DomesticAddressDialog } from './DomesticAddressDialog';

interface Props {
  creds: FirewallCredentials | null;
  /** Receives the list summary each time the list is (re)loaded. */
  onInfo: (info: DomesticAddressListInfo) => void;
}

export function DomesticAddressCard({ creds, onInfo }: Props) {
  const { t } = useTranslation('network');
  const toast = useToast();
  const [entries, setEntries] = useState<DomesticAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<DomesticAddress | null>(null);
  const [pendingDelete, setPendingDelete] = useState<DomesticAddress | null>(null);
  const [deleting, setDeleting] = useState(false);
  // Blocks a second confirm click that lands before `deleting` re-renders.
  const deletingRef = useRef(false);

  // Bumped when the credentials change or the card unmounts, so a load that is still
  // in flight for the previous router cannot overwrite the current list or summary.
  const generationRef = useRef(0);
  useEffect(
    () => () => {
      generationRef.current += 1;
    },
    [creds],
  );

  const reloadList = useCallback(async () => {
    if (!creds) return;
    const generation = generationRef.current;
    try {
      const [list, summary] = await Promise.all([
        fetchDomesticAddresses(creds),
        fetchDomesticAddressListInfo(creds),
      ]);
      if (generation !== generationRef.current) return;
      setEntries(list);
      onInfo(summary);
      setError(null);
    } catch (err) {
      if (generation !== generationRef.current) return;
      setError(err instanceof Error ? err.message : t('firewall.domestic.loadFailed'));
    }
  }, [creds, onInfo, t]);

  useEffect(() => {
    if (!creds) {
      setLoading(false);
      return;
    }
    setLoading(true);
    void reloadList().finally(() => setLoading(false));
  }, [creds, reloadList]);

  const notifyError = (title: string, err: unknown) => {
    toast.notify({
      title,
      description: err instanceof Error ? err.message : t('common.unknownError'),
      tone: 'danger',
    });
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
    if (!creds || !pendingDelete || deletingRef.current) return;
    const target = pendingDelete;
    deletingRef.current = true;
    setDeleting(true);
    try {
      await deleteDomesticAddress(creds, target.id);
    } catch (err) {
      notifyError(t('firewall.domestic.toasts.deleteFailed'), err);
      deletingRef.current = false;
      setDeleting(false);
      return;
    }
    deletingRef.current = false;
    setDeleting(false);
    setPendingDelete(null);
    toast.notify({
      title: t('firewall.domestic.toasts.deleted', { address: target.address }),
      tone: 'info',
    });
    await reloadList();
  };

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
          <Badge>{t('firewall.domestic.never')}</Badge>
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
      width: '200px',
      render: (row) => (
        <Inline>
          <Button
            size="sm"
            variant="secondary"
            disabled={!creds}
            aria-label={t('firewall.domestic.editFor', { address: row.address })}
            onClick={() => setEditing(row)}
          >
            <Pencil size={14} aria-hidden /> {t('firewall.domestic.edit')}
          </Button>
          <Button
            size="sm"
            variant="danger"
            disabled={!creds}
            aria-label={t('firewall.domestic.deleteFor', { address: row.address })}
            onClick={() => setPendingDelete(row)}
          >
            <Trash2 size={14} aria-hidden /> {t('firewall.domestic.delete')}
          </Button>
        </Inline>
      ),
    },
  ];

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
          <Button size="sm" variant="success" onClick={() => setAdding(true)} disabled={!creds}>
            <Plus size={14} aria-hidden /> {t('firewall.domestic.add')}
          </Button>
        </div>
      </CardHeader>

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
