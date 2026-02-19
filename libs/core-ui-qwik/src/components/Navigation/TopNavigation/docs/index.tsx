import { component$ } from "@builder.io/qwik";

import APIReference from "./APIReference";
import Examples from "./Examples";
import Overview from "./Overview";
import Playground from "./Playground";
import Usage from "./Usage";

export default component$(() => {
  return <div>TopNavigation Documentation Index</div>;
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
  name: "TopNavigation",
  category: "Navigation",
  description:
    "A horizontal navigation bar typically positioned at the top of a website or application.",
  repository: "src/components/Core/Navigation/TopNavigation",
  features: [
    "Responsive behavior for different screen sizes",
    "Support for dropdown menus",
    "Icon integration",
    "Accessible implementation",
    "Mobile navigation toggle",
  ],
};
