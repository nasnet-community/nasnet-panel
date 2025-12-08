/**
 * SecurityProfileSection Component
 * Displays security profile information for a wireless interface
 * Implements FR0-16: View security profile settings
 */

import { Lock } from 'lucide-react';
import { Card } from '@nasnet/ui/primitives';
import {
  type SecurityProfile,
  type AuthenticationType,
  getSecurityLevel,
} from '@nasnet/core/types';
import { SecurityLevelBadge } from './SecurityLevelBadge';
import { PasswordField } from './PasswordField';

export interface SecurityProfileSectionProps {
  /** Security profile to display */
  profile: SecurityProfile;
  /** Optional CSS className */
  className?: string;
}

/**
 * Security Profile Section Component
 * - Displays profile name and security level
 * - Shows authentication type and encryption method
 * - Provides password field with masking and copy functionality
 */
export function SecurityProfileSection({
  profile,
  className,
}: SecurityProfileSectionProps) {
  const securityLevel = getSecurityLevel(profile);

  // Get user-friendly authentication type label
  const authLabel = getAuthenticationLabel(profile.authenticationTypes);

  // Get encryption method label
  const encryptionLabel = profile.unicastCiphers
    .map((cipher) => (cipher === 'aes-ccm' ? 'AES' : 'TKIP'))
    .join(', ');

  // Get password (prefer WPA2, fallback to WPA)
  const password = profile.wpa2PreSharedKey || profile.wpaPreSharedKey;

  return (
    <Card className={className}>
      <div className="p-6">
        {/* Header with security level badge */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              Security
            </h3>
          </div>
          <SecurityLevelBadge level={securityLevel} />
        </div>

        {/* Security details */}
        <div className="space-y-3">
          <DetailRow label="Profile" value={profile.name} />

          {/* Authentication type */}
          <DetailRow label="Authentication" value={authLabel} />

          {/* Encryption method */}
          {profile.mode !== 'none' && (
            <DetailRow label="Encryption" value={encryptionLabel} />
          )}

          {/* Password (if available) */}
          {password && <PasswordField password={password} />}
        </div>
      </div>
    </Card>
  );
}

/**
 * Detail row component for consistent key-value display
 */
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-600 dark:text-slate-400">
        {label}
      </span>
      <span className="text-sm font-medium text-slate-900 dark:text-slate-50">
        {value}
      </span>
    </div>
  );
}

/**
 * Get user-friendly label for authentication types
 */
function getAuthenticationLabel(
  authTypes: AuthenticationType[]
): string {
  if (authTypes.length === 0) {
    return 'Open';
  }

  // Map authentication types to friendly labels
  const labels = authTypes.map((type) => {
    switch (type) {
      case 'wpa2-psk':
        return 'WPA2-PSK';
      case 'wpa-psk':
        return 'WPA-PSK';
      case 'wpa2-eap':
        return 'WPA2-Enterprise';
      case 'wpa-eap':
        return 'WPA-Enterprise';
      case 'wpa3-psk':
        return 'WPA3-PSK';
      case 'wpa3-eap':
        return 'WPA3-Enterprise';
      default: {
        // Exhaustive check - this should never be reached
        const _exhaustive: never = type;
        return String(_exhaustive);
      }
    }
  });

  return labels.join(', ');
}
