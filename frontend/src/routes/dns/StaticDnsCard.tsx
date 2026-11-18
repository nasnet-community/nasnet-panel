import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BookMarked, Pencil, Plus, SearchX, Trash2 } from 'lucide-react';
import {
  Button,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  ConfirmDialog,
  DataTable,
  Inline,
  Skeleton,
  Switch,
  useToast,
  type DataTableColumn,
} from '@nasnet/ui';
import styles from '../DNSPage.module.scss';
import {
  createStaticDnsEntry,
  deleteStaticDnsEntry,
  fetchStaticDnsEntries,
  updateStaticDnsEntry,
  type CreateStaticDnsRequest,
  type DnsCredentials,
  type StaticDnsEntry,
} from '../../api';
import { StaticDnsDialog } from './StaticDnsDialog';

interface Props {
  creds: DnsCredentials | null;
}

export function StaticDnsCard({ creds }: Props) {
  const { t } = useTranslation('network');
  const toast = useToast();
  const [entries, setEntries] = useState<StaticDnsEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<StaticDnsEntry | null>(null);
  const [pendingDelete, setPendingDelete] = useState<StaticDnsEntry | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState<Set<string>>(() => new Set());

  const reload = useCallback(async () => {
    if (!creds) {
      setLoading(false);
      return;
    }
    setError(null);
    try {
      setEntries(await fetchStaticDnsEntries(creds));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('dns.static.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [creds, t]);

  useEffect(() => {
    setLoading(true);
    void reload();
  }, [reload]);

  const notifyError = (title: string, err: unknown, fallback: string) => {
    toast.notify({
      title,
      description: err instanceof Error ? err.message : fallback,
      tone: 'danger',
    });
  };

  const onSubmit = async (request: CreateStaticDnsRequest) => {
    if (!creds) return;
    const target = editing;
    try {
      if (target) {
        await updateStaticDnsEntry(creds, target.id, request);
      } else {
        await createStaticDnsEntry(creds, request);
      }
    } catch (err) {
      notifyError(
        target ? t('dns.static.toasts.updateFailed') : t('dns.static.toasts.addFailed'),
        err,
        t('common.unknownError'),
      );
      throw err;
    }
    setAdding(false);
    setEditing(null);
    toast.notify({
      title: target
        ? t('dns.static.toasts.updated', { name: request.name })
        : t('dns.static.toasts.added', { name: request.name }),
      tone: 'success',
    });
    await reload();
  };

  const toggle = async (entry: StaticDnsEntry, enabled: boolean) => {
    if (!creds) return;
    setToggling((prev) => new Set(prev).add(entry.id));
    try {
      await updateStaticDnsEntry(creds, entry.id, { disabled: !enabled });
      setEntries((list) => list.map((e) => (e.id === entry.id ? { ...e, disabled: !enabled } : e)));
    } catch (err) {
      notifyError(t('dns.static.toasts.updateFailed'), err, t('common.unknownError'));
    } finally {
      setToggling((prev) => {
        const next = new Set(prev);
        next.delete(entry.id);
        return next;
      });
    }
  };

  const confirmDelete = async () => {
    if (!creds || !pendingDelete) return;
    const target = pendingDelete;
    setDeleting(true);
    try {
      await deleteStaticDnsEntry(creds, target.id);
    } catch (err) {
      notifyError(t('dns.static.toasts.deleteFailed'), err, t('common.unknownError'));
      setDeleting(false);
      return;
    }
    setDeleting(false);
    setPendingDelete(null);
    toast.notify({ title: t('dns.static.toasts.deleted', { name: target.name }), tone: 'info' });
    await reload();
  };

  const columns: DataTableColumn<StaticDnsEntry>[] = [
    {
      key: 'name',
      header: t('dns.static.columns.name'),
      render: (row) => <span dir="ltr">{row.name}</span>,
      sortValue: (row) => row.name,
    },
    {
      key: 'address',
      header: t('dns.static.columns.address'),
      render: (row) => (
        <span className={styles.serverPill} dir="ltr">
          {row.address}
        </span>
      ),
      sortValue: (row) => row.address,
    },
    {
      key: 'enabled',
      header: t('dns.static.columns.enabled'),
      width: '110px',
      render: (row) => (
        <Switch
          aria-label={t('dns.static.enabledFor', { name: row.name })}
          checked={!row.disabled}
          disabled={!creds || toggling.has(row.id)}
          onChange={(e) => {
            void toggle(row, e.currentTarget.checked);
          }}
        />
      ),
      sortValue: (row) => !row.disabled,
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
            aria-label={t('dns.static.editFor', { name: row.name })}
            onClick={() => setEditing(row)}
          >
            <Pencil size={14} aria-hidden /> {t('dns.edit')}
          </Button>
          <Button
            size="sm"
            variant="danger"
            disabled={!creds}
            aria-label={t('dns.static.deleteFor', { name: row.name })}
            onClick={() => setPendingDelete(row)}
          >
            <Trash2 size={14} aria-hidden /> {t('dns.static.delete')}
          </Button>
        </Inline>
      ),
    },
  ];

  return (
    <Card data-testid="static-dns-card">
      <CardHeader className={styles.cardHeader}>
        <div>
          <CardTitle>
            <Inline>
              <BookMarked size={16} aria-hidden /> {t('dns.static.title')}
            </Inline>
          </CardTitle>
          <CardDescription>{t('dns.static.description')}</CardDescription>
        </div>
        <div className={styles.headerActions}>
          <Button size="sm" variant="success" onClick={() => setAdding(true)} disabled={!creds}>
            <Plus size={14} aria-hidden /> {t('dns.static.add')}
          </Button>
        </div>
      </CardHeader>

      {loading && entries.length === 0 ? (
        <div className={styles.skeletonGrid} data-testid="static-dns-skeleton">
          <Skeleton width={140} height={14} />
          <Skeleton height={36} />
          <Skeleton width={140} height={14} />
          <Skeleton height={36} />
        </div>
      ) : error ? (
        <div className={styles.errorNote}>
          <SearchX size={28} aria-hidden className={styles.errorIcon} />
          <p>{error}</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          rows={entries}
          rowKey={(row) => row.id}
          emptyMessage={t('dns.static.empty')}
        />
      )}

      {adding || editing ? (
        <StaticDnsDialog
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
        title={t('dns.static.confirmDelete.title')}
        description={
          pendingDelete
            ? t('dns.static.confirmDelete.description', { name: pendingDelete.name })
            : undefined
        }
        confirmLabel={deleting ? t('dns.static.deleting') : t('dns.static.delete')}
        destructive
        onConfirm={confirmDelete}
        onCancel={() => (deleting ? undefined : setPendingDelete(null))}
      />
    </Card>
  );
}
