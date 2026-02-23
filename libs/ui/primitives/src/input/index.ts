/**
 * Input component barrel export
 *
 * Provides access to:
 * - `Input` component: Flexible text input with multiple types and sizes
 * - `InputProps` interface: Complete prop definition including size and variant options
 *
 * Part of the Primitives Layer 1 component architecture.
 * For responsive input handling across mobile/tablet/desktop, use in combination
 * with pattern components in `@nasnet/ui/patterns`.
 *
 * @example
 * ```tsx
 * import { Input } from '@nasnet/ui/primitives';
 *
 * export function MyForm() {
 *   const [email, setEmail] = React.useState('');
 *
 *   return (
 *     <Input
 *       type="email"
 *       value={email}
 *       onChange={(e) => setEmail(e.target.value)}
 *       placeholder="user@example.com"
 *       inputSize="default"
 *     />
 *   );
 * }
 * ```
 *
 * @see {@link https://nasnet.internal/component-library} for pattern inputs with responsive presenters
 */
export { Input } from './input';
export type { InputProps } from './input';
