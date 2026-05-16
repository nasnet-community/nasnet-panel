import { simulateLatency } from '../simulate-latency';
import type { DomesticUplink, StarlinkUplink, WanVpnClient } from '../types';
import { clone, commit, nextId, state } from './store';

export const wan = {
  async listStarlink(routerId: string): Promise<StarlinkUplink[]> {
    await simulateLatency(50, 150);
    return clone(state.current.starlinkUplinks.filter((u) => u.routerId === routerId));
  },
  async createStarlink(input: Omit<StarlinkUplink, 'id'>): Promise<StarlinkUplink> {
    await simulateLatency();
    const uplink: StarlinkUplink = { ...input, id: nextId('wansl') };
    state.current.starlinkUplinks.push(uplink);
    commit();
    return clone(uplink);
  },
  async updateStarlink(
    id: string,
    patch: Partial<StarlinkUplink>,
  ): Promise<StarlinkUplink | undefined> {
    await simulateLatency();
    const list = state.current.starlinkUplinks;
    const idx = list.findIndex((u) => u.id === id);
    if (idx === -1) return undefined;
    list[idx] = { ...list[idx], ...patch };
    commit();
    return clone(list[idx]);
  },
  async deleteStarlink(id: string): Promise<void> {
    await simulateLatency();
    state.current.starlinkUplinks = state.current.starlinkUplinks.filter((u) => u.id !== id);
    commit();
  },

  async listDomestic(routerId: string): Promise<DomesticUplink[]> {
    await simulateLatency(50, 150);
    return clone(state.current.domesticUplinks.filter((u) => u.routerId === routerId));
  },
  async createDomestic(input: Omit<DomesticUplink, 'id'>): Promise<DomesticUplink> {
    await simulateLatency();
    const uplink: DomesticUplink = { ...input, id: nextId('wandom') };
    state.current.domesticUplinks.push(uplink);
    commit();
    return clone(uplink);
  },
  async updateDomestic(
    id: string,
    patch: Partial<DomesticUplink>,
  ): Promise<DomesticUplink | undefined> {
    await simulateLatency();
    const list = state.current.domesticUplinks;
    const idx = list.findIndex((u) => u.id === id);
    if (idx === -1) return undefined;
    list[idx] = { ...list[idx], ...patch };
    commit();
    return clone(list[idx]);
  },
  async deleteDomestic(id: string): Promise<void> {
    await simulateLatency();
    state.current.domesticUplinks = state.current.domesticUplinks.filter((u) => u.id !== id);
    commit();
  },

  async listMaskingVpn(routerId: string): Promise<WanVpnClient[]> {
    await simulateLatency(50, 150);
    return clone(state.current.maskingVpnClients.filter((c) => c.routerId === routerId));
  },
  async createMaskingVpn(input: Omit<WanVpnClient, 'id'>): Promise<WanVpnClient> {
    await simulateLatency();
    const client: WanVpnClient = { ...input, id: nextId('wanmvpn') };
    state.current.maskingVpnClients.push(client);
    commit();
    return clone(client);
  },
  async updateMaskingVpn(
    id: string,
    patch: Partial<WanVpnClient>,
  ): Promise<WanVpnClient | undefined> {
    await simulateLatency();
    const list = state.current.maskingVpnClients;
    const idx = list.findIndex((c) => c.id === id);
    if (idx === -1) return undefined;
    list[idx] = { ...list[idx], ...patch };
    commit();
    return clone(list[idx]);
  },
  async deleteMaskingVpn(id: string): Promise<void> {
    await simulateLatency();
    state.current.maskingVpnClients = state.current.maskingVpnClients.filter((c) => c.id !== id);
    commit();
  },

  async listDomesticVpn(routerId: string): Promise<WanVpnClient[]> {
    await simulateLatency(50, 150);
    return clone(state.current.domesticVpnInterfaces.filter((c) => c.routerId === routerId));
  },
  async createDomesticVpn(input: Omit<WanVpnClient, 'id'>): Promise<WanVpnClient> {
    await simulateLatency();
    const client: WanVpnClient = { ...input, id: nextId('wandvpn') };
    state.current.domesticVpnInterfaces.push(client);
    commit();
    return clone(client);
  },
  async updateDomesticVpn(
    id: string,
    patch: Partial<WanVpnClient>,
  ): Promise<WanVpnClient | undefined> {
    await simulateLatency();
    const list = state.current.domesticVpnInterfaces;
    const idx = list.findIndex((c) => c.id === id);
    if (idx === -1) return undefined;
    list[idx] = { ...list[idx], ...patch };
    commit();
    return clone(list[idx]);
  },
  async deleteDomesticVpn(id: string): Promise<void> {
    await simulateLatency();
    state.current.domesticVpnInterfaces = state.current.domesticVpnInterfaces.filter(
      (c) => c.id !== id,
    );
    commit();
  },
};
