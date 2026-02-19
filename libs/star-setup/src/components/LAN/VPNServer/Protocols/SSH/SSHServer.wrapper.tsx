import { component$ , useContext } from "@builder.io/qwik";
import { StarContext } from "@nas-net/star-context";

import { SSHServerAdvanced } from "./SSHServerAdvanced";
import { SSHServerEasy } from "./SSHServerEasy";

import type { Mode } from "@nas-net/star-context";

export const SSHServerWrapper = component$(() => {
  const starContext = useContext(StarContext);
  const mode = starContext.state.Choose.Mode as Mode;

  return <>{mode === "easy" ? <SSHServerEasy /> : <SSHServerAdvanced />}</>;
});