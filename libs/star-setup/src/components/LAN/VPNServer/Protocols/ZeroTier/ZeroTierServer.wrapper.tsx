import { component$ , useContext } from "@builder.io/qwik";
import { StarContext } from "@nas-net/star-context";

import { ZeroTierServerAdvanced } from "./ZeroTierServerAdvanced";
import { ZeroTierServerEasy } from "./ZeroTierServerEasy";

import type { Mode } from "@nas-net/star-context";

export const ZeroTierServerWrapper = component$(() => {
  const starContext = useContext(StarContext);
  const mode = starContext.state.Choose.Mode as Mode;

  return <>{mode === "easy" ? <ZeroTierServerEasy /> : <ZeroTierServerAdvanced />}</>;
});