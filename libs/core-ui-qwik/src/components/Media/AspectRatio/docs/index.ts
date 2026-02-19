// AspectRatio Documentation Exports
export { default as AspectRatioOverview } from "./Overview";
export { default as AspectRatioAPIReference } from "./APIReference";
export { default as AspectRatioExamples } from "./Examples";
export { default as AspectRatioUsage } from "./Usage";
export { default as AspectRatioPlayground } from "./Playground";

// Re-export all as named exports for easier importing
import AspectRatioAPIReference from "./APIReference";
import AspectRatioExamples from "./Examples";
import AspectRatioOverview from "./Overview";
import AspectRatioPlayground from "./Playground";
import AspectRatioUsage from "./Usage";

export {
  AspectRatioOverview as Overview,
  AspectRatioAPIReference as APIReference,
  AspectRatioExamples as Examples,
  AspectRatioUsage as Usage,
  AspectRatioPlayground as Playground,
};

// Documentation navigation structure
export const aspectRatioDocNavigation = [
  {
    title: "Overview",
    href: "/docs/components/media/aspect-ratio/overview",
    component: "AspectRatioOverview",
  },
  {
    title: "API Reference",
    href: "/docs/components/media/aspect-ratio/api",
    component: "AspectRatioAPIReference",
  },
  {
    title: "Examples",
    href: "/docs/components/media/aspect-ratio/examples",
    component: "AspectRatioExamples",
  },
  {
    title: "Usage Guidelines",
    href: "/docs/components/media/aspect-ratio/usage",
    component: "AspectRatioUsage",
  },
  {
    title: "Playground",
    href: "/docs/components/media/aspect-ratio/playground",
    component: "AspectRatioPlayground",
  },
] as const;

// Component metadata
export const aspectRatioMetadata = {
  name: "AspectRatio",
  category: "Media",
  description: "Maintains a specific aspect ratio for its content",
  version: "1.0.0",
  status: "stable",
  documentation: aspectRatioDocNavigation,
} as const;