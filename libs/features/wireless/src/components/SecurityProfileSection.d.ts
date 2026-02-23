/**
 * SecurityProfileSection Component
 * @description Displays comprehensive security profile information including authentication
 * type, encryption method, and password field with visual indicators.
 * Implements FR0-16: View security profile settings
 */
import * as React from 'react';
import { type SecurityProfile } from '@nasnet/core/types';
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
export declare const SecurityProfileSection: React.NamedExoticComponent<SecurityProfileSectionProps>;
//# sourceMappingURL=SecurityProfileSection.d.ts.map