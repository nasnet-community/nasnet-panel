import { component$, Slot } from "@builder.io/qwik";

import { useBadgeGroup } from "./hooks/useBadgeGroup";

import type { BadgeGroupProps } from "./Badge.types";

/**
 * BadgeGroup component for grouping multiple badges
 */
export const BadgeGroup = component$<BadgeGroupProps>((props) => {
  const { class: className = "" } = props;

  const { classes } = useBadgeGroup(props, className);

  return (
    <div class={classes}>
      <Slot />
    </div>
  );
});
