/**
 * useStepper Hook Storybook Stories
 *
 * Documentation and examples for the headless stepper hook that
 * manages step navigation, validation, and state for wizard flows.
 *
 * @module @nasnet/ui/patterns/stepper/hooks/use-stepper
 * @see NAS-4A.14: Build Headless Stepper Hook
 * @see ADR-018: Headless + Platform Presenters
 */
import type { Meta, StoryObj } from '@storybook/react';
/**
 * useStepper is a headless hook that manages all step navigation, validation, and state
 * for multi-step wizard flows. It follows the Headless + Platform Presenter pattern (ADR-018).
 *
 * ## Key Features
 *
 * - ✅ Step navigation (next, prev, goTo)
 * - ✅ Async validation with Zod schema support
 * - ✅ Step data persistence
 * - ✅ Progress tracking
 * - ✅ Error state management
 * - ✅ Skip step support
 * - ✅ Free navigation mode
 * - ✅ Complete callback with all step data
 *
 * ## Migration from Qwik
 *
 * | Qwik Pattern | React Pattern |
 * |--------------|---------------|
 * | `useStore({ currentStep: 0 })` | `useStepper({ steps: [...] })` |
 * | `store.currentStep++` | `stepper.next()` |
 * | `useComputed$(() => ...)` | Derived values in hook return |
 * | `useTask$()` | Async validation in step config |
 *
 * ## Accessibility
 *
 * The hook provides all necessary state for accessible stepper UIs:
 * - `currentIndex` for `aria-current="step"`
 * - `isCompleted()` for completion announcements
 * - `errors` for `aria-invalid` and error messages
 * - `progress` for `role="progressbar"`
 *
 * @see VStepper - Vertical stepper presenter
 * @see HStepper - Horizontal stepper presenter
 * @see CStepper - Content stepper with preview
 * @see MiniStepper - Mobile stepper presenter
 */
declare const meta: Meta;
export default meta;
type Story = StoryObj;
/**
 * Basic 3-step wizard demonstrating core navigation functionality.
 */
export declare const BasicUsage: Story;
/**
 * Wizard with async validation on each step. Shows error handling.
 */
export declare const WithValidation: Story;
/**
 * Wizard allowing optional step skipping.
 */
export declare const WithSkipSteps: Story;
/**
 * Wizard with free navigation - can jump to any step.
 */
export declare const FreeNavigation: Story;
/**
 * Demonstrates progress tracking features.
 */
export declare const ProgressTracking: Story;
/**
 * Demonstrates the reset functionality.
 */
export declare const ResetFunctionality: Story;
/**
 * Visual API reference showing all return values from the hook.
 */
export declare const APIReference: Story;
/**
 * Interactive test story with play function for automated testing.
 */
export declare const InteractiveTest: Story;
/**
 * Dark theme demo.
 */
export declare const DarkTheme: Story;
//# sourceMappingURL=use-stepper.stories.d.ts.map