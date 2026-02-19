import { component$ } from "@builder.io/qwik";
import { Stack , Box } from "@nas-net/core-ui-qwik";


export const StackBasic = component$(() => {
  return (
    <>
      <Stack spacing="md">
        <Box
          padding="md"
          backgroundColor="primary"
          borderRadius="md"
          class="text-white"
        >
          First item
        </Box>
        <Box
          padding="md"
          backgroundColor="primary"
          borderRadius="md"
          class="text-white"
        >
          Second item
        </Box>
        <Box
          padding="md"
          backgroundColor="primary"
          borderRadius="md"
          class="text-white"
        >
          Third item
        </Box>
      </Stack>
    </>
  );
});

export default StackBasic;
