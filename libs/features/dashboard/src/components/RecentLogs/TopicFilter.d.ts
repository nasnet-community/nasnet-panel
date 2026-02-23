/**
 * TopicFilter component for multi-select log topic filtering
 * WCAG AAA compliant with proper ARIA roles and 44px touch targets
 * Story NAS-5.6: Recent Logs with Filtering
 */
import type { TopicFilterProps } from './types';
/**
 * Multi-select dropdown for filtering logs by topic
 * Displays selected count badge and supports keyboard navigation
 *
 * @description
 * Accessible multi-select filter component for log topics.
 * Features 44px minimum touch targets, full keyboard navigation (Tab, Space, Arrow keys),
 * and ARIA labels for screen reader support.
 * Shows badge with selected count for quick visual feedback.
 * Includes "Clear filters" button when filters are active.
 *
 * @example
 * ```tsx
 * const [topics, setTopics] = useState(['firewall', 'dhcp']);
 * <TopicFilter
 *   selectedTopics={topics}
 *   onSelectionChange={setTopics}
 *   className="w-full"
 * />
 * ```
 *
 * @param selectedTopics - Currently selected topics
 * @param onSelectionChange - Callback when topic selection changes
 * @param className - Optional CSS class for styling
 */
export declare const TopicFilter: import("react").NamedExoticComponent<TopicFilterProps>;
//# sourceMappingURL=TopicFilter.d.ts.map