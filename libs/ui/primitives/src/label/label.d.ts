import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { type VariantProps } from "class-variance-authority";
declare const labelVariants: (props?: import("class-variance-authority/types").ClassProp | undefined) => string;
/**
 * Props for the Label component
 */
export type LabelProps = React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & VariantProps<typeof labelVariants>;
/**
 * Accessible label component that associates with form controls.
 * Supports disabled state styling through CSS peer selectors.
 */
declare const Label: React.MemoExoticComponent<React.ForwardRefExoticComponent<Omit<LabelPrimitive.LabelProps & React.RefAttributes<HTMLLabelElement>, "ref"> & VariantProps<(props?: import("class-variance-authority/types").ClassProp | undefined) => string> & React.RefAttributes<HTMLLabelElement>>>;
export { Label };
//# sourceMappingURL=label.d.ts.map