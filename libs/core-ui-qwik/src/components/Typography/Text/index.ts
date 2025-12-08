/**
 * The Text component provides consistent typography styling for text elements
 * with various variants, weights, sizes, and colors
 *
 * @example
 * ```tsx
 * import { Text } from "@nas-net/core-ui-qwik";
 *
 * <Text>Default body text</Text>
 * <Text variant="caption" color="secondary">Secondary caption text</Text>
 * ```
 */
export { Text } from "./Text";
export type {
  TextProps,
  TextSize,
  TextColor,
  TextAlign,
  TextStyle,
  FontWeight,
  TextTransform,
  TextDecoration,
  ResponsiveTextSize,
} from "./Text.types";
