import type { DHCPServer, DHCPLease, DHCPPool, DHCPNetwork, DHCPStats } from '@/services/dhcp';
import { 
  getDHCPServers, 
  getDHCPLeases, 
  getDHCPPools,
  getDHCPNetworks,
  getDHCPStatistics,
  toggleDHCPServer,
  deleteDHCPServer,
  releaseDHCPLease,
  toggleDHCPLeaseBlocked,
  addDHCPServer,
  addStaticDHCPLease,
  addDHCPPool,
  addDHCPNetwork,
  getLeaseStatusColor,
  getServerStatusColor,
  formatLeaseExpiration,
  isValidIPAddress,
  isValidMACAddress,
  isValidIPRange
} from '@/services/dhcp';

/**
 * DHCP Manager Component
 * Comprehensive DHCP server management and client lease viewing
 */
export class DHCPManager {
  private container: HTMLElement;
  private dhcpServers: DHCPServer[] = [];
  private dhcpLeases: DHCPLease[] = [];
  private dhcpPools: DHCPPool[] = [];
  private dhcpNetworks: DHCPNetwork[] = [];
  private dhcpStats: DHCPStats | null = null;
  private routerIp = '';
  private isLoading = false;
  private currentView: 'servers' | 'leases' | 'pools' | 'networks' = 'servers';

  constructor(container: HTMLElement) {
    this.container = container;
  }

  /** Loads DHCP data for a router */
  public async loadDHCPData(routerIp: string): Promise<void> {
    this.routerIp = routerIp;
    this.setLoading(true);

    try {
      await this.loadCurrentView();
      await this.loadStatistics();
    } catch (error) {
      this.setLoading(false);
      this.showError(error instanceof Error ? error.message : 'Failed to load DHCP data');
    }
  }

  /** Loads data for the current view */
  private async loadCurrentView(): Promise<void> {
    try {
      switch (this.currentView) {
        case 'servers':
          await this.loadServers();
          break;
        case 'leases':
          await this.loadLeases();
          break;
        case 'pools':
          await this.loadPools();
          break;
        case 'networks':
          await this.loadNetworks();
          break;
      }
      
      this.setLoading(false);
      this.render();
    } catch (error) {
      this.setLoading(false);
      throw error;
    }
  }

  /** Load DHCP servers */
  private async loadServers(): Promise<void> {
    const result = await getDHCPServers(this.routerIp);
    
    if (result.success && result.data) {
      this.dhcpServers = result.data;
    } else {
      throw new Error(result.error || 'Failed to load DHCP servers');
    }
  }

  /** Load DHCP leases */
  private async loadLeases(): Promise<void> {
    const result = await getDHCPLeases(this.routerIp);
    
    if (result.success && result.data) {
      this.dhcpLeases = result.data;
    } else {
      throw new Error(result.error || 'Failed to load DHCP leases');
    }
  }

  /** Load DHCP pools */
  private async loadPools(): Promise<void> {
    const result = await getDHCPPools(this.routerIp);
    
    if (result.success && result.data) {
      this.dhcpPools = result.data;
    } else {
      throw new Error(result.error || 'Failed to load DHCP pools');
    }
  }

  /** Load DHCP networks */
  private async loadNetworks(): Promise<void> {
    const result = await getDHCPNetworks(this.routerIp);
    
    if (result.success && result.data) {
      this.dhcpNetworks = result.data;
    } else {
      throw new Error(result.error || 'Failed to load DHCP networks');
    }
  }

  /** Load DHCP statistics */
  private async loadStatistics(): Promise<void> {
    const result = await getDHCPStatistics(this.routerIp);
    
    if (result.success && result.data) {
      this.dhcpStats = result.data;
    }
  }

  /** Switch between different views */
  private switchView(view: 'servers' | 'leases' | 'pools' | 'networks'): void {
    this.currentView = view;
    this.loadCurrentView();
  }

  /** Toggle DHCP server enabled/disabled */
  private async toggleServer(serverId: string, enabled: boolean): Promise<void> {
    try {
      const result = await toggleDHCPServer(this.routerIp, serverId, enabled);

      if (result.success) {
        // Update local state
        const server = this.dhcpServers.find(s => s.id === serverId);
        if (server) {
          (server as any).disabled = !enabled;
        }
        
        this.render();
        this.showSuccess(`DHCP server ${enabled ? 'enabled' : 'disabled'} successfully`);
      } else {
        throw new Error(result.error || 'Failed to toggle DHCP server');
      }
    } catch (error) {
      this.showError(error instanceof Error ? error.message : 'Failed to toggle DHCP server');
    }
  }

  /** Delete DHCP server */
  private async deleteServer(serverId: string): Promise<void> {
    const confirmed = confirm('Are you sure you want to delete this DHCP server?');
    if (!confirmed) return;

    try {
      const result = await deleteDHCPServer(this.routerIp, serverId);

      if (result.success) {
        this.dhcpServers = this.dhcpServers.filter(s => s.id !== serverId);
        this.render();
        this.showSuccess('DHCP server deleted successfully');
      } else {
        throw new Error(result.error || 'Failed to delete DHCP server');
      }
    } catch (error) {
      this.showError(error instanceof Error ? error.message : 'Failed to delete DHCP server');
    }
  }

  /** Release DHCP lease */
  private async releaseLease(leaseId: string): Promise<void> {
    const confirmed = confirm('Are you sure you want to release this DHCP lease?');
    if (!confirmed) return;

    try {
      const result = await releaseDHCPLease(this.routerIp, leaseId);

      if (result.success) {
        this.dhcpLeases = this.dhcpLeases.filter(l => l.id !== leaseId);
        this.render();
        this.showSuccess('DHCP lease released successfully');
      } else {
        throw new Error(result.error || 'Failed to release DHCP lease');
      }
    } catch (error) {
      this.showError(error instanceof Error ? error.message : 'Failed to release DHCP lease');
    }
  }

  /** Toggle DHCP lease blocked state */
  private async toggleLeaseBlocked(leaseId: string, blocked: boolean): Promise<void> {
    try {
      const result = await toggleDHCPLeaseBlocked(this.routerIp, leaseId, blocked);

      if (result.success) {
        // Update local state
        const lease = this.dhcpLeases.find(l => l.id === leaseId);
        if (lease) {
          (lease as any).blocked = blocked;
        }
        
        this.render();
        this.showSuccess(`DHCP lease ${blocked ? 'blocked' : 'unblocked'} successfully`);
      } else {
        throw new Error(result.error || 'Failed to toggle DHCP lease block');
      }
    } catch (error) {
      this.showError(error instanceof Error ? error.message : 'Failed to toggle DHCP lease block');
    }
  }

  /** Show add server modal */
  private showAddServerModal(): void {
    this.showModal('Add DHCP Server', this.renderAddServerForm(), async (formData: any) => {
      try {
        const result = await addDHCPServer(this.routerIp, {
          name: formData.name,
          interface: formData.interface,
          addressPool: formData.addressPool,
          leaseTime: formData.leaseTime || '1d',
          authoritative: formData.authoritative || 'yes',
          comment: formData.comment,
        });

        if (result.success && result.data) {
          this.dhcpServers.push(result.data);
          this.render();
          this.showSuccess('DHCP server added successfully');
          return true;
        } else {
          throw new Error(result.error || 'Failed to add DHCP server');
        }
      } catch (error) {
        this.showError(error instanceof Error ? error.message : 'Failed to add DHCP server');
        return false;
      }
    });
  }

  /** Show add lease modal */
  private showAddLeaseModal(): void {
    this.showModal('Add Static Lease', this.renderAddLeaseForm(), async (formData: any) => {
      try {
        if (!isValidIPAddress(formData.address)) {
          throw new Error('Invalid IP address format');
        }
        if (!isValidMACAddress(formData.macAddress)) {
          throw new Error('Invalid MAC address format');
        }

        const result = await addStaticDHCPLease(this.routerIp, {
          address: formData.address,
          macAddress: formData.macAddress,
          hostname: formData.hostname,
          server: formData.server,
          comment: formData.comment,
        });

        if (result.success && result.data) {
          this.dhcpLeases.push(result.data);
          this.render();
          this.showSuccess('Static DHCP lease added successfully');
          return true;
        } else {
          throw new Error(result.error || 'Failed to add static DHCP lease');
        }
      } catch (error) {
        this.showError(error instanceof Error ? error.message : 'Failed to add static DHCP lease');
        return false;
      }
    });
  }

  /** Show add pool modal */
  private showAddPoolModal(): void {
    this.showModal('Add Address Pool', this.renderAddPoolForm(), async (formData: any) => {
      try {
        if (!isValidIPRange(formData.ranges)) {
          throw new Error('Invalid IP range format. Use format: 192.168.1.100-192.168.1.200 or 192.168.1.0/24');
        }

        const result = await addDHCPPool(this.routerIp, {
          name: formData.name,
          ranges: formData.ranges,
          comment: formData.comment,
        });

        if (result.success && result.data) {
          this.dhcpPools.push(result.data);
          this.render();
          this.showSuccess('Address pool added successfully');
          return true;
        } else {
          throw new Error(result.error || 'Failed to add address pool');
        }
      } catch (error) {
        this.showError(error instanceof Error ? error.message : 'Failed to add address pool');
        return false;
      }
    });
  }

  /** Show add network modal */
  private showAddNetworkModal(): void {
    this.showModal('Add DHCP Network', this.renderAddNetworkForm(), async (formData: any) => {
      try {
        if (!isValidIPRange(formData.address)) {
          throw new Error('Invalid network address format');
        }
        if (formData.gateway && !isValidIPAddress(formData.gateway)) {
          throw new Error('Invalid gateway IP address');
        }

        const result = await addDHCPNetwork(this.routerIp, {
          address: formData.address,
          gateway: formData.gateway,
          dnsServer: formData.dnsServer,
          domain: formData.domain,
          comment: formData.comment,
        });

        if (result.success && result.data) {
          this.dhcpNetworks.push(result.data);
          this.render();
          this.showSuccess('DHCP network added successfully');
          return true;
        } else {
          throw new Error(result.error || 'Failed to add DHCP network');
        }
      } catch (error) {
        this.showError(error instanceof Error ? error.message : 'Failed to add DHCP network');
        return false;
      }
    });
  }

  /** Refresh current view */
  private async refreshView(): Promise<void> {
    if (this.routerIp) {
      await this.loadCurrentView();
      await this.loadStatistics();
    }
  }

  /** Sets loading state */
  private setLoading(loading: boolean): void {
    this.isLoading = loading;
    if (loading) {
      this.container.innerHTML = `
        <div class="loading-container">
          <div class="loading-spinner"></div>
          <p>Loading DHCP data...</p>
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

  /** Shows modal dialog */
  private showModal(title: string, content: string, onSubmit: (data: any) => Promise<boolean>): void {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h3>${title}</h3>
          <button class="modal-close">×</button>
        </div>
        <div class="modal-body">
          ${content}
        </div>
        <div class="modal-footer">
          <button class="btn btn-cancel">Cancel</button>
          <button class="btn btn-primary">Submit</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Event listeners
    const closeModal = () => modal.remove();
    modal.querySelector('.modal-close')?.addEventListener('click', closeModal);
    modal.querySelector('.btn-cancel')?.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    modal.querySelector('.btn-primary')?.addEventListener('click', async () => {
      const form = modal.querySelector('form') as HTMLFormElement;
      if (form) {
        const formData = new FormData(form);
        const data: any = {};
        formData.forEach((value, key) => {
          data[key] = value;
        });

        const success = await onSubmit(data);
        if (success) {
          closeModal();
        }
      }
    });
  }

  /** Renders the DHCP manager */
  private render(): void {
    if (this.isLoading) {
      return;
    }

    this.container.innerHTML = `
      <style>
        .dhcp-manager {
          padding: 0;
        }
        
        .dhcp-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        
        .dhcp-title {
          font-size: 20px;
          font-weight: 600;
          color: #333;
          margin: 0;
        }
        
        .dhcp-actions {
          display: flex;
          gap: 12px;
        }
        
        .action-button {
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
        
        .action-button:hover {
          background: #0056b3;
        }
        
        .action-button.refresh {
          background: #28a745;
        }
        
        .action-button.refresh:hover {
          background: #1e7e34;
        }
        
        .action-button.add {
          background: #17a2b8;
        }
        
        .action-button.add:hover {
          background: #117a8b;
        }

        .stats-overview {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .stat-card {
          text-align: center;
          padding: 16px;
          background: white;
          border-radius: 6px;
          border: 1px solid #dee2e6;
        }

        .stat-value {
          font-size: 28px;
          font-weight: 700;
          color: #333;
          margin-bottom: 4px;
        }

        .stat-label {
          font-size: 12px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .view-tabs {
          display: flex;
          border-bottom: 1px solid #dee2e6;
          margin-bottom: 20px;
        }
        
        .view-tab {
          background: none;
          border: none;
          border-bottom: 3px solid transparent;
          padding: 12px 20px;
          font-size: 14px;
          font-weight: 500;
          color: #6c757d;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .view-tab:hover {
          color: #007bff;
          background: rgba(0, 123, 255, 0.05);
        }
        
        .view-tab.active {
          color: #007bff;
          border-bottom-color: #007bff;
        }
        
        .content-container {
          background: white;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          overflow: hidden;
        }
        
        .data-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .data-table th {
          background: #f8f9fa;
          border-bottom: 1px solid #dee2e6;
          padding: 12px;
          text-align: left;
          font-weight: 600;
          color: #333;
          font-size: 14px;
        }
        
        .data-table td {
          border-bottom: 1px solid #f8f9fa;
          padding: 12px;
          font-size: 14px;
          vertical-align: middle;
        }
        
        .data-table tr:hover {
          background: #f8f9fa;
        }
        
        .status-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
          color: white;
          text-transform: uppercase;
        }
        
        .item-actions {
          display: flex;
          gap: 8px;
        }
        
        .item-action-btn {
          background: none;
          border: 1px solid #dee2e6;
          border-radius: 4px;
          padding: 4px 8px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .item-action-btn:hover {
          background: #f8f9fa;
        }
        
        .item-action-btn.toggle {
          border-color: #28a745;
          color: #28a745;
        }
        
        .item-action-btn.toggle.disabled {
          border-color: #6c757d;
          color: #6c757d;
        }
        
        .item-action-btn.block {
          border-color: #ffc107;
          color: #ffc107;
        }
        
        .item-action-btn.delete,
        .item-action-btn.release {
          border-color: #dc3545;
          color: #dc3545;
        }
        
        .item-action-btn.delete:hover,
        .item-action-btn.release:hover {
          background: #dc3545;
          color: white;
        }
        
        .empty-state {
          text-align: center;
          color: #666;
          padding: 60px 20px;
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

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          z-index: 1200;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal {
          background: white;
          border-radius: 8px;
          width: 90%;
          max-width: 500px;
          max-height: 80vh;
          overflow: hidden;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid #dee2e6;
        }

        .modal-header h3 {
          margin: 0;
          color: #333;
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          padding: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-body {
          padding: 20px;
          max-height: 60vh;
          overflow-y: auto;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 16px 20px;
          border-top: 1px solid #dee2e6;
          background: #f8f9fa;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-label {
          display: block;
          margin-bottom: 4px;
          font-weight: 500;
          color: #333;
        }

        .form-input,
        .form-select {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #dee2e6;
          border-radius: 4px;
          font-size: 14px;
        }

        .form-input:focus,
        .form-select:focus {
          outline: none;
          border-color: #007bff;
          box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
        }

        .btn {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }

        .btn-primary {
          background: #007bff;
          color: white;
        }

        .btn-primary:hover {
          background: #0056b3;
        }

        .btn-cancel {
          background: #6c757d;
          color: white;
        }

        .btn-cancel:hover {
          background: #545b62;
        }
      </style>
      
      <div class="dhcp-manager">
        <div class="dhcp-header">
          <h2 class="dhcp-title">DHCP Management</h2>
          <div class="dhcp-actions">
            <button class="action-button refresh" id="refresh-dhcp">
              🔄 Refresh
            </button>
            <button class="action-button add" id="add-item">
              ➕ Add ${this.getAddButtonText()}
            </button>
          </div>
        </div>
        
        ${this.renderStatistics()}
        
        <div class="view-tabs">
          <button class="view-tab ${this.currentView === 'servers' ? 'active' : ''}" data-view="servers">
            DHCP Servers
          </button>
          <button class="view-tab ${this.currentView === 'leases' ? 'active' : ''}" data-view="leases">
            Client Leases
          </button>
          <button class="view-tab ${this.currentView === 'pools' ? 'active' : ''}" data-view="pools">
            Address Pools
          </button>
          <button class="view-tab ${this.currentView === 'networks' ? 'active' : ''}" data-view="networks">
            DHCP Networks
          </button>
        </div>
        
        ${this.renderCurrentView()}
      </div>
    `;

    this.attachEventListeners();
  }

  /** Renders statistics overview */
  private renderStatistics(): string {
    if (!this.dhcpStats) {
      return '';
    }

    return `
      <div class="stats-overview">
        <div class="stat-card">
          <div class="stat-value">${this.dhcpStats.totalServers}</div>
          <div class="stat-label">Total Servers</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${this.dhcpStats.activeServers}</div>
          <div class="stat-label">Active Servers</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${this.dhcpStats.totalLeases}</div>
          <div class="stat-label">Total Leases</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${this.dhcpStats.boundLeases}</div>
          <div class="stat-label">Bound Leases</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${this.dhcpStats.expiredLeases}</div>
          <div class="stat-label">Expired Leases</div>
        </div>
      </div>
    `;
  }

  /** Gets the appropriate add button text for current view */
  private getAddButtonText(): string {
    switch (this.currentView) {
      case 'servers': return 'Server';
      case 'leases': return 'Static Lease';
      case 'pools': return 'Pool';
      case 'networks': return 'Network';
      default: return 'Item';
    }
  }

  /** Renders the current view content */
  private renderCurrentView(): string {
    switch (this.currentView) {
      case 'servers':
        return this.renderServers();
      case 'leases':
        return this.renderLeases();
      case 'pools':
        return this.renderPools();
      case 'networks':
        return this.renderNetworks();
      default:
        return '';
    }
  }

  /** Renders DHCP servers */
  private renderServers(): string {
    if (this.dhcpServers.length === 0) {
      return `
        <div class="empty-state">
          <h3>No DHCP Servers</h3>
          <p>No DHCP servers configured on this router.</p>
        </div>
      `;
    }

    return `
      <div class="content-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Interface</th>
              <th>Address Pool</th>
              <th>Lease Time</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${this.dhcpServers.map(server => this.renderServerRow(server)).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  /** Renders DHCP leases */
  private renderLeases(): string {
    if (this.dhcpLeases.length === 0) {
      return `
        <div class="empty-state">
          <h3>No DHCP Leases</h3>
          <p>No DHCP client leases found.</p>
        </div>
      `;
    }

    return `
      <div class="content-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>IP Address</th>
              <th>MAC Address</th>
              <th>Hostname</th>
              <th>Server</th>
              <th>Status</th>
              <th>Expires</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${this.dhcpLeases.map(lease => this.renderLeaseRow(lease)).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  /** Renders DHCP pools */
  private renderPools(): string {
    if (this.dhcpPools.length === 0) {
      return `
        <div class="empty-state">
          <h3>No Address Pools</h3>
          <p>No DHCP address pools configured.</p>
        </div>
      `;
    }

    return `
      <div class="content-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>IP Ranges</th>
              <th>Next Pool</th>
              <th>Comment</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${this.dhcpPools.map(pool => this.renderPoolRow(pool)).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  /** Renders DHCP networks */
  private renderNetworks(): string {
    if (this.dhcpNetworks.length === 0) {
      return `
        <div class="empty-state">
          <h3>No DHCP Networks</h3>
          <p>No DHCP networks configured.</p>
        </div>
      `;
    }

    return `
      <div class="content-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Network</th>
              <th>Gateway</th>
              <th>DNS Server</th>
              <th>Domain</th>
              <th>Comment</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${this.dhcpNetworks.map(network => this.renderNetworkRow(network)).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  /** Renders a single DHCP server row */
  private renderServerRow(server: DHCPServer): string {
    const isDisabled = server.disabled;
    
    return `
      <tr>
        <td><strong>${server.name}</strong></td>
        <td>${server.interface}</td>
        <td>${server.addressPool}</td>
        <td>${server.leaseTime || 'Default'}</td>
        <td>
          <span class="status-badge" style="background-color: ${getServerStatusColor(server)}">
            ${isDisabled ? 'Disabled' : 'Active'}
          </span>
        </td>
        <td>
          <div class="item-actions">
            <button class="item-action-btn toggle ${isDisabled ? 'disabled' : ''}" 
                    data-server-id="${server.id}" 
                    data-enabled="${!isDisabled}">
              ${isDisabled ? 'Enable' : 'Disable'}
            </button>
            <button class="item-action-btn delete" 
                    data-server-id="${server.id}">
              Delete
            </button>
          </div>
        </td>
      </tr>
    `;
  }

  /** Renders a single DHCP lease row */
  private renderLeaseRow(lease: DHCPLease): string {
    return `
      <tr>
        <td><strong>${lease.address}</strong></td>
        <td><code>${lease.macAddress}</code></td>
        <td>${lease.hostname || '-'}</td>
        <td>${lease.server}</td>
        <td>
          <span class="status-badge" style="background-color: ${getLeaseStatusColor(lease.status)}">
            ${lease.status}
          </span>
          ${lease.blocked ? '<br><small style="color: #dc3545;">Blocked</small>' : ''}
        </td>
        <td>${formatLeaseExpiration(lease.expiresAfter)}</td>
        <td>
          <div class="item-actions">
            ${!lease.dynamic ? `
              <button class="item-action-btn block" 
                      data-lease-id="${lease.id}" 
                      data-blocked="${!lease.blocked}">
                ${lease.blocked ? 'Unblock' : 'Block'}
              </button>
            ` : ''}
            <button class="item-action-btn release" 
                    data-lease-id="${lease.id}">
              Release
            </button>
          </div>
        </td>
      </tr>
    `;
  }

  /** Renders a single pool row */
  private renderPoolRow(pool: DHCPPool): string {
    return `
      <tr>
        <td><strong>${pool.name}</strong></td>
        <td><code>${pool.ranges}</code></td>
        <td>${pool.nextPool || '-'}</td>
        <td>${pool.comment || '-'}</td>
        <td>
          <div class="item-actions">
            <button class="item-action-btn delete" 
                    data-pool-id="${pool.id}">
              Delete
            </button>
          </div>
        </td>
      </tr>
    `;
  }

  /** Renders a single network row */
  private renderNetworkRow(network: DHCPNetwork): string {
    return `
      <tr>
        <td><strong>${network.address}</strong></td>
        <td>${network.gateway || '-'}</td>
        <td>${network.dnsServer || '-'}</td>
        <td>${network.domain || '-'}</td>
        <td>${network.comment || '-'}</td>
        <td>
          <div class="item-actions">
            <button class="item-action-btn delete" 
                    data-network-id="${network.id}">
              Delete
            </button>
          </div>
        </td>
      </tr>
    `;
  }

  /** Renders add server form */
  private renderAddServerForm(): string {
    return `
      <form>
        <div class="form-group">
          <label class="form-label">Server Name *</label>
          <input type="text" name="name" class="form-input" required>
        </div>
        <div class="form-group">
          <label class="form-label">Interface *</label>
          <input type="text" name="interface" class="form-input" placeholder="e.g., bridge1" required>
        </div>
        <div class="form-group">
          <label class="form-label">Address Pool *</label>
          <input type="text" name="addressPool" class="form-input" placeholder="e.g., pool1" required>
        </div>
        <div class="form-group">
          <label class="form-label">Lease Time</label>
          <select name="leaseTime" class="form-select">
            <option value="1h">1 hour</option>
            <option value="6h">6 hours</option>
            <option value="12h">12 hours</option>
            <option value="1d" selected>1 day</option>
            <option value="3d">3 days</option>
            <option value="1w">1 week</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Authoritative</label>
          <select name="authoritative" class="form-select">
            <option value="yes" selected>Yes</option>
            <option value="no">No</option>
            <option value="after-2sec-delay">After 2sec delay</option>
            <option value="after-10sec-delay">After 10sec delay</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Comment</label>
          <input type="text" name="comment" class="form-input">
        </div>
      </form>
    `;
  }

  /** Renders add lease form */
  private renderAddLeaseForm(): string {
    return `
      <form>
        <div class="form-group">
          <label class="form-label">IP Address *</label>
          <input type="text" name="address" class="form-input" placeholder="192.168.1.100" required>
        </div>
        <div class="form-group">
          <label class="form-label">MAC Address *</label>
          <input type="text" name="macAddress" class="form-input" placeholder="00:11:22:33:44:55" required>
        </div>
        <div class="form-group">
          <label class="form-label">Hostname</label>
          <input type="text" name="hostname" class="form-input" placeholder="client1">
        </div>
        <div class="form-group">
          <label class="form-label">DHCP Server *</label>
          <input type="text" name="server" class="form-input" placeholder="server1" required>
        </div>
        <div class="form-group">
          <label class="form-label">Comment</label>
          <input type="text" name="comment" class="form-input">
        </div>
      </form>
    `;
  }

  /** Renders add pool form */
  private renderAddPoolForm(): string {
    return `
      <form>
        <div class="form-group">
          <label class="form-label">Pool Name *</label>
          <input type="text" name="name" class="form-input" placeholder="pool1" required>
        </div>
        <div class="form-group">
          <label class="form-label">IP Ranges *</label>
          <input type="text" name="ranges" class="form-input" placeholder="192.168.1.100-192.168.1.200" required>
          <small style="color: #666; font-size: 12px;">Format: 192.168.1.100-192.168.1.200 or 192.168.1.0/24</small>
        </div>
        <div class="form-group">
          <label class="form-label">Comment</label>
          <input type="text" name="comment" class="form-input">
        </div>
      </form>
    `;
  }

  /** Renders add network form */
  private renderAddNetworkForm(): string {
    return `
      <form>
        <div class="form-group">
          <label class="form-label">Network Address *</label>
          <input type="text" name="address" class="form-input" placeholder="192.168.1.0/24" required>
        </div>
        <div class="form-group">
          <label class="form-label">Gateway</label>
          <input type="text" name="gateway" class="form-input" placeholder="192.168.1.1">
        </div>
        <div class="form-group">
          <label class="form-label">DNS Server</label>
          <input type="text" name="dnsServer" class="form-input" placeholder="8.8.8.8,8.8.4.4">
        </div>
        <div class="form-group">
          <label class="form-label">Domain</label>
          <input type="text" name="domain" class="form-input" placeholder="local">
        </div>
        <div class="form-group">
          <label class="form-label">Comment</label>
          <input type="text" name="comment" class="form-input">
        </div>
      </form>
    `;
  }

  /** Attaches event listeners */
  private attachEventListeners(): void {
    // Refresh button
    const refreshButton = document.getElementById('refresh-dhcp');
    if (refreshButton) {
      refreshButton.addEventListener('click', () => this.refreshView());
    }

    // Add button
    const addButton = document.getElementById('add-item');
    if (addButton) {
      addButton.addEventListener('click', () => {
        switch (this.currentView) {
          case 'servers':
            this.showAddServerModal();
            break;
          case 'leases':
            this.showAddLeaseModal();
            break;
          case 'pools':
            this.showAddPoolModal();
            break;
          case 'networks':
            this.showAddNetworkModal();
            break;
        }
      });
    }

    // View tabs
    document.querySelectorAll('.view-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const view = tab.getAttribute('data-view') as 'servers' | 'leases' | 'pools' | 'networks';
        if (view) {
          this.switchView(view);
        }
      });
    });

    // Server action buttons
    document.querySelectorAll('[data-server-id]').forEach(button => {
      button.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const serverId = target.getAttribute('data-server-id');
        
        if (!serverId) return;

        if (target.classList.contains('toggle')) {
          const enabled = target.getAttribute('data-enabled') === 'false';
          this.toggleServer(serverId, enabled);
        } else if (target.classList.contains('delete')) {
          this.deleteServer(serverId);
        }
      });
    });

    // Lease action buttons
    document.querySelectorAll('[data-lease-id]').forEach(button => {
      button.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const leaseId = target.getAttribute('data-lease-id');
        
        if (!leaseId) return;

        if (target.classList.contains('block')) {
          const blocked = target.getAttribute('data-blocked') === 'true';
          this.toggleLeaseBlocked(leaseId, blocked);
        } else if (target.classList.contains('release')) {
          this.releaseLease(leaseId);
        }
      });
    });
  }
}