/**
 * Alert component exports
 *
 * Provides composable alert components with multiple variants for status messages,
 * warnings, errors, and notifications. Fully accessible with WCAG AAA compliance.
 *
 * @example
 * ```tsx
 * import { Alert, AlertTitle, AlertDescription } from '@nasnet/ui/primitives';
 *
 * export function MyAlert() {
 *   return (
 *     <Alert variant="success">
 *       <CheckCircle className="h-4 w-4" />
 *       <AlertTitle>Success</AlertTitle>
 *       <AlertDescription>Operation completed successfully.</AlertDescription>
 *     </Alert>
 *   );
 * }
 * ```
 */

export { Alert, AlertTitle, AlertDescription, alertVariants } from './alert';
export type { AlertProps, AlertTitleProps, AlertDescriptionProps } from './alert';




























