import { component$ , useContext } from "@builder.io/qwik";
import { StarContext } from "@nas-net/star-context";

import { Socks5ServerAdvanced } from "./Socks5ServerAdvanced";
import { Socks5ServerEasy } from "./Socks5ServerEasy";

import type { Mode } from "@nas-net/star-context";

export const Socks5ServerWrapper = component$(() => {
  const starContext = useContext(StarContext);
  const mode = starContext.state.Choose.Mode as Mode;

  return <>{mode === "easy" ? <Socks5ServerEasy /> : <Socks5ServerAdvanced />}</>;
});