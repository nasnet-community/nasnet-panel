import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
/**
 * Progress bar component for showing operation progress or percentages.
 * Built on Radix UI Progress primitive with full accessibility support.
 *
 * @example
 * <Progress value={65} />
 *
 * @example
 * <Progress value={75} max={100} aria-label="Download progress" />
 */
declare const Progress: React.MemoExoticComponent<React.ForwardRefExoticComponent<Omit<ProgressPrimitive.ProgressProps & React.RefAttributes<HTMLDivElement>, "ref"> & React.RefAttributes<HTMLDivElement>>>;
export { Progress };
//# sourceMappingURL=progress.d.ts.map