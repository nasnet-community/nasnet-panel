import { Textarea } from '@nasnet/ui/primitives';
import type { ComponentPropsWithoutRef } from 'react';

export type TextAreaProps = ComponentPropsWithoutRef<typeof Textarea>;

/**
 * Multi-line text area for TEXT_AREA type
 */
export function TextArea(props: TextAreaProps) {
  return <Textarea {...props} rows={4} />;
}
