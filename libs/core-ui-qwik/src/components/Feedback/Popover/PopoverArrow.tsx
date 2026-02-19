import { component$, useContext } from "@builder.io/qwik";

import { PopoverContext } from "./usePopover";

import type { PopoverArrowProps } from "./Popover.types";

/**
 * PopoverArrow - Component for customizing the arrow
 */
export const PopoverArrow = component$<PopoverArrowProps>((props) => {
  const { class: className } = props;
  const popoverState = useContext(PopoverContext);

  return (
    <div
      class={`absolute h-4 w-4 rotate-45 transform border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 ${className || ""}`}
      ref={popoverState.arrowRef}
    ></div>
  );
});
