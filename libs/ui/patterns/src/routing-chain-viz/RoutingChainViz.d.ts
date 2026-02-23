import type { RoutingChainVizProps } from './types';
/**
 * RoutingChainViz - Multi-hop routing chain visualization
 *
 * Automatically selects the appropriate presenter based on platform.
 * Displays the path from a device through multiple service hops to the internet.
 *
 * @example
 * ```tsx
 * <RoutingChainViz
 *   chain={chainData}
 *   showLatency={true}
 *   showKillSwitch={true}
 *   onHopClick={(hop) => console.log('Hop clicked:', hop)}
 * />
 * ```
 */
declare const RoutingChainViz: import("react").NamedExoticComponent<RoutingChainVizProps>;
export { RoutingChainViz };
//# sourceMappingURL=RoutingChainViz.d.ts.map