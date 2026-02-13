/**
 * ExportMenu Component
 * Dropdown menu for exporting interface statistics data
 *
 * NAS-6.9: Implement Interface Traffic Statistics (Task 7 - AC5)
 */

import { Download } from 'lucide-react';
import { Button } from '@nasnet/ui/primitives';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@nasnet/ui/primitives';

export interface ExportMenuProps {
  /** Handler for CSV export */
  onExportCsv: () => void;
  /** Handler for JSON export */
  onExportJson: () => void;
  /** Handler for PNG export */
  onExportPng: () => void;
  /** Disable menu when no data available */
  disabled?: boolean;
}

/**
 * ExportMenu Component
 *
 * Provides a dropdown menu with three export options:
 * - Export as CSV (spreadsheet format)
 * - Export as JSON (structured data)
 * - Export Chart as PNG (screenshot)
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
 *   disabled={!data || loading}
 * />
 * ```
 */
export function ExportMenu({
  onExportCsv,
  onExportJson,
  onExportPng,
  disabled = false,
}: ExportMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          aria-label="Export statistics data"
        >
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onExportCsv}>
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onExportJson}>
          Export as JSON
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onExportPng}>
          Export Chart as PNG
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
