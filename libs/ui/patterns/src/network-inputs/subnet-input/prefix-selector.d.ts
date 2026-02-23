/**
 * PrefixSelector Component
 * Dropdown for selecting common CIDR prefix lengths
 *
 * Supports both dropdown selection AND direct numeric input.
 *
 * @example
 * ```tsx
 * <PrefixSelector
 *   value={24}
 *   onChange={(prefix) => console.log(prefix)}
 *   options={COMMON_PREFIX_OPTIONS}
 * />
 * ```
 */
import type { PrefixSelectorProps } from './subnet-input.types';
/**
 * PrefixSelector Component
 *
 * Provides a dropdown to select common CIDR prefixes,
 * showing the mask equivalent and host count for each option.
 */
export declare function PrefixSelector({ value, onChange, options, disabled, ariaLabel, className, }: PrefixSelectorProps): import("react/jsx-runtime").JSX.Element;
export declare namespace PrefixSelector {
    var displayName: string;
}
//# sourceMappingURL=prefix-selector.d.ts.map