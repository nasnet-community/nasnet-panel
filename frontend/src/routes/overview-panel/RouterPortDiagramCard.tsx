import React, { useCallback, useMemo } from 'react';
import type { InterfaceResponse } from '../../api';
import { PANEL_REGISTRY } from './panels';
import { POWER_ACTION, type PowerAction, mapPorts } from './mapPorts';
import { resolveModelStrict } from './resolveModel';
import type { ResolvedSlot } from './types';
import styles from './OverviewPanel.module.scss';

export interface RouterPortDiagramCardProps {
  model: string;
  interfaces: InterfaceResponse[];
  onPower: (action: PowerAction) => void;
}

export const RouterPortDiagramCard: React.FC<RouterPortDiagramCardProps> = React.memo(
  function RouterPortDiagramCard({ model, interfaces, onPower }) {
    const { descriptor, slots } = useMemo(() => {
      const resolved = resolveModelStrict(model);
      return { descriptor: resolved, slots: mapPorts(resolved.slots, interfaces) };
    }, [model, interfaces]);

    const Panel = PANEL_REGISTRY[descriptor.key];

    const handleSlot = useCallback(
      (slot: ResolvedSlot) => {
        const action = POWER_ACTION[slot.kind];
        if (action) onPower(action);
      },
      [onPower],
    );

    return (
      <div className={styles.bannerPorts} data-testid="port-diagram">
        <span className={styles.srOnly} data-testid="panel-model">
          {descriptor.displayName}
        </span>
        <Panel descriptor={descriptor} slots={slots} onSlotActivate={handleSlot} bare />
      </div>
    );
  },
);
