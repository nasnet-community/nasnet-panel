/**
 * ChangelogModal Component (NAS-8.7)
 *
 * Displays GitHub release notes with version information and warnings.
 *
 * @description Displays a modal with release notes for service updates, including severity,
 * version diff, security warnings, and a link to the full changelog on GitHub.
 *
 * @example
 * ```tsx
 * <ChangelogModal
 *   open={modalOpen}
 *   onClose={() => setModalOpen(false)}
 *   instanceName="Tor Proxy"
 *   currentVersion="1.0.0"
 *   newVersion="1.1.0"
 *   severity="SECURITY"
 *   changelogUrl="https://github.com/torproject/tor/releases/tag/v1.1.0"
 *   securityFixes={true}
 * />
 * ```
 */
import React from 'react';
import type { UpdateSeverity } from '@nasnet/api-client/queries';
export interface ChangelogModalProps {
    /** Whether the modal is open */
    open: boolean;
    /** Callback to close the modal */
    onClose: () => void;
    /** Service instance name */
    instanceName: string;
    /** Current version */
    currentVersion: string;
    /** New version */
    newVersion: string;
    /** Update severity */
    severity: UpdateSeverity;
    /** Changelog URL (GitHub releases) */
    changelogUrl: string;
    /** Release date (ISO string) */
    releaseDate?: string;
    /** Whether update includes security fixes */
    securityFixes?: boolean;
    /** Whether update has breaking changes */
    breakingChanges?: boolean;
    /** Optional CSS class name */
    className?: string;
}
declare function ChangelogModalComponent(props: ChangelogModalProps): import("react/jsx-runtime").JSX.Element;
/**
 * ChangelogModal - Displays release notes for service updates
 */
export declare const ChangelogModal: React.MemoExoticComponent<typeof ChangelogModalComponent>;
export {};
//# sourceMappingURL=ChangelogModal.d.ts.map