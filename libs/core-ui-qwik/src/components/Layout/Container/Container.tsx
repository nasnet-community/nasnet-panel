import { component$, Slot } from "@builder.io/qwik";

import { useContainer } from "./hooks";

import type { ContainerProps } from "./Container.types";

const Container = component$<ContainerProps>((props) => {
  const { role, "aria-label": ariaLabel, ...rest } = props;

  const { combinedClassNames } = useContainer(props);

  return (
    <div
      {...rest}
      class={combinedClassNames}
      role={role}
      aria-label={ariaLabel}
    >
      <Slot />
    </div>
  );
});

export default Container;
