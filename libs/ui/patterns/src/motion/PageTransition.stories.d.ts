/**
 * PageTransition Storybook Stories
 *
 * Demonstrates PageTransition and PageTransitionWrapper – the Framer Motion
 * components that animate route changes in NasNetConnect.
 *
 * @module @nasnet/ui/patterns/motion
 */
import { PageTransitionWrapper } from './PageTransition';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof PageTransitionWrapper>;
export default meta;
type Story = StoryObj<typeof PageTransitionWrapper>;
/**
 * Default fade transition – the most common variant used throughout the app.
 */
export declare const FadeVariant: Story;
/**
 * SlideUp variant – content enters from slightly below with an opacity fade.
 * Used for secondary pages and sub-routes.
 */
export declare const SlideUpVariant: Story;
/**
 * None variant – instant transition with no animation.
 * Equivalent to what is rendered when reduced motion is preferred.
 */
export declare const NoAnimation: Story;
/**
 * Interactive page switcher – click buttons to swap the pageKey and watch
 * the transition re-trigger with the chosen variant.
 */
export declare const InteractivePageSwitch: Story;
/**
 * Custom Framer Motion variants passed directly to PageTransitionWrapper.
 * Shows how to bypass the built-in variant map for bespoke animations.
 */
export declare const CustomVariants: Story;
/**
 * Multiple simultaneous wrappers showing independent keying.
 * Each wrapper animates independently when its pageKey prop changes.
 */
export declare const MultipleWrappers: Story;
//# sourceMappingURL=PageTransition.stories.d.ts.map