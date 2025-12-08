import type { NetworkInterface, IPAddress, Route, ARPEntry, NetworkStats } from '@/services/network';
import { 
  getIPAddresses, 
  getRoutes, 
  getARPTable,
  getNetworkStatistics,
  getInterfaceStats,
  toggleNetworkInterface,
  addStaticRoute,
  deleteRoute,
  addStaticARPEntry,
  deleteARPEntry,
  getInterfaceStatusColor,
  getInterfaceStatusText,
  getRouteTypeDisplay,
  getRouteTypeColor,
  formatBytes,
  sortInterfacesByName,
  isValidIPAddress,
  isValidMACAddress,
  isValidCIDR
} from '@/services/network';

/**
 * Network Monitor Component
 * Comprehensive network monitoring dashboard with real-time statistics
 */
export class NetworkMonitor {
  private container: HTMLElement;
  private interfaces: NetworkInterface[] = [];
  private ipAddresses: IPAddress[] = [];
  private routes: Route[] = [];
  private arpEntries: ARPEntry[] = [];
  private networkStats: NetworkStats | null = null;
  private routerIp = '';
  private isLoading = false;
  private currentView: 'interfaces' | 'addresses' | 'routes' | 'arp' = 'interfaces';
  private refreshInterval: number | null = null;
  private autoRefresh = true;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  /** Loads network monitoring data for a router */
  public async loadNetworkData(routerIp: string): Promise<void> {
    this.routerIp = routerIp;
    this.setLoading(true);

    try {
      await this.loadCurrentView();
      await this.loadStatistics();
      this.startAutoRefresh();
    } catch (error) {
      this.setLoading(false);
      this.showError(error instanceof Error ? error.message : 'Failed to load network data');
    }
  }

  /** Cleanup when component is destroyed */
  public cleanup(): void {
    this.stopAutoRefresh();
  }

  /** Loads data for the current view */
  private async loadCurrentView(): Promise<void> {
    try {
      switch (this.currentView) {
        case 'interfaces':
          await this.loadInterfaces();
          break;
        case 'addresses':
          await this.loadIPAddresses();
          break;
        case 'routes':
          await this.loadRoutes();
          break;
        case 'arp':
          await this.loadARPTable();
          break;
      }
      
      this.setLoading(false);
      this.render();
    } catch (error) {
      this.setLoading(false);
      throw error;
    }
  }

  /** Load network interfaces with statistics */
  private async loadInterfaces(): Promise<void> {
    const result = await getInterfaceStats(this.routerIp);
    
    if (result.success && result.data) {
      this.interfaces = sortInterfacesByName(result.data);
    } else {
      throw new Error(result.error || 'Failed to load network interfaces');
    }
  }

  /** Load IP addresses */
  private async loadIPAddresses(): Promise<void> {
    const result = await getIPAddresses(this.routerIp);
    
    if (result.success && result.data) {
      this.ipAddresses = result.data;
    } else {
      throw new Error(result.error || 'Failed to load IP addresses');
    }
  }

  /** Load routing table */
  private async loadRoutes(): Promise<void> {
    const result = await getRoutes(this.routerIp);
    
    if (result.success && result.data) {
      this.routes = result.data;
    } else {
      throw new Error(result.error || 'Failed to load routing table');
    }
  }

  /** Load ARP table */
  private async loadARPTable(): Promise<void> {
    const result = await getARPTable(this.routerIp);
    
    if (result.success && result.data) {
      this.arpEntries = result.data;
    } else {
      throw new Error(result.error || 'Failed to load ARP table');
    }
  }

  /** Load network statistics */
  private async loadStatistics(): Promise<void> {
    const result = await getNetworkStatistics(this.routerIp);
    
    if (result.success && result.data) {
      this.networkStats = result.data;
    }
  }

  /** Switch between different views */
  private switchView(view: 'interfaces' | 'addresses' | 'routes' | 'arp'): void {
    this.currentView = view;
    this.loadCurrentView();
  }

  /** Start auto-refresh */
  private startAutoRefresh(): void {
    if (this.autoRefresh && !this.refreshInterval) {
      this.refreshInterval = window.setInterval(() => {
        this.refreshView();
      }, 10000); // Refresh every 10 seconds
    }
  }

  /** Stop auto-refresh */
  private stopAutoRefresh(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  /** Toggle auto-refresh */
  private toggleAutoRefresh(): void {
    this.autoRefresh = !this.autoRefresh;
    
    if (this.autoRefresh) {
      this.startAutoRefresh();
    } else {
      this.stopAutoRefresh();
    }
    
    this.updateAutoRefreshButton();
  }

  /** Update auto-refresh button state */
  private updateAutoRefreshButton(): void {
    const button = document.getElementById('toggle-auto-refresh');
    if (button) {
      button.textContent = this.autoRefresh ? '⏸️ Pause Auto-Refresh' : '▶️ Start Auto-Refresh';
      button.classList.toggle('active', this.autoRefresh);
    }
  }

  /** Toggle network interface enabled/disabled */
  private async toggleInterface(interfaceId: string, enabled: boolean): Promise<void> {
    try {
      const result = await toggleNetworkInterface(this.routerIp, interfaceId, enabled);

      if (result.success) {
        // Update local state
        const iface = this.interfaces.find(i => i.id === interfaceId);
        if (iface) {
          (iface as any).disabled = !enabled;
        }
        
        this.render();
        this.showSuccess(`Interface ${enabled ? 'enabled' : 'disabled'} successfully`);
      } else {
        throw new Error(result.error || 'Failed to toggle interface');
      }
    } catch (error) {
      this.showError(error instanceof Error ? error.message : 'Failed to toggle interface');
    }
  }

  /** Delete route */
  private async deleteRouteEntry(routeId: string): Promise<void> {
    const confirmed = confirm('Are you sure you want to delete this route?');
    if (!confirmed) return;

    try {
      const result = await deleteRoute(this.routerIp, routeId);

      if (result.success) {
        this.routes = this.routes.filter(r => r.id !== routeId);
        this.render();
        this.showSuccess('Route deleted successfully');
      } else {
        throw new Error(result.error || 'Failed to delete route');
      }
    } catch (error) {
      this.showError(error instanceof Error ? error.message : 'Failed to delete route');
    }
  }

  /** Delete ARP entry */
  private async deleteARPEntryItem(address: string): Promise<void> {
    const confirmed = confirm('Are you sure you want to delete this ARP entry?');
    if (!confirmed) return;

    try {
      const result = await deleteARPEntry(this.routerIp, address);

      if (result.success) {
        this.arpEntries = this.arpEntries.filter(a => a.address !== address);
        this.render();
        this.showSuccess('ARP entry deleted successfully');
      } else {
        throw new Error(result.error || 'Failed to delete ARP entry');
      }
    } catch (error) {
      this.showError(error instanceof Error ? error.message : 'Failed to delete ARP entry');
    }
  }

  /** Show add route modal */
  private showAddRouteModal(): void {
    this.showModal('Add Static Route', this.renderAddRouteForm(), async (formData: any) => {
      try {
        if (!isValidCIDR(formData.dstAddress) && !isValidIPAddress(formData.dstAddress)) {
          throw new Error('Invalid destination address format');
        }
        if (formData.gateway && !isValidIPAddress(formData.gateway)) {
          throw new Error('Invalid gateway IP address');
        }

        const result = await addStaticRoute(this.routerIp, {
          dstAddress: formData.dstAddress,
          gateway: formData.gateway,
          interface: formData.interface,
          distance: formData.distance ? parseInt(formData.distance) : undefined,
          comment: formData.comment,
        });

        if (result.success && result.data) {
          this.routes.push(result.data);
          this.render();
          this.showSuccess('Static route added successfully');
          return true;
        } else {
          throw new Error(result.error || 'Failed to add static route');
        }
      } catch (error) {
        this.showError(error instanceof Error ? error.message : 'Failed to add static route');
        return false;
      }
    });
  }

  /** Show add ARP entry modal */
  private showAddARPModal(): void {
    this.showModal('Add Static ARP Entry', this.renderAddARPForm(), async (formData: any) => {
      try {
        if (!isValidIPAddress(formData.address)) {
          throw new Error('Invalid IP address format');
        }
        if (!isValidMACAddress(formData.macAddress)) {
          throw new Error('Invalid MAC address format');
        }

        const result = await addStaticARPEntry(this.routerIp, {
          address: formData.address,
          macAddress: formData.macAddress,
          interface: formData.interface,
          comment: formData.comment,
        });

        if (result.success && result.data) {
          this.arpEntries.push(result.data);
          this.render();
          this.showSuccess('Static ARP entry added successfully');
          return true;
        } else {
          throw new Error(result.error || 'Failed to add static ARP entry');
        }
      } catch (error) {
        this.showError(error instanceof Error ? error.message : 'Failed to add static ARP entry');
        return false;
      }
    });
  }

  /** Refresh current view */
  private async refreshView(): Promise<void> {
    if (this.routerIp) {
      try {
        await this.loadCurrentView();
        await this.loadStatistics();
      } catch (error) {
        console.warn('Auto-refresh failed:', error);
        // Don't show error for auto-refresh failures
      }
    }
  }

  /** Manual refresh triggered by user */
  private async manualRefresh(): Promise<void> {
    if (this.routerIp) {
      this.setLoading(true);
      try {
        await this.loadCurrentView();
        await this.loadStatistics();
        this.showSuccess('Data refreshed successfully');
      } catch (error) {
        this.setLoading(false);
        this.showError(error instanceof Error ? error.message : 'Failed to refresh data');
      }
    }
  }

  /** Sets loading state */
  private setLoading(loading: boolean): void {
    this.isLoading = loading;
    if (loading) {
      this.container.innerHTML = `
        <div class="loading-container">
          <div class="loading-spinner"></div>
          <p>Loading network data...</p>
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

  /** Renders the network monitor */
  private render(): void {
    if (this.isLoading) {
      return;
    }

    this.container.innerHTML = `
      <style>
        .network-monitor {
          padding: 0;
        }
        
        .network-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        
        .network-title {
          font-size: 20px;
          font-weight: 600;
          color: #333;
          margin: 0;
        }
        
        .network-actions {
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
        
        .action-button.auto-refresh {
          background: #17a2b8;
        }
        
        .action-button.auto-refresh:hover {
          background: #117a8b;
        }
        
        .action-button.auto-refresh.active {
          background: #fd7e14;
        }
        
        .action-button.auto-refresh.active:hover {
          background: #e06b00;
        }
        
        .action-button.add {
          background: #6f42c1;
        }
        
        .action-button.add:hover {
          background: #5a3399;
        }

        .stats-overview {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
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
          font-size: 24px;
          font-weight: 700;
          color: #333;
          margin-bottom: 4px;
        }

        .stat-label {
          font-size: 11px;
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
        
        .traffic-bar {
          background: #f8f9fa;
          border-radius: 3px;
          height: 6px;
          position: relative;
          margin: 4px 0;
        }
        
        .traffic-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.3s ease;
        }
        
        .interface-name {
          font-weight: 600;
          color: #333;
        }
        
        .interface-type {
          font-size: 12px;
          color: #666;
          background: #f8f9fa;
          padding: 2px 6px;
          border-radius: 3px;
          text-transform: uppercase;
        }
        
        .route-destination {
          font-family: monospace;
          font-weight: 600;
        }
        
        .route-gateway {
          font-family: monospace;
          color: #666;
        }
        
        .arp-mac {
          font-family: monospace;
          color: #666;
        }
        
        .ip-address {
          font-family: monospace;
          font-weight: 600;
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
        
        .item-action-btn.delete {
          border-color: #dc3545;
          color: #dc3545;
        }
        
        .item-action-btn.delete:hover {
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

        .traffic-stats {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .traffic-row {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
        }

        .traffic-rx {
          color: #28a745;
        }

        .traffic-tx {
          color: #007bff;
        }
      </style>
      
      <div class="network-monitor">
        <div class="network-header">
          <h2 class="network-title">Network Monitoring</h2>
          <div class="network-actions">
            <button class="action-button refresh" id="refresh-network">
              🔄 Refresh
            </button>
            <button class="action-button auto-refresh ${this.autoRefresh ? 'active' : ''}" id="toggle-auto-refresh">
              ${this.autoRefresh ? '⏸️ Pause Auto-Refresh' : '▶️ Start Auto-Refresh'}
            </button>
            ${this.renderAddButton()}
          </div>
        </div>
        
        ${this.renderStatistics()}
        
        <div class="view-tabs">
          <button class="view-tab ${this.currentView === 'interfaces' ? 'active' : ''}" data-view="interfaces">
            Network Interfaces
          </button>
          <button class="view-tab ${this.currentView === 'addresses' ? 'active' : ''}" data-view="addresses">
            IP Addresses
          </button>
          <button class="view-tab ${this.currentView === 'routes' ? 'active' : ''}" data-view="routes">
            Routing Table
          </button>
          <button class="view-tab ${this.currentView === 'arp' ? 'active' : ''}" data-view="arp">
            ARP Table
          </button>
        </div>
        
        ${this.renderCurrentView()}
      </div>
    `;

    this.attachEventListeners();
  }

  /** Renders statistics overview */
  private renderStatistics(): string {
    if (!this.networkStats) {
      return '';
    }

    return `
      <div class="stats-overview">
        <div class="stat-card">
          <div class="stat-value">${this.networkStats.totalInterfaces}</div>
          <div class="stat-label">Total Interfaces</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${this.networkStats.activeInterfaces}</div>
          <div class="stat-label">Active</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${this.networkStats.totalRoutes}</div>
          <div class="stat-label">Routes</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${this.networkStats.totalIPAddresses}</div>
          <div class="stat-label">IP Addresses</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${this.networkStats.totalARPEntries}</div>
          <div class="stat-label">ARP Entries</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${formatBytes(this.networkStats.totalTrafficRx)}</div>
          <div class="stat-label">Total RX</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${formatBytes(this.networkStats.totalTrafficTx)}</div>
          <div class="stat-label">Total TX</div>
        </div>
      </div>
    `;
  }

  /** Renders appropriate add button for current view */
  private renderAddButton(): string {
    if (this.currentView === 'routes') {
      return `
        <button class="action-button add" id="add-item">
          ➕ Add Route
        </button>
      `;
    } else if (this.currentView === 'arp') {
      return `
        <button class="action-button add" id="add-item">
          ➕ Add ARP Entry
        </button>
      `;
    }
    return '';
  }

  /** Renders the current view content */
  private renderCurrentView(): string {
    switch (this.currentView) {
      case 'interfaces':
        return this.renderInterfaces();
      case 'addresses':
        return this.renderIPAddresses();
      case 'routes':
        return this.renderRoutes();
      case 'arp':
        return this.renderARP();
      default:
        return '';
    }
  }

  /** Renders network interfaces */
  private renderInterfaces(): string {
    if (this.interfaces.length === 0) {
      return `
        <div class="empty-state">
          <h3>No Network Interfaces</h3>
          <p>No network interfaces found on this router.</p>
        </div>
      `;
    }

    return `
      <div class="content-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Interface</th>
              <th>Type</th>
              <th>Status</th>
              <th>MAC Address</th>
              <th>MTU</th>
              <th>Traffic</th>
              <th>Packets</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${this.interfaces.map(iface => this.renderInterfaceRow(iface)).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  /** Renders IP addresses */
  private renderIPAddresses(): string {
    if (this.ipAddresses.length === 0) {
      return `
        <div class="empty-state">
          <h3>No IP Addresses</h3>
          <p>No IP addresses configured on this router.</p>
        </div>
      `;
    }

    return `
      <div class="content-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>IP Address</th>
              <th>Network</th>
              <th>Interface</th>
              <th>Type</th>
              <th>Status</th>
              <th>Comment</th>
            </tr>
          </thead>
          <tbody>
            ${this.ipAddresses.map(addr => this.renderIPAddressRow(addr)).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  /** Renders routing table */
  private renderRoutes(): string {
    if (this.routes.length === 0) {
      return `
        <div class="empty-state">
          <h3>No Routes</h3>
          <p>No routes found in the routing table.</p>
        </div>
      `;
    }

    return `
      <div class="content-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Destination</th>
              <th>Gateway</th>
              <th>Interface</th>
              <th>Distance</th>
              <th>Type</th>
              <th>Status</th>
              <th>Comment</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${this.routes.map(route => this.renderRouteRow(route)).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  /** Renders ARP table */
  private renderARP(): string {
    if (this.arpEntries.length === 0) {
      return `
        <div class="empty-state">
          <h3>No ARP Entries</h3>
          <p>No ARP entries found.</p>
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
              <th>Interface</th>
              <th>Type</th>
              <th>Status</th>
              <th>Comment</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${this.arpEntries.map(arp => this.renderARPRow(arp)).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  /** Renders a single interface row */
  private renderInterfaceRow(iface: NetworkInterface): string {
    const statusColor = getInterfaceStatusColor(iface);
    const statusText = getInterfaceStatusText(iface);
    
    return `
      <tr>
        <td>
          <div class="interface-name">${iface.name}</div>
        </td>
        <td>
          <span class="interface-type">${iface.type}</span>
        </td>
        <td>
          <span class="status-badge" style="background-color: ${statusColor}">
            ${statusText}
          </span>
        </td>
        <td><code>${iface.macAddress || '-'}</code></td>
        <td>${iface.mtu || '-'}</td>
        <td>
          <div class="traffic-stats">
            <div class="traffic-row">
              <span class="traffic-rx">RX: ${formatBytes(iface.rxByte || 0)}</span>
              <span class="traffic-tx">TX: ${formatBytes(iface.txByte || 0)}</span>
            </div>
            ${iface.rxError || iface.txError ? `
              <div class="traffic-row" style="color: #dc3545;">
                <span>RX Err: ${iface.rxError || 0}</span>
                <span>TX Err: ${iface.txError || 0}</span>
              </div>
            ` : ''}
          </div>
        </td>
        <td>
          <div class="traffic-stats">
            <div class="traffic-row">
              <span class="traffic-rx">RX: ${(iface.rxPacket || 0).toLocaleString()}</span>
              <span class="traffic-tx">TX: ${(iface.txPacket || 0).toLocaleString()}</span>
            </div>
            ${iface.rxDrop || iface.txDrop ? `
              <div class="traffic-row" style="color: #ffc107;">
                <span>RX Drop: ${iface.rxDrop || 0}</span>
                <span>TX Drop: ${iface.txDrop || 0}</span>
              </div>
            ` : ''}
          </div>
        </td>
        <td>
          <div class="item-actions">
            <button class="item-action-btn toggle ${iface.disabled ? 'disabled' : ''}" 
                    data-interface-id="${iface.id}" 
                    data-enabled="${!iface.disabled}">
              ${iface.disabled ? 'Enable' : 'Disable'}
            </button>
          </div>
        </td>
      </tr>
    `;
  }

  /** Renders a single IP address row */
  private renderIPAddressRow(addr: IPAddress): string {
    return `
      <tr>
        <td><span class="ip-address">${addr.address}</span></td>
        <td><code>${addr.network || '-'}</code></td>
        <td>${addr.interface}</td>
        <td>
          <span class="interface-type">${addr.dynamic ? 'Dynamic' : 'Static'}</span>
        </td>
        <td>
          <span class="status-badge" style="background-color: ${addr.invalid ? '#dc3545' : addr.disabled ? '#6c757d' : '#28a745'}">
            ${addr.invalid ? 'Invalid' : addr.disabled ? 'Disabled' : 'Active'}
          </span>
        </td>
        <td>${addr.comment || '-'}</td>
      </tr>
    `;
  }

  /** Renders a single route row */
  private renderRouteRow(route: Route): string {
    const routeType = getRouteTypeDisplay(route);
    const routeColor = getRouteTypeColor(route);
    
    return `
      <tr>
        <td><span class="route-destination">${route.dstAddress}</span></td>
        <td><span class="route-gateway">${route.gateway || '-'}</span></td>
        <td>${route.interface || '-'}</td>
        <td>${route.distance || '-'}</td>
        <td>
          <span class="status-badge" style="background-color: ${routeColor}">
            ${routeType}
          </span>
        </td>
        <td>
          <span class="status-badge" style="background-color: ${route.active ? '#28a745' : '#6c757d'}">
            ${route.active ? 'Active' : 'Inactive'}
          </span>
        </td>
        <td>${route.comment || '-'}</td>
        <td>
          <div class="item-actions">
            ${route.static ? `
              <button class="item-action-btn delete" 
                      data-route-id="${route.id}">
                Delete
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `;
  }

  /** Renders a single ARP row */
  private renderARPRow(arp: ARPEntry): string {
    return `
      <tr>
        <td><span class="ip-address">${arp.address}</span></td>
        <td><span class="arp-mac">${arp.macAddress}</span></td>
        <td>${arp.interface}</td>
        <td>
          <span class="interface-type">${arp.dynamic ? 'Dynamic' : 'Static'}</span>
        </td>
        <td>
          <span class="status-badge" style="background-color: ${arp.complete ? '#28a745' : arp.invalid ? '#dc3545' : '#ffc107'}">
            ${arp.complete ? 'Complete' : arp.invalid ? 'Invalid' : 'Incomplete'}
          </span>
        </td>
        <td>${arp.comment || '-'}</td>
        <td>
          <div class="item-actions">
            ${!arp.dynamic ? `
              <button class="item-action-btn delete" 
                      data-arp-address="${arp.address}">
                Delete
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `;
  }

  /** Renders add route form */
  private renderAddRouteForm(): string {
    return `
      <form>
        <div class="form-group">
          <label class="form-label">Destination Address *</label>
          <input type="text" name="dstAddress" class="form-input" placeholder="0.0.0.0/0" required>
          <small style="color: #666; font-size: 12px;">Format: IP/CIDR (e.g., 192.168.1.0/24 or 0.0.0.0/0)</small>
        </div>
        <div class="form-group">
          <label class="form-label">Gateway</label>
          <input type="text" name="gateway" class="form-input" placeholder="192.168.1.1">
        </div>
        <div class="form-group">
          <label class="form-label">Interface</label>
          <input type="text" name="interface" class="form-input" placeholder="ether1">
        </div>
        <div class="form-group">
          <label class="form-label">Distance</label>
          <input type="number" name="distance" class="form-input" placeholder="1" min="1" max="255">
        </div>
        <div class="form-group">
          <label class="form-label">Comment</label>
          <input type="text" name="comment" class="form-input">
        </div>
      </form>
    `;
  }

  /** Renders add ARP form */
  private renderAddARPForm(): string {
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
          <label class="form-label">Interface *</label>
          <input type="text" name="interface" class="form-input" placeholder="ether1" required>
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
    const refreshButton = document.getElementById('refresh-network');
    if (refreshButton) {
      refreshButton.addEventListener('click', () => this.manualRefresh());
    }

    // Auto-refresh toggle button
    const autoRefreshButton = document.getElementById('toggle-auto-refresh');
    if (autoRefreshButton) {
      autoRefreshButton.addEventListener('click', () => this.toggleAutoRefresh());
    }

    // Add button
    const addButton = document.getElementById('add-item');
    if (addButton) {
      addButton.addEventListener('click', () => {
        if (this.currentView === 'routes') {
          this.showAddRouteModal();
        } else if (this.currentView === 'arp') {
          this.showAddARPModal();
        }
      });
    }

    // View tabs
    document.querySelectorAll('.view-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const view = tab.getAttribute('data-view') as 'interfaces' | 'addresses' | 'routes' | 'arp';
        if (view) {
          this.switchView(view);
        }
      });
    });

    // Interface action buttons
    document.querySelectorAll('[data-interface-id]').forEach(button => {
      button.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const interfaceId = target.getAttribute('data-interface-id');
        
        if (!interfaceId) return;

        if (target.classList.contains('toggle')) {
          const enabled = target.getAttribute('data-enabled') === 'false';
          this.toggleInterface(interfaceId, enabled);
        }
      });
    });

    // Route action buttons
    document.querySelectorAll('[data-route-id]').forEach(button => {
      button.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const routeId = target.getAttribute('data-route-id');
        
        if (!routeId) return;

        if (target.classList.contains('delete')) {
          this.deleteRouteEntry(routeId);
        }
      });
    });

    // ARP action buttons
    document.querySelectorAll('[data-arp-address]').forEach(button => {
      button.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const address = target.getAttribute('data-arp-address');
        
        if (!address) return;

        if (target.classList.contains('delete')) {
          this.deleteARPEntryItem(address);
        }
      });
    });
  }
}