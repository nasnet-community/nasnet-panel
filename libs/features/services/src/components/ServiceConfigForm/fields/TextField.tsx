import { Input } from '@nasnet/ui/primitives';
import type { ComponentPropsWithoutRef } from 'react';

export interface TextFieldProps extends ComponentPropsWithoutRef<typeof Input> {
  sensitive?: boolean;
}

/**
 * Text input field for TEXT, EMAIL, URL, IP_ADDRESS, FILE_PATH types
 */
export function TextField({ sensitive, ...props }: TextFieldProps) {
  return (
    <Input
      {...props}
      autoComplete={sensitive ? 'off' : undefined}
      className={props.className}
    />
  );
}
