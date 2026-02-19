import { component$, Slot } from "@builder.io/qwik";

import { List } from "./List";

import type { ListProps } from "./List.types";

/**
 * UnorderedList convenience component
 */
export const UnorderedList = component$<Omit<ListProps, "variant">>((props) => {
  return (
    <List {...props} variant="unordered">
      <Slot />
    </List>
  );
});
