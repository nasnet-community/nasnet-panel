import type React from 'react';
import type { ModelKey, PanelProps } from '../types';
import { HapAx2Panel } from './HapAx2Panel';
import { HapAx3Panel } from './HapAx3Panel';
import { Rb4011Panel } from './Rb4011Panel';
import { Rb5009Panel } from './Rb5009Panel';
import { ChateauLte12Panel } from './ChateauLte12Panel';

export const PANEL_REGISTRY: Record<ModelKey, React.FC<PanelProps>> = {
  'hap-ax2': HapAx2Panel,
  'hap-ax3': HapAx3Panel,
  rb4011: Rb4011Panel,
  rb5009: Rb5009Panel,
  'chateau-lte12': ChateauLte12Panel,
};

export { HapAx2Panel, HapAx3Panel, Rb4011Panel, Rb5009Panel, ChateauLte12Panel };
