/**
 * CStepperPreview - Preview Panel Component
 *
 * Collapsible right panel for displaying live preview content:
 * - RouterOS script with syntax highlighting
 * - Network topology diagrams
 * - Configuration diffs
 *
 * @see NAS-4A.17: Build Content Stepper (Desktop with Preview)
 * @see AC2: Live Preview Updates
 * @see AC3: Preview Panel Collapsibility
 * @see AC7: Preview Content Types
 */
import * as React from 'react';
import type { CStepperPreviewProps } from './c-stepper.types';
/**
 * Preview panel component for the Content Stepper
 *
 * @param props - CStepperPreview props
 * @returns Preview panel element
 *
 * @example
 * ```tsx
 * <CStepperPreview
 *   title="Configuration Preview"
 *   onClose={() => setShowPreview(false)}
 * >
 *   <ConfigPreview script={routerOSScript} />
 *   <NetworkTopologySVG config={networkConfig} />
 * </CStepperPreview>
 * ```
 */
export declare const CStepperPreview: React.ForwardRefExoticComponent<CStepperPreviewProps & React.RefAttributes<HTMLDivElement>>;
//# sourceMappingURL=c-stepper-preview.d.ts.map