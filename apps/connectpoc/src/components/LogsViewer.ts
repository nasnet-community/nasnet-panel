import type { LogEntry, LogRule, LogStats } from '@/services/logs';
import { 
  getSystemLogs, 
  getLogRules,
  getLogStatistics,
  clearSystemLogs,
  addLogRule,
  updateLogRule,
  deleteLogRule,
  toggleLogRule,
  getLogsByTopic,
  getLogsByLevel,
  detectLogLevel,
  formatLogTime,
  getLogLevelColor,
  getLogLevelIcon,
  filterLogsByText,
  filterLogsByTimeRange,
  exportLogsToText,
  exportLogsToCSV,
  getCommonLogTopics,
  validateLogRule,
  LOG_LEVEL_COLORS
} from '@/services/logs';

/**
 * Logs Viewer Component
 * Comprehensive system logs management and viewing interface
 */
export class LogsViewer {
  private container: HTMLElement;
  private logs: LogEntry[] = [];
  private logRules: LogRule[] = [];
  private logStats: LogStats | null = null;
  private filteredLogs: LogEntry[] = [];
  private routerIp = '';
  private isLoading = false;
  private currentView: 'logs' | 'rules' = 'logs';
  private refreshInterval: number | null = null;
  private autoRefresh = true;
  private searchText = '';
  private selectedLevel: string = 'all';
  private selectedTopic: string = 'all';
  private entriesPerPage = 50;
  private currentPage = 1;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  /** Loads log data for a router */
  public async loadLogData(routerIp: string): Promise<void> {
    this.routerIp = routerIp;
    this.setLoading(true);

    try {
      await this.loadCurrentView();
      await this.loadStatistics();
      this.startAutoRefresh();
    } catch (error) {
      this.setLoading(false);
      this.showError(error instanceof Error ? error.message : 'Failed to load log data');
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
        case 'logs':
          await this.loadLogs();
          break;
        case 'rules':
          await this.loadLogRules();
          break;
      }
      
      this.setLoading(false);
      this.render();
    } catch (error) {
      this.setLoading(false);
      throw error;
    }
  }

  /** Load system logs */
  private async loadLogs(): Promise<void> {
    const result = await getSystemLogs(this.routerIp, 1000); // Get last 1000 entries
    
    if (result.success && result.data) {
      this.logs = result.data.map(log => ({
        ...log,
        level: log.level || detectLogLevel(log.message)
      }));
      this.applyFilters();
    } else {
      throw new Error(result.error || 'Failed to load system logs');
    }
  }

  /** Load log rules */
  private async loadLogRules(): Promise<void> {
    const result = await getLogRules(this.routerIp);
    
    if (result.success && result.data) {
      this.logRules = result.data;
    } else {
      throw new Error(result.error || 'Failed to load log rules');
    }
  }

  /** Load log statistics */
  private async loadStatistics(): Promise<void> {
    const result = await getLogStatistics(this.routerIp);
    
    if (result.success && result.data) {
      this.logStats = result.data;
    }
  }

  /** Apply current filters to logs */
  private applyFilters(): void {
    let filtered = [...this.logs];
    
    // Apply text search
    if (this.searchText) {
      filtered = filterLogsByText(filtered, this.searchText);
    }
    
    // Apply level filter
    if (this.selectedLevel !== 'all') {
      filtered = filtered.filter(log => log.level === this.selectedLevel);
    }
    
    // Apply topic filter
    if (this.selectedTopic !== 'all') {
      filtered = filtered.filter(log => 
        log.topics.toLowerCase().includes(this.selectedTopic.toLowerCase())
      );
    }
    
    this.filteredLogs = filtered;
    this.currentPage = 1; // Reset to first page when filters change
  }

  /** Switch between different views */
  private switchView(view: 'logs' | 'rules'): void {
    this.currentView = view;
    this.loadCurrentView();
  }

  /** Start auto-refresh */
  private startAutoRefresh(): void {
    if (this.autoRefresh && !this.refreshInterval) {
      this.refreshInterval = window.setInterval(() => {
        if (this.currentView === 'logs') {
          this.refreshLogs();
        }
      }, 15000); // Refresh every 15 seconds for logs
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

  /** Refresh logs only */
  private async refreshLogs(): Promise<void> {
    if (this.routerIp && this.currentView === 'logs') {
      try {
        await this.loadLogs();
        await this.loadStatistics();
        this.render();
      } catch (error) {
        console.warn('Auto-refresh failed:', error);
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

  /** Clear system logs */
  private async clearLogs(): Promise<void> {
    const confirmed = confirm('Are you sure you want to clear all system logs? This action cannot be undone.');
    if (!confirmed) return;

    try {
      const result = await clearSystemLogs(this.routerIp);

      if (result.success) {
        this.logs = [];
        this.filteredLogs = [];
        this.render();
        this.showSuccess('System logs cleared successfully');
      } else {
        throw new Error(result.error || 'Failed to clear system logs');
      }
    } catch (error) {
      this.showError(error instanceof Error ? error.message : 'Failed to clear system logs');
    }
  }

  /** Export logs */
  private exportLogs(format: 'txt' | 'csv'): void {
    const logsToExport = this.filteredLogs.length > 0 ? this.filteredLogs : this.logs;
    
    if (logsToExport.length === 0) {
      this.showError('No logs to export');
      return;
    }

    let content: string;
    let filename: string;
    let mimeType: string;

    if (format === 'csv') {
      content = exportLogsToCSV(logsToExport);
      filename = `routeros-logs-${new Date().toISOString().split('T')[0]}.csv`;
      mimeType = 'text/csv';
    } else {
      content = exportLogsToText(logsToExport);
      filename = `routeros-logs-${new Date().toISOString().split('T')[0]}.txt`;
      mimeType = 'text/plain';
    }

    // Create download
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    this.showSuccess(`Logs exported to ${filename}`);
  }

  /** Update search filter */
  private updateSearchFilter(searchText: string): void {
    this.searchText = searchText;
    this.applyFilters();
    this.render();
  }

  /** Update level filter */
  private updateLevelFilter(level: string): void {
    this.selectedLevel = level;
    this.applyFilters();
    this.render();
  }

  /** Update topic filter */
  private updateTopicFilter(topic: string): void {
    this.selectedTopic = topic;
    this.applyFilters();
    this.render();
  }

  /** Change page */
  private changePage(page: number): void {
    const totalPages = Math.ceil(this.filteredLogs.length / this.entriesPerPage);
    if (page >= 1 && page <= totalPages) {
      this.currentPage = page;
      this.render();
    }
  }

  /** Toggle log rule enabled/disabled */
  private async toggleRule(ruleId: string, enabled: boolean): Promise<void> {
    try {
      const result = await toggleLogRule(this.routerIp, ruleId, enabled);

      if (result.success) {
        // Update local state
        const rule = this.logRules.find(r => r.id === ruleId);
        if (rule) {
          (rule as any).disabled = !enabled;
        }
        
        this.render();
        this.showSuccess(`Log rule ${enabled ? 'enabled' : 'disabled'} successfully`);
      } else {
        throw new Error(result.error || 'Failed to toggle log rule');
      }
    } catch (error) {
      this.showError(error instanceof Error ? error.message : 'Failed to toggle log rule');
    }
  }

  /** Delete log rule */
  private async deleteRule(ruleId: string): Promise<void> {
    const confirmed = confirm('Are you sure you want to delete this log rule?');
    if (!confirmed) return;

    try {
      const result = await deleteLogRule(this.routerIp, ruleId);

      if (result.success) {
        this.logRules = this.logRules.filter(r => r.id !== ruleId);
        this.render();
        this.showSuccess('Log rule deleted successfully');
      } else {
        throw new Error(result.error || 'Failed to delete log rule');
      }
    } catch (error) {
      this.showError(error instanceof Error ? error.message : 'Failed to delete log rule');
    }
  }

  /** Show add rule modal */
  private showAddRuleModal(): void {
    this.showModal('Add Log Rule', this.renderAddRuleForm(), async (formData: any) => {
      try {
        const ruleData = {
          topics: formData.topics,
          action: formData.action,
          prefix: formData.prefix,
          remember: formData.remember === 'on',
        };

        const errors = validateLogRule(ruleData);
        if (errors.length > 0) {
          throw new Error(errors.join(', '));
        }

        const result = await addLogRule(this.routerIp, ruleData);

        if (result.success && result.data) {
          this.logRules.push(result.data);
          this.render();
          this.showSuccess('Log rule added successfully');
          return true;
        } else {
          throw new Error(result.error || 'Failed to add log rule');
        }
      } catch (error) {
        this.showError(error instanceof Error ? error.message : 'Failed to add log rule');
        return false;
      }
    });
  }

  /** Sets loading state */
  private setLoading(loading: boolean): void {
    this.isLoading = loading;
    if (loading) {
      this.container.innerHTML = `
        <div class="loading-container">
          <div class="loading-spinner"></div>
          <p>Loading system logs...</p>
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

  /** Renders the logs viewer */
  private render(): void {
    if (this.isLoading) {
      return;
    }

    this.container.innerHTML = `
      <style>
        .logs-viewer {
          padding: 0;
        }
        
        .logs-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        
        .logs-title {
          font-size: 20px;
          font-weight: 600;
          color: #333;
          margin: 0;
        }
        
        .logs-actions {
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
        
        .action-button.clear {
          background: #dc3545;
        }
        
        .action-button.clear:hover {
          background: #c82333;
        }
        
        .action-button.export {
          background: #6f42c1;
        }
        
        .action-button.export:hover {
          background: #5a3399;
        }
        
        .action-button.add {
          background: #ffc107;
          color: #333;
        }
        
        .action-button.add:hover {
          background: #e0a800;
        }

        .stats-overview {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .stat-card {
          text-align: center;
          padding: 12px;
          background: white;
          border-radius: 6px;
          border: 1px solid #dee2e6;
        }

        .stat-value {
          font-size: 20px;
          font-weight: 700;
          color: #333;
          margin-bottom: 4px;
        }

        .stat-label {
          font-size: 10px;
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

        .filters-bar {
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
          padding: 16px;
          background: #f8f9fa;
          border-radius: 6px;
          flex-wrap: wrap;
          align-items: center;
        }

        .filter-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .filter-label {
          font-size: 14px;
          font-weight: 500;
          color: #333;
        }

        .filter-input,
        .filter-select {
          padding: 6px 10px;
          border: 1px solid #dee2e6;
          border-radius: 4px;
          font-size: 14px;
        }

        .filter-input:focus,
        .filter-select:focus {
          outline: none;
          border-color: #007bff;
          box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
        }
        
        .content-container {
          background: white;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          overflow: hidden;
        }
        
        .logs-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .logs-table th {
          background: #f8f9fa;
          border-bottom: 1px solid #dee2e6;
          padding: 12px;
          text-align: left;
          font-weight: 600;
          color: #333;
          font-size: 14px;
        }
        
        .logs-table td {
          border-bottom: 1px solid #f8f9fa;
          padding: 8px 12px;
          font-size: 13px;
          vertical-align: top;
        }
        
        .logs-table tr:hover {
          background: #f8f9fa;
        }
        
        .log-time {
          font-family: monospace;
          color: #666;
          white-space: nowrap;
        }
        
        .log-level {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 500;
          color: white;
          text-transform: uppercase;
        }
        
        .log-topics {
          font-family: monospace;
          color: #007bff;
          font-size: 12px;
        }
        
        .log-message {
          max-width: 400px;
          word-wrap: break-word;
          line-height: 1.4;
        }

        .pagination {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          background: #f8f9fa;
          border-top: 1px solid #dee2e6;
        }

        .pagination-info {
          font-size: 14px;
          color: #666;
        }

        .pagination-controls {
          display: flex;
          gap: 8px;
        }

        .pagination-btn {
          background: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 6px 12px;
          font-size: 14px;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }

        .pagination-btn:hover {
          background: #0056b3;
        }

        .pagination-btn:disabled {
          background: #6c757d;
          cursor: not-allowed;
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

        .form-checkbox {
          margin-right: 8px;
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
      
      <div class="logs-viewer">
        <div class="logs-header">
          <h2 class="logs-title">System Logs</h2>
          <div class="logs-actions">
            <button class="action-button refresh" id="refresh-logs">
              🔄 Refresh
            </button>
            <button class="action-button auto-refresh ${this.autoRefresh ? 'active' : ''}" id="toggle-auto-refresh">
              ${this.autoRefresh ? '⏸️ Pause Auto-Refresh' : '▶️ Start Auto-Refresh'}
            </button>
            ${this.currentView === 'logs' ? `
              <button class="action-button export" id="export-txt">
                📄 Export TXT
              </button>
              <button class="action-button export" id="export-csv">
                📊 Export CSV
              </button>
              <button class="action-button clear" id="clear-logs">
                🗑️ Clear Logs
              </button>
            ` : ''}
            ${this.currentView === 'rules' ? `
              <button class="action-button add" id="add-rule">
                ➕ Add Rule
              </button>
            ` : ''}
          </div>
        </div>
        
        ${this.renderStatistics()}
        
        <div class="view-tabs">
          <button class="view-tab ${this.currentView === 'logs' ? 'active' : ''}" data-view="logs">
            System Logs
          </button>
          <button class="view-tab ${this.currentView === 'rules' ? 'active' : ''}" data-view="rules">
            Log Rules
          </button>
        </div>
        
        ${this.currentView === 'logs' ? this.renderFilters() : ''}
        
        ${this.renderCurrentView()}
      </div>
    `;

    this.attachEventListeners();
  }

  /** Renders statistics overview */
  private renderStatistics(): string {
    if (!this.logStats) {
      return '';
    }

    return `
      <div class="stats-overview">
        <div class="stat-card">
          <div class="stat-value">${this.logStats.totalEntries}</div>
          <div class="stat-label">Total Entries</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" style="color: ${LOG_LEVEL_COLORS.critical}">${this.logStats.criticalCount}</div>
          <div class="stat-label">Critical</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" style="color: ${LOG_LEVEL_COLORS.error}">${this.logStats.errorCount}</div>
          <div class="stat-label">Errors</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" style="color: ${LOG_LEVEL_COLORS.warning}">${this.logStats.warningCount}</div>
          <div class="stat-label">Warnings</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" style="color: ${LOG_LEVEL_COLORS.info}">${this.logStats.infoCount}</div>
          <div class="stat-label">Info</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" style="color: ${LOG_LEVEL_COLORS.debug}">${this.logStats.debugCount}</div>
          <div class="stat-label">Debug</div>
        </div>
      </div>
    `;
  }

  /** Renders filters bar */
  private renderFilters(): string {
    const topics = getCommonLogTopics();
    
    return `
      <div class="filters-bar">
        <div class="filter-group">
          <label class="filter-label">Search:</label>
          <input type="text" id="search-logs" class="filter-input" placeholder="Search logs..." value="${this.searchText}">
        </div>
        <div class="filter-group">
          <label class="filter-label">Level:</label>
          <select id="level-filter" class="filter-select">
            <option value="all" ${this.selectedLevel === 'all' ? 'selected' : ''}>All Levels</option>
            <option value="critical" ${this.selectedLevel === 'critical' ? 'selected' : ''}>Critical</option>
            <option value="error" ${this.selectedLevel === 'error' ? 'selected' : ''}>Error</option>
            <option value="warning" ${this.selectedLevel === 'warning' ? 'selected' : ''}>Warning</option>
            <option value="info" ${this.selectedLevel === 'info' ? 'selected' : ''}>Info</option>
            <option value="debug" ${this.selectedLevel === 'debug' ? 'selected' : ''}>Debug</option>
          </select>
        </div>
        <div class="filter-group">
          <label class="filter-label">Topic:</label>
          <select id="topic-filter" class="filter-select">
            <option value="all" ${this.selectedTopic === 'all' ? 'selected' : ''}>All Topics</option>
            ${topics.map(topic => `
              <option value="${topic}" ${this.selectedTopic === topic ? 'selected' : ''}>${topic}</option>
            `).join('')}
          </select>
        </div>
        <div class="filter-group">
          <span class="filter-label">Showing: ${this.filteredLogs.length} / ${this.logs.length} entries</span>
        </div>
      </div>
    `;
  }

  /** Renders the current view content */
  private renderCurrentView(): string {
    switch (this.currentView) {
      case 'logs':
        return this.renderLogs();
      case 'rules':
        return this.renderRules();
      default:
        return '';
    }
  }

  /** Renders system logs */
  private renderLogs(): string {
    if (this.filteredLogs.length === 0) {
      return `
        <div class="empty-state">
          <h3>No Log Entries</h3>
          <p>${this.logs.length === 0 ? 'No system logs found.' : 'No logs match the current filters.'}</p>
        </div>
      `;
    }

    const startIndex = (this.currentPage - 1) * this.entriesPerPage;
    const endIndex = startIndex + this.entriesPerPage;
    const pageEntries = this.filteredLogs.slice(startIndex, endIndex);
    const totalPages = Math.ceil(this.filteredLogs.length / this.entriesPerPage);

    return `
      <div class="content-container">
        <table class="logs-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Level</th>
              <th>Topics</th>
              <th>Message</th>
            </tr>
          </thead>
          <tbody>
            ${pageEntries.map(log => this.renderLogRow(log)).join('')}
          </tbody>
        </table>
        ${totalPages > 1 ? `
          <div class="pagination">
            <div class="pagination-info">
              Page ${this.currentPage} of ${totalPages} (${this.filteredLogs.length} entries)
            </div>
            <div class="pagination-controls">
              <button class="pagination-btn" ${this.currentPage === 1 ? 'disabled' : ''} 
                      onclick="this.closest('.logs-viewer').dispatchEvent(new CustomEvent('changePage', { detail: ${this.currentPage - 1} }))">
                Previous
              </button>
              <button class="pagination-btn" ${this.currentPage === totalPages ? 'disabled' : ''} 
                      onclick="this.closest('.logs-viewer').dispatchEvent(new CustomEvent('changePage', { detail: ${this.currentPage + 1} }))">
                Next
              </button>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  /** Renders log rules */
  private renderRules(): string {
    if (this.logRules.length === 0) {
      return `
        <div class="empty-state">
          <h3>No Log Rules</h3>
          <p>No log rules configured on this router.</p>
        </div>
      `;
    }

    return `
      <div class="content-container">
        <table class="logs-table">
          <thead>
            <tr>
              <th>Topics</th>
              <th>Action</th>
              <th>Prefix</th>
              <th>Remember</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${this.logRules.map(rule => this.renderRuleRow(rule)).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  /** Renders a single log row */
  private renderLogRow(log: LogEntry): string {
    const level = log.level || 'info';
    const levelColor = getLogLevelColor(level);
    const levelIcon = getLogLevelIcon(level);
    
    return `
      <tr>
        <td><span class="log-time">${formatLogTime(log.time)}</span></td>
        <td>
          <span class="log-level" style="background-color: ${levelColor}">
            ${levelIcon} ${level}
          </span>
        </td>
        <td><span class="log-topics">${log.topics}</span></td>
        <td><div class="log-message">${log.message}</div></td>
      </tr>
    `;
  }

  /** Renders a single rule row */
  private renderRuleRow(rule: LogRule): string {
    return `
      <tr>
        <td><span class="log-topics">${rule.topics}</span></td>
        <td><strong>${rule.action}</strong></td>
        <td>${rule.prefix || '-'}</td>
        <td>${rule.remember ? 'Yes' : 'No'}</td>
        <td>
          <span class="log-level" style="background-color: ${rule.disabled ? '#6c757d' : '#28a745'}">
            ${rule.disabled ? 'Disabled' : 'Enabled'}
          </span>
        </td>
        <td>
          <div class="item-actions">
            <button class="item-action-btn toggle ${rule.disabled ? 'disabled' : ''}" 
                    data-rule-id="${rule.id}" 
                    data-enabled="${!rule.disabled}">
              ${rule.disabled ? 'Enable' : 'Disable'}
            </button>
            <button class="item-action-btn delete" 
                    data-rule-id="${rule.id}">
              Delete
            </button>
          </div>
        </td>
      </tr>
    `;
  }

  /** Renders add rule form */
  private renderAddRuleForm(): string {
    const topics = getCommonLogTopics();
    
    return `
      <form>
        <div class="form-group">
          <label class="form-label">Topics *</label>
          <select name="topics" class="form-select" required>
            ${topics.map(topic => `<option value="${topic}">${topic}</option>`).join('')}
          </select>
          <small style="color: #666; font-size: 12px;">Select the log topic to capture</small>
        </div>
        <div class="form-group">
          <label class="form-label">Action *</label>
          <select name="action" class="form-select" required>
            <option value="memory">Memory</option>
            <option value="disk">Disk</option>
            <option value="remote">Remote</option>
            <option value="echo">Echo</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Prefix</label>
          <input type="text" name="prefix" class="form-input" placeholder="Optional prefix for log messages">
        </div>
        <div class="form-group">
          <label class="form-label">
            <input type="checkbox" name="remember" class="form-checkbox">
            Remember log entries in memory
          </label>
        </div>
      </form>
    `;
  }

  /** Attaches event listeners */
  private attachEventListeners(): void {
    // Refresh button
    const refreshButton = document.getElementById('refresh-logs');
    if (refreshButton) {
      refreshButton.addEventListener('click', () => this.manualRefresh());
    }

    // Auto-refresh toggle button
    const autoRefreshButton = document.getElementById('toggle-auto-refresh');
    if (autoRefreshButton) {
      autoRefreshButton.addEventListener('click', () => this.toggleAutoRefresh());
    }

    // Export buttons
    const exportTxtButton = document.getElementById('export-txt');
    if (exportTxtButton) {
      exportTxtButton.addEventListener('click', () => this.exportLogs('txt'));
    }

    const exportCsvButton = document.getElementById('export-csv');
    if (exportCsvButton) {
      exportCsvButton.addEventListener('click', () => this.exportLogs('csv'));
    }

    // Clear logs button
    const clearButton = document.getElementById('clear-logs');
    if (clearButton) {
      clearButton.addEventListener('click', () => this.clearLogs());
    }

    // Add rule button
    const addRuleButton = document.getElementById('add-rule');
    if (addRuleButton) {
      addRuleButton.addEventListener('click', () => this.showAddRuleModal());
    }

    // View tabs
    document.querySelectorAll('.view-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const view = tab.getAttribute('data-view') as 'logs' | 'rules';
        if (view) {
          this.switchView(view);
        }
      });
    });

    // Filter inputs
    const searchInput = document.getElementById('search-logs');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.updateSearchFilter((e.target as HTMLInputElement).value);
      });
    }

    const levelFilter = document.getElementById('level-filter');
    if (levelFilter) {
      levelFilter.addEventListener('change', (e) => {
        this.updateLevelFilter((e.target as HTMLSelectElement).value);
      });
    }

    const topicFilter = document.getElementById('topic-filter');
    if (topicFilter) {
      topicFilter.addEventListener('change', (e) => {
        this.updateTopicFilter((e.target as HTMLSelectElement).value);
      });
    }

    // Pagination events
    this.container.addEventListener('changePage', (e: any) => {
      this.changePage(e.detail);
    });

    // Rule action buttons
    document.querySelectorAll('[data-rule-id]').forEach(button => {
      button.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const ruleId = target.getAttribute('data-rule-id');
        
        if (!ruleId) return;

        if (target.classList.contains('toggle')) {
          const enabled = target.getAttribute('data-enabled') === 'false';
          this.toggleRule(ruleId, enabled);
        } else if (target.classList.contains('delete')) {
          this.deleteRule(ruleId);
        }
      });
    });
  }
}