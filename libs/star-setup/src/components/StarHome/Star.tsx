import { component$ } from "@builder.io/qwik";
import { StarContextProvider } from "@nas-net/star-context";

import { StarContainer } from "../StarContainer/StarContainer";

export const Star = component$(() => {
  return (
    <div class="w-full">
      <StarContextProvider>
        <StarContainer />
      </StarContextProvider>
    </div>
  );
});
