import { Input } from '@nasnet/ui/primitives';
import type { ComponentPropsWithoutRef } from 'react';

export interface NumberFieldProps
  extends Omit<ComponentPropsWithoutRef<typeof Input>, 'type'> {
  min?: number;
  max?: number;
}

/**
 * Number input field for NUMBER and PORT types
 */
export function NumberField({ min, max, ...props }: NumberFieldProps) {
  return <Input {...props} type="number" min={min} max={max} step="1" />;
}
