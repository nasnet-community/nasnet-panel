import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArchiveRestore, DatabaseBackup, Download, Plus, SearchX, Trash2 } from 'lucide-react';
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
  Tooltip,
  useToast,
  type DataTableColumn,
} from '@nasnet/ui';
import styles from './BackupsCard.module.scss';
import {
  createBackup,
  deleteBackup,
  downloadBackup,
  fetchBackups,
  isAbortError,
  restoreBackup,
  type BackupFileResponse,
  type SystemCredentials,
} from '../api';

interface Props {
  creds: SystemCredentials | null;
}

// Wraps a file name in a first-strong isolate so it keeps its order inside Persian text.
const isolate = (text: string) => `\u2068${text}\u2069`;

function saveBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function BackupsCard({ creds }: Props) {
  const { t } = useTranslation('tools');
  const toast = useToast();
  const navigate = useNavigate();
  const [backups, setBackups] = useState<BackupFileResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [pendingRestore, setPendingRestore] = useState<BackupFileResponse | null>(null);
  const [pendingDelete, setPendingDelete] = useState<BackupFileResponse | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const reload = useCallback(
    async (signal?: AbortSignal) => {
      if (!creds) {
        setLoading(false);
        setError(t('common.missingCredentials'));
        return;
      }
      setError(null);
      try {
        setBackups(await fetchBackups(creds, signal));
      } catch (err) {
        if (isAbortError(err)) return;
        setError(err instanceof Error ? err.message : t('backups.loadFailed'));
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [creds, t],
  );

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    void reload(controller.signal);
    return () => controller.abort();
  }, [reload]);

  const notifyError = (title: string, err: unknown) => {
    toast.notify({
      title,
      description: err instanceof Error ? err.message : undefined,
      tone: 'danger',
    });
  };

  const create = async () => {
    if (!creds) return;
    setCreating(true);
    try {
      const created = await createBackup(creds);
      toast.notify({
        title: t('backups.toasts.created', { file: isolate(created.filename) }),
        tone: 'success',
      });
      await reload();
    } catch (err) {
      notifyError(t('backups.toasts.createFailed'), err);
    } finally {
      setCreating(false);
    }
  };

  const download = async (backup: BackupFileResponse) => {
    if (!creds) return;
    setDownloading(backup.filename);
    try {
      saveBlob(backup.filename, await downloadBackup(creds, backup.filename));
    } catch (err) {
      notifyError(t('backups.toasts.downloadFailed'), err);
    } finally {
      setDownloading(null);
    }
  };

  const confirmRestore = async () => {
    if (!creds || !pendingRestore) return;
    setRestoring(true);
    try {
      await restoreBackup(creds, pendingRestore.filename);
    } catch (err) {
      notifyError(t('backups.toasts.restoreFailed'), err);
      setRestoring(false);
      return;
    }
    setRestoring(false);
    setPendingRestore(null);
    toast.notify({ title: t('backups.toasts.restoreStarted'), tone: 'warning' });
    navigate('/');
  };

  const confirmDelete = async () => {
    if (!creds || !pendingDelete) return;
    const target = pendingDelete;
    setDeleting(true);
    try {
      await deleteBackup(creds, target.filename);
    } catch (err) {
      notifyError(t('backups.toasts.deleteFailed'), err);
      setDeleting(false);
      return;
    }
    setDeleting(false);
    setPendingDelete(null);
    toast.notify({
      title: t('backups.toasts.deleted', { file: isolate(target.filename) }),
      tone: 'info',
    });
    await reload();
  };

  const busy = creating || restoring || deleting;

  const columns: DataTableColumn<BackupFileResponse>[] = [
    {
      key: 'filename',
      header: t('backups.columns.name'),
      render: (row) => (
        <span className={styles.fileName} dir="ltr">
          {row.filename}
        </span>
      ),
    },
    {
      key: 'date',
      header: t('backups.columns.date'),
      render: (row) => <span dir="ltr">{row.date}</span>,
    },
    {
      key: 'size',
      header: t('backups.columns.size'),
      width: '110px',
      render: (row) => <span dir="ltr">{row.size}</span>,
      sortValue: (row) => row.sizeBytes,
    },
    {
      key: 'actions',
      header: '',
      sortable: false,
      width: '170px',
      render: (row) => (
        <Inline>
          <Tooltip label={t('backups.download')}>
            <Button
              size="sm"
              variant="secondary"
              disabled={!creds || downloading === row.filename}
              loading={downloading === row.filename}
              aria-label={t('backups.downloadFor', { file: row.filename })}
              onClick={() => {
                void download(row);
              }}
            >
              <Download size={14} aria-hidden />
            </Button>
          </Tooltip>
          <Tooltip label={t('backups.restore')}>
            <Button
              size="sm"
              variant="secondary"
              disabled={!creds || busy}
              aria-label={t('backups.restoreFor', { file: row.filename })}
              onClick={() => setPendingRestore(row)}
            >
              <ArchiveRestore size={14} aria-hidden />
            </Button>
          </Tooltip>
          <Tooltip label={t('backups.delete')}>
            <Button
              size="sm"
              variant="danger"
              disabled={!creds || busy}
              aria-label={t('backups.deleteFor', { file: row.filename })}
              onClick={() => setPendingDelete(row)}
            >
              <Trash2 size={14} aria-hidden />
            </Button>
          </Tooltip>
        </Inline>
      ),
    },
  ];

  return (
    <Card data-testid="backups-card">
      <CardHeader className={styles.cardHeader}>
        <div>
          <CardTitle>
            <Inline>
              <DatabaseBackup size={16} aria-hidden /> {t('backups.title')}
            </Inline>
          </CardTitle>
          <CardDescription>{t('backups.description')}</CardDescription>
        </div>
        <div className={styles.headerActions}>
          <Button
            size="sm"
            variant="success"
            onClick={() => {
              void create();
            }}
            disabled={!creds || busy}
            loading={creating}
          >
            {creating ? (
              t('backups.creating')
            ) : (
              <>
                <Plus size={14} aria-hidden /> {t('backups.create')}
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      {loading && backups.length === 0 ? (
        <div className={styles.skeletonGrid} data-testid="backups-skeleton">
          <Skeleton width={180} height={14} />
          <Skeleton height={36} />
          <Skeleton width={180} height={14} />
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
          rows={backups}
          rowKey={(row) => row.filename}
          emptyMessage={t('backups.empty')}
        />
      )}

      <ConfirmDialog
        open={!!pendingRestore}
        title={t('backups.confirmRestore.title')}
        description={
          pendingRestore
            ? t('backups.confirmRestore.description', { file: isolate(pendingRestore.filename) })
            : undefined
        }
        confirmLabel={restoring ? t('backups.restoring') : t('backups.restore')}
        destructive
        onConfirm={confirmRestore}
        onCancel={() => (restoring ? undefined : setPendingRestore(null))}
      />
      <ConfirmDialog
        open={!!pendingDelete}
        title={t('backups.confirmDelete.title')}
        description={
          pendingDelete
            ? t('backups.confirmDelete.description', { file: isolate(pendingDelete.filename) })
            : undefined
        }
        confirmLabel={deleting ? t('backups.deleting') : t('backups.delete')}
        destructive
        onConfirm={confirmDelete}
        onCancel={() => (deleting ? undefined : setPendingDelete(null))}
      />
    </Card>
  );
}
