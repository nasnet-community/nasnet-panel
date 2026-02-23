/**
 * SecurityLevelBadge Stories
 *
 * Covers all four security levels defined by the SecurityLevel type:
 * strong, moderate, weak, and none. An additional story shows all four
 * badges rendered side-by-side to allow quick visual comparison.
 */
import { SecurityLevelBadge } from './SecurityLevelBadge';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof SecurityLevelBadge>;
export default meta;
type Story = StoryObj<typeof SecurityLevelBadge>;
export declare const Strong: Story;
export declare const Moderate: Story;
export declare const Weak: Story;
export declare const None: Story;
export declare const AllLevels: Story;
export declare const CustomSize: Story;
//# sourceMappingURL=SecurityLevelBadge.stories.d.ts.map