/**
 * Sortable System Configuration
 *
 * Base configuration for dnd-kit sensors and collision detection.
 *
 * @see NAS-4.21: Implement Drag & Drop System
 */

import {
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
  closestCorners,
  rectIntersection,
  pointerWithin,
  type MouseSensorOptions,
  type TouchSensorOptions,
  type KeyboardSensorOptions,
  type CollisionDetection,
} from '@dnd-kit/core';
import {
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
  type SortingStrategy,
} from '@dnd-kit/sortable';

import type { CollisionStrategy, SortableDirection } from './types';

// ============================================================================
// Sensor Configuration
// ============================================================================

/**
 * Default mouse sensor options
 */
export const defaultMouseSensorOptions: MouseSensorOptions = {
  // Start drag after 5px of movement to prevent accidental drags
  activationConstraint: {
    distance: 5,
  },
};

/**
 * Default touch sensor options
 * Uses long-press to differentiate from scroll
 */
export const defaultTouchSensorOptions: TouchSensorOptions = {
  activationConstraint: {
    // 250ms long-press before drag starts
    delay: 250,
    // Allow 5px movement during delay (prevents accidental activation while scrolling)
    tolerance: 5,
  },
};

/**
 * Default keyboard sensor options
 */
export const defaultKeyboardSensorOptions: KeyboardSensorOptions = {
  coordinateGetter: sortableKeyboardCoordinates,
};

/**
 * Custom hook to create configured sensors
 */
export function useSortableSensors(options?: {
  mouse?: Partial<MouseSensorOptions>;
  touch?: Partial<TouchSensorOptions>;
  keyboard?: Partial<KeyboardSensorOptions>;
  touchEnabled?: boolean;
  keyboardEnabled?: boolean;
}) {
  const {
    mouse = {},
    touch = {},
    keyboard = {},
    touchEnabled = true,
    keyboardEnabled = true,
  } = options ?? {};

  const mouseSensor = useSensor(MouseSensor, {
    ...defaultMouseSensorOptions,
    ...mouse,
  });

  const touchSensor = useSensor(TouchSensor, {
    ...defaultTouchSensorOptions,
    ...touch,
  });

  const keyboardSensor = useSensor(KeyboardSensor, {
    ...defaultKeyboardSensorOptions,
    ...keyboard,
  });

  const sensors = [mouseSensor];

  if (touchEnabled) {
    sensors.push(touchSensor);
  }

  if (keyboardEnabled) {
    sensors.push(keyboardSensor);
  }

  return useSensors(...sensors);
}

// ============================================================================
// Collision Detection
// ============================================================================

/**
 * Map of collision strategy names to detection functions
 */
export const collisionStrategies: Record<CollisionStrategy, CollisionDetection> = {
  closestCenter,
  closestCorners,
  rectIntersection,
  pointerWithin,
};

/**
 * Get collision detection function by strategy name
 */
export function getCollisionDetection(strategy: CollisionStrategy): CollisionDetection {
  return collisionStrategies[strategy] ?? closestCenter;
}

// ============================================================================
// Sorting Strategy
// ============================================================================

/**
 * Get sorting strategy based on direction
 */
export function getSortingStrategy(direction: SortableDirection): SortingStrategy {
  return direction === 'horizontal' ? horizontalListSortingStrategy : verticalListSortingStrategy;
}

// ============================================================================
// Animation Configuration
// ============================================================================

/**
 * Default animation duration in ms
 */
export const ANIMATION_DURATION = 200;

/**
 * Default drag overlay animation
 */
export const dragOverlayAnimation = {
  initial: { scale: 1, boxShadow: 'none', opacity: 1 },
  dragging: {
    scale: 1.02,
    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
    opacity: 1,
    zIndex: 1000,
  },
};

/**
 * CSS transition for smooth layout animations
 */
export const layoutTransition = {
  type: 'spring',
  stiffness: 400,
  damping: 30,
} as const;

// ============================================================================
// Touch/Mobile Configuration
// ============================================================================

/**
 * Minimum touch target size (WCAG AAA)
 */
export const MIN_TOUCH_TARGET = 44;

/**
 * Auto-scroll configuration for long lists
 */
export const autoScrollConfig = {
  // Pixels from edge to start scrolling
  threshold: 50,
  // Scroll speed in pixels per frame
  speed: 10,
  // Acceleration factor based on distance from edge
  acceleration: 1.5,
};

// ============================================================================
// Accessibility Configuration
// ============================================================================

/**
 * Default keyboard bindings
 */
export const keyboardBindings = {
  startDrag: ['Space', 'Enter'],
  confirmDrop: ['Space', 'Enter'],
  cancelDrag: ['Escape'],
  moveUp: ['ArrowUp'],
  moveDown: ['ArrowDown'],
  moveLeft: ['ArrowLeft'],
  moveRight: ['ArrowRight'],
  moveToTop: ['Home'],
  moveToBottom: ['End'],
  selectAll: ['KeyA'], // With modifier
  extendSelection: ['Shift'], // With arrow keys
} as const;

/**
 * ARIA role for sortable list
 */
export const SORTABLE_LIST_ROLE = 'listbox';

/**
 * ARIA role for sortable item
 */
export const SORTABLE_ITEM_ROLE = 'option';

// ============================================================================
// Error Messages
// ============================================================================

/**
 * Default error messages for invalid drops
 */
export const errorMessages = {
  invalidPosition: 'Cannot move item to this position',
  samePosition: 'Item is already at this position',
  disabled: 'This item cannot be moved',
  emptyList: 'No items to reorder',
  multiSelectNotSupported: 'Multi-select is not enabled for this list',
} as const;
