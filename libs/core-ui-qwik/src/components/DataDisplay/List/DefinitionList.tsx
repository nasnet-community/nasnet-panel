import { component$, Slot } from "@builder.io/qwik";

import { List } from "./List";

import type { ListProps } from "./List.types";

/**
 * DefinitionList convenience component
 */
export const DefinitionList = component$<Omit<ListProps, "variant">>(
  (props) => {
    return (
      <List {...props} variant="definition">
        <Slot />
      </List>
    );
  },
);
