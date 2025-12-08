import { component$ } from "@builder.io/qwik";
import { ErrorMessage } from "@nas-net/core-ui-qwik";

export const CustomTitleErrorMessage = component$(() => {
  return (
    <div class="space-y-4">
      <ErrorMessage
        title="Database Error"
        message="Unable to save your changes. The database is currently unavailable."
      />
    </div>
  );
});
