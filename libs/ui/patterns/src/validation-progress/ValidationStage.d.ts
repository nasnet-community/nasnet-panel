/**
 * ValidationStage Component
 *
 * Displays a single validation stage with status, errors, and collapse/expand.
 *
 * @module @nasnet/ui/patterns/validation-progress
 */
import * as React from 'react';
import type { ValidationStageResult } from './types';
export interface ValidationStageProps {
    /** Stage result data */
    result: ValidationStageResult;
    /** Whether this stage is currently expanded */
    isExpanded?: boolean;
    /** Callback when expand/collapse is toggled */
    onToggle?: () => void;
    /** Whether to show the connector line to next stage */
    showConnector?: boolean;
    /** Stage index for animation stagger */
    index?: number;
}
/**
 * Single validation stage display component.
 */
export declare const ValidationStage: React.NamedExoticComponent<ValidationStageProps>;
//# sourceMappingURL=ValidationStage.d.ts.map