import type { 
  WireGuardInterface, 
  WireGuardPeer, 
  L2TPServer, 
  PPTPServer,
  SSTPServer,
  OpenVPNServer
} from '@shared/routeros';
import { 
  getVPNStatus,
  getWireGuardInterfaces,
  getWireGuardPeers,
  getL2TPServer,
  getPPTPServer,
  getSSTPServer,
  getOpenVPNServer,
  getVPNUsers,
  getActiveVPNConnections
} from '@/services/vpn';
import { VPNConfigDialog } from './VPNConfigDialog';

/**
 * VPN Manager Component
 * Manages VPN configurations and connections
 */
export class VPNManager {
  private container: HTMLElement;
  private routerIp = '';
  private vpnStatus: any = null;
  private wireguardInterfaces: WireGuardInterface[] = [];
  private wireguardPeers: WireGuardPeer[] = [];
  private vpnUsers: any[] = [];
  private activeConnections: any[] = [];
  private configDialog: VPNConfigDialog | null = null;
  private isLoading = false;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  /** Loads VPN configuration for a router */
  public async loadConfiguration(routerIp: string): Promise<void> {
    this.routerIp = routerIp;
    this.setLoading(true);

    try {
      // Load VPN status overview
      const statusResult = await getVPNStatus(routerIp);
      if (statusResult.success && statusResult.data) {
        this.vpnStatus = statusResult.data;
      } else {
        console.warn('Failed to load VPN status:', statusResult.error);
      }

      // Load detailed VPN configurations
      const [
        wireguardResult,
        peersResult,
        usersResult,
        connectionsResult
      ] = await Promise.all([
        getWireGuardInterfaces(routerIp),
        getWireGuardPeers(routerIp),
        getVPNUsers(routerIp),
        getActiveVPNConnections(routerIp)
      ]);

      if (wireguardResult.success && wireguardResult.data) {
        this.wireguardInterfaces = wireguardResult.data;
      }

      if (peersResult.success && peersResult.data) {
        this.wireguardPeers = peersResult.data;
      }

      if (usersResult.success && usersResult.data) {
        this.vpnUsers = usersResult.data;
      }

      if (connectionsResult.success && connectionsResult.data) {
        this.activeConnections = connectionsResult.data;
      }

      this.setLoading(false);
      this.render();
    } catch (error) {
      this.setLoading(false);
      this.showError(error instanceof Error ? error.message : 'Failed to load VPN configuration');
    }
  }

  /** Refreshes VPN configuration */
  private async refreshConfiguration(): Promise<void> {
    if (this.routerIp) {
      await this.loadConfiguration(this.routerIp);
    }
  }

  /** Opens VPN configuration dialog */
  private openConfigDialog(type: 'wireguard' | 'l2tp' | 'pptp' | 'sstp' | 'openvpn', data?: any): void {
    if (!this.configDialog) {
      const dialogContainer = document.createElement('div');
      document.body.appendChild(dialogContainer);
      this.configDialog = new VPNConfigDialog(dialogContainer);
    }

    this.configDialog.show(
      this.routerIp,
      type,
      data,
      () => {
        // On success, refresh the configuration
        this.refreshConfiguration();
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
          <p>Loading VPN configuration...</p>
        </div>
      `;
    }
  }

  /** Shows error message */
  private showError(message: string): void {
    this.showNotification(message, 'error');
  }

  /** Shows success message */
  private showSuccess(message: string): void {
    this.showNotification(message, 'success');
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

  /** Gets status indicator for VPN service */
  private getServiceStatus(enabled: boolean, count?: number): { text: string; className: string } {
    if (enabled) {
      if (count && count > 0) {
        return { text: `Active (${count})`, className: 'status-active' };
      } else {
        return { text: 'Enabled', className: 'status-enabled' };
      }
    } else {
      return { text: 'Disabled', className: 'status-disabled' };
    }
  }

  /** Renders the VPN manager */
  private render(): void {
    if (this.isLoading) {
      return;
    }

    this.container.innerHTML = `
      <style>
        .vpn-manager {
          padding: 0;
        }
        
        .vpn-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        
        .vpn-title {
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
        
        .vpn-overview {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
        
        .vpn-service-card {
          background: white;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          padding: 20px;
          transition: box-shadow 0.2s ease;
        }
        
        .vpn-service-card:hover {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .service-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }
        
        .service-name {
          font-size: 16px;
          font-weight: 600;
          color: #333;
          margin: 0;
        }
        
        .service-type {
          font-size: 11px;
          color: #666;
          text-transform: uppercase;
          font-weight: 500;
        }
        
        .service-status {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .status-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        
        .status-active .status-indicator {
          background: #28a745;
        }
        
        .status-enabled .status-indicator {
          background: #17a2b8;
        }
        
        .status-disabled .status-indicator {
          background: #6c757d;
        }
        
        .status-text {
          font-size: 11px;
          font-weight: 500;
          text-transform: uppercase;
        }
        
        .service-details {
          margin-bottom: 16px;
        }
        
        .service-detail {
          display: flex;
          justify-content: space-between;
          margin-bottom: 6px;
          font-size: 13px;
        }
        
        .service-detail:last-child {
          margin-bottom: 0;
        }
        
        .detail-label {
          color: #666;
        }
        
        .detail-value {
          color: #333;
          font-weight: 500;
        }
        
        .service-actions {
          display: flex;
          gap: 8px;
        }
        
        .action-button {
          border: none;
          border-radius: 4px;
          padding: 6px 12px;
          font-size: 11px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          text-transform: uppercase;
        }
        
        .action-button.configure {
          background: #007bff;
          color: white;
        }
        
        .action-button.configure:hover {
          background: #0056b3;
        }
        
        .action-button.manage {
          background: #28a745;
          color: white;
        }
        
        .action-button.manage:hover {
          background: #1e7e34;
        }
        
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: 30px 0 20px 0;
          padding-bottom: 8px;
          border-bottom: 1px solid #dee2e6;
        }
        
        .section-title {
          font-size: 18px;
          font-weight: 600;
          color: #333;
          margin: 0;
        }
        
        .add-button {
          background: #28a745;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 8px 16px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s ease;
          text-transform: uppercase;
        }
        
        .add-button:hover {
          background: #1e7e34;
        }
        
        .vpn-list {
          display: grid;
          gap: 16px;
        }
        
        .vpn-item {
          background: white;
          border: 1px solid #dee2e6;
          border-radius: 6px;
          padding: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .vpn-item-info {
          flex: 1;
        }
        
        .vpn-item-name {
          font-weight: 500;
          color: #333;
          margin: 0 0 4px 0;
        }
        
        .vpn-item-details {
          font-size: 12px;
          color: #666;
        }
        
        .vpn-item-actions {
          display: flex;
          gap: 8px;
        }
        
        .item-action-button {
          border: none;
          border-radius: 4px;
          padding: 4px 8px;
          font-size: 11px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .item-action-button.edit {
          background: #007bff;
          color: white;
        }
        
        .item-action-button.delete {
          background: #dc3545;
          color: white;
        }
        
        .empty-state {
          text-align: center;
          color: #666;
          padding: 40px 20px;
          background: white;
          border: 1px dashed #dee2e6;
          border-radius: 8px;
        }
        
        .empty-state h3 {
          margin: 0 0 8px 0;
          color: #333;
          font-size: 16px;
        }
        
        .empty-state p {
          margin: 0;
          font-size: 14px;
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
          z-index: 1200;
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
      
      <div class="vpn-manager">
        <div class="vpn-header">
          <h2 class="vpn-title">VPN Configuration</h2>
          <button class="refresh-button" id="refresh-vpn">
            🔄 Refresh
          </button>
        </div>
        
        ${this.renderVPNOverview()}
        ${this.renderWireGuardSection()}
        ${this.renderVPNUsersSection()}
        ${this.renderActiveConnectionsSection()}
      </div>
    `;

    this.attachEventListeners();
  }

  /** Renders VPN overview section */
  private renderVPNOverview(): string {
    if (!this.vpnStatus) {
      return '<div class="empty-state"><h3>VPN Status Unavailable</h3><p>Unable to load VPN service status</p></div>';
    }

    const wireguardStatus = this.getServiceStatus(
      this.vpnStatus.wireguard.interfaces > 0, 
      this.vpnStatus.wireguard.peers
    );
    
    const l2tpStatus = this.getServiceStatus(
      this.vpnStatus.l2tp.enabled,
      this.vpnStatus.l2tp.clients
    );

    return `
      <div class="vpn-overview">
        <div class="vpn-service-card">
          <div class="service-header">
            <div>
              <h3 class="service-name">WireGuard</h3>
              <p class="service-type">Modern VPN Protocol</p>
            </div>
            <div class="service-status ${wireguardStatus.className}">
              <div class="status-indicator"></div>
              <span class="status-text">${wireguardStatus.text}</span>
            </div>
          </div>
          <div class="service-details">
            <div class="service-detail">
              <span class="detail-label">Interfaces:</span>
              <span class="detail-value">${this.vpnStatus.wireguard.interfaces}</span>
            </div>
            <div class="service-detail">
              <span class="detail-label">Peers:</span>
              <span class="detail-value">${this.vpnStatus.wireguard.peers}</span>
            </div>
          </div>
          <div class="service-actions">
            <button class="action-button configure" data-action="configure" data-type="wireguard">
              Configure
            </button>
          </div>
        </div>
        
        <div class="vpn-service-card">
          <div class="service-header">
            <div>
              <h3 class="service-name">L2TP/IPSec</h3>
              <p class="service-type">Legacy VPN Protocol</p>
            </div>
            <div class="service-status ${l2tpStatus.className}">
              <div class="status-indicator"></div>
              <span class="status-text">${l2tpStatus.text}</span>
            </div>
          </div>
          <div class="service-details">
            <div class="service-detail">
              <span class="detail-label">Server:</span>
              <span class="detail-value">${this.vpnStatus.l2tp.enabled ? 'Enabled' : 'Disabled'}</span>
            </div>
            <div class="service-detail">
              <span class="detail-label">Clients:</span>
              <span class="detail-value">${this.vpnStatus.l2tp.clients}</span>
            </div>
          </div>
          <div class="service-actions">
            <button class="action-button configure" data-action="configure" data-type="l2tp">
              Configure
            </button>
          </div>
        </div>
        
        <div class="vpn-service-card">
          <div class="service-header">
            <div>
              <h3 class="service-name">OpenVPN</h3>
              <p class="service-type">Open Source VPN</p>
            </div>
            <div class="service-status ${this.getServiceStatus(this.vpnStatus.ovpn.enabled).className}">
              <div class="status-indicator"></div>
              <span class="status-text">${this.getServiceStatus(this.vpnStatus.ovpn.enabled).text}</span>
            </div>
          </div>
          <div class="service-details">
            <div class="service-detail">
              <span class="detail-label">Server:</span>
              <span class="detail-value">${this.vpnStatus.ovpn.enabled ? 'Enabled' : 'Disabled'}</span>
            </div>
          </div>
          <div class="service-actions">
            <button class="action-button configure" data-action="configure" data-type="openvpn">
              Configure
            </button>
          </div>
        </div>
        
        <div class="vpn-service-card">
          <div class="service-header">
            <div>
              <h3 class="service-name">PPTP</h3>
              <p class="service-type">Legacy Protocol</p>
            </div>
            <div class="service-status ${this.getServiceStatus(this.vpnStatus.pptp.enabled).className}">
              <div class="status-indicator"></div>
              <span class="status-text">${this.getServiceStatus(this.vpnStatus.pptp.enabled).text}</span>
            </div>
          </div>
          <div class="service-details">
            <div class="service-detail">
              <span class="detail-label">Security:</span>
              <span class="detail-value">⚠️ Weak</span>
            </div>
          </div>
          <div class="service-actions">
            <button class="action-button configure" data-action="configure" data-type="pptp">
              Configure
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /** Renders WireGuard section */
  private renderWireGuardSection(): string {
    return `
      <div class="section-header">
        <h3 class="section-title">WireGuard Interfaces</h3>
        <button class="add-button" data-action="add" data-type="wireguard">
          + Add Interface
        </button>
      </div>
      <div class="vpn-list">
        ${this.wireguardInterfaces.length === 0 ? 
          '<div class="empty-state"><h3>No WireGuard Interfaces</h3><p>Create a WireGuard interface to get started</p></div>' :
          this.wireguardInterfaces.map(iface => this.renderWireGuardInterface(iface)).join('')
        }
      </div>
    `;
  }

  /** Renders a WireGuard interface */
  private renderWireGuardInterface(iface: WireGuardInterface): string {
    const peers = this.wireguardPeers.filter(peer => peer.interface === iface.name);
    
    return `
      <div class="vpn-item">
        <div class="vpn-item-info">
          <h4 class="vpn-item-name">${iface.name}</h4>
          <div class="vpn-item-details">
            Port: ${iface.listenPort || 'Auto'} | Peers: ${peers.length} | 
            Status: ${iface.disabled ? 'Disabled' : 'Enabled'}
          </div>
        </div>
        <div class="vpn-item-actions">
          <button class="item-action-button edit" data-action="edit" data-type="wireguard" data-id="${iface.name}">
            Edit
          </button>
          <button class="item-action-button manage" data-action="manage-peers" data-interface="${iface.name}">
            Peers
          </button>
        </div>
      </div>
    `;
  }

  /** Renders VPN users section */
  private renderVPNUsersSection(): string {
    return `
      <div class="section-header">
        <h3 class="section-title">VPN Users</h3>
        <button class="add-button" data-action="add" data-type="user">
          + Add User
        </button>
      </div>
      <div class="vpn-list">
        ${this.vpnUsers.length === 0 ? 
          '<div class="empty-state"><h3>No VPN Users</h3><p>Create VPN users to allow connections</p></div>' :
          this.vpnUsers.map(user => this.renderVPNUser(user)).join('')
        }
      </div>
    `;
  }

  /** Renders a VPN user */
  private renderVPNUser(user: any): string {
    return `
      <div class="vpn-item">
        <div class="vpn-item-info">
          <h4 class="vpn-item-name">${user.name}</h4>
          <div class="vpn-item-details">
            Service: ${user.service || 'Any'} | 
            Profile: ${user.profile || 'Default'} | 
            Status: ${user.disabled ? 'Disabled' : 'Enabled'}
          </div>
        </div>
        <div class="vpn-item-actions">
          <button class="item-action-button edit" data-action="edit" data-type="user" data-id="${user.name}">
            Edit
          </button>
          <button class="item-action-button delete" data-action="delete" data-type="user" data-id="${user.name}">
            Delete
          </button>
        </div>
      </div>
    `;
  }

  /** Renders active connections section */
  private renderActiveConnectionsSection(): string {
    return `
      <div class="section-header">
        <h3 class="section-title">Active Connections (${this.activeConnections.length})</h3>
      </div>
      <div class="vpn-list">
        ${this.activeConnections.length === 0 ? 
          '<div class="empty-state"><h3>No Active Connections</h3><p>No users are currently connected</p></div>' :
          this.activeConnections.map(conn => this.renderActiveConnection(conn)).join('')
        }
      </div>
    `;
  }

  /** Renders an active connection */
  private renderActiveConnection(conn: any): string {
    return `
      <div class="vpn-item">
        <div class="vpn-item-info">
          <h4 class="vpn-item-name">${conn.name}</h4>
          <div class="vpn-item-details">
            Address: ${conn.address || 'N/A'} | 
            Uptime: ${conn.uptime || 'N/A'} | 
            Service: ${conn.service || 'Unknown'}
          </div>
        </div>
        <div class="vpn-item-actions">
          <button class="item-action-button delete" data-action="disconnect" data-id="${conn['.id']}">
            Disconnect
          </button>
        </div>
      </div>
    `;
  }

  /** Attaches event listeners */
  private attachEventListeners(): void {
    // Refresh button
    const refreshButton = document.getElementById('refresh-vpn');
    if (refreshButton) {
      refreshButton.addEventListener('click', () => this.refreshConfiguration());
    }

    // Action buttons
    document.querySelectorAll('[data-action]').forEach(button => {
      button.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const action = target.getAttribute('data-action');
        const type = target.getAttribute('data-type');
        const id = target.getAttribute('data-id');
        
        this.handleAction(action, type, id);
      });
    });
  }

  /** Handles button actions */
  private handleAction(action: string | null, type: string | null, id: string | null): void {
    switch (action) {
      case 'configure':
        if (type) {
          this.openConfigDialog(type as any);
        }
        break;
      case 'add':
        if (type) {
          this.openConfigDialog(type as any);
        }
        break;
      case 'edit':
        if (type && id) {
          const data = this.getItemData(type, id);
          this.openConfigDialog(type as any, data);
        }
        break;
      case 'manage-peers':
        // TODO: Implement peer management
        this.showSuccess('Peer management coming soon');
        break;
      case 'delete':
        if (type && id) {
          this.handleDelete(type, id);
        }
        break;
      case 'disconnect':
        if (id) {
          this.handleDisconnect(id);
        }
        break;
    }
  }

  /** Gets item data for editing */
  private getItemData(type: string, id: string): any {
    switch (type) {
      case 'wireguard':
        return this.wireguardInterfaces.find(iface => iface.name === id);
      case 'user':
        return this.vpnUsers.find(user => user.name === id);
      default:
        return null;
    }
  }

  /** Handles delete action */
  private async handleDelete(type: string, id: string): Promise<void> {
    const confirmed = confirm(`Are you sure you want to delete this ${type}?`);
    if (confirmed) {
      this.showSuccess(`Deleting ${type}... (functionality coming soon)`);
    }
  }

  /** Handles disconnect action */
  private async handleDisconnect(connectionId: string): Promise<void> {
    const confirmed = confirm('Are you sure you want to disconnect this user?');
    if (confirmed) {
      this.showSuccess('Disconnecting user... (functionality coming soon)');
    }
  }
}