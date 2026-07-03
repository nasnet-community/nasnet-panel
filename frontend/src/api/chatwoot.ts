// eslint-disable-next-line @typescript-eslint/naming-convention
declare const __CHATWOOT_BASE_URL__: string | undefined;
// eslint-disable-next-line @typescript-eslint/naming-convention
declare const __CHATWOOT_WEBSITE_TOKEN__: string | undefined;

const BASE_URL = (
  typeof __CHATWOOT_BASE_URL__ === 'string' ? __CHATWOOT_BASE_URL__ : 'https://app.chatwoot.com'
).replace(/\/$/, '');

const WEBSITE_TOKEN =
  typeof __CHATWOOT_WEBSITE_TOKEN__ === 'string'
    ? __CHATWOOT_WEBSITE_TOKEN__
    : '6bf25JZcWyhrbtLMgiv4oNuy';

interface ChatwootApi {
  toggle: (state?: 'open' | 'close') => void;
}

interface ChatwootWindow extends Window {
  chatwootSettings?: {
    position?: 'left' | 'right';
    type?: 'standard' | 'expanded_bubble';
    launcherTitle?: string;
    hideMessageBubble?: boolean;
  };
  chatwootSDK?: { run: (config: { websiteToken: string; baseUrl: string }) => void };
  $chatwoot?: ChatwootApi;
}

const win = window as ChatwootWindow;

let loadPromise: Promise<void> | null = null;

export function loadChatwoot(): Promise<void> {
  if (win.$chatwoot) return Promise.resolve();
  if (loadPromise) return loadPromise;
  loadPromise = new Promise<void>((resolve, reject) => {
    win.chatwootSettings = {
      position: 'right',
      type: 'standard',
      launcherTitle: '',
    };
    const script = document.createElement('script');
    script.src = `${BASE_URL}/packs/js/sdk.js`;
    script.async = true;
    script.onload = () => {
      if (!win.chatwootSDK) {
        loadPromise = null;
        reject(new Error('Chatwoot SDK failed to initialise'));
        return;
      }
      window.addEventListener(
        'chatwoot:ready',
        () => {
          resolve();
        },
        { once: true },
      );
      win.chatwootSDK.run({ websiteToken: WEBSITE_TOKEN, baseUrl: BASE_URL });
    };
    script.onerror = () => {
      loadPromise = null;
      script.remove();
      reject(new Error('Failed to load Chatwoot SDK'));
    };
    document.head.appendChild(script);
  });
  return loadPromise;
}

export function toggleChatwoot(state: 'open' | 'close'): void {
  win.$chatwoot?.toggle(state);
}
