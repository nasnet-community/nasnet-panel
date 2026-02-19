import { component$ , useContext } from "@builder.io/qwik";
import { StarContext } from "@nas-net/star-context";

import { PPTPServerAdvanced } from "./PPTPServerAdvanced";
import { PPTPServerEasy } from "./PPTPServerEasy";

import type { Mode } from "@nas-net/star-context";

export const PPTPServerWrapper = component$(() => {
  const starContext = useContext(StarContext);
  const mode = starContext.state.Choose.Mode as Mode;

  return <>{mode === "easy" ? <PPTPServerEasy /> : <PPTPServerAdvanced />}</>;
});
