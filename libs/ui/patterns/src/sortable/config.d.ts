/**
 * Sortable System Configuration
 *
 * Base configuration for dnd-kit sensors and collision detection.
 *
 * @see NAS-4.21: Implement Drag & Drop System
 */
import { type MouseSensorOptions, type TouchSensorOptions, type KeyboardSensorOptions, type CollisionDetection } from '@dnd-kit/core';
import { type SortingStrategy } from '@dnd-kit/sortable';
import type { CollisionStrategy, SortableDirection } from './types';
/**
 * Default mouse sensor options
 */
export declare const defaultMouseSensorOptions: MouseSensorOptions;
/**
 * Default touch sensor options
 * Uses long-press to differentiate from scroll
 */
export declare const defaultTouchSensorOptions: TouchSensorOptions;
/**
 * Default keyboard sensor options
 */
export declare const defaultKeyboardSensorOptions: KeyboardSensorOptions;
/**
 * Custom hook to create configured sensors
 */
export declare function useSortableSensors(options?: {
    mouse?: Partial<MouseSensorOptions>;
    touch?: Partial<TouchSensorOptions>;
    keyboard?: Partial<KeyboardSensorOptions>;
    touchEnabled?: boolean;
    keyboardEnabled?: boolean;
}): import("@dnd-kit/core").SensorDescriptor<import("@dnd-kit/core").SensorOptions>[];
/**
 * Map of collision strategy names to detection functions
 */
export declare const collisionStrategies: Record<CollisionStrategy, CollisionDetection>;
/**
 * Get collision detection function by strategy name
 */
export declare function getCollisionDetection(strategy: CollisionStrategy): CollisionDetection;
/**
 * Get sorting strategy based on direction
 */
export declare function getSortingStrategy(direction: SortableDirection): SortingStrategy;
/**
 * Default animation duration in ms
 */
export declare const ANIMATION_DURATION = 200;
/**
 * Default drag overlay animation
 */
export declare const dragOverlayAnimation: {
    initial: {
        scale: number;
        boxShadow: string;
        opacity: number;
    };
    dragging: {
        scale: number;
        boxShadow: string;
        opacity: number;
        zIndex: number;
    };
};
/**
 * CSS transition for smooth layout animations
 */
export declare const layoutTransition: {
    readonly type: "spring";
    readonly stiffness: 400;
    readonly damping: 30;
};
/**
 * Minimum touch target size (WCAG AAA)
 */
export declare const MIN_TOUCH_TARGET = 44;
/**
 * Auto-scroll configuration for long lists
 */
export declare const autoScrollConfig: {
    threshold: number;
    speed: number;
    acceleration: number;
};
/**
 * Default keyboard bindings
 */
export declare const keyboardBindings: {
    readonly startDrag: readonly ["Space", "Enter"];
    readonly confirmDrop: readonly ["Space", "Enter"];
    readonly cancelDrag: readonly ["Escape"];
    readonly moveUp: readonly ["ArrowUp"];
    readonly moveDown: readonly ["ArrowDown"];
    readonly moveLeft: readonly ["ArrowLeft"];
    readonly moveRight: readonly ["ArrowRight"];
    readonly moveToTop: readonly ["Home"];
    readonly moveToBottom: readonly ["End"];
    readonly selectAll: readonly ["KeyA"];
    readonly extendSelection: readonly ["Shift"];
};
/**
 * ARIA role for sortable list
 */
export declare const SORTABLE_LIST_ROLE = "listbox";
/**
 * ARIA role for sortable item
 */
export declare const SORTABLE_ITEM_ROLE = "option";
/**
 * Default error messages for invalid drops
 */
export declare const errorMessages: {
    readonly invalidPosition: "Cannot move item to this position";
    readonly samePosition: "Item is already at this position";
    readonly disabled: "This item cannot be moved";
    readonly emptyList: "No items to reorder";
    readonly multiSelectNotSupported: "Multi-select is not enabled for this list";
};
//# sourceMappingURL=config.d.ts.map