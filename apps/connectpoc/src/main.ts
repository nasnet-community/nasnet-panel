import './styles/main.css';
import { Scanner } from '@/components/Scanner';
import { RouterList } from '@/components/RouterList';
import { RouterPanel } from '@/components/RouterPanel';
import { loadManualRouters } from '@/services/manual-router';
import { initializeTheme, toggleTheme, subscribeToThemeChanges, type Theme } from '@/services/theme';
import type { RouterInfo, ScanResult, RouterCredentials } from '@shared/routeros';

class MikroTikScanner {
  private scanner!: Scanner;
  private routerList!: RouterList;
  private routerPanel!: RouterPanel;
  private currentView: 'scanner' | 'panel' = 'scanner';

  constructor() {
    // Initialize theme first (before components that may use theme-aware styles)
    initializeTheme();
    this.initializeComponents();
    this.loadStoredManualRouters();
    this.setupThemeToggle();
    console.log('🚀 MikroTik Scanner initialized with auto-scan enabled');
    console.log('🔍 Auto-scanning 192.168.0-255.1 subnet for HTTP API endpoints...');
  }

  private initializeComponents(): void {
    const scannerContainer = document.getElementById('scanner-container');
    const routerListContainer = document.getElementById('router-list-container');
    const mainContainer = document.querySelector('main');

    if (!scannerContainer || !routerListContainer || !mainContainer) {
      throw new Error('Required DOM containers not found');
    }

    this.scanner = new Scanner(scannerContainer, {
      autoStart: true,
      showAutoScanStatus: true,
    });
    this.routerList = new RouterList(routerListContainer);
    this.routerPanel = new RouterPanel(mainContainer);

    this.scanner.onRouterFoundCallback((result: ScanResult) => {
      this.handleRouterFound(result);
    });
    this.routerList.onRouterAuthenticatedCallback(
      (router: RouterInfo, credentials: RouterCredentials) => {
        this.handleRouterAuthenticated(router, credentials);
      }
    );
  }

  private handleRouterFound(result: ScanResult): void {
    console.log('Router found:', result);
    const isManualRouter = result.hostname && result.hostname.includes('Manual Router');

    if (isManualRouter) {
      const routerInfo: RouterInfo = {
        id: `manual-${result.ip}`,
        name: result.hostname || `Router ${result.ip}`,
        ip: result.ip,
        ...(result.mac && { mac: result.mac }),
        ...(result.version && { version: result.version }),
        status: 'online',
      };
      this.routerList.addManualRouter(routerInfo);
    } else {
      this.routerList.addFromScanResult(result);
    }
  }

  private handleRouterAuthenticated(router: RouterInfo, credentials: RouterCredentials): void {
    console.log('Router authenticated:', router);
    this.showRouterPanel(router, credentials);
  }

  private showRouterPanel(router: RouterInfo, credentials: RouterCredentials): void {
    this.currentView = 'panel';
    const scannerContainer = document.getElementById('scanner-container');
    const routerListContainer = document.getElementById('router-list-container');

    if (scannerContainer) {
      scannerContainer.style.display = 'none';
    }
    if (routerListContainer) {
      routerListContainer.style.display = 'none';
    }

    this.routerPanel.show(router, credentials, () => {
      this.showScannerView();
    });
  }

  private showScannerView(): void {
    this.currentView = 'scanner';
    this.routerPanel.hide();

    const scannerContainer = document.getElementById('scanner-container');
    const routerListContainer = document.getElementById('router-list-container');

    if (scannerContainer) {
      scannerContainer.style.display = 'block';
    }
    if (routerListContainer) {
      routerListContainer.style.display = 'block';
    }
  }

  private loadStoredManualRouters(): void {
    try {
      const storedManualRouters = loadManualRouters();
      console.log(`Loading ${storedManualRouters.length} stored manual routers`);
      storedManualRouters.forEach((manualEntry) => {
        const routerInfo: RouterInfo = {
          id: `manual-${manualEntry.ip}`,
          name: manualEntry.name,
          ip: manualEntry.ip,
          status: 'unknown',
        };
        this.routerList.addManualRouter(routerInfo);
      });
      if (storedManualRouters.length > 0) {
        console.log('Stored manual routers loaded successfully');
      }
    } catch (error) {
      console.warn('Failed to load stored manual routers:', error);
    }
  }

  /**
   * Setup theme toggle button with ThemeService integration
   */
  private setupThemeToggle(): void {
    const toggleButton = document.getElementById('dark-mode-toggle');
    const sunIcon = document.getElementById('sun-icon');
    const moonIcon = document.getElementById('moon-icon');

    if (!toggleButton || !sunIcon || !moonIcon) {
      console.warn('Theme toggle elements not found in DOM');
      return;
    }

    // Update icon visibility based on current theme
    const updateIcons = (theme: Theme) => {
      if (theme === 'dark' || theme === 'dim') {
        sunIcon.classList.add('opacity-0');
        moonIcon.classList.remove('opacity-0');
      } else {
        sunIcon.classList.remove('opacity-0');
        moonIcon.classList.add('opacity-0');
      }
    };

    // Initialize icon state
    const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    updateIcons(currentTheme as Theme);

    // Handle toggle button click
    toggleButton.addEventListener('click', () => {
      const newTheme = toggleTheme();
      updateIcons(newTheme);
    });

    // Subscribe to theme changes (for system preference changes or external theme updates)
    subscribeToThemeChanges((theme) => {
      updateIcons(theme);
      console.log(`Theme changed to: ${theme}`);
    });
  }

  public getVersion(): string {
    return '2.0.0-minimal';
  }
}

let app: MikroTikScanner;

function initializeApp(): void {
  try {
    app = new MikroTikScanner();
    (window as any).mikrotikScanner = app;
    console.log('MikroTik Scanner started successfully');
    console.log(`Version: ${app.getVersion()}`);
  } catch (error) {
    console.error('Failed to initialize application:', error);
    const container = document.querySelector('main');
    if (container) {
      container.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #dc2626;">
          <h2 style="margin-bottom: 16px;">Application Error</h2>
          <p style="margin-bottom: 8px;">Failed to initialize the MikroTik Scanner.</p>
          <p style="margin-bottom: 20px;">Please refresh the page and try again.</p>
          <p style="font-size: 12px; color: #6b7280;">
            Error: ${error instanceof Error ? error.message : String(error)}
          </p>
        </div>
      `;
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

export { MikroTikScanner };