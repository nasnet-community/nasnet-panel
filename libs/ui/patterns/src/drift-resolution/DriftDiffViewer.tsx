import * as React from 'react';

import type { DriftedField, DriftResult } from '@nasnet/state/stores';
import { cn , Card, CardContent, CardHeader, CardTitle , ScrollArea , Badge } from '@nasnet/ui/primitives';

/**
 * Drift Diff Viewer Component
 *
 * Displays a side-by-side comparison of configuration (desired state)
 * vs deployment (actual state) for drift resolution.
 *
 * Features:
 * - Side-by-side diff view
 * - Field-level highlighting of changes
 * - Syntax highlighting for network values (IPs, MACs)
 * - JSON diff support for complex objects
 * - Categorized field grouping
 *
 * @see NAS-4.13: Implement Drift Detection Foundation
 */

// =============================================================================
// Types
// =============================================================================

export interface DriftDiffViewerProps {
  /**
   * Drift detection result containing drifted fields
   */
  result: DriftResult;
  /**
   * Additional className for the root element
   */
  className?: string;
  /**
   * Whether to show the field category badges
   * @default true
   */
  showCategories?: boolean;
  /**
   * Maximum height for the viewer (scrollable)
   */
  maxHeight?: number | string;
  /**
   * Callback when a field is selected (for partial resolution)
   */
  onFieldSelect?: (field: DriftedField) => void;
  /**
   * Currently selected fields (for partial resolution)
   */
  selectedFields?: string[];
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Check if value is a network-specific type for syntax highlighting
 */
function getValueType(
  value: unknown
): 'ip' | 'mac' | 'port' | 'cidr' | 'string' | 'number' | 'boolean' | 'object' | 'null' {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'object') return 'object';

  const strValue = String(value);

  // IPv4 address
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(strValue)) return 'ip';

  // IPv6 address (simplified check)
  if (/^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/.test(strValue)) return 'ip';

  // CIDR notation
  if (/^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/.test(strValue)) return 'cidr';

  // MAC address
  if (/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/.test(strValue)) return 'mac';

  // Port number
  if (/^\d{1,5}$/.test(strValue)) {
    const num = parseInt(strValue, 10);
    if (num > 0 && num <= 65535) return 'port';
  }

  return 'string';
}

/**
 * Format value for display with syntax highlighting class
 */
function formatValue(value: unknown): { text: string; className: string } {
  const valueType = getValueType(value);

  const classNames: Record<string, string> = {
    ip: 'text-info font-mono',
    mac: 'text-purple-600 dark:text-purple-400 font-mono',
    port: 'text-orange-600 dark:text-orange-400 font-mono',
    cidr: 'text-info font-mono',
    string: 'text-success-dark dark:text-success-light',
    number: 'text-primary font-mono',
    boolean: 'text-warning-dark dark:text-warning-light font-medium',
    object: 'text-muted-foreground font-mono text-xs',
    null: 'text-muted-foreground italic',
  };

  if (value === null || value === undefined) {
    return { text: 'null', className: classNames.null };
  }

  if (typeof value === 'object') {
    return {
      text: JSON.stringify(value, null, 2),
      className: classNames.object,
    };
  }

  return {
    text: String(value),
    className: classNames[valueType] || classNames.string,
  };
}

/**
 * Get category color for badge
 */
function getCategoryColor(
  category: DriftedField['category']
): 'default' | 'secondary' | 'outline' {
  switch (category) {
    case 'network':
      return 'default';
    case 'security':
      return 'secondary';
    default:
      return 'outline';
  }
}

/**
 * Group fields by category
 */
function groupFieldsByCategory(
  fields: DriftedField[]
): Map<string, DriftedField[]> {
  const groups = new Map<string, DriftedField[]>();

  for (const field of fields) {
    const category = field.category || 'general';
    const existing = groups.get(category) || [];
    existing.push(field);
    groups.set(category, existing);
  }

  // Sort categories: network first, then security, then general
  const sortOrder = ['network', 'security', 'general'];
  const sorted = new Map<string, DriftedField[]>();

  for (const cat of sortOrder) {
    const fields = groups.get(cat);
    if (fields) {
      sorted.set(cat, fields);
    }
  }

  return sorted;
}

// =============================================================================
// Sub-Components
// =============================================================================

interface DiffRowProps {
  field: DriftedField;
  showCategory: boolean;
  isSelected?: boolean;
  onSelect?: (field: DriftedField) => void;
}

function DiffRow({ field, showCategory, isSelected, onSelect }: DiffRowProps) {
  const configFormatted = formatValue(field.configValue);
  const deployFormatted = formatValue(field.deployValue);

  return (
    <tr
      className={cn(
        'border-b border-border hover:bg-muted/50 transition-colors',
        isSelected && 'bg-primary/5',
        onSelect && 'cursor-pointer'
      )}
      onClick={() => onSelect?.(field)}
    >
      {/* Field Name */}
      <td className="py-2 px-3 font-mono text-sm">
        <div className="flex items-center gap-2">
          {onSelect && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onSelect(field)}
              className="h-4 w-4 rounded border-border"
              onClick={(e) => e.stopPropagation()}
            />
          )}
          <span className="text-foreground">{field.path}</span>
          {showCategory && field.category && (
            <Badge
              variant={getCategoryColor(field.category)}
              className="text-[10px] px-1.5 py-0"
            >
              {field.category}
            </Badge>
          )}
        </div>
      </td>

      {/* Configuration Value (Desired) */}
      <td className="py-2 px-3">
        <div className="flex items-center">
          <span
            className={cn(
              'text-sm break-all',
              configFormatted.className,
              typeof field.configValue === 'object' && 'whitespace-pre'
            )}
          >
            {configFormatted.text}
          </span>
        </div>
      </td>

      {/* Arrow */}
      <td className="py-2 px-1 text-center">
        <svg
          className="h-4 w-4 text-muted-foreground inline-block"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M3 8h10M10 5l3 3-3 3"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </td>

      {/* Deployment Value (Actual) */}
      <td className="py-2 px-3">
        <div className="flex items-center">
          <span
            className={cn(
              'text-sm break-all',
              deployFormatted.className,
              typeof field.deployValue === 'object' && 'whitespace-pre'
            )}
          >
            {deployFormatted.text}
          </span>
        </div>
      </td>
    </tr>
  );
}

// =============================================================================
// Main Component
// =============================================================================

/**
 * DriftDiffViewer displays a side-by-side comparison of drifted fields.
 *
 * @example
 * ```tsx
 * <DriftDiffViewer
 *   result={driftResult}
 *   maxHeight={400}
 *   showCategories
 * />
 * ```
 *
 * @example With field selection for partial resolution
 * ```tsx
 * const [selectedFields, setSelectedFields] = useState<string[]>([]);
 *
 * <DriftDiffViewer
 *   result={driftResult}
 *   selectedFields={selectedFields}
 *   onFieldSelect={(field) => {
 *     setSelectedFields(prev =>
 *       prev.includes(field.path)
 *         ? prev.filter(p => p !== field.path)
 *         : [...prev, field.path]
 *     );
 *   }}
 * />
 * ```
 */
export function DriftDiffViewer({
  result,
  className,
  showCategories = true,
  maxHeight = 400,
  onFieldSelect,
  selectedFields = [],
}: DriftDiffViewerProps) {
  const { driftedFields, lastChecked } = result;

  // Group fields by category if showing categories
  const groupedFields = React.useMemo(() => {
    if (showCategories) {
      return groupFieldsByCategory(driftedFields);
    }
    return new Map([['all', driftedFields]]);
  }, [driftedFields, showCategories]);

  // No drift
  if (driftedFields.length === 0) {
    return (
      <Card className={cn('border-success/20', className)}>
        <CardContent className="py-8 text-center">
          <svg
            className="h-12 w-12 mx-auto text-success mb-3"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <p className="text-muted-foreground">Configuration is in sync with router</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="py-3 px-4 border-b border-border bg-muted/30">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <svg
              className="h-4 w-4 text-warning"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 9v4m0 4h.01M3.516 15.1l6.03-11.003c.874-1.593 3.034-1.593 3.908 0l6.03 11.004c.87 1.586-.23 3.559-1.954 3.559H5.47c-1.724 0-2.824-1.973-1.954-3.56z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>
              {driftedFields.length} Field{driftedFields.length === 1 ? '' : 's'} Changed
            </span>
          </CardTitle>
          <span className="text-xs text-muted-foreground">
            Last checked: {formatTimestamp(lastChecked)}
          </span>
        </div>
      </CardHeader>

      <ScrollArea style={{ maxHeight }} className="overflow-auto">
        <CardContent className="p-0">
          <table className="w-full">
            <thead className="bg-muted/50 sticky top-0">
              <tr className="border-b border-border">
                <th className="py-2 px-3 text-left text-xs font-medium text-muted-foreground">
                  Field
                </th>
                <th className="py-2 px-3 text-left text-xs font-medium text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-info" />
                    Desired (Config)
                  </span>
                </th>
                <th className="py-2 px-1 text-center text-xs font-medium text-muted-foreground">
                  &nbsp;
                </th>
                <th className="py-2 px-3 text-left text-xs font-medium text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-warning" />
                    Actual (Router)
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {Array.from(groupedFields.entries()).map(([category, fields]) => (
                <React.Fragment key={category}>
                  {showCategories && category !== 'all' && (
                    <tr className="bg-muted/20">
                      <td
                        colSpan={4}
                        className="py-1.5 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider"
                      >
                        {category}
                      </td>
                    </tr>
                  )}
                  {fields.map((field) => (
                    <DiffRow
                      key={field.path}
                      field={field}
                      showCategory={!showCategories}
                      isSelected={selectedFields.includes(field.path)}
                      onSelect={onFieldSelect}
                    />
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </CardContent>
      </ScrollArea>
    </Card>
  );
}

/**
 * Format timestamp for display
 */
function formatTimestamp(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);

  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;

  return date.toLocaleDateString();
}

export type { DriftedField };
