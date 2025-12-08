import { component$, type QRL } from "@builder.io/qwik";
import { Button } from "@nas-net/core-ui-qwik";

interface ActionButtonsProps {
  onSubmit: QRL<() => void>;
  isValid: boolean;
}

export const ActionButtons = component$<ActionButtonsProps>(
  ({ onSubmit, isValid }) => {
    return (
      <div class="mt-8 flex justify-end">
        <Button
          onClick$={onSubmit}
          disabled={!isValid}
          variant="primary"
          size="md"
        >
          {$localize`Save`}
        </Button>
      </div>
    );
  },
);
