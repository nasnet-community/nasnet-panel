import { component$ , useContext } from "@builder.io/qwik";
import { StarContext } from "@nas-net/star-context";

import { SSTPServerAdvanced } from "./SSTPServerAdvanced";
import { SSTPServerEasy } from "./SSTPServerEasy";

import type { Mode } from "@nas-net/star-context";

export const SSTPServerWrapper = component$(() => {
  const starContext = useContext(StarContext);
  const mode = starContext.state.Choose.Mode as Mode;

  return <>{mode === "easy" ? <SSTPServerEasy /> : <SSTPServerAdvanced />}</>;
});
