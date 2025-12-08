// Main component
export { Game } from "./Game";

// Hooks
export { useGameLogic } from "./useGame";

// Types
export type {
  Game as GameType,
  SerializedGame,
  GameTableProps,
  GamePaginationProps,
} from "./type";

// Data and utilities - export specific functions to avoid conflicts
export * from "./GameData";
export { buildNetworkOptions, groupNetworkOptions } from "./NetworkOptionsHelper";

// Sub-components (internal - exported for advanced usage)
export { GameForm } from "./GameForm";
export { GameHeader } from "./GameHeader";
export { GamePagination } from "./GamePagination";
export { GameSearch } from "./GameSearch";
export { GameSelected } from "./GameSelected";
export { GameTable } from "./GameTable";
