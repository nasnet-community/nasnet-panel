export function formatBytes(bytes: number): string {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(2)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${bytes} B`;
}

const DEV_PLACEHOLDER_VERSION = 'v0.0.0-dev';
const SNAPSHOT_VERSION = /^([A-Za-z][\w.]*-)?([0-9a-f]{8,40})$/;

export function formatBuildVersion(version: string | undefined): string {
  const value = (version ?? '').trim();
  if (!value || value === DEV_PLACEHOLDER_VERSION) return '';
  const snapshot = SNAPSHOT_VERSION.exec(value);
  if (!snapshot) return value;
  return `${snapshot[1] ?? ''}${snapshot[2].slice(0, 7)}`;
}
