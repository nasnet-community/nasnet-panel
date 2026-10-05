import type { ToastTone } from '@nasnet/ui';
import type { WireguardPeerImportResult } from '../../api';

export interface WgClientSummary {
  title: string;
  description?: string;
  tone: ToastTone;
}

const MAX_LISTED_KEYS = 3;

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

const shortKey = (key: string) => (key.length > 12 ? `${key.slice(0, 8)}…` : key);

function describeSkipped(keys: string[]): string {
  const listed = keys.slice(0, MAX_LISTED_KEYS).map(shortKey).join(', ');
  const more = keys.length > MAX_LISTED_KEYS ? ` and ${keys.length - MAX_LISTED_KEYS} more` : '';
  return `Skipped ${plural(keys.length, 'peer')} already on this interface (${listed}${more}).`;
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
      title: `WireGuard client "${name}" is already up to date`,
      description: sentences(
        'An interface with the same private key and IP address already exists, so it was reused.',
        'No new peers were added.',
        skippedText,
      ),
      tone: 'info',
    };
  }

  if (res.reusedExistingInterface) {
    return {
      title: `Added ${plural(imported, 'peer')} to existing WireGuard client "${name}"`,
      description: sentences(
        'An interface with the same private key and IP address already exists, so it was reused instead of creating a new one.',
        skippedText,
      ),
      tone: 'success',
    };
  }

  if (imported === 0) {
    return {
      title: `WireGuard client "${name}" imported without peers`,
      description: skippedText || 'The config did not contain any peers to add.',
      tone: 'warning',
    };
  }

  return {
    title: `WireGuard client "${name}" imported`,
    description: sentences(`Created with ${plural(imported, 'peer')}.`, skippedText),
    tone: 'success',
  };
}
