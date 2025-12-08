import type { FirewallRule, NATRule, ActiveConnection } from '@/services/firewall';
import { 
  getFirewallRules, 
  getNATRules, 
  getActiveConnections,
  toggleFirewallRule,
  toggleNATRule,
  deleteFirewallRule,
  deleteNATRule,
  formatFirewallRule,
  getActionColor,
  getChainColor
} from '@/services/firewall';

/**
 * Firewall Manager Component
 * Manages firewall rules, NAT rules, and active connections
 */
export class FirewallManager {
  private container: HTMLElement;
  private firewallRules: FirewallRule[] = [];
  private natRules: NATRule[] = [];
  private activeConnections: ActiveConnection[] = [];
  private routerIp = '';
  private isLoading = false;
  private currentView: 'filter' | 'nat' | 'connections' = 'filter';

  constructor(container: HTMLElement) {
    this.container = container;
  }

  /** Loads firewall data for a router */
  public async loadFirewallData(routerIp: string): Promise<void> {
    this.routerIp = routerIp;
    this.setLoading(true);

    try {
      await this.loadCurrentView();
    } catch (error) {
      this.setLoading(false);
      this.showError(error instanceof Error ? error.message : 'Failed to load firewall data');
    }
  }

  /** Loads data for the current view */
  private async loadCurrentView(): Promise<void> {
    try {
      switch (this.currentView) {
        case 'filter':
          await this.loadFilterRules();
          break;
        case 'nat':
          await this.loadNATRules();
          break;
        case 'connections':
          await this.loadActiveConnections();
          break;
      }
      
      this.setLoading(false);
      this.render();
    } catch (error) {
      this.setLoading(false);
      throw error;
    }
  }

  /** Load firewall filter rules */
  private async loadFilterRules(): Promise<void> {
    const result = await getFirewallRules(this.routerIp);
    
    if (result.success && result.data) {
      this.firewallRules = result.data;
    } else {
      throw new Error(result.error || 'Failed to load firewall rules');
    }
  }

  /** Load NAT rules */
  private async loadNATRules(): Promise<void> {
    const result = await getNATRules(this.routerIp);
    
    if (result.success && result.data) {
      this.natRules = result.data;
    } else {
      throw new Error(result.error || 'Failed to load NAT rules');
    }
  }

  /** Load active connections */
  private async loadActiveConnections(): Promise<void> {
    const result = await getActiveConnections(this.routerIp);
    
    if (result.success && result.data) {
      this.activeConnections = result.data;
    } else {
      throw new Error(result.error || 'Failed to load active connections');
    }
  }

  /** Switch between different views */
  private switchView(view: 'filter' | 'nat' | 'connections'): void {
    this.currentView = view;
    this.loadCurrentView();
  }

  /** Toggle firewall rule enabled/disabled */
  private async toggleRule(ruleId: string, enabled: boolean, type: 'filter' | 'nat'): Promise<void> {
    try {
      let result;
      if (type === 'filter') {
        result = await toggleFirewallRule(this.routerIp, ruleId, enabled);
      } else {
        result = await toggleNATRule(this.routerIp, ruleId, enabled);
      }

      if (result.success) {
        // Update local state
        if (type === 'filter') {
          const rule = this.firewallRules.find(r => r.id === ruleId);
          if (rule) {
            (rule as any).disabled = !enabled;
          }
        } else {
          const rule = this.natRules.find(r => r.id === ruleId);
          if (rule) {
            (rule as any).disabled = !enabled;
          }
        }
        
        this.render();
        this.showSuccess(`Rule ${enabled ? 'enabled' : 'disabled'} successfully`);
      } else {
        throw new Error(result.error || 'Failed to toggle rule');
      }
    } catch (error) {
      this.showError(error instanceof Error ? error.message : 'Failed to toggle rule');
    }
  }

  /** Delete firewall rule */
  private async deleteRule(ruleId: string, type: 'filter' | 'nat'): Promise<void> {
    const confirmed = confirm(`Are you sure you want to delete this ${type} rule?`);
    if (!confirmed) return;

    try {
      let result;
      if (type === 'filter') {
        result = await deleteFirewallRule(this.routerIp, ruleId);
      } else {
        result = await deleteNATRule(this.routerIp, ruleId);
      }

      if (result.success) {
        // Remove from local state
        if (type === 'filter') {
          this.firewallRules = this.firewallRules.filter(r => r.id !== ruleId);
        } else {
          this.natRules = this.natRules.filter(r => r.id !== ruleId);
        }
        
        this.render();
        this.showSuccess('Rule deleted successfully');
      } else {
        throw new Error(result.error || 'Failed to delete rule');
      }
    } catch (error) {
      this.showError(error instanceof Error ? error.message : 'Failed to delete rule');
    }
  }

  /** Refresh current view */
  private async refreshView(): Promise<void> {
    if (this.routerIp) {
      await this.loadCurrentView();
    }
  }

  /** Sets loading state */
  private setLoading(loading: boolean): void {
    this.isLoading = loading;
    if (loading) {
      this.container.innerHTML = `
        <div class="loading-container">
          <div class="loading-spinner"></div>
          <p>Loading firewall data...</p>
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

  /** Renders the firewall manager */
  private render(): void {
    if (this.isLoading) {
      return;
    }

    this.container.innerHTML = `
      <style>
        .firewall-manager {
          padding: 0;
        }
        
        .firewall-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        
        .firewall-title {
          font-size: 20px;
          font-weight: 600;
          color: #333;
          margin: 0;
        }
        
        .firewall-actions {
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
        
        .rules-container {
          background: white;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          overflow: hidden;
        }
        
        .rules-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .rules-table th {
          background: #f8f9fa;
          border-bottom: 1px solid #dee2e6;
          padding: 12px;
          text-align: left;
          font-weight: 600;
          color: #333;
          font-size: 14px;
        }
        
        .rules-table td {
          border-bottom: 1px solid #f8f9fa;
          padding: 12px;
          font-size: 14px;
          vertical-align: middle;
        }
        
        .rules-table tr:hover {
          background: #f8f9fa;
        }
        
        .rule-disabled {
          opacity: 0.6;
          background: #f8f9fa !important;
        }
        
        .chain-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
          color: white;
          text-transform: uppercase;
        }
        
        .action-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
          color: white;
          text-transform: uppercase;
        }
        
        .rule-actions {
          display: flex;
          gap: 8px;
        }
        
        .rule-action-btn {
          background: none;
          border: 1px solid #dee2e6;
          border-radius: 4px;
          padding: 4px 8px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .rule-action-btn:hover {
          background: #f8f9fa;
        }
        
        .rule-action-btn.toggle {
          border-color: #28a745;
          color: #28a745;
        }
        
        .rule-action-btn.toggle.disabled {
          border-color: #6c757d;
          color: #6c757d;
        }
        
        .rule-action-btn.delete {
          border-color: #dc3545;
          color: #dc3545;
        }
        
        .rule-action-btn.delete:hover {
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
        
        .stats-bar {
          display: flex;
          gap: 20px;
          margin-bottom: 20px;
          padding: 16px;
          background: #f8f9fa;
          border-radius: 6px;
        }
        
        .stat-item {
          text-align: center;
        }
        
        .stat-value {
          font-size: 24px;
          font-weight: 600;
          color: #333;
        }
        
        .stat-label {
          font-size: 12px;
          color: #666;
          text-transform: uppercase;
          margin-top: 4px;
        }
      </style>
      
      <div class="firewall-manager">
        <div class="firewall-header">
          <h2 class="firewall-title">Firewall Management</h2>
          <div class="firewall-actions">
            <button class="action-button refresh" id="refresh-firewall">
              🔄 Refresh
            </button>
          </div>
        </div>
        
        <div class="view-tabs">
          <button class="view-tab ${this.currentView === 'filter' ? 'active' : ''}" data-view="filter">
            Filter Rules
          </button>
          <button class="view-tab ${this.currentView === 'nat' ? 'active' : ''}" data-view="nat">
            NAT Rules
          </button>
          <button class="view-tab ${this.currentView === 'connections' ? 'active' : ''}" data-view="connections">
            Active Connections
          </button>
        </div>
        
        ${this.renderCurrentView()}
      </div>
    `;

    this.attachEventListeners();
  }

  /** Renders the current view content */
  private renderCurrentView(): string {
    switch (this.currentView) {
      case 'filter':
        return this.renderFilterRules();
      case 'nat':
        return this.renderNATRules();
      case 'connections':
        return this.renderActiveConnections();
      default:
        return '';
    }
  }

  /** Renders firewall filter rules */
  private renderFilterRules(): string {
    if (this.firewallRules.length === 0) {
      return `
        <div class="empty-state">
          <h3>No Firewall Rules</h3>
          <p>No firewall filter rules found on this router.</p>
        </div>
      `;
    }

    const stats = this.getFilterRuleStats();

    return `
      <div class="stats-bar">
        <div class="stat-item">
          <div class="stat-value">${stats.total}</div>
          <div class="stat-label">Total Rules</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${stats.enabled}</div>
          <div class="stat-label">Enabled</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${stats.disabled}</div>
          <div class="stat-label">Disabled</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${stats.accept}</div>
          <div class="stat-label">Accept</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${stats.drop}</div>
          <div class="stat-label">Drop</div>
        </div>
      </div>
      
      <div class="rules-container">
        <table class="rules-table">
          <thead>
            <tr>
              <th>Chain</th>
              <th>Action</th>
              <th>Protocol</th>
              <th>Source</th>
              <th>Destination</th>
              <th>Interface</th>
              <th>Comment</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${this.firewallRules.map(rule => this.renderFirewallRule(rule)).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  /** Renders NAT rules */
  private renderNATRules(): string {
    if (this.natRules.length === 0) {
      return `
        <div class="empty-state">
          <h3>No NAT Rules</h3>
          <p>No NAT rules found on this router.</p>
        </div>
      `;
    }

    const stats = this.getNATRuleStats();

    return `
      <div class="stats-bar">
        <div class="stat-item">
          <div class="stat-value">${stats.total}</div>
          <div class="stat-label">Total Rules</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${stats.srcnat}</div>
          <div class="stat-label">SRC NAT</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${stats.dstnat}</div>
          <div class="stat-label">DST NAT</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${stats.enabled}</div>
          <div class="stat-label">Enabled</div>
        </div>
      </div>
      
      <div class="rules-container">
        <table class="rules-table">
          <thead>
            <tr>
              <th>Chain</th>
              <th>Action</th>
              <th>Protocol</th>
              <th>Source</th>
              <th>Destination</th>
              <th>To Address</th>
              <th>Comment</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${this.natRules.map(rule => this.renderNATRule(rule)).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  /** Renders active connections */
  private renderActiveConnections(): string {
    if (this.activeConnections.length === 0) {
      return `
        <div class="empty-state">
          <h3>No Active Connections</h3>
          <p>No active connections found.</p>
        </div>
      `;
    }

    const stats = this.getConnectionStats();

    return `
      <div class="stats-bar">
        <div class="stat-item">
          <div class="stat-value">${stats.total}</div>
          <div class="stat-label">Total</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${stats.tcp}</div>
          <div class="stat-label">TCP</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${stats.udp}</div>
          <div class="stat-label">UDP</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${stats.icmp}</div>
          <div class="stat-label">ICMP</div>
        </div>
      </div>
      
      <div class="rules-container">
        <table class="rules-table">
          <thead>
            <tr>
              <th>Protocol</th>
              <th>Source</th>
              <th>Destination</th>
              <th>Reply Source</th>
              <th>Reply Destination</th>
              <th>Timeout</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${this.activeConnections.map(conn => this.renderActiveConnection(conn)).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  /** Renders a single firewall rule */
  private renderFirewallRule(rule: FirewallRule): string {
    const isDisabled = rule.disabled;
    
    return `
      <tr class="${isDisabled ? 'rule-disabled' : ''}">
        <td>
          <span class="chain-badge" style="background-color: ${getChainColor(rule.chain)}">
            ${rule.chain}
          </span>
        </td>
        <td>
          <span class="action-badge" style="background-color: ${getActionColor(rule.action)}">
            ${rule.action}
          </span>
        </td>
        <td>${rule.protocol || '-'}</td>
        <td>${rule.srcAddress || 'any'}</td>
        <td>${rule.dstAddress || 'any'}</td>
        <td>
          ${rule.inInterface ? `in: ${rule.inInterface}` : ''}
          ${rule.outInterface ? `out: ${rule.outInterface}` : ''}
          ${!rule.inInterface && !rule.outInterface ? 'any' : ''}
        </td>
        <td>${rule.comment || '-'}</td>
        <td>
          <div class="rule-actions">
            <button class="rule-action-btn toggle ${isDisabled ? 'disabled' : ''}" 
                    data-rule-id="${rule.id}" 
                    data-enabled="${!isDisabled}"
                    data-type="filter">
              ${isDisabled ? 'Enable' : 'Disable'}
            </button>
            <button class="rule-action-btn delete" 
                    data-rule-id="${rule.id}"
                    data-type="filter">
              Delete
            </button>
          </div>
        </td>
      </tr>
    `;
  }

  /** Renders a single NAT rule */
  private renderNATRule(rule: NATRule): string {
    const isDisabled = rule.disabled;
    
    return `
      <tr class="${isDisabled ? 'rule-disabled' : ''}">
        <td>
          <span class="chain-badge" style="background-color: ${getChainColor(rule.chain)}">
            ${rule.chain}
          </span>
        </td>
        <td>
          <span class="action-badge" style="background-color: ${getActionColor(rule.action)}">
            ${rule.action}
          </span>
        </td>
        <td>${rule.protocol || '-'}</td>
        <td>${rule.srcAddress || 'any'}</td>
        <td>${rule.dstAddress || 'any'}</td>
        <td>
          ${rule.toAddresses || '-'}
          ${rule.toPorts ? `:${rule.toPorts}` : ''}
        </td>
        <td>${rule.comment || '-'}</td>
        <td>
          <div class="rule-actions">
            <button class="rule-action-btn toggle ${isDisabled ? 'disabled' : ''}" 
                    data-rule-id="${rule.id}" 
                    data-enabled="${!isDisabled}"
                    data-type="nat">
              ${isDisabled ? 'Enable' : 'Disable'}
            </button>
            <button class="rule-action-btn delete" 
                    data-rule-id="${rule.id}"
                    data-type="nat">
              Delete
            </button>
          </div>
        </td>
      </tr>
    `;
  }

  /** Renders a single active connection */
  private renderActiveConnection(conn: ActiveConnection): string {
    return `
      <tr>
        <td>${conn.protocol.toUpperCase()}</td>
        <td>${conn.srcAddress}:${conn.srcPort}</td>
        <td>${conn.dstAddress}:${conn.dstPort}</td>
        <td>${conn.replySrcAddress}:${conn.replySrcPort}</td>
        <td>${conn.replyDstAddress}:${conn.replyDstPort}</td>
        <td>${conn.timeout}</td>
        <td>
          ${conn.assured ? 
            '<span style="color: #28a745; font-weight: 500;">Assured</span>' : 
            '<span style="color: #6c757d;">Not Assured</span>'
          }
        </td>
      </tr>
    `;
  }

  /** Get filter rule statistics */
  private getFilterRuleStats() {
    return {
      total: this.firewallRules.length,
      enabled: this.firewallRules.filter(r => !r.disabled).length,
      disabled: this.firewallRules.filter(r => r.disabled).length,
      accept: this.firewallRules.filter(r => r.action === 'accept').length,
      drop: this.firewallRules.filter(r => r.action === 'drop').length,
    };
  }

  /** Get NAT rule statistics */
  private getNATRuleStats() {
    return {
      total: this.natRules.length,
      enabled: this.natRules.filter(r => !r.disabled).length,
      srcnat: this.natRules.filter(r => r.chain === 'srcnat').length,
      dstnat: this.natRules.filter(r => r.chain === 'dstnat').length,
    };
  }

  /** Get connection statistics */
  private getConnectionStats() {
    return {
      total: this.activeConnections.length,
      tcp: this.activeConnections.filter(c => c.protocol === 'tcp').length,
      udp: this.activeConnections.filter(c => c.protocol === 'udp').length,
      icmp: this.activeConnections.filter(c => c.protocol === 'icmp').length,
    };
  }

  /** Attaches event listeners */
  private attachEventListeners(): void {
    // Refresh button
    const refreshButton = document.getElementById('refresh-firewall');
    if (refreshButton) {
      refreshButton.addEventListener('click', () => this.refreshView());
    }

    // View tabs
    document.querySelectorAll('.view-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const view = tab.getAttribute('data-view') as 'filter' | 'nat' | 'connections';
        if (view) {
          this.switchView(view);
        }
      });
    });

    // Rule action buttons
    document.querySelectorAll('.rule-action-btn').forEach(button => {
      button.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const ruleId = target.getAttribute('data-rule-id');
        const type = target.getAttribute('data-type') as 'filter' | 'nat';
        
        if (!ruleId || !type) return;

        if (target.classList.contains('toggle')) {
          const enabled = target.getAttribute('data-enabled') === 'false';
          this.toggleRule(ruleId, enabled, type);
        } else if (target.classList.contains('delete')) {
          this.deleteRule(ruleId, type);
        }
      });
    });
  }
}