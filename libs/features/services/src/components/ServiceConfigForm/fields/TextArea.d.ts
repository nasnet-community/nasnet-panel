import React from 'react';
import { Textarea } from '@nasnet/ui/primitives';
import type { ComponentPropsWithoutRef } from 'react';
/**
 * Props for TextArea component
 *
 * Extends standard HTML textarea attributes with field-specific configuration.
 */
export type TextAreaProps = ComponentPropsWithoutRef<typeof Textarea>;
/**
 * TextArea component for multi-line text input
 *
 * Renders a textarea element with configurable rows and automatic height adjustment.
 * Suitable for long-form text input, configuration data, or code snippets.
 *
 * @example
 * ```tsx
 * <TextArea
 *   placeholder="Enter configuration..."
 *   rows={6}
 *   onChange={handleChange}
 *   aria-describedby="config-help"
 * />
 * ```
 *
 * @see DynamicField for integration with form schema validation
 */
export declare const TextArea: React.ForwardRefExoticComponent<Omit<import("@nasnet/ui/primitives").TextareaProps & React.RefAttributes<HTMLTextAreaElement>, "ref"> & React.RefAttributes<HTMLTextAreaElement>>;
//# sourceMappingURL=TextArea.d.ts.map