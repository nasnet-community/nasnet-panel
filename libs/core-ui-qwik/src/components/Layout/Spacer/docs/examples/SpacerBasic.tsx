import { component$ } from "@builder.io/qwik";
import { Spacer } from "@nas-net/core-ui-qwik";
import { Box } from "@nas-net/core-ui-qwik";

export const SpacerBasic = component$(() => {
  return (
    <div>
      <>
        <Box
          padding="md"
          backgroundColor="primary"
          borderRadius="md"
          class="text-white"
        >
          First box
        </Box>
        <Spacer size="md" />
        <Box
          padding="md"
          backgroundColor="secondary"
          borderRadius="md"
          class="text-white"
        >
          Second box with space above
        </Box>
      </>
    </div>
  );
});

export default SpacerBasic;
