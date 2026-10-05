import type { ToastTone } from '@nasnet/ui';
import type { WireguardPeerImportResult } from '../../api';
import i18n from '../../i18n';

export interface WgClientSummary {
  title: string;
  description?: string;
  tone: ToastTone;
}

const MAX_LISTED_KEYS = 3;

const shortKey = (key: string) => (key.length > 12 ? `${key.slice(0, 8)}…` : key);

function describeSkipped(keys: string[]): string {
  const listed = keys.slice(0, MAX_LISTED_KEYS).map(shortKey).join(', ');
  const more =
    keys.length > MAX_LISTED_KEYS
      ? i18n.t('wgImport.skippedMore', { ns: 'vpn', count: keys.length - MAX_LISTED_KEYS })
      : '';
  return i18n.t('wgImport.skipped', { ns: 'vpn', count: keys.length, list: listed, more });
}

const sentences = (...parts: string[]) => parts.filter(Boolean).join(' ') || undefined;

/**
 * Builds the toast shown after importing a WireGuard config. The backend may
 * reuse an existing interface (same private key and IP) and skip peers whose public key
 * is already present, so a successful request can add zero peers.
 */
export function summarizeWireguardImport(
  interfaceName: string,
  res: WireguardPeerImportResult,
): WgClientSummary {
  const name = interfaceName;
  const imported = res.importedPeerCount ?? res.peerNames?.length ?? 0;
  const skipped = res.skippedDuplicatePeers ?? [];
  const skippedText = skipped.length > 0 ? describeSkipped(skipped) : '';

  if (res.reusedExistingInterface && imported === 0) {
    return {
      title: i18n.t('wgImport.upToDate', { ns: 'vpn', name }),
      description: sentences(
        i18n.t('wgImport.reusedInterface', { ns: 'vpn' }),
        i18n.t('wgImport.noNewPeers', { ns: 'vpn' }),
        skippedText,
      ),
      tone: 'info',
    };
  }

  if (res.reusedExistingInterface) {
    return {
      title: i18n.t('wgImport.addedToExisting', { ns: 'vpn', count: imported, name }),
      description: sentences(i18n.t('wgImport.reusedInsteadOfNew', { ns: 'vpn' }), skippedText),
      tone: 'success',
    };
  }

  if (imported === 0) {
    return {
      title: i18n.t('wgImport.importedWithoutPeers', { ns: 'vpn', name }),
      description: skippedText || i18n.t('wgImport.noPeersInConfig', { ns: 'vpn' }),
      tone: 'warning',
    };
  }

  return {
    title: i18n.t('wgImport.imported', { ns: 'vpn', name }),
    description: sentences(
      i18n.t('wgImport.createdWith', { ns: 'vpn', count: imported }),
      skippedText,
    ),
    tone: 'success',
  };
}
