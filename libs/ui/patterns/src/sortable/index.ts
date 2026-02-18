/**
 * @nasnet/ui/patterns/sortable
 *
 * Drag & Drop Sortable List System for NasNetConnect.
 *
 * This module provides a comprehensive sortable list implementation with:
 * - Mouse, touch, and keyboard support
 * - Multi-select drag functionality
 * - Platform-specific presenters (Mobile/Desktop)
 * - WCAG AAA accessibility compliance
 * - Animation integration with Framer Motion
 * - Undo/redo support
 * - Context menu integration
 *
 * @see NAS-4.21: Implement Drag & Drop System
 *
 * @example
 * ```tsx
 * import { SortableList } from '@nasnet/ui/patterns/sortable';
 *
 * function MyList() {
 *   const [items, setItems] = useState([
 *     { id: '1', label: 'Item 1' },
 *     { id: '2', label: 'Item 2' },
 *   ]);
 *
 *   return (
 *     <SortableList
 *       items={items}
 *       onReorder={({ items }) => setItems(items)}
 *       renderItem={(item) => <div>{item.label}</div>}
 *     />
 *   );
 * }
 * ```
 */

// ============================================================================
// Types
// ============================================================================

export type {
  // Core types
  SortableItemData,
  SortableDirection,
  CollisionStrategy,

  // Validation types
  DropValidationResult,
  ValidateDropFn,

  // Event types
  ReorderEvent,
  MultiReorderEvent,

  // Hook types
  UseSortableListOptions,
  UseSortableListReturn,

  // Component props
  SortableListProps,
  SortableItemRenderOptions,
  SortableItemProps,
  DragHandleProps,
  DropZoneIndicatorProps,

  // Context types
  SortableContextValue,

  // Announcement types
  SortableAnnouncements,
} from './types';

// ============================================================================
// Components
// ============================================================================

export {
  // Main component
  SortableList,

  // Sub-components
  SortableItem,
  SortableItemWithActions,
  DragHandle,
  DropZoneIndicator,
  InsertionLine,

  // Platform presenters
  SortableListMobile,
  SortableListDesktop,
  SortableListDesktop as SortableListWithActions, // Alias for backward compatibility
} from './components';

export type {
  SortableItemWithActionsProps,
  InsertionLineProps,
  SortableListMobileProps,
  SortableListDesktopProps,
  ContextMenuActions,
} from './components';

// ============================================================================
// Hooks
// ============================================================================

export {
  useSortableList,
  useMultiSelect,
} from './hooks';

export type {
  UseMultiSelectOptions,
  UseMultiSelectReturn,
} from './hooks';

// ============================================================================
// Utilities
// ============================================================================

export {
  defaultAnnouncements,
  createAnnouncements,
  toDndKitAnnouncements,
  multiSelectAnnouncements,
  keyboardAnnouncements,
} from './utils';

export type {
  AnnouncementData,
  CreateAnnouncementsOptions,
} from './utils';

// ============================================================================
// Context
// ============================================================================

export {
  SortableContext,
  useSortableContext,
  useSortableContextOptional,
} from './context';

// ============================================================================
// Configuration
// ============================================================================

export {
  // Sensors
  useSortableSensors,
  defaultMouseSensorOptions,
  defaultTouchSensorOptions,
  defaultKeyboardSensorOptions,

  // Collision detection
  collisionStrategies,
  getCollisionDetection,
  getSortingStrategy,

  // Animation
  ANIMATION_DURATION,
  dragOverlayAnimation,
  layoutTransition,

  // Touch/Mobile
  MIN_TOUCH_TARGET,
  autoScrollConfig,

  // Accessibility
  keyboardBindings,
  SORTABLE_LIST_ROLE,
  SORTABLE_ITEM_ROLE,

  // Error messages
  errorMessages,
} from './config';

// ============================================================================
// Domain Components
// ============================================================================

export {
  FirewallRuleList,
} from './domain';

export type {
  FirewallRule,
  FirewallRuleListProps,
} from './domain';
