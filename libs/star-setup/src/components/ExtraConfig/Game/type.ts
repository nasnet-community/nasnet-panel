import type { Signal } from "@builder.io/qwik";
import type { StarContextType } from "@nas-net/star-context";

export interface Game {
  name: string;
  tcp?: (string | number)[];
  udp?: (string | number)[];
}

export interface SerializedGame {
  name: string;
  tcp?: string[];
  udp?: string[];
}

export interface GameTableProps {
  context: StarContextType;
  searchQuery: Signal<string>;
  currentPage: Signal<number>;
  itemsPerPage: number;
}

export interface GamePaginationProps {
  currentPage: Signal<number>;
  itemsPerPage: number;
  searchQuery: Signal<string>;
}
