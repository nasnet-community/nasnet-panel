import { component$, Slot } from "@builder.io/qwik";

import { List } from "./List";

import type { ListProps } from "./List.types";

/**
 * OrderedList convenience component
 */
export const OrderedList = component$<Omit<ListProps, "variant">>((props) => {
  return (
    <List {...props} variant="ordered">
      <Slot />
    </List>
  );
});
