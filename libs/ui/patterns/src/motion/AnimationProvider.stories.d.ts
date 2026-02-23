/**
 * AnimationProvider Storybook Stories
 *
 * Demonstrates the AnimationProvider context, MotionConfig override component,
 * and the useAnimation hook utilities used across the app's motion system.
 *
 * @module @nasnet/ui/patterns/motion
 */
import { AnimationProvider } from './AnimationProvider';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof AnimationProvider>;
export default meta;
type Story = StoryObj<typeof AnimationProvider>;
/**
 * Basic usage – wraps children and exposes animation context.
 * The context display shows live values resolved by the provider.
 */
export declare const Default: Story;
/**
 * MotionConfig with reduced motion forced on.
 * All animation durations resolve to 0ms and variants use instant fades.
 */
export declare const ReducedMotionForced: Story;
/**
 * MotionConfig with reduced motion forced off, even if the OS preference is on.
 * Useful for demo sections or marketing pages that must always animate.
 */
export declare const MotionConfigAnimationsEnabled: Story;
/**
 * Nested MotionConfig – inner config overrides the outer provider's settings.
 * The outer section has animations on; the inner section forces them off.
 */
export declare const NestedMotionConfig: Story;
/**
 * Missing provider – demonstrates graceful degradation with useAnimationOptional.
 * The AnimationContextDisplay renders an error state instead of throwing.
 */
export declare const NoProvider: Story;
/**
 * Multiple sibling providers – each has independent state.
 * Useful for Storybook decorators or isolated feature sections.
 */
export declare const MultipleProviders: Story;
//# sourceMappingURL=AnimationProvider.stories.d.ts.map