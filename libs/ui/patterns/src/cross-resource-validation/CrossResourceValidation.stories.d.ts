/**
 * Cross-Resource Validation Stories
 *
 * Storybook stories for ConflictCard and ConflictList components.
 */
import { ConflictCard } from './ConflictCard';
import { ConflictList } from './ConflictList';
import type { Meta, StoryObj } from '@storybook/react';
declare const cardMeta: Meta<typeof ConflictCard>;
export default cardMeta;
type CardStory = StoryObj<typeof ConflictCard>;
/**
 * IP collision conflict - collapsed
 */
export declare const IPCollisionCollapsed: CardStory;
/**
 * IP collision conflict - expanded with details
 */
export declare const IPCollisionExpanded: CardStory;
/**
 * Port conflict - warning severity
 */
export declare const PortConflict: CardStory;
/**
 * Duplicate MAC - with destructive resolution
 */
export declare const DuplicateMAC: CardStory;
/**
 * List with multiple conflicts
 */
export declare const MultipleConflicts: StoryObj<typeof ConflictList>;
/**
 * Empty state - no conflicts
 */
export declare const NoConflicts: StoryObj<typeof ConflictList>;
/**
 * Only errors (filtered)
 */
export declare const OnlyErrors: StoryObj<typeof ConflictList>;
/**
 * Custom title
 */
export declare const CustomTitle: StoryObj<typeof ConflictList>;
/**
 * Without summary header
 */
export declare const WithoutSummary: StoryObj<typeof ConflictList>;
/**
 * Interactive - with resolution handler
 */
export declare const Interactive: StoryObj<typeof ConflictList>;
//# sourceMappingURL=CrossResourceValidation.stories.d.ts.map