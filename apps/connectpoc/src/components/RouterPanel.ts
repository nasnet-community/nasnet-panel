import type { RouterInfo, RouterCredentials } from '@shared/routeros';
import { testConnection, logout } from '@/services/auth';
import { WiFiManager } from './WiFiManager';
import { VPNManager } from './VPNManager';
import { FirewallManager } from './FirewallManager';
import { DHCPManager } from './DHCPManager';
import { NetworkMonitor } from './NetworkMonitor';
import { LogsViewer } from './LogsViewer';
import { getSystemInfo, getRouterboardInfo, getRouterHealth, formatBytes, getPercentageClass } from '@/services/system';
import type { SystemInfo, RouterboardInfo } from '@/services/system';

/**
 * Router Management Panel Component
 * Main dashboard for managing router configuration
 */
export class RouterPanel {
  private container: HTMLElement;
  private router: RouterInfo;
  private credentials: RouterCredentials;
  private wifiManager: WiFiManager | null = null;
  private vpnManager: VPNManager | null = null;
  private firewallManager: FirewallManager | null = null;
  private dhcpManager: DHCPManager | null = null;
  private networkMonitor: NetworkMonitor | null = null;
  private logsViewer: LogsViewer | null = null;
  private onClose?: () => void;
  private currentTab: 'overview' | 'wifi' | 'vpn' | 'firewall' | 'dhcp' | 'network' | 'logs' = 'overview';
  private isVisible = false;
  private systemInfo: SystemInfo | null = null;
  private routerboardInfo: RouterboardInfo | null = null;
  private isLoadingSystemInfo = false;

  constructor(container: HTMLElement) {
    this.container = container;
    this.router = {} as RouterInfo;
    this.credentials = {} as RouterCredentials;
  }

  /** Shows the router management panel */
  public show(
    router: RouterInfo,
    credentials: RouterCredentials,
    onClose?: () => void
  ): void {
    this.router = router;
    this.credentials = credentials;
    this.onClose = onClose || undefined;
    this.isVisible = true;
    this.currentTab = 'overview';
    
    this.render();
    this.initializeManagers();
    this.checkConnectionStatus();
  }

  /** Hides the router management panel */
  public hide(): void {
    this.isVisible = false;
    this.cleanup();
    this.container.innerHTML = '';
  }

  /** Initializes child managers */
  private initializeManagers(): void {
    const wifiContainer = document.getElementById('wifi-content');
    const vpnContainer = document.getElementById('vpn-content');
    const firewallContainer = document.getElementById('firewall-content');
    const dhcpContainer = document.getElementById('dhcp-content');
    const networkContainer = document.getElementById('network-content');
    const logsContainer = document.getElementById('logs-content');

    if (wifiContainer && !this.wifiManager) {
      this.wifiManager = new WiFiManager(wifiContainer);
    }

    if (vpnContainer && !this.vpnManager) {
      this.vpnManager = new VPNManager(vpnContainer);
    }

    if (firewallContainer && !this.firewallManager) {
      this.firewallManager = new FirewallManager(firewallContainer);
    }

    if (dhcpContainer && !this.dhcpManager) {
      this.dhcpManager = new DHCPManager(dhcpContainer);
    }

    if (networkContainer && !this.networkMonitor) {
      this.networkMonitor = new NetworkMonitor(networkContainer);
    }

    if (logsContainer && !this.logsViewer) {
      this.logsViewer = new LogsViewer(logsContainer);
    }

    // Load initial data for active tab
    this.loadTabContent();
  }

  /** Loads system information for the overview tab */
  private async loadSystemInfo(): Promise<void> {
    if (this.isLoadingSystemInfo) return;
    
    this.isLoadingSystemInfo = true;
    
    try {
      // Load system information and routerboard info in parallel
      const [systemResult, routerboardResult] = await Promise.all([
        getSystemInfo(this.router.ip),
        getRouterboardInfo(this.router.ip)
      ]);

      if (systemResult.success && systemResult.data) {
        this.systemInfo = systemResult.data;
      } else {
        console.warn('Failed to load system info:', systemResult.error);
      }

      if (routerboardResult.success && routerboardResult.data) {
        this.routerboardInfo = routerboardResult.data;
      } else {
        console.warn('Failed to load routerboard info:', routerboardResult.error);
      }

      // Re-render the overview section with new data
      if (this.currentTab === 'overview') {
        this.updateOverviewContent();
      }
    } catch (error) {
      console.error('Failed to load system information:', error);
    } finally {
      this.isLoadingSystemInfo = false;
    }
  }

  /** Loads content for the current tab */
  private async loadTabContent(): Promise<void> {
    try {
      switch (this.currentTab) {
        case 'wifi':
          if (this.wifiManager) {
            await this.wifiManager.loadInterfaces(this.router.ip);
          }
          break;
        case 'vpn':
          if (this.vpnManager) {
            await this.vpnManager.loadConfiguration(this.router.ip);
          }
          break;
        case 'firewall':
          if (this.firewallManager) {
            await this.firewallManager.loadFirewallData(this.router.ip);
          }
          break;
        case 'dhcp':
          if (this.dhcpManager) {
            await this.dhcpManager.loadDHCPData(this.router.ip);
          }
          break;
        case 'network':
          if (this.networkMonitor) {
            await this.networkMonitor.loadNetworkData(this.router.ip);
          }
          break;
        case 'logs':
          if (this.logsViewer) {
            await this.logsViewer.loadLogData(this.router.ip);
          }
          break;
        case 'overview':
        default:
          await this.loadSystemInfo();
          break;
      }
    } catch (error) {
      console.error('Failed to load tab content:', error);
      this.showError(`Failed to load ${this.currentTab} data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /** Switches to a specific tab */
  private switchTab(tab: 'overview' | 'wifi' | 'vpn' | 'firewall' | 'dhcp' | 'network' | 'logs'): void {
    this.currentTab = tab;
    
    // Update tab appearance
    document.querySelectorAll('.tab-button').forEach(button => {
      button.classList.remove('active');
    });
    
    const activeTab = document.querySelector(`[data-tab="${tab}"]`);
    if (activeTab) {
      activeTab.classList.add('active');
    }
    
    // Show/hide content sections
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    
    const activeContent = document.getElementById(`${tab}-content`);
    if (activeContent) {
      activeContent.classList.add('active');
    }
    
    // Load content for the new tab
    this.loadTabContent();
  }

  /** Checks connection status periodically */
  private async checkConnectionStatus(): Promise<void> {
    try {
      const result = await testConnection(this.router.ip);
      this.updateConnectionStatus(result.success);
      
      if (result.success) {
        // Schedule next check
        setTimeout(() => {
          if (this.isVisible) {
            this.checkConnectionStatus();
          }
        }, 30000); // Check every 30 seconds
      }
    } catch (error) {
      console.error('Connection status check failed:', error);
      this.updateConnectionStatus(false);
    }
  }

  /** Updates the overview content with system information */
  private updateOverviewContent(): void {
    const overviewContent = document.getElementById('overview-content');
    if (!overviewContent) return;

    const overviewGrid = overviewContent.querySelector('.overview-grid');
    if (overviewGrid) {
      overviewGrid.innerHTML = this.renderOverviewCards();
    }
  }

  /** Updates connection status indicator */
  private updateConnectionStatus(connected: boolean): void {
    const statusIndicator = document.getElementById('connection-status');
    const statusText = document.getElementById('connection-text');
    
    if (statusIndicator && statusText) {
      if (connected) {
        statusIndicator.className = 'status-indicator online';
        statusText.textContent = 'Connected';
      } else {
        statusIndicator.className = 'status-indicator offline';
        statusText.textContent = 'Disconnected';
      }
    }
  }

  /** Shows error message */
  private showError(message: string): void {
    const errorContainer = document.getElementById('panel-error');
    if (errorContainer) {
      errorContainer.innerHTML = `
        <div class="error-message">
          <span class="error-icon">⚠️</span>
          ${message}
          <button class="error-close" onclick="this.parentElement.style.display='none'">×</button>
        </div>
      `;
      errorContainer.style.display = 'block';
    }
  }

  /** Handles logout */
  private async handleLogout(): Promise<void> {
    const confirmed = confirm('Are you sure you want to disconnect from this router?');
    if (confirmed) {
      try {
        await logout(this.router.ip, false);
        this.hide();
        if (this.onClose) {
          this.onClose();
        }
      } catch (error) {
        console.error('Logout failed:', error);
      }
    }
  }

  /** Cleanup resources */
  private cleanup(): void {
    this.wifiManager = null;
    this.vpnManager = null;
    this.firewallManager = null;
    this.dhcpManager = null;
    if (this.networkMonitor) {
      this.networkMonitor.cleanup();
      this.networkMonitor = null;
    }
    if (this.logsViewer) {
      this.logsViewer.cleanup();
      this.logsViewer = null;
    }
  }

  /** Renders the router management panel */
  private render(): void {
    if (!this.isVisible) {
      this.container.innerHTML = '';
      return;
    }

    this.container.innerHTML = `
      <style>
        .router-panel {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: #f8f9fa;
          z-index: 900;
          overflow-y: auto;
        }
        
        .panel-header {
          background: white;
          border-bottom: 1px solid #dee2e6;
          padding: 20px;
          position: sticky;
          top: 0;
          z-index: 10;
        }
        
        .header-content {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .router-title {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        
        .back-button {
          background: #6c757d;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 8px 12px;
          font-size: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: background-color 0.2s ease;
        }
        
        .back-button:hover {
          background: #545b62;
        }
        
        .router-info {
          flex: 1;
        }
        
        .router-name {
          font-size: 24px;
          font-weight: 600;
          color: #333;
          margin: 0 0 4px 0;
        }
        
        .router-details {
          font-size: 14px;
          color: #666;
          display: flex;
          gap: 20px;
          align-items: center;
        }
        
        .connection-status {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .status-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        
        .status-indicator.online {
          background: #28a745;
        }
        
        .status-indicator.offline {
          background: #dc3545;
        }
        
        .header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .logout-button {
          background: #dc3545;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 8px 16px;
          font-size: 14px;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }
        
        .logout-button:hover {
          background: #c82333;
        }
        
        .panel-nav {
          background: white;
          border-bottom: 1px solid #dee2e6;
          padding: 0 20px;
        }
        
        .nav-content {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
        }
        
        .tab-button {
          background: none;
          border: none;
          border-bottom: 3px solid transparent;
          padding: 16px 24px;
          font-size: 14px;
          font-weight: 500;
          color: #6c757d;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .tab-button:hover {
          color: #007bff;
          background: rgba(0, 123, 255, 0.05);
        }
        
        .tab-button.active {
          color: #007bff;
          border-bottom-color: #007bff;
        }
        
        .panel-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          min-height: calc(100vh - 140px);
        }
        
        .tab-content {
          display: none;
        }
        
        .tab-content.active {
          display: block;
        }
        
        .panel-error {
          display: none;
          margin-bottom: 20px;
        }
        
        .error-message {
          background: #f8d7da;
          border: 1px solid #f5c6cb;
          border-radius: 6px;
          padding: 12px 16px;
          color: #721c24;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .error-icon {
          font-size: 16px;
        }
        
        .error-close {
          background: none;
          border: none;
          color: #721c24;
          font-size: 18px;
          cursor: pointer;
          margin-left: auto;
          padding: 0;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .overview-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
        
        .info-card {
          background: white;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          padding: 20px;
        }
        
        .info-card h3 {
          margin: 0 0 16px 0;
          color: #333;
          font-size: 18px;
          font-weight: 600;
        }
        
        .info-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        
        .info-item:last-child {
          margin-bottom: 0;
        }
        
        .info-label {
          font-weight: 500;
          color: #333;
        }
        
        .info-value {
          color: #666;
          font-family: monospace;
        }
        
        .metric-card {
          background: white;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          padding: 20px;
          position: relative;
          overflow: hidden;
        }
        
        .metric-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        
        .metric-title {
          font-size: 14px;
          font-weight: 600;
          color: #333;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .metric-icon {
          font-size: 20px;
          opacity: 0.7;
        }
        
        .metric-value {
          font-size: 28px;
          font-weight: 700;
          color: #333;
          margin-bottom: 8px;
        }
        
        .metric-label {
          font-size: 12px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .progress-bar {
          background: #f8f9fa;
          border-radius: 4px;
          height: 8px;
          margin-top: 12px;
          overflow: hidden;
        }
        
        .progress-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.3s ease;
        }
        
        .progress-fill.normal {
          background: linear-gradient(90deg, #28a745, #20c997);
        }
        
        .progress-fill.caution {
          background: linear-gradient(90deg, #ffc107, #fd7e14);
        }
        
        .progress-fill.warning {
          background: linear-gradient(90deg, #fd7e14, #dc3545);
        }
        
        .progress-fill.critical {
          background: linear-gradient(90deg, #dc3545, #6f42c1);
        }
        
        .health-indicator {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .health-indicator.excellent {
          background: #d4edda;
          color: #155724;
        }
        
        .health-indicator.good {
          background: #cdf0d0;
          color: #0f5132;
        }
        
        .health-indicator.warning {
          background: #fff3cd;
          color: #664d03;
        }
        
        .health-indicator.critical {
          background: #f8d7da;
          color: #721c24;
        }
        
        .system-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
        }
        
        .loading-placeholder {
          background: #f8f9fa;
          border-radius: 4px;
          height: 20px;
          animation: pulse 1.5s ease-in-out infinite;
        }
        
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
        
        .routerboard-info {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #dee2e6;
        }
        
        .uptime-display {
          font-size: 16px;
          font-weight: 600;
          color: #333;
          margin-bottom: 4px;
        }
      </style>
      
      <div class="router-panel">
        <div class="panel-header">
          <div class="header-content">
            <div class="router-title">
              <button class="back-button" id="back-button">
                ← Back to List
              </button>
              <div class="router-info">
                <h1 class="router-name">${this.router.name}</h1>
                <div class="router-details">
                  <span>IP: ${this.router.ip}</span>
                  ${this.router.version ? `<span>RouterOS: ${this.router.version}</span>` : ''}
                  <div class="connection-status">
                    <div id="connection-status" class="status-indicator online"></div>
                    <span id="connection-text">Connected</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="header-actions">
              <button class="logout-button" id="logout-button">
                Disconnect
              </button>
            </div>
          </div>
        </div>
        
        <div class="panel-nav">
          <div class="nav-content">
            <button class="tab-button active" data-tab="overview" id="overview-tab">
              Overview
            </button>
            <button class="tab-button" data-tab="wifi" id="wifi-tab">
              WiFi Interfaces
            </button>
            <button class="tab-button" data-tab="vpn" id="vpn-tab">
              VPN Configuration
            </button>
            <button class="tab-button" data-tab="firewall" id="firewall-tab">
              Firewall Management
            </button>
            <button class="tab-button" data-tab="dhcp" id="dhcp-tab">
              DHCP Management
            </button>
            <button class="tab-button" data-tab="network" id="network-tab">
              Network Monitoring
            </button>
            <button class="tab-button" data-tab="logs" id="logs-tab">
              System Logs
            </button>
          </div>
        </div>
        
        <div class="panel-content">
          <div id="panel-error" class="panel-error"></div>
          
          <div id="overview-content" class="tab-content active">
            <div class="overview-grid">
              ${this.renderOverviewCards()}
            </div>
          </div>
          
          <div id="wifi-content" class="tab-content">
            <!-- WiFi Manager will be loaded here -->
          </div>
          
          <div id="vpn-content" class="tab-content">
            <!-- VPN Manager will be loaded here -->
          </div>
          
          <div id="firewall-content" class="tab-content">
            <!-- Firewall Manager will be loaded here -->
          </div>
          
          <div id="dhcp-content" class="tab-content">
            <!-- DHCP Manager will be loaded here -->
          </div>
          
          <div id="network-content" class="tab-content">
            <!-- Network Monitor will be loaded here -->
          </div>
          
          <div id="logs-content" class="tab-content">
            <!-- Logs Viewer will be loaded here -->
          </div>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  /** Attaches event listeners */
  private attachEventListeners(): void {
    // Back button
    const backButton = document.getElementById('back-button');
    if (backButton) {
      backButton.addEventListener('click', () => {
        this.hide();
        if (this.onClose) {
          this.onClose();
        }
      });
    }

    // Logout button
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
      logoutButton.addEventListener('click', () => this.handleLogout());
    }

    // Tab buttons
    document.querySelectorAll('.tab-button').forEach(button => {
      button.addEventListener('click', () => {
        const tab = button.getAttribute('data-tab') as 'overview' | 'wifi' | 'vpn' | 'firewall' | 'dhcp' | 'network' | 'logs';
        if (tab) {
          this.switchTab(tab);
        }
      });
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isVisible) {
        this.hide();
        if (this.onClose) {
          this.onClose();
        }
      }
    });
  }

  /** Renders the overview cards with system information */
  private renderOverviewCards(): string {
    return `
      ${this.renderBasicInfoCard()}
      ${this.renderSystemResourcesCard()}
      ${this.renderRouterboardInfoCard()}
      ${this.renderConnectionCard()}
      ${this.renderFeaturesCard()}
    `;
  }

  /** Renders basic router information card */
  private renderBasicInfoCard(): string {
    return `
      <div class="info-card">
        <h3>Router Information</h3>
        <div class="info-item">
          <span class="info-label">Name:</span>
          <span class="info-value">${this.router.name}</span>
        </div>
        <div class="info-item">
          <span class="info-label">IP Address:</span>
          <span class="info-value">${this.router.ip}</span>
        </div>
        ${this.router.version ? `
          <div class="info-item">
            <span class="info-label">RouterOS Version:</span>
            <span class="info-value">${this.router.version}</span>
          </div>
        ` : ''}
        ${this.router.mac ? `
          <div class="info-item">
            <span class="info-label">MAC Address:</span>
            <span class="info-value">${this.router.mac}</span>
          </div>
        ` : ''}
        ${this.systemInfo ? `
          <div class="info-item">
            <span class="info-label">Architecture:</span>
            <span class="info-value">${this.systemInfo.architecture}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Platform:</span>
            <span class="info-value">${this.systemInfo.platform}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Uptime:</span>
            <span class="info-value">${this.systemInfo.uptimeFormatted}</span>
          </div>
        ` : ''}
      </div>
    `;
  }

  /** Renders system resources card */
  private renderSystemResourcesCard(): string {
    if (!this.systemInfo) {
      return `
        <div class="info-card">
          <h3>System Resources</h3>
          <div class="loading-placeholder"></div>
          <div class="loading-placeholder" style="margin-top: 8px;"></div>
          <div class="loading-placeholder" style="margin-top: 8px;"></div>
        </div>
      `;
    }

    return `
      <div class="metric-card">
        <h3>System Resources</h3>
        <div class="system-grid">
          <div>
            <div class="metric-header">
              <span class="metric-title">CPU Load</span>
              <span class="metric-icon">⚡</span>
            </div>
            <div class="metric-value">${this.systemInfo.cpuLoad}%</div>
            <div class="progress-bar">
              <div class="progress-fill ${getPercentageClass(this.systemInfo.cpuLoad)}" 
                   style="width: ${this.systemInfo.cpuLoad}%"></div>
            </div>
          </div>
          
          <div>
            <div class="metric-header">
              <span class="metric-title">Memory</span>
              <span class="metric-icon">💾</span>
            </div>
            <div class="metric-value">${this.systemInfo.memoryUsagePercent}%</div>
            <div class="metric-label">${formatBytes(this.systemInfo.totalMemory - this.systemInfo.freeMemory)} / ${formatBytes(this.systemInfo.totalMemory)}</div>
            <div class="progress-bar">
              <div class="progress-fill ${getPercentageClass(this.systemInfo.memoryUsagePercent)}" 
                   style="width: ${this.systemInfo.memoryUsagePercent}%"></div>
            </div>
          </div>
          
          <div>
            <div class="metric-header">
              <span class="metric-title">Storage</span>
              <span class="metric-icon">💿</span>
            </div>
            <div class="metric-value">${this.systemInfo.diskUsagePercent}%</div>
            <div class="metric-label">${formatBytes(this.systemInfo.totalHddSpace - this.systemInfo.freeHddSpace)} / ${formatBytes(this.systemInfo.totalHddSpace)}</div>
            <div class="progress-bar">
              <div class="progress-fill ${getPercentageClass(this.systemInfo.diskUsagePercent)}" 
                   style="width: ${this.systemInfo.diskUsagePercent}%"></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /** Renders routerboard information card */
  private renderRouterboardInfoCard(): string {
    if (!this.systemInfo && !this.routerboardInfo) {
      return `
        <div class="info-card">
          <h3>Hardware Information</h3>
          <div class="loading-placeholder"></div>
          <div class="loading-placeholder" style="margin-top: 8px;"></div>
        </div>
      `;
    }

    return `
      <div class="info-card">
        <h3>Hardware Information</h3>
        ${this.systemInfo ? `
          <div class="info-item">
            <span class="info-label">Board Name:</span>
            <span class="info-value">${this.systemInfo.boardName}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Build Time:</span>
            <span class="info-value">${this.systemInfo.buildTime}</span>
          </div>
        ` : ''}
        ${this.routerboardInfo ? `
          <div class="routerboard-info">
            ${this.routerboardInfo.model ? `
              <div class="info-item">
                <span class="info-label">Model:</span>
                <span class="info-value">${this.routerboardInfo.model}</span>
              </div>
            ` : ''}
            ${this.routerboardInfo.serialNumber ? `
              <div class="info-item">
                <span class="info-label">Serial Number:</span>
                <span class="info-value">${this.routerboardInfo.serialNumber}</span>
              </div>
            ` : ''}
            ${this.routerboardInfo.firmwareVersion ? `
              <div class="info-item">
                <span class="info-label">Firmware Version:</span>
                <span class="info-value">${this.routerboardInfo.firmwareVersion}</span>
              </div>
            ` : ''}
            ${this.routerboardInfo.currentFirmware ? `
              <div class="info-item">
                <span class="info-label">Current Firmware:</span>
                <span class="info-value">${this.routerboardInfo.currentFirmware}</span>
              </div>
            ` : ''}
          </div>
        ` : ''}
      </div>
    `;
  }

  /** Renders connection details card */
  private renderConnectionCard(): string {
    return `
      <div class="info-card">
        <h3>Connection Details</h3>
        <div class="info-item">
          <span class="info-label">Username:</span>
          <span class="info-value">${this.credentials.username}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Authentication:</span>
          <span class="info-value">HTTP Basic Auth</span>
        </div>
        <div class="info-item">
          <span class="info-label">API:</span>
          <span class="info-value">RouterOS REST API</span>
        </div>
      </div>
    `;
  }

  /** Renders available features card */
  private renderFeaturesCard(): string {
    return `
      <div class="info-card">
        <h3>Available Features</h3>
        <div class="info-item">
          <span class="info-label">WiFi Management:</span>
          <span class="info-value">✓ Available</span>
        </div>
        <div class="info-item">
          <span class="info-label">VPN Configuration:</span>
          <span class="info-value">✓ Available</span>
        </div>
        <div class="info-item">
          <span class="info-label">Firewall Management:</span>
          <span class="info-value">✓ Available</span>
        </div>
        <div class="info-item">
          <span class="info-label">DHCP Management:</span>
          <span class="info-value">✓ Available</span>
        </div>
        <div class="info-item">
          <span class="info-label">Network Monitoring:</span>
          <span class="info-value">✓ Available</span>
        </div>
        <div class="info-item">
          <span class="info-label">System Logs:</span>
          <span class="info-value">✓ Available</span>
        </div>
        <div class="info-item">
          <span class="info-label">System Monitoring:</span>
          <span class="info-value">✓ Available</span>
        </div>
        <div class="info-item">
          <span class="info-label">Security Profiles:</span>
          <span class="info-value">✓ Available</span>
        </div>
      </div>
    `;
  }
}