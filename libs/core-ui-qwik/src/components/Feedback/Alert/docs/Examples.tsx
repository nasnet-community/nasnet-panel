import { component$ } from "@builder.io/qwik";
import { ExamplesTemplate, type Example } from "@nas-net/core-ui-qwik";

import { AlertSizesAndDismissible } from "../Examples/AlertSizesAndDismissible";
import { AlertVariants } from "../Examples/AlertVariants";
import { BasicAlert } from "../Examples/BasicAlert";
import { ComplexAlert } from "../Examples/ComplexAlert";
import { ResponsiveAlert } from "../Examples/ResponsiveAlert";

/**
 * Alert component examples documentation using the standard template
 */
export default component$(() => {
  const examples: Example[] = [
    {
      title: "Basic Alert",
      description:
        "Basic alert examples with different status types: info, success, warning, and error.",
      component: <BasicAlert />,
    },
    {
      title: "Alert Variants",
      description:
        "Different visual variants including solid, outline, and subtle styles, plus icon customization options.",
      component: <AlertVariants />,
    },
    {
      title: "Sizes and Interactive Features",
      description:
        "Alert size options, dismissible alerts, auto-dismissing alerts, loading state, and custom content.",
      component: <AlertSizesAndDismissible />,
    },
    {
      title: "Responsive Design",
      description:
        "Responsive alerts that adapt to different screen sizes with mobile-optimized touch targets and typography.",
      component: <ResponsiveAlert />,
    },
    {
      title: "Advanced Examples",
      description:
        "Complex alert implementations with animations, theme variations, and accessibility features.",
      component: <ComplexAlert />,
    },
  ];

  return (
    <ExamplesTemplate examples={examples}>
      <p>
        The Alert component offers multiple configurations to communicate
        different types of messages and feedback to users. Each status type
        (info, success, warning, error) has its own semantic color scheme and
        default icon that helps users quickly understand the nature of the
        message.
      </p>
      <p class="mt-2">
        Alerts can be styled in various ways - from prominent solid backgrounds
        for high-visibility messages to subtle or outlined variants for less
        intrusive notifications. You can also create auto-dismissing alerts for
        temporary feedback or include loading states for in-progress operations.
      </p>
      
      <div class="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-900/20 dark:border-blue-800">
        <h4 class="font-medium text-blue-900 dark:text-blue-100 mb-2">📱 Mobile & Responsive Features</h4>
        <ul class="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• Touch-friendly dismiss buttons with 44px minimum target size</li>
          <li>• Responsive typography that scales across device sizes</li>
          <li>• Automatic dark mode support with theme integration</li>
          <li>• Smooth animations optimized for touch interactions</li>
          <li>• Safe area padding for notched mobile devices</li>
        </ul>
      </div>
      
      <div class="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg dark:bg-green-900/20 dark:border-green-800">
        <h4 class="font-medium text-green-900 dark:text-green-100 mb-2">🎨 Theme Integration</h4>
        <ul class="text-sm text-green-800 dark:text-green-200 space-y-1">
          <li>• Consistent color tokens that adapt to light and dark themes</li>
          <li>• High contrast mode compatibility for accessibility</li>
          <li>• System preference detection for automatic theme switching</li>
          <li>• Customizable color schemes for brand consistency</li>
        </ul>
      </div>
    </ExamplesTemplate>
  );
});
