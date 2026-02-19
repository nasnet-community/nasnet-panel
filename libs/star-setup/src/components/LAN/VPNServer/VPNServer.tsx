import { component$, useContext } from "@builder.io/qwik";
import { StarContext } from "@nas-net/star-context";

import { VPNServerAdvanced } from "./VPNServerAdvanced/VPNServerAdvanced";
import { VPNServerEasy } from "./VPNServerEasy/VPNServerEasy";

import type { StepProps } from "@nas-net/core-ui-qwik";

export const VPNServer = component$<StepProps>((props) => {
  const starContext = useContext(StarContext);
  const mode = starContext.state.Choose.Mode;

  return (
    <div class="w-full max-w-6xl">
      {/* Main Content - Render based on mode */}
      <div class="flex flex-col gap-8">
        {mode === "easy" ? (
          <VPNServerEasy
            isComplete={props.isComplete}
            onComplete$={props.onComplete$}
            onDisabled$={props.onDisabled$}
          />
        ) : (
          <VPNServerAdvanced
            isComplete={props.isComplete}
            onComplete$={props.onComplete$}
            onDisabled$={props.onDisabled$}
          />
        )}
      </div>
    </div>
  );
});
