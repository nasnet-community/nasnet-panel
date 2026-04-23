import { simulateLatency } from '../simulate-latency';
import type { Interface } from '../types';
import { clone, state } from './store';

export const system = {
  async listInterfaces(routerId: string): Promise<Interface[]> {
    await simulateLatency(50, 150);
    return clone(state.current.interfaces[routerId] ?? []);
  },
};
