import { mockStore } from './handlers/store';
import { routers } from './handlers/routers';
import { system } from './handlers/system';
import { vpn, getProtocolOptions } from './handlers/vpn';
import { users } from './handlers/users';
import { updates } from './handlers/updates';
import { logs } from './handlers/logs';
import { batch } from './handlers/batch';
import { routing } from './handlers/routing';
import { wan } from './handlers/wan';

export { mockStore, getProtocolOptions };

export const mockApi = {
  routers,
  system,
  vpn,
  users,
  updates,
  logs,
  batch,
  routing,
  wan,
};

export type MockApi = typeof mockApi;
export type MockStore = typeof mockStore;
