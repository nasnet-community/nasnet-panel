import type { 
  EnhancedDHCPServer, 
  EnhancedDHCPLease, 
  EnhancedDHCPPool, 
  EnhancedDHCPNetwork,
  DHCPReservation,
  DHCPOption,
  DHCPServerStats,
  DHCPPoolUtilization 
} from '@/services/dhcp-server';
import { 
  getEnhancedDHCPServers,
  getEnhancedDHCPLeases,
  getEnhancedDHCPPools,
  getEnhancedDHCPNetworks,
  getDHCPReservations,
  getDHCPServerOptions,
  getDHCPServerStatistics,
  getDHCPPoolUtilization,
  addDHCPReservation,
  updateDHCPReservation,
  deleteDHCPReservation,
  addDHCPServerOption,
  updateDHCPServerOption,
  deleteDHCPServerOption,
  exportDHCPConfiguration,
  importDHCPReservations,
  getEnhancedLeaseStatusColor,
  formatDHCPOptionValue,
  validateDHCPOption
} from '@/services/dhcp-server';

/**
 * Enhanced DHCP Server Manager Component
 * Comprehensive DHCP management with advanced features like reservations, options, monitoring
 */
export class DHCPServerManager {
  private container: HTMLElement;
  private dhcpServers: EnhancedDHCPServer[] = [];
  private dhcpLeases: EnhancedDHCPLease[] = [];
  private dhcpPools: EnhancedDHCPPool[] = [];
  private dhcpNetworks: EnhancedDHCPNetwork[] = [];
  private dhcpReservations: DHCPReservation[] = [];
  private dhcpOptions: DHCPOption[] = [];
  private serverStats: DHCPServerStats[] = [];
  private poolUtilization: DHCPPoolUtilization[] = [];
  private routerIp = '';
  private isLoading = false;
  private currentView: 'overview' | 'servers' | 'leases' | 'reservations' | 'pools' | 'networks' | 'options' | 'monitoring' = 'overview';
  private autoRefreshInterval: number | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  /** Loads all DHCP data for a router */
  public async loadDHCPData(routerIp: string): Promise<void> {
    this.routerIp = routerIp;
    this.setLoading(true);

    try {
      await this.loadAllData();
      this.setLoading(false);
      this.render();
      this.startAutoRefresh();
    } catch (error) {
      this.setLoading(false);
      this.showError(error instanceof Error ? error.message : 'Failed to load DHCP data');
    }
  }

  /** Loads all DHCP data */
  private async loadAllData(): Promise<void> {
    try {
      const [
        serversResult,
        leasesResult,
        poolsResult,
        networksResult,
        reservationsResult,
        optionsResult,
        statsResult,
        utilizationResult
      ] = await Promise.all([
        getEnhancedDHCPServers(this.routerIp),
        getEnhancedDHCPLeases(this.routerIp),
        getEnhancedDHCPPools(this.routerIp),
        getEnhancedDHCPNetworks(this.routerIp),
        getDHCPReservations(this.routerIp),
        getDHCPServerOptions(this.routerIp),
        getDHCPServerStatistics(this.routerIp),
        getDHCPPoolUtilization(this.routerIp)
      ]);

      if (serversResult.success && serversResult.data) {
        this.dhcpServers = serversResult.data;
      }

      if (leasesResult.success && leasesResult.data) {
        this.dhcpLeases = leasesResult.data;
      }

      if (poolsResult.success && poolsResult.data) {
        this.dhcpPools = poolsResult.data;
      }

      if (networksResult.success && networksResult.data) {
        this.dhcpNetworks = networksResult.data;
      }

      if (reservationsResult.success && reservationsResult.data) {
        this.dhcpReservations = reservationsResult.data;
      }

      if (optionsResult.success && optionsResult.data) {
        this.dhcpOptions = optionsResult.data;
      }

      if (statsResult.success && statsResult.data) {
        this.serverStats = statsResult.data;
      }

      if (utilizationResult.success && utilizationResult.data) {
        this.poolUtilization = utilizationResult.data;
      }

    } catch (error) {
      throw new Error(`Failed to load DHCP data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /** Switch between different views */
  private switchView(view: typeof this.currentView): void {
    this.currentView = view;
    this.render();
  }

  /** Start auto refresh */
  private startAutoRefresh(): void {
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
    }

    this.autoRefreshInterval = window.setInterval(() => {
      if (this.routerIp && this.currentView === 'monitoring') {
        this.loadAllData().then(() => this.render()).catch(() => {
          // Silent failure for auto-refresh
        });
      }
    }, 30000); // Refresh every 30 seconds for monitoring view
  }

  /** Stop auto refresh */
  private stopAutoRefresh(): void {
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
      this.autoRefreshInterval = null;
    }
  }

  /** Show add reservation modal */
  private showAddReservationModal(): void {
    this.showModal('Add Static Reservation', this.renderAddReservationForm(), async (formData: any) => {
      try {
        const result = await addDHCPReservation(this.routerIp, {
          address: formData.address,
          macAddress: formData.macAddress,
          hostname: formData.hostname,
          server: formData.server,
          comment: formData.comment,
          leaseTime: formData.leaseTime,
        });

        if (result.success && result.data) {
          this.dhcpReservations.push(result.data);
          this.render();
          this.showSuccess('Static reservation added successfully');
          return true;
        } else {
          throw new Error(result.error || 'Failed to add static reservation');
        }
      } catch (error) {
        this.showError(error instanceof Error ? error.message : 'Failed to add static reservation');
        return false;
      }
    });
  }

  /** Show edit reservation modal */
  private showEditReservationModal(reservationId: string): void {
    const reservation = this.dhcpReservations.find(r => r.id === reservationId);
    if (!reservation) return;

    this.showModal('Edit Static Reservation', this.renderEditReservationForm(reservation), async (formData: any) => {
      try {
        const result = await updateDHCPReservation(this.routerIp, reservationId, {
          address: formData.address,
          macAddress: formData.macAddress,
          hostname: formData.hostname,
          comment: formData.comment,
          disabled: formData.disabled === 'true',
        });

        if (result.success) {
          const index = this.dhcpReservations.findIndex(r => r.id === reservationId);
          if (index >= 0 && result.data) {
            this.dhcpReservations[index] = result.data;
          }
          this.render();
          this.showSuccess('Static reservation updated successfully');
          return true;
        } else {
          throw new Error(result.error || 'Failed to update static reservation');
        }
      } catch (error) {
        this.showError(error instanceof Error ? error.message : 'Failed to update static reservation');
        return false;
      }
    });
  }

  /** Delete reservation */
  private async deleteReservation(reservationId: string): Promise<void> {
    const confirmed = confirm('Are you sure you want to delete this static reservation?');
    if (!confirmed) return;

    try {
      const result = await deleteDHCPReservation(this.routerIp, reservationId);

      if (result.success) {
        this.dhcpReservations = this.dhcpReservations.filter(r => r.id !== reservationId);
        this.render();
        this.showSuccess('Static reservation deleted successfully');
      } else {
        throw new Error(result.error || 'Failed to delete static reservation');
      }
    } catch (error) {
      this.showError(error instanceof Error ? error.message : 'Failed to delete static reservation');
    }
  }

  /** Show add DHCP option modal */
  private showAddOptionModal(): void {
    this.showModal('Add DHCP Option', this.renderAddOptionForm(), async (formData: any) => {
      try {
        const code = parseInt(formData.code, 10);
        const value = formData.value;

        if (!validateDHCPOption(code, value)) {
          throw new Error('Invalid option value for the specified code');
        }

        const result = await addDHCPServerOption(this.routerIp, {
          code,
          name: formData.name,
          value,
          comment: formData.comment,
        });

        if (result.success && result.data) {
          this.dhcpOptions.push(result.data);
          this.render();
          this.showSuccess('DHCP option added successfully');
          return true;
        } else {
          throw new Error(result.error || 'Failed to add DHCP option');
        }
      } catch (error) {
        this.showError(error instanceof Error ? error.message : 'Failed to add DHCP option');
        return false;
      }
    });
  }

  /** Delete DHCP option */
  private async deleteOption(optionId: string): Promise<void> {
    const confirmed = confirm('Are you sure you want to delete this DHCP option?');
    if (!confirmed) return;

    try {
      const result = await deleteDHCPServerOption(this.routerIp, optionId);

      if (result.success) {
        this.dhcpOptions = this.dhcpOptions.filter(o => o.id !== optionId);
        this.render();
        this.showSuccess('DHCP option deleted successfully');
      } else {
        throw new Error(result.error || 'Failed to delete DHCP option');
      }
    } catch (error) {
      this.showError(error instanceof Error ? error.message : 'Failed to delete DHCP option');
    }
  }

  /** Export DHCP configuration */
  private async exportConfiguration(): Promise<void> {
    try {
      const result = await exportDHCPConfiguration(this.routerIp);
      
      if (result.success && result.data) {
        const dataStr = JSON.stringify(result.data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `dhcp-config-${this.routerIp}-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showSuccess('DHCP configuration exported successfully');
      } else {
        throw new Error(result.error || 'Failed to export DHCP configuration');
      }
    } catch (error) {
      this.showError(error instanceof Error ? error.message : 'Failed to export DHCP configuration');
    }
  }

  /** Show import reservations modal */
  private showImportReservationsModal(): void {
    this.showModal('Import Static Reservations', this.renderImportReservationsForm(), async (formData: any) => {
      try {
        const file = formData.file;
        const serverId = formData.serverId;
        
        if (!file || !serverId) {
          throw new Error('Please select a file and server');
        }

        const text = await file.text();
        const result = await importDHCPReservations(this.routerIp, text, serverId);

        if (result.success && result.data) {
          this.showSuccess(`Imported ${result.data.imported} reservations successfully`);
          if (result.data.errors.length > 0) {
            this.showError(`Errors: ${result.data.errors.slice(0, 3).join(', ')}${result.data.errors.length > 3 ? '...' : ''}`);
          }
          await this.loadAllData();
          this.render();
          return true;
        } else {
          throw new Error(result.error || 'Failed to import reservations');
        }
      } catch (error) {
        this.showError(error instanceof Error ? error.message : 'Failed to import reservations');
        return false;
      }
    });
  }

  /** Refresh current view */
  private async refreshView(): Promise<void> {
    if (this.routerIp) {
      this.setLoading(true);
      try {
        await this.loadAllData();
        this.setLoading(false);
        this.render();
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
    if (loading && this.container) {
      this.container.innerHTML = `
        <div class="loading-container">
          <div class="loading-spinner"></div>
          <p>Loading enhanced DHCP data...</p>
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
        
        // Handle file inputs separately
        for (const [key, value] of formData.entries()) {
          if (value instanceof File) {
            data[key] = value;
          } else {
            data[key] = value;
          }
        }

        const success = await onSubmit(data);
        if (success) {
          closeModal();
        }
      }
    });
  }

  /** Cleanup when component is destroyed */
  public destroy(): void {
    this.stopAutoRefresh();
  }

  /** Renders the enhanced DHCP manager */
  private render(): void {
    if (this.isLoading) {
      return;
    }

    this.container.innerHTML = `
      <style>
        ${this.getStyles()}
      </style>
      
      <div class="dhcp-manager-enhanced">
        <div class="dhcp-header">
          <h2 class="dhcp-title">Enhanced DHCP Management</h2>
          <div class="dhcp-actions">
            <button class="action-button refresh" id="refresh-dhcp">
              🔄 Refresh
            </button>
            <button class="action-button export" id="export-config">
              💾 Export Config
            </button>
            <button class="action-button add" id="add-item">
              ➕ Add ${this.getAddButtonText()}
            </button>
          </div>
        </div>
        
        <div class="view-tabs">
          ${this.renderViewTabs()}
        </div>
        
        <div class="content-area">
          ${this.renderCurrentView()}
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  /** Renders view tabs */
  private renderViewTabs(): string {
    const tabs = [
      { key: 'overview', label: 'Overview', icon: '📊' },
      { key: 'servers', label: 'DHCP Servers', icon: '🖥️' },
      { key: 'leases', label: 'Active Leases', icon: '📋' },
      { key: 'reservations', label: 'Static Reservations', icon: '📌' },
      { key: 'pools', label: 'Address Pools', icon: '🏊' },
      { key: 'networks', label: 'Networks', icon: '🌐' },
      { key: 'options', label: 'DHCP Options', icon: '⚙️' },
      { key: 'monitoring', label: 'Monitoring', icon: '📈' },
    ];

    return tabs.map(tab => `
      <button class="view-tab ${this.currentView === tab.key ? 'active' : ''}" data-view="${tab.key}">
        <span class="tab-icon">${tab.icon}</span>
        <span class="tab-label">${tab.label}</span>
      </button>
    `).join('');
  }

  /** Gets the appropriate add button text for current view */
  private getAddButtonText(): string {
    switch (this.currentView) {
      case 'reservations': return 'Reservation';
      case 'options': return 'Option';
      case 'pools': return 'Pool';
      case 'networks': return 'Network';
      default: return 'Item';
    }
  }

  /** Renders the current view content */
  private renderCurrentView(): string {
    switch (this.currentView) {
      case 'overview':
        return this.renderOverview();
      case 'servers':
        return this.renderServers();
      case 'leases':
        return this.renderLeases();
      case 'reservations':
        return this.renderReservations();
      case 'pools':
        return this.renderPools();
      case 'networks':
        return this.renderNetworks();
      case 'options':
        return this.renderOptions();
      case 'monitoring':
        return this.renderMonitoring();
      default:
        return '';
    }
  }

  /** Renders overview dashboard */
  private renderOverview(): string {
    const totalServers = this.dhcpServers.length;
    const activeServers = this.dhcpServers.filter(s => !s.disabled).length;
    const totalLeases = this.dhcpLeases.length;
    const boundLeases = this.dhcpLeases.filter(l => l.status === 'bound').length;
    const staticReservations = this.dhcpReservations.length;
    const totalPools = this.dhcpPools.length;

    const avgUtilization = this.poolUtilization.length > 0 
      ? Math.round(this.poolUtilization.reduce((sum, p) => sum + p.utilizationPercent, 0) / this.poolUtilization.length)
      : 0;

    return `
      <div class="overview-dashboard">
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">🖥️</div>
            <div class="stat-info">
              <div class="stat-value">${activeServers}/${totalServers}</div>
              <div class="stat-label">Active Servers</div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">📋</div>
            <div class="stat-info">
              <div class="stat-value">${boundLeases}</div>
              <div class="stat-label">Active Leases</div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">📌</div>
            <div class="stat-info">
              <div class="stat-value">${staticReservations}</div>
              <div class="stat-label">Static Reservations</div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">🏊</div>
            <div class="stat-info">
              <div class="stat-value">${totalPools}</div>
              <div class="stat-label">Address Pools</div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">📊</div>
            <div class="stat-info">
              <div class="stat-value">${avgUtilization}%</div>
              <div class="stat-label">Avg Pool Usage</div>
            </div>
          </div>
        </div>
        
        <div class="overview-sections">
          <div class="overview-section">
            <h3>Pool Utilization</h3>
            <div class="pool-utilization-list">
              ${this.poolUtilization.map(pool => this.renderPoolUtilizationCard(pool)).join('')}
            </div>
          </div>
          
          <div class="overview-section">
            <h3>Recent Activity</h3>
            <div class="recent-activity">
              ${this.renderRecentActivity()}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /** Renders pool utilization card */
  private renderPoolUtilizationCard(pool: DHCPPoolUtilization): string {
    const statusClass = pool.status === 'critical' ? 'critical' : pool.status === 'warning' ? 'warning' : 'normal';
    
    return `
      <div class="pool-util-card ${statusClass}">
        <div class="pool-util-header">
          <span class="pool-name">${pool.poolName}</span>
          <span class="pool-percent">${pool.utilizationPercent}%</span>
        </div>
        <div class="pool-util-bar">
          <div class="pool-util-fill" style="width: ${pool.utilizationPercent}%"></div>
        </div>
        <div class="pool-util-details">
          <small>${pool.usedIPs}/${pool.totalIPs} IPs used</small>
        </div>
      </div>
    `;
  }

  /** Renders recent activity */
  private renderRecentActivity(): string {
    const recentLeases = this.dhcpLeases
      .filter(l => l.status === 'bound')
      .sort((a, b) => (b.bindingTime || '').localeCompare(a.bindingTime || ''))
      .slice(0, 5);

    if (recentLeases.length === 0) {
      return '<p class="empty-text">No recent activity</p>';
    }

    return recentLeases.map(lease => `
      <div class="activity-item">
        <div class="activity-icon">🔗</div>
        <div class="activity-details">
          <div class="activity-title">${lease.hostname || lease.address} connected</div>
          <div class="activity-meta">MAC: ${lease.macAddress} • Server: ${lease.server}</div>
        </div>
      </div>
    `).join('');
  }

  /** Renders DHCP servers */
  private renderServers(): string {
    if (this.dhcpServers.length === 0) {
      return `
        <div class="empty-state">
          <div class="empty-icon">🖥️</div>
          <h3>No DHCP Servers</h3>
          <p>No DHCP servers are configured on this router.</p>
        </div>
      `;
    }

    return `
      <div class="data-table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Server Name</th>
              <th>Interface</th>
              <th>Address Pool</th>
              <th>Lease Time</th>
              <th>Authoritative</th>
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
          <div class="empty-icon">📋</div>
          <h3>No Active Leases</h3>
          <p>No DHCP client leases are currently active.</p>
        </div>
      `;
    }

    return `
      <div class="data-table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>IP Address</th>
              <th>MAC Address</th>
              <th>Hostname</th>
              <th>Server</th>
              <th>Status</th>
              <th>Expires</th>
              <th>Type</th>
            </tr>
          </thead>
          <tbody>
            ${this.dhcpLeases.map(lease => this.renderLeaseRow(lease)).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  /** Renders static reservations */
  private renderReservations(): string {
    return `
      <div class="reservations-container">
        <div class="reservations-header">
          <h3>Static DHCP Reservations</h3>
          <div class="reservations-actions">
            <button class="action-button import" id="import-reservations">
              📥 Import CSV
            </button>
          </div>
        </div>
        
        ${this.dhcpReservations.length === 0 ? `
          <div class="empty-state">
            <div class="empty-icon">📌</div>
            <h3>No Static Reservations</h3>
            <p>No static DHCP reservations are configured.</p>
          </div>
        ` : `
          <div class="data-table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>IP Address</th>
                  <th>MAC Address</th>
                  <th>Hostname</th>
                  <th>Server</th>
                  <th>Status</th>
                  <th>Comment</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${this.dhcpReservations.map(reservation => this.renderReservationRow(reservation)).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>
    `;
  }

  /** Renders pools with utilization */
  private renderPools(): string {
    if (this.dhcpPools.length === 0) {
      return `
        <div class="empty-state">
          <div class="empty-icon">🏊</div>
          <h3>No Address Pools</h3>
          <p>No DHCP address pools are configured.</p>
        </div>
      `;
    }

    return `
      <div class="data-table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Pool Name</th>
              <th>IP Ranges</th>
              <th>Total IPs</th>
              <th>Used IPs</th>
              <th>Utilization</th>
              <th>Status</th>
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

  /** Renders networks */
  private renderNetworks(): string {
    if (this.dhcpNetworks.length === 0) {
      return `
        <div class="empty-state">
          <div class="empty-icon">🌐</div>
          <h3>No DHCP Networks</h3>
          <p>No DHCP networks are configured.</p>
        </div>
      `;
    }

    return `
      <div class="data-table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Network</th>
              <th>Gateway</th>
              <th>DNS Servers</th>
              <th>Domain</th>
              <th>Options</th>
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

  /** Renders DHCP options */
  private renderOptions(): string {
    return `
      <div class="options-container">
        <div class="options-header">
          <h3>DHCP Server Options</h3>
          <p class="options-description">Custom DHCP options that will be sent to clients</p>
        </div>
        
        ${this.dhcpOptions.length === 0 ? `
          <div class="empty-state">
            <div class="empty-icon">⚙️</div>
            <h3>No DHCP Options</h3>
            <p>No custom DHCP options are configured.</p>
          </div>
        ` : `
          <div class="data-table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Value</th>
                  <th>Description</th>
                  <th>Comment</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${this.dhcpOptions.map(option => this.renderOptionRow(option)).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>
    `;
  }

  /** Renders monitoring dashboard */
  private renderMonitoring(): string {
    return `
      <div class="monitoring-dashboard">
        <div class="monitoring-header">
          <h3>DHCP Monitoring Dashboard</h3>
          <div class="monitoring-controls">
            <span class="auto-refresh-indicator">
              🔄 Auto-refresh: ${this.autoRefreshInterval ? 'ON' : 'OFF'}
            </span>
          </div>
        </div>
        
        <div class="monitoring-grid">
          ${this.serverStats.map(stats => this.renderServerStatsCard(stats)).join('')}
        </div>
        
        <div class="monitoring-charts">
          <div class="chart-container">
            <h4>Pool Utilization Overview</h4>
            <div class="pool-charts">
              ${this.poolUtilization.map(pool => this.renderPoolChart(pool)).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /** Renders server statistics card */
  private renderServerStatsCard(stats: DHCPServerStats): string {
    return `
      <div class="server-stats-card">
        <div class="stats-header">
          <h4>${stats.serverName}</h4>
          <span class="server-id">${stats.serverId}</span>
        </div>
        
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-value">${stats.totalLeases}</span>
            <span class="stat-label">Total Leases</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">${stats.boundLeases}</span>
            <span class="stat-label">Active</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">${stats.staticLeases}</span>
            <span class="stat-label">Static</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">${stats.peakUsage}%</span>
            <span class="stat-label">Peak Usage</span>
          </div>
        </div>
        
        <div class="stats-details">
          <div class="detail-row">
            <span>Average Lease Time:</span>
            <span>${stats.averageLeaseTime}</span>
          </div>
          <div class="detail-row">
            <span>Expired Leases:</span>
            <span>${stats.expiredLeases}</span>
          </div>
        </div>
      </div>
    `;
  }

  /** Renders pool utilization chart */
  private renderPoolChart(pool: DHCPPoolUtilization): string {
    return `
      <div class="pool-chart">
        <div class="pool-chart-header">
          <span class="pool-chart-name">${pool.poolName}</span>
          <span class="pool-chart-percent ${pool.status}">${pool.utilizationPercent}%</span>
        </div>
        <div class="pool-chart-bar">
          <div class="pool-chart-fill ${pool.status}" style="width: ${pool.utilizationPercent}%"></div>
        </div>
        <div class="pool-chart-details">
          <span>${pool.usedIPs} of ${pool.totalIPs} IPs</span>
          <span class="pool-status ${pool.status}">${pool.status.toUpperCase()}</span>
        </div>
      </div>
    `;
  }

  /** Renders a server row */
  private renderServerRow(server: EnhancedDHCPServer): string {
    return `
      <tr>
        <td><strong>${server.name}</strong></td>
        <td>${server.interface}</td>
        <td>${server.addressPool}</td>
        <td>${server.leaseTime || 'Default'}</td>
        <td>${server.authoritative || 'Yes'}</td>
        <td>
          <span class="status-badge ${server.disabled ? 'disabled' : 'active'}">
            ${server.disabled ? 'Disabled' : 'Active'}
          </span>
        </td>
        <td>
          <div class="item-actions">
            <button class="item-action-btn edit" data-server-id="${server.id}">Edit</button>
          </div>
        </td>
      </tr>
    `;
  }

  /** Renders a lease row */
  private renderLeaseRow(lease: EnhancedDHCPLease): string {
    return `
      <tr>
        <td><strong>${lease.address}</strong></td>
        <td><code>${lease.macAddress}</code></td>
        <td>${lease.hostname || '-'}</td>
        <td>${lease.server}</td>
        <td>
          <span class="status-badge" style="background-color: ${getEnhancedLeaseStatusColor(lease.status)}">
            ${lease.status}
          </span>
        </td>
        <td>${lease.expiresAfter}</td>
        <td>
          <span class="type-badge ${lease.dynamic ? 'dynamic' : 'static'}">
            ${lease.dynamic ? 'Dynamic' : 'Static'}
          </span>
        </td>
      </tr>
    `;
  }

  /** Renders a reservation row */
  private renderReservationRow(reservation: DHCPReservation): string {
    return `
      <tr>
        <td><strong>${reservation.address}</strong></td>
        <td><code>${reservation.macAddress}</code></td>
        <td>${reservation.hostname || '-'}</td>
        <td>${reservation.server}</td>
        <td>
          <span class="status-badge ${reservation.disabled ? 'disabled' : 'active'}">
            ${reservation.disabled ? 'Disabled' : 'Active'}
          </span>
        </td>
        <td>${reservation.comment || '-'}</td>
        <td>
          <div class="item-actions">
            <button class="item-action-btn edit" data-reservation-id="${reservation.id}">Edit</button>
            <button class="item-action-btn delete" data-reservation-id="${reservation.id}">Delete</button>
          </div>
        </td>
      </tr>
    `;
  }

  /** Renders a pool row */
  private renderPoolRow(pool: EnhancedDHCPPool): string {
    const utilization = this.poolUtilization.find(u => u.poolId === pool.id);
    
    return `
      <tr>
        <td><strong>${pool.name}</strong></td>
        <td><code>${pool.ranges}</code></td>
        <td>${pool.totalIPs || '-'}</td>
        <td>${pool.usedIPs || 0}</td>
        <td>
          ${utilization ? `
            <div class="utilization-bar">
              <div class="utilization-fill ${utilization.status}" style="width: ${utilization.utilizationPercent}%"></div>
              <span class="utilization-text">${utilization.utilizationPercent}%</span>
            </div>
          ` : '-'}
        </td>
        <td>
          ${utilization ? `
            <span class="status-badge ${utilization.status}">${utilization.status}</span>
          ` : '-'}
        </td>
        <td>
          <div class="item-actions">
            <button class="item-action-btn edit" data-pool-id="${pool.id}">Edit</button>
          </div>
        </td>
      </tr>
    `;
  }

  /** Renders a network row */
  private renderNetworkRow(network: EnhancedDHCPNetwork): string {
    return `
      <tr>
        <td><strong>${network.address}</strong></td>
        <td>${network.gateway || '-'}</td>
        <td>${network.dnsServer || '-'}</td>
        <td>${network.domain || '-'}</td>
        <td>
          ${network.dhcpOptions ? `
            <span class="options-count">${network.dhcpOptions.length} options</span>
          ` : '-'}
        </td>
        <td>
          <div class="item-actions">
            <button class="item-action-btn edit" data-network-id="${network.id}">Edit</button>
          </div>
        </td>
      </tr>
    `;
  }

  /** Renders an option row */
  private renderOptionRow(option: DHCPOption): string {
    return `
      <tr>
        <td><strong>${option.code}</strong></td>
        <td>${option.name || '-'}</td>
        <td><code>${option.value}</code></td>
        <td>${formatDHCPOptionValue(option.code, option.value)}</td>
        <td>${option.comment || '-'}</td>
        <td>
          <div class="item-actions">
            <button class="item-action-btn delete" data-option-id="${option.id}">Delete</button>
          </div>
        </td>
      </tr>
    `;
  }

  /** Renders add reservation form */
  private renderAddReservationForm(): string {
    const serverOptions = this.dhcpServers.map(server => 
      `<option value="${server.name}">${server.name}</option>`
    ).join('');

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
          <select name="server" class="form-select" required>
            <option value="">Select a server</option>
            ${serverOptions}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Lease Time</label>
          <select name="leaseTime" class="form-select">
            <option value="">Use server default</option>
            <option value="1h">1 hour</option>
            <option value="6h">6 hours</option>
            <option value="12h">12 hours</option>
            <option value="1d">1 day</option>
            <option value="3d">3 days</option>
            <option value="1w">1 week</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Comment</label>
          <input type="text" name="comment" class="form-input" placeholder="Optional comment">
        </div>
      </form>
    `;
  }

  /** Renders edit reservation form */
  private renderEditReservationForm(reservation: DHCPReservation): string {
    return `
      <form>
        <div class="form-group">
          <label class="form-label">IP Address *</label>
          <input type="text" name="address" class="form-input" value="${reservation.address}" required>
        </div>
        <div class="form-group">
          <label class="form-label">MAC Address *</label>
          <input type="text" name="macAddress" class="form-input" value="${reservation.macAddress}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Hostname</label>
          <input type="text" name="hostname" class="form-input" value="${reservation.hostname || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">Comment</label>
          <input type="text" name="comment" class="form-input" value="${reservation.comment || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">Status</label>
          <select name="disabled" class="form-select">
            <option value="false" ${!reservation.disabled ? 'selected' : ''}>Enabled</option>
            <option value="true" ${reservation.disabled ? 'selected' : ''}>Disabled</option>
          </select>
        </div>
      </form>
    `;
  }

  /** Renders add option form */
  private renderAddOptionForm(): string {
    return `
      <form>
        <div class="form-group">
          <label class="form-label">Option Code *</label>
          <input type="number" name="code" class="form-input" placeholder="e.g., 66" min="1" max="254" required>
          <small class="form-help">Common codes: 1=Subnet, 3=Gateway, 6=DNS, 15=Domain, 42=NTP, 66=TFTP, 67=Boot File</small>
        </div>
        <div class="form-group">
          <label class="form-label">Option Name</label>
          <input type="text" name="name" class="form-input" placeholder="e.g., TFTP Server">
        </div>
        <div class="form-group">
          <label class="form-label">Value *</label>
          <input type="text" name="value" class="form-input" placeholder="e.g., 192.168.1.10" required>
        </div>
        <div class="form-group">
          <label class="form-label">Comment</label>
          <input type="text" name="comment" class="form-input" placeholder="Optional description">
        </div>
      </form>
    `;
  }

  /** Renders import reservations form */
  private renderImportReservationsForm(): string {
    const serverOptions = this.dhcpServers.map(server => 
      `<option value="${server.name}">${server.name}</option>`
    ).join('');

    return `
      <form>
        <div class="form-group">
          <label class="form-label">CSV File *</label>
          <input type="file" name="file" class="form-input" accept=".csv" required>
          <small class="form-help">CSV format: address,mac,hostname,comment (header row required)</small>
        </div>
        <div class="form-group">
          <label class="form-label">Target DHCP Server *</label>
          <select name="serverId" class="form-select" required>
            <option value="">Select a server</option>
            ${serverOptions}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Sample CSV Format:</label>
          <pre class="csv-sample">address,mac,hostname,comment
192.168.1.100,00:11:22:33:44:55,client1,Office computer
192.168.1.101,AA:BB:CC:DD:EE:FF,printer1,Network printer</pre>
        </div>
      </form>
    `;
  }

  /** Attaches event listeners */
  private attachEventListeners(): void {
    // Refresh button
    document.getElementById('refresh-dhcp')?.addEventListener('click', () => this.refreshView());

    // Export button
    document.getElementById('export-config')?.addEventListener('click', () => this.exportConfiguration());

    // Add button
    document.getElementById('add-item')?.addEventListener('click', () => {
      switch (this.currentView) {
        case 'reservations':
          this.showAddReservationModal();
          break;
        case 'options':
          this.showAddOptionModal();
          break;
      }
    });

    // Import button
    document.getElementById('import-reservations')?.addEventListener('click', () => this.showImportReservationsModal());

    // View tabs
    document.querySelectorAll('.view-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const view = tab.getAttribute('data-view') as typeof this.currentView;
        if (view) {
          this.switchView(view);
        }
      });
    });

    // Reservation actions
    document.querySelectorAll('[data-reservation-id]').forEach(button => {
      button.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const reservationId = target.getAttribute('data-reservation-id');
        
        if (!reservationId) return;

        if (target.classList.contains('edit')) {
          this.showEditReservationModal(reservationId);
        } else if (target.classList.contains('delete')) {
          this.deleteReservation(reservationId);
        }
      });
    });

    // Option actions
    document.querySelectorAll('[data-option-id]').forEach(button => {
      button.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const optionId = target.getAttribute('data-option-id');
        
        if (!optionId) return;

        if (target.classList.contains('delete')) {
          this.deleteOption(optionId);
        }
      });
    });
  }

  /** Gets comprehensive styles for the component */
  private getStyles(): string {
    return `
      .dhcp-manager-enhanced {
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      
      .dhcp-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
        padding: 0 0 16px 0;
        border-bottom: 2px solid #e9ecef;
      }
      
      .dhcp-title {
        font-size: 24px;
        font-weight: 700;
        color: #2c3e50;
        margin: 0;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .dhcp-actions {
        display: flex;
        gap: 12px;
      }
      
      .action-button {
        background: #007bff;
        color: white;
        border: none;
        border-radius: 8px;
        padding: 10px 16px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      
      .action-button:hover {
        background: #0056b3;
        transform: translateY(-1px);
      }
      
      .action-button.refresh {
        background: #28a745;
      }
      
      .action-button.refresh:hover {
        background: #1e7e34;
      }
      
      .action-button.export {
        background: #6f42c1;
      }
      
      .action-button.export:hover {
        background: #5a2c87;
      }
      
      .action-button.add {
        background: #17a2b8;
      }
      
      .action-button.add:hover {
        background: #117a8b;
      }
      
      .action-button.import {
        background: #fd7e14;
      }
      
      .action-button.import:hover {
        background: #e55a00;
      }
      
      .view-tabs {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        margin-bottom: 24px;
        background: #f8f9fa;
        padding: 8px;
        border-radius: 12px;
      }
      
      .view-tab {
        background: none;
        border: none;
        border-radius: 8px;
        padding: 12px 16px;
        font-size: 14px;
        font-weight: 500;
        color: #6c757d;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 120px;
        justify-content: center;
      }
      
      .view-tab:hover {
        color: #007bff;
        background: rgba(0, 123, 255, 0.1);
      }
      
      .view-tab.active {
        color: #007bff;
        background: white;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
      
      .tab-icon {
        font-size: 16px;
      }
      
      .content-area {
        background: white;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        overflow: hidden;
      }
      
      .overview-dashboard {
        padding: 24px;
      }
      
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 20px;
        margin-bottom: 32px;
      }
      
      .stat-card {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 24px;
        border-radius: 16px;
        display: flex;
        align-items: center;
        gap: 16px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }
      
      .stat-icon {
        font-size: 32px;
        opacity: 0.8;
      }
      
      .stat-info {
        flex: 1;
      }
      
      .stat-value {
        font-size: 28px;
        font-weight: 700;
        margin-bottom: 4px;
      }
      
      .stat-label {
        font-size: 14px;
        opacity: 0.9;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .overview-sections {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 32px;
      }
      
      .overview-section h3 {
        margin: 0 0 16px 0;
        color: #2c3e50;
        font-size: 18px;
        font-weight: 600;
      }
      
      .pool-utilization-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      
      .pool-util-card {
        background: #f8f9fa;
        border-radius: 8px;
        padding: 16px;
        border-left: 4px solid #28a745;
      }
      
      .pool-util-card.warning {
        border-left-color: #ffc107;
      }
      
      .pool-util-card.critical {
        border-left-color: #dc3545;
      }
      
      .pool-util-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }
      
      .pool-name {
        font-weight: 600;
        color: #2c3e50;
      }
      
      .pool-percent {
        font-weight: 700;
        color: #007bff;
      }
      
      .pool-util-bar {
        height: 8px;
        background: #e9ecef;
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: 8px;
      }
      
      .pool-util-fill {
        height: 100%;
        background: #28a745;
        transition: width 0.3s ease;
      }
      
      .pool-util-card.warning .pool-util-fill {
        background: #ffc107;
      }
      
      .pool-util-card.critical .pool-util-fill {
        background: #dc3545;
      }
      
      .recent-activity {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      
      .activity-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        background: #f8f9fa;
        border-radius: 8px;
      }
      
      .activity-icon {
        font-size: 18px;
        opacity: 0.7;
      }
      
      .activity-title {
        font-weight: 500;
        color: #2c3e50;
      }
      
      .activity-meta {
        font-size: 12px;
        color: #6c757d;
      }
      
      .data-table-container {
        overflow-x: auto;
        padding: 24px;
      }
      
      .data-table {
        width: 100%;
        border-collapse: collapse;
      }
      
      .data-table th {
        background: #f8f9fa;
        border-bottom: 2px solid #dee2e6;
        padding: 16px 12px;
        text-align: left;
        font-weight: 600;
        color: #495057;
        font-size: 14px;
        white-space: nowrap;
      }
      
      .data-table td {
        border-bottom: 1px solid #f8f9fa;
        padding: 16px 12px;
        font-size: 14px;
        vertical-align: middle;
      }
      
      .data-table tr:hover {
        background: #f8f9fa;
      }
      
      .status-badge {
        display: inline-block;
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .status-badge.active {
        background: #d4edda;
        color: #155724;
      }
      
      .status-badge.disabled {
        background: #f8d7da;
        color: #721c24;
      }
      
      .type-badge {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 500;
        text-transform: uppercase;
      }
      
      .type-badge.dynamic {
        background: #cfe2ff;
        color: #084298;
      }
      
      .type-badge.static {
        background: #d1ecf1;
        color: #0c5460;
      }
      
      .item-actions {
        display: flex;
        gap: 8px;
      }
      
      .item-action-btn {
        background: none;
        border: 1px solid #dee2e6;
        border-radius: 6px;
        padding: 6px 12px;
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      .item-action-btn:hover {
        background: #f8f9fa;
      }
      
      .item-action-btn.edit {
        border-color: #007bff;
        color: #007bff;
      }
      
      .item-action-btn.edit:hover {
        background: #007bff;
        color: white;
      }
      
      .item-action-btn.delete {
        border-color: #dc3545;
        color: #dc3545;
      }
      
      .item-action-btn.delete:hover {
        background: #dc3545;
        color: white;
      }
      
      .utilization-bar {
        position: relative;
        height: 20px;
        background: #e9ecef;
        border-radius: 10px;
        overflow: hidden;
        min-width: 120px;
      }
      
      .utilization-fill {
        height: 100%;
        transition: width 0.3s ease;
      }
      
      .utilization-fill.normal {
        background: #28a745;
      }
      
      .utilization-fill.warning {
        background: #ffc107;
      }
      
      .utilization-fill.critical {
        background: #dc3545;
      }
      
      .utilization-text {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 11px;
        font-weight: 600;
        color: white;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
      }
      
      .monitoring-dashboard {
        padding: 24px;
      }
      
      .monitoring-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
      }
      
      .monitoring-header h3 {
        margin: 0;
        color: #2c3e50;
        font-size: 20px;
        font-weight: 600;
      }
      
      .auto-refresh-indicator {
        font-size: 14px;
        color: #6c757d;
        padding: 8px 12px;
        background: #f8f9fa;
        border-radius: 6px;
      }
      
      .monitoring-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 20px;
        margin-bottom: 32px;
      }
      
      .server-stats-card {
        background: white;
        border: 1px solid #dee2e6;
        border-radius: 12px;
        padding: 20px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
      
      .stats-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        padding-bottom: 16px;
        border-bottom: 1px solid #e9ecef;
      }
      
      .stats-header h4 {
        margin: 0;
        color: #2c3e50;
        font-size: 16px;
        font-weight: 600;
      }
      
      .server-id {
        font-size: 12px;
        color: #6c757d;
        background: #f8f9fa;
        padding: 2px 8px;
        border-radius: 4px;
      }
      
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 16px;
        margin-bottom: 16px;
      }
      
      .stat-item {
        text-align: center;
        padding: 12px;
        background: #f8f9fa;
        border-radius: 8px;
      }
      
      .stat-item .stat-value {
        display: block;
        font-size: 20px;
        font-weight: 700;
        color: #007bff;
        margin-bottom: 4px;
      }
      
      .stat-item .stat-label {
        font-size: 12px;
        color: #6c757d;
      }
      
      .stats-details {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      
      .detail-row {
        display: flex;
        justify-content: space-between;
        font-size: 13px;
      }
      
      .detail-row span:first-child {
        color: #6c757d;
      }
      
      .detail-row span:last-child {
        font-weight: 500;
        color: #2c3e50;
      }
      
      .pool-charts {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 16px;
      }
      
      .pool-chart {
        background: white;
        border: 1px solid #dee2e6;
        border-radius: 8px;
        padding: 16px;
      }
      
      .pool-chart-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }
      
      .pool-chart-name {
        font-weight: 600;
        color: #2c3e50;
      }
      
      .pool-chart-percent {
        font-weight: 700;
        font-size: 16px;
      }
      
      .pool-chart-percent.normal {
        color: #28a745;
      }
      
      .pool-chart-percent.warning {
        color: #ffc107;
      }
      
      .pool-chart-percent.critical {
        color: #dc3545;
      }
      
      .pool-chart-bar {
        height: 12px;
        background: #e9ecef;
        border-radius: 6px;
        overflow: hidden;
        margin-bottom: 12px;
      }
      
      .pool-chart-fill {
        height: 100%;
        transition: width 0.3s ease;
      }
      
      .pool-chart-fill.normal {
        background: #28a745;
      }
      
      .pool-chart-fill.warning {
        background: #ffc107;
      }
      
      .pool-chart-fill.critical {
        background: #dc3545;
      }
      
      .pool-chart-details {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 12px;
      }
      
      .pool-status {
        padding: 2px 8px;
        border-radius: 4px;
        font-weight: 600;
        text-transform: uppercase;
      }
      
      .pool-status.normal {
        background: #d4edda;
        color: #155724;
      }
      
      .pool-status.warning {
        background: #fff3cd;
        color: #856404;
      }
      
      .pool-status.critical {
        background: #f8d7da;
        color: #721c24;
      }
      
      .empty-state {
        text-align: center;
        padding: 60px 20px;
        color: #6c757d;
      }
      
      .empty-icon {
        font-size: 48px;
        margin-bottom: 16px;
        opacity: 0.5;
      }
      
      .empty-state h3 {
        margin: 0 0 8px 0;
        color: #495057;
        font-size: 18px;
      }
      
      .empty-text {
        color: #6c757d;
        font-style: italic;
      }
      
      .reservations-container,
      .options-container {
        padding: 24px;
      }
      
      .reservations-header,
      .options-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 24px;
        padding-bottom: 16px;
        border-bottom: 1px solid #e9ecef;
      }
      
      .reservations-header h3,
      .options-header h3 {
        margin: 0;
        color: #2c3e50;
        font-size: 20px;
        font-weight: 600;
      }
      
      .options-description {
        margin: 4px 0 0 0;
        color: #6c757d;
        font-size: 14px;
      }
      
      .loading-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 60px 20px;
        color: #6c757d;
      }
      
      .loading-spinner {
        width: 40px;
        height: 40px;
        border: 4px solid #f3f3f3;
        border-top: 4px solid #007bff;
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
        padding: 16px 24px;
        border-radius: 8px;
        color: white;
        font-size: 14px;
        font-weight: 500;
        z-index: 1100;
        display: flex;
        align-items: center;
        gap: 12px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        max-width: 400px;
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
        font-size: 18px;
        font-weight: bold;
        cursor: pointer;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background-color 0.2s ease;
      }
      
      .notification-close:hover {
        background: rgba(255, 255, 255, 0.2);
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
        backdrop-filter: blur(4px);
      }
      
      .modal {
        background: white;
        border-radius: 12px;
        width: 90%;
        max-width: 600px;
        max-height: 80vh;
        overflow: hidden;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
      }
      
      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px 24px;
        border-bottom: 1px solid #e9ecef;
        background: #f8f9fa;
      }
      
      .modal-header h3 {
        margin: 0;
        color: #2c3e50;
        font-size: 18px;
        font-weight: 600;
      }
      
      .modal-close {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #6c757d;
        padding: 0;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: all 0.2s ease;
      }
      
      .modal-close:hover {
        background: #e9ecef;
        color: #495057;
      }
      
      .modal-body {
        padding: 24px;
        max-height: 60vh;
        overflow-y: auto;
      }
      
      .modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        padding: 20px 24px;
        border-top: 1px solid #e9ecef;
        background: #f8f9fa;
      }
      
      .form-group {
        margin-bottom: 20px;
      }
      
      .form-label {
        display: block;
        margin-bottom: 6px;
        font-weight: 500;
        color: #495057;
        font-size: 14px;
      }
      
      .form-input,
      .form-select {
        width: 100%;
        padding: 12px 16px;
        border: 1px solid #ced4da;
        border-radius: 8px;
        font-size: 14px;
        transition: border-color 0.2s ease, box-shadow 0.2s ease;
      }
      
      .form-input:focus,
      .form-select:focus {
        outline: none;
        border-color: #007bff;
        box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
      }
      
      .form-help {
        display: block;
        margin-top: 4px;
        font-size: 12px;
        color: #6c757d;
      }
      
      .csv-sample {
        background: #f8f9fa;
        border: 1px solid #e9ecef;
        border-radius: 6px;
        padding: 12px;
        font-size: 12px;
        color: #495057;
        white-space: pre;
        font-family: 'Monaco', 'Consolas', monospace;
        margin-top: 8px;
      }
      
      .btn {
        padding: 12px 24px;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        display: inline-flex;
        align-items: center;
        gap: 8px;
      }
      
      .btn-primary {
        background: #007bff;
        color: white;
      }
      
      .btn-primary:hover {
        background: #0056b3;
        transform: translateY(-1px);
      }
      
      .btn-cancel {
        background: #6c757d;
        color: white;
      }
      
      .btn-cancel:hover {
        background: #545b62;
      }
      
      @media (max-width: 768px) {
        .dhcp-header {
          flex-direction: column;
          gap: 16px;
          align-items: stretch;
        }
        
        .dhcp-actions {
          justify-content: center;
        }
        
        .view-tabs {
          flex-direction: column;
        }
        
        .overview-sections {
          grid-template-columns: 1fr;
        }
        
        .stats-grid {
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        }
        
        .monitoring-grid {
          grid-template-columns: 1fr;
        }
        
        .pool-charts {
          grid-template-columns: 1fr;
        }
      }
    `;
  }
}