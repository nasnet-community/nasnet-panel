import { component$ } from "@builder.io/qwik";
import { Spacer , Box } from "@nas-net/core-ui-qwik";


export const SpacerHorizontal = component$(() => {
  return (
    <div class="flex flex-wrap items-center">
      <>
        <Box
          padding="sm"
          backgroundColor="primary"
          borderRadius="md"
          class="text-white"
        >
          Box 1
        </Box>
        <Spacer horizontal size="sm" />
        <Box
          padding="sm"
          backgroundColor="secondary"
          borderRadius="md"
          class="text-white"
        >
          Box 2
        </Box>
        <Spacer horizontal size="md" />
        <Box
          padding="sm"
          backgroundColor="primary"
          borderRadius="md"
          class="text-white"
        >
          Box 3
        </Box>
        <Spacer horizontal size="lg" />
        <Box
          padding="sm"
          backgroundColor="secondary"
          borderRadius="md"
          class="text-white"
        >
          Box 4
        </Box>
      </>
    </div>
  );
});

export default SpacerHorizontal;
