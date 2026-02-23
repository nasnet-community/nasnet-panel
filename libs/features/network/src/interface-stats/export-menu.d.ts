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
export declare const ExportMenu: import("react").NamedExoticComponent<ExportMenuProps>;
//# sourceMappingURL=export-menu.d.ts.map