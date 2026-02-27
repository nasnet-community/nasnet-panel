/**
 * ExportMenu Component
 * Dropdown menu for exporting interface statistics data
 *
 * @description
 * Provides export options for interface statistics data in multiple formats.
 * Renders as a dropdown with three options: CSV (spreadsheet), JSON (structured),
 * and PNG (chart screenshot).
 *
 * NAS-6.9: Implement Interface Traffic Statistics (Task 7 - AC5)
 */

import { memo, useCallback } from 'react';

import { Download } from 'lucide-react';

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@nasnet/ui/primitives';
import { cn } from '@nasnet/ui/utils';

export interface ExportMenuProps {
  /** Handler for CSV export */
  onExportCsv: () => void;
  /** Handler for JSON export */
  onExportJson: () => void;
  /** Handler for PNG export */
  onExportPng: () => void;
  /** Disable menu when no data available */
  isDisabled?: boolean;
  /** Optional className for styling */
  className?: string;
}

/**
 * ExportMenu Component
 *
 * Provides a dropdown menu with three export options for statistics data:
 * - CSV (spreadsheet format for analysis)
 * - JSON (structured data for integration)
 * - PNG (chart screenshot for sharing)
 *
 * @example
 * ```tsx
 * const { exportCsv, exportJson, exportPng } = useStatsExport({
 *   interfaceId: 'ether1',
 *   interfaceName: 'ether1 - WAN',
 * });
 *
 * const chartRef = useRef<HTMLDivElement>(null);
 *
 * <ExportMenu
 *   onExportCsv={() => exportCsv(data.dataPoints, timeRange)}
 *   onExportJson={() => exportJson(data.dataPoints, timeRange)}
 *   onExportPng={() => exportPng(chartRef)}
 *   isDisabled={!data || loading}
 * />
 * ```
 */
export const ExportMenu = memo(function ExportMenu({
  onExportCsv,
  onExportJson,
  onExportPng,
  isDisabled = false,
  className,
}: ExportMenuProps) {
  // Memoized callbacks to maintain stable references
  const handleExportCsv = useCallback(onExportCsv, [onExportCsv]);
  const handleExportJson = useCallback(onExportJson, [onExportJson]);
  const handleExportPng = useCallback(onExportPng, [onExportPng]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={isDisabled}
          aria-label="Export statistics data in CSV, JSON, or PNG format"
          className={cn('category-networking', className)}
        >
          <Download
            className="mr-component-sm h-4 w-4"
            aria-hidden="true"
          />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="bg-card border-border"
      >
        <DropdownMenuItem onClick={handleExportCsv}>Export as CSV</DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportJson}>Export as JSON</DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportPng}>Export Chart as PNG</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

ExportMenu.displayName = 'ExportMenu';
