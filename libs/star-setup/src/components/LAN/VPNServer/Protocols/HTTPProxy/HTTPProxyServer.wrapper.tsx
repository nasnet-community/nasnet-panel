import { component$ , useContext } from "@builder.io/qwik";
import { StarContext } from "@nas-net/star-context";

import { HTTPProxyServerAdvanced } from "./HTTPProxyServerAdvanced";
import { HTTPProxyServerEasy } from "./HTTPProxyServerEasy";

import type { Mode } from "@nas-net/star-context";

export const HTTPProxyServerWrapper = component$(() => {
  const starContext = useContext(StarContext);
  const mode = starContext.state.Choose.Mode as Mode;

  return <>{mode === "easy" ? <HTTPProxyServerEasy /> : <HTTPProxyServerAdvanced />}</>;
});