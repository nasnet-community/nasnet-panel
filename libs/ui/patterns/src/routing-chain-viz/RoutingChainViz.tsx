import { memo } from 'react';
import { usePlatform } from '@nasnet/ui/layouts';
import { useRoutingChainViz } from './useRoutingChainViz';
import { RoutingChainVizDesktop } from './RoutingChainVizDesktop';
import { RoutingChainVizMobile } from './RoutingChainVizMobile';
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
const RoutingChainViz = memo(function RoutingChainVizComponent(props: RoutingChainVizProps) {
  const {
    chain,
    loading,
    error,
    compact,
    showLatency = true,
    showKillSwitch = true,
    onHopClick,
    onKillSwitchToggle,
    className,
  } = props;
  const platform = usePlatform();
  const state = useRoutingChainViz(chain);

  const presenterProps = {
    state,
    loading,
    error,
    compact,
    showLatency,
    showKillSwitch,
    onHopClick,
    onKillSwitchToggle,
    className,
  };

  switch (platform) {
    case 'mobile':
      return <RoutingChainVizMobile {...presenterProps} />;
    case 'tablet':
    case 'desktop':
    default:
      return <RoutingChainVizDesktop {...presenterProps} />;
  }
});

RoutingChainViz.displayName = 'RoutingChainViz';

export { RoutingChainViz };
