import type { WirelessInterface, WirelessSecurityProfile } from '@shared/routeros';
import { 
  getWirelessInterfaces,
  getSecurityProfiles,
  toggleWirelessInterface
} from '@/services/wireless';
import { WiFiConfigDialog } from './WiFiConfigDialog';

/**
 * WiFi Manager Component
 * Manages wireless interfaces and their configurations
 */
export class WiFiManager {
  private container: HTMLElement;
  private interfaces: WirelessInterface[] = [];
  private securityProfiles: WirelessSecurityProfile[] = [];
  private configDialog: WiFiConfigDialog | null = null;
  private routerIp = '';
  private isLoading = false;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  /** Loads wireless interfaces for a router */
  public async loadInterfaces(routerIp: string): Promise<void> {
    this.routerIp = routerIp;
    this.setLoading(true);

    try {
      // Load wireless interfaces and security profiles
      const [interfacesResult, profilesResult] = await Promise.all([
        getWirelessInterfaces(routerIp),
        getSecurityProfiles(routerIp)
      ]);

      if (interfacesResult.success && interfacesResult.data) {
        this.interfaces = interfacesResult.data;
      } else {
        throw new Error(interfacesResult.error || 'Failed to load wireless interfaces');
      }

      if (profilesResult.success && profilesResult.data) {
        this.securityProfiles = profilesResult.data;
      } else {
        console.warn('Failed to load security profiles:', profilesResult.error);
        this.securityProfiles = [];
      }

      this.setLoading(false);
      this.render();
    } catch (error) {
      this.setLoading(false);
      this.showError(error instanceof Error ? error.message : 'Failed to load interfaces');
    }
  }

  /** Refreshes the interface list */
  private async refreshInterfaces(): Promise<void> {
    if (this.routerIp) {
      await this.loadInterfaces(this.routerIp);
    }
  }

  /** Toggles interface enabled/disabled state */
  private async toggleInterface(interfaceId: string, enabled: boolean): Promise<void> {
    try {
      const result = await toggleWirelessInterface(this.routerIp, interfaceId, enabled);
      
      if (result.success) {
        // Update local state
        const iface = this.interfaces.find(i => i.name === interfaceId);
        if (iface) {
          (iface as any).disabled = !enabled;
        }
        
        this.render();
        this.showSuccess(`Interface ${interfaceId} ${enabled ? 'enabled' : 'disabled'} successfully`);
      } else {
        throw new Error(result.error || 'Failed to toggle interface');
      }
    } catch (error) {
      this.showError(error instanceof Error ? error.message : 'Failed to toggle interface');
    }
  }

  /** Opens configuration dialog for an interface */
  private openConfigDialog(interfaceId: string): void {
    const iface = this.interfaces.find(i => i.name === interfaceId);
    if (!iface) {
      this.showError('Interface not found');
      return;
    }

    if (!this.configDialog) {
      const dialogContainer = document.createElement('div');
      document.body.appendChild(dialogContainer);
      this.configDialog = new WiFiConfigDialog(dialogContainer);
    }

    this.configDialog.show(
      this.routerIp,
      iface,
      this.securityProfiles,
      () => {
        // On success, refresh the interface list
        this.refreshInterfaces();
      }
    );
  }

  /** Sets loading state */
  private setLoading(loading: boolean): void {
    this.isLoading = loading;
    if (loading) {
      this.container.innerHTML = `
        <div class="loading-container">
          <div class="loading-spinner"></div>
          <p>Loading wireless interfaces...</p>
        </div>
      `;
    }
  }

  /** Shows success message */
  private showSuccess(message: string): void {
    this.showNotification(message, 'success');
  }

  /** Shows error message */
  private showError(message: string): void {
    this.showNotification(message, 'error');
  }

  /** Shows notification */
  private showNotification(message: string, type: 'success' | 'error'): void {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
      <span>${message}</span>
      <button class="notification-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 5000);
  }

  /** Gets interface status text */
  private getInterfaceStatus(iface: WirelessInterface): { text: string; className: string } {
    if (iface.disabled) {
      return { text: 'Disabled', className: 'status-disabled' };
    } else if (iface.running) {
      return { text: 'Running', className: 'status-running' };
    } else {
      return { text: 'Stopped', className: 'status-stopped' };
    }
  }

  /** Gets security profile name for an interface */
  private getSecurityProfileName(interfaceId: string): string {
    const iface = this.interfaces.find(i => i.name === interfaceId);
    if (!iface || !(iface as any).securityProfile) {
      return 'None';
    }

    const profile = this.securityProfiles.find(p => p.name === (iface as any).securityProfile);
    return profile ? profile.name : (iface as any).securityProfile;
  }

  /** Renders the WiFi manager */
  private render(): void {
    if (this.isLoading) {
      return;
    }

    this.container.innerHTML = `
      <style>
        .wifi-manager {
          padding: 0;
        }
        
        .wifi-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        
        .wifi-title {
          font-size: 20px;
          font-weight: 600;
          color: #333;
          margin: 0;
        }
        
        .refresh-button {
          background: #007bff;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 8px 16px;
          font-size: 14px;
          cursor: pointer;
          transition: background-color 0.2s ease;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .refresh-button:hover {
          background: #0056b3;
        }
        
        .interfaces-grid {
          display: grid;
          gap: 20px;
        }
        
        .interface-card {
          background: white;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          padding: 20px;
          transition: box-shadow 0.2s ease;
        }
        
        .interface-card:hover {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .interface-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }
        
        .interface-name {
          font-size: 18px;
          font-weight: 600;
          color: #333;
          margin: 0 0 4px 0;
        }
        
        .interface-type {
          font-size: 12px;
          color: #666;
          text-transform: uppercase;
          font-weight: 500;
        }
        
        .interface-status {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .status-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        
        .status-running .status-indicator {
          background: #28a745;
        }
        
        .status-stopped .status-indicator {
          background: #ffc107;
        }
        
        .status-disabled .status-indicator {
          background: #6c757d;
        }
        
        .status-text {
          font-size: 12px;
          font-weight: 500;
          text-transform: uppercase;
        }
        
        .interface-details {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 20px;
        }
        
        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .detail-label {
          font-size: 12px;
          color: #666;
          text-transform: uppercase;
          font-weight: 500;
        }
        
        .detail-value {
          font-size: 14px;
          color: #333;
          font-weight: 500;
        }
        
        .detail-value.monospace {
          font-family: monospace;
        }
        
        .interface-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        
        .action-button {
          border: none;
          border-radius: 6px;
          padding: 6px 12px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .action-button.configure {
          background: #007bff;
          color: white;
        }
        
        .action-button.configure:hover {
          background: #0056b3;
        }
        
        .action-button.toggle {
          background: #28a745;
          color: white;
        }
        
        .action-button.toggle.disable {
          background: #6c757d;
        }
        
        .action-button.toggle:hover {
          opacity: 0.9;
        }
        
        .empty-state {
          text-align: center;
          color: #666;
          padding: 60px 20px;
          background: white;
          border: 1px dashed #dee2e6;
          border-radius: 8px;
        }
        
        .empty-state h3 {
          margin: 0 0 8px 0;
          color: #333;
        }
        
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          color: #666;
        }
        
        .loading-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid #f3f3f3;
          border-top: 3px solid #007bff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .notification {
          position: fixed;
          top: 20px;
          right: 20px;
          padding: 12px 20px;
          border-radius: 6px;
          color: white;
          font-size: 14px;
          z-index: 1100;
          display: flex;
          align-items: center;
          gap: 10px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }
        
        .notification.success {
          background: #28a745;
        }
        
        .notification.error {
          background: #dc3545;
        }
        
        .notification-close {
          background: none;
          border: none;
          color: white;
          font-size: 16px;
          cursor: pointer;
          padding: 0;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      </style>
      
      <div class="wifi-manager">
        <div class="wifi-header">
          <h2 class="wifi-title">Wireless Interfaces</h2>
          <button class="refresh-button" id="refresh-interfaces">
            🔄 Refresh
          </button>
        </div>
        
        <div class="interfaces-grid">
          ${this.interfaces.length === 0 ? this.renderEmptyState() : this.interfaces.map(iface => this.renderInterface(iface)).join('')}
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  /** Renders empty state */
  private renderEmptyState(): string {
    return `
      <div class="empty-state">
        <h3>No Wireless Interfaces Found</h3>
        <p>This router doesn't have any configured wireless interfaces.</p>
      </div>
    `;
  }

  /** Renders a single interface */
  private renderInterface(iface: WirelessInterface): string {
    const status = this.getInterfaceStatus(iface);
    const securityProfile = this.getSecurityProfileName(iface.name);
    
    return `
      <div class="interface-card">
        <div class="interface-header">
          <div>
            <h3 class="interface-name">${iface.name}</h3>
            <p class="interface-type">${iface.mode || 'Unknown Mode'}</p>
          </div>
          <div class="interface-status ${status.className}">
            <div class="status-indicator"></div>
            <span class="status-text">${status.text}</span>
          </div>
        </div>
        
        <div class="interface-details">
          <div class="detail-item">
            <span class="detail-label">SSID</span>
            <span class="detail-value">${iface.ssid || 'Not Set'}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Frequency</span>
            <span class="detail-value monospace">${iface.frequency || 'Auto'}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Security</span>
            <span class="detail-value">${securityProfile}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Band</span>
            <span class="detail-value">${iface.band || 'Unknown'}</span>
          </div>
          ${iface.txPower ? `
            <div class="detail-item">
              <span class="detail-label">TX Power</span>
              <span class="detail-value monospace">${iface.txPower} dBm</span>
            </div>
          ` : ''}
          ${(iface as any).macAddress ? `
            <div class="detail-item">
              <span class="detail-label">MAC Address</span>
              <span class="detail-value monospace">${(iface as any).macAddress}</span>
            </div>
          ` : ''}
        </div>
        
        <div class="interface-actions">
          <button class="action-button configure" data-interface="${iface.name}" data-action="configure">
            Configure
          </button>
          <button class="action-button toggle ${iface.disabled ? '' : 'disable'}" 
                  data-interface="${iface.name}" 
                  data-action="toggle" 
                  data-enabled="${!iface.disabled}">
            ${iface.disabled ? 'Enable' : 'Disable'}
          </button>
        </div>
      </div>
    `;
  }

  /** Attaches event listeners */
  private attachEventListeners(): void {
    // Refresh button
    const refreshButton = document.getElementById('refresh-interfaces');
    if (refreshButton) {
      refreshButton.addEventListener('click', () => this.refreshInterfaces());
    }

    // Interface action buttons
    document.querySelectorAll('[data-action]').forEach(button => {
      button.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const action = target.getAttribute('data-action');
        const interfaceId = target.getAttribute('data-interface');
        
        if (!interfaceId) return;

        switch (action) {
          case 'configure':
            this.openConfigDialog(interfaceId);
            break;
          case 'toggle': {
            const enabled = target.getAttribute('data-enabled') === 'false';
            this.toggleInterface(interfaceId, enabled);
            break;
          }
        }
      });
    });
  }
}