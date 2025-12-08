import { component$ } from "@builder.io/qwik";
import { useContext } from "@builder.io/qwik";
import { StarContext } from "@nas-net/star-context";
import { BackToHomeServerAdvanced } from "./BackToHomeServerAdvanced";
import { BackToHomeServerEasy } from "./BackToHomeServerEasy";
import type { Mode } from "@nas-net/star-context";

export const BackToHomeServerWrapper = component$(() => {
  const starContext = useContext(StarContext);
  const mode = starContext.state.Choose.Mode as Mode;

  return <>{mode === "easy" ? <BackToHomeServerEasy /> : <BackToHomeServerAdvanced />}</>;
});