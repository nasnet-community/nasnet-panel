/**
 * InterfaceDetailSheet Component
 *
 * Displays expanded interface details in a sheet (mobile/tablet) or dialog (desktop).
 *
 * Shows:
 * - MAC address, IP address
 * - MTU, Link Speed
 * - Running status
 * - Comment/description
 * - Link partner info
 * - Last seen timestamp (for down interfaces)
 * - Navigation to Network section
 */
import React from 'react';
import type { InterfaceDetailSheetProps } from './types';
/**
 * Detail sheet/dialog for interface information.
 * Shows MAC, MTU, running status, comment, link partner.
 * Uses Dialog on desktop, Sheet on mobile/tablet.
 *
 * @description
 * Adaptive component that renders as a dialog on desktop screens and
 * a bottom sheet on mobile/tablet for better touch interaction.
 * Displays complete interface details including MAC address (font-mono),
 * IP address (font-mono), MTU, link speed, and operational status.
 *
 * @example
 * <InterfaceDetailSheet
 *   interface={selectedInterface}
 *   open={!!selectedInterface}
 *   onOpenChange={(open) => !open && setSelectedInterface(null)}
 * />
 */
declare const InterfaceDetailSheetComponent: React.NamedExoticComponent<InterfaceDetailSheetProps>;
export { InterfaceDetailSheetComponent as InterfaceDetailSheet };
//# sourceMappingURL=InterfaceDetailSheet.d.ts.map