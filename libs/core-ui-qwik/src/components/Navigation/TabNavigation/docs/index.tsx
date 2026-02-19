import { component$ } from "@builder.io/qwik";

import APIReference from "./APIReference";
import Examples from "./Examples";
import Overview from "./Overview";
import Playground from "./Playground";
import Usage from "./Usage";

export default component$(() => {
  return <div>TabNavigation Documentation Index</div>;
});

export { Overview, Examples, APIReference, Usage, Playground };

export const componentIntegration = {
  labels: {
    overview: "Overview",
    examples: "Examples",
    apiReference: "API Reference",
    usage: "Usage Guidelines",
    playground: "Playground",
  },
  components: {
    overview: Overview,
    examples: Examples,
    apiReference: APIReference,
    usage: Usage,
    playground: Playground,
  },
};

export const customization = {
  name: "TabNavigation",
  category: "Navigation",
  description:
    "A component for organizing content into accessible, selectable tabs.",
  repository: "src/components/Core/Navigation/TabNavigation",
  features: [
    "Horizontal and vertical orientations",
    "Multiple visual variants",
    "Icon and label support",
    "Accessible implementation",
    "Responsive design",
  ],
};
