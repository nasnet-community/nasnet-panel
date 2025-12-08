// Re-export RouterConfig type and utilities needed by Master and Slave files
export type { RouterConfig } from '../../generator';
export * from '../../utils';

// Re-export functions from other modules needed by Slave
export * from '../extra/ExtraCG';
export * from '../extra/ExtraUtil';
export * from '../wan/DNS/DNS';

export * from "./Master";
export * from "./Slave";
