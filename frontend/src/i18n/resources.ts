import enCommon from './locales/en/common.json';
import enLayout from './locales/en/layout.json';
import enRouterList from './locales/en/routerList.json';
import enAddRouter from './locales/en/addRouter.json';
import enOverview from './locales/en/overview.json';
import enEasyConfig from './locales/en/easyConfig.json';
import enInternet from './locales/en/internet.json';
import enVpn from './locales/en/vpn.json';
import enWireless from './locales/en/wireless.json';
import enNetwork from './locales/en/network.json';
import enTools from './locales/en/tools.json';
import enUi from './locales/en/ui.json';
import faCommon from './locales/fa/common.json';
import faLayout from './locales/fa/layout.json';
import faRouterList from './locales/fa/routerList.json';
import faAddRouter from './locales/fa/addRouter.json';
import faOverview from './locales/fa/overview.json';
import faEasyConfig from './locales/fa/easyConfig.json';
import faInternet from './locales/fa/internet.json';
import faVpn from './locales/fa/vpn.json';
import faWireless from './locales/fa/wireless.json';
import faNetwork from './locales/fa/network.json';
import faTools from './locales/fa/tools.json';
import faUi from './locales/fa/ui.json';

export const en = {
  common: enCommon,
  layout: enLayout,
  routerList: enRouterList,
  addRouter: enAddRouter,
  overview: enOverview,
  easyConfig: enEasyConfig,
  internet: enInternet,
  vpn: enVpn,
  wireless: enWireless,
  network: enNetwork,
  tools: enTools,
  ui: enUi,
};

// Farsi catalogs may lag behind English; missing keys fall back to `en` at runtime.
export const fa: Partial<Record<keyof typeof en, Record<string, unknown>>> = {
  common: faCommon,
  layout: faLayout,
  routerList: faRouterList,
  addRouter: faAddRouter,
  overview: faOverview,
  easyConfig: faEasyConfig,
  internet: faInternet,
  vpn: faVpn,
  wireless: faWireless,
  network: faNetwork,
  tools: faTools,
  ui: faUi,
};

export const namespaces = Object.keys(en) as Array<keyof typeof en>;
