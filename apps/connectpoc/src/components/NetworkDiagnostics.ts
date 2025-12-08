import type {
  PingConfig,
  TracerouteConfig,
  BandwidthConfig,
  DNSLookupConfig,
  PortScanConfig,
  ConnectionTestConfig,
  InterfaceStats
} from '@/services/diagnostics';
import {
  startPingTest,
  startTracerouteTest,
  startBandwidthTest,
  performDNSLookup,
  startPortScan,
  testConnection,
  performNetworkQualityTest,
  getInterfaceStatistics,
  getNetworkNeighbors,
  stopDiagnosticTest,
  getDiagnosticTestStatus,
  exportDiagnosticResults,
  formatDiagnosticResult,
  formatSpeed,
  formatLatency
} from '@/services/diagnostics';

/**
 * Network Diagnostics Component
 * Comprehensive network diagnostic tools interface with real-time testing capabilities
 */
export class NetworkDiagnostics {
  private container: HTMLElement;
  private routerIp = '';
  private currentView: 'ping' | 'traceroute' | 'bandwidth' | 'dns' | 'port-scan' | 'connection' | 'quality' | 'interfaces' | 'neighbors' = 'ping';
  private activeTests: Map<string, any> = new Map();
  private testHistory: any[] = [];
  private autoRefreshInterval: number | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  /** Initialize the diagnostics for a router */
  public async initialize(routerIp: string): Promise<void> {
    this.routerIp = routerIp;
    this.render();
    this.startAutoRefresh();
  }

  /** Switch between different diagnostic tools */
  private switchView(view: typeof this.currentView): void {
    this.currentView = view;
    this.render();
  }

  /** Start auto refresh for active tests */
  private startAutoRefresh(): void {
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
    }

    this.autoRefreshInterval = window.setInterval(() => {
      this.refreshActiveTests();
    }, 2000); // Refresh every 2 seconds
  }

  /** Stop auto refresh */
  private stopAutoRefresh(): void {
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
      this.autoRefreshInterval = null;
    }
  }

  /** Refresh status of active tests */
  private async refreshActiveTests(): Promise<void> {
    for (const [testId, test] of this.activeTests.entries()) {
      if (test.status === 'running') {
        try {
          const result = await getDiagnosticTestStatus(this.routerIp, test.type, testId);
          if (result.success && result.data) {
            this.activeTests.set(testId, { ...test, ...result.data });
            
            // If test completed, move to history
            if (result.data.status === 'completed' || result.data.status === 'failed') {
              this.testHistory.unshift({ ...result.data, id: testId });
              this.activeTests.delete(testId);
            }
          }
        } catch (error) {
          console.error(`Failed to refresh test ${testId}:`, error);
        }
      }
    }

    // Update UI if we're showing active tests
    if (this.activeTests.size > 0 || this.testHistory.length > 0) {
      this.updateTestResults();
    }
  }

  /** Start ping test */
  private async startPing(config: PingConfig): Promise<void> {
    try {
      this.setLoading(true);
      const result = await startPingTest(this.routerIp, config);
      
      if (result.success && result.data) {
        this.activeTests.set(result.data.id, { ...result.data, type: 'ping' });
        this.showSuccess('Ping test started successfully');
        this.updateTestResults();
      } else {
        throw new Error(result.error || 'Failed to start ping test');
      }
    } catch (error) {
      this.showError(error instanceof Error ? error.message : 'Failed to start ping test');
    } finally {
      this.setLoading(false);
    }
  }

  /** Start traceroute test */
  private async startTraceroute(config: TracerouteConfig): Promise<void> {
    try {
      this.setLoading(true);
      const result = await startTracerouteTest(this.routerIp, config);
      
      if (result.success && result.data) {
        this.activeTests.set(result.data.id, { ...result.data, type: 'traceroute' });
        this.showSuccess('Traceroute test started successfully');
        this.updateTestResults();
      } else {
        throw new Error(result.error || 'Failed to start traceroute test');
      }
    } catch (error) {
      this.showError(error instanceof Error ? error.message : 'Failed to start traceroute test');
    } finally {
      this.setLoading(false);
    }
  }

  /** Start bandwidth test */
  private async startBandwidth(config: BandwidthConfig): Promise<void> {
    try {
      this.setLoading(true);
      const result = await startBandwidthTest(this.routerIp, config);
      
      if (result.success && result.data) {
        this.activeTests.set(result.data.id, { ...result.data, type: 'bandwidth' });
        this.showSuccess('Bandwidth test started successfully');
        this.updateTestResults();
      } else {
        throw new Error(result.error || 'Failed to start bandwidth test');
      }
    } catch (error) {
      this.showError(error instanceof Error ? error.message : 'Failed to start bandwidth test');
    } finally {
      this.setLoading(false);
    }
  }

  /** Perform DNS lookup */
  private async performDNS(config: DNSLookupConfig): Promise<void> {
    try {
      this.setLoading(true);
      const result = await performDNSLookup(this.routerIp, config);
      
      if (result.success && result.data) {
        this.testHistory.unshift({ ...result.data, type: 'dns' });
        this.showSuccess('DNS lookup completed successfully');
        this.updateTestResults();
      } else {
        throw new Error(result.error || 'Failed to perform DNS lookup');
      }
    } catch (error) {
      this.showError(error instanceof Error ? error.message : 'Failed to perform DNS lookup');
    } finally {
      this.setLoading(false);
    }
  }

  /** Start port scan */
  private async startPortScan(config: PortScanConfig): Promise<void> {
    try {
      this.setLoading(true);
      const result = await startPortScan(this.routerIp, config);
      
      if (result.success && result.data) {
        this.activeTests.set(result.data.id, { ...result.data, type: 'port-scan' });
        this.showSuccess('Port scan started successfully');
        this.updateTestResults();
      } else {
        throw new Error(result.error || 'Failed to start port scan');
      }
    } catch (error) {
      this.showError(error instanceof Error ? error.message : 'Failed to start port scan');
    } finally {
      this.setLoading(false);
    }
  }

  /** Test connection */
  private async testConnectionTo(config: ConnectionTestConfig): Promise<void> {
    try {
      this.setLoading(true);
      const result = await testConnection(this.routerIp, config);
      
      if (result.success && result.data) {
        this.testHistory.unshift({ ...result.data, type: 'connection' });
        this.showSuccess('Connection test completed successfully');
        this.updateTestResults();
      } else {
        throw new Error(result.error || 'Failed to test connection');
      }
    } catch (error) {
      this.showError(error instanceof Error ? error.message : 'Failed to test connection');
    } finally {
      this.setLoading(false);
    }
  }

  /** Perform network quality test */
  private async performQualityTest(target: string): Promise<void> {
    try {
      this.setLoading(true);
      const result = await performNetworkQualityTest(this.routerIp, target);
      
      if (result.success && result.data) {
        this.testHistory.unshift({ ...result.data, type: 'quality' });
        this.showSuccess('Network quality test completed successfully');
        this.updateTestResults();
      } else {
        throw new Error(result.error || 'Failed to perform network quality test');
      }
    } catch (error) {
      this.showError(error instanceof Error ? error.message : 'Failed to perform network quality test');
    } finally {
      this.setLoading(false);
    }
  }

  /** Load interface statistics */
  private async loadInterfaces(): Promise<void> {
    try {
      this.setLoading(true);
      const result = await getInterfaceStatistics(this.routerIp);
      
      if (result.success && result.data) {
        this.updateInterfaceView(result.data);
      } else {
        throw new Error(result.error || 'Failed to load interface statistics');
      }
    } catch (error) {
      this.showError(error instanceof Error ? error.message : 'Failed to load interface statistics');
    } finally {
      this.setLoading(false);
    }
  }

  /** Load network neighbors */
  private async loadNeighbors(): Promise<void> {
    try {
      this.setLoading(true);
      const result = await getNetworkNeighbors(this.routerIp);
      
      if (result.success && result.data) {
        this.updateNeighborsView(result.data);
      } else {
        throw new Error(result.error || 'Failed to load network neighbors');
      }
    } catch (error) {
      this.showError(error instanceof Error ? error.message : 'Failed to load network neighbors');
    } finally {
      this.setLoading(false);
    }
  }

  /** Stop a running test */
  private async stopTest(testId: string, testType: string): Promise<void> {
    try {
      const result = await stopDiagnosticTest(this.routerIp, testType as any, testId);
      
      if (result.success) {
        this.activeTests.delete(testId);
        this.showSuccess('Test stopped successfully');
        this.updateTestResults();
      } else {
        throw new Error(result.error || 'Failed to stop test');
      }
    } catch (error) {
      this.showError(error instanceof Error ? error.message : 'Failed to stop test');
    }
  }

  /** Export test results */
  private async exportResults(): Promise<void> {
    try {
      const testIds = Array.from(this.activeTests.keys()).concat(
        this.testHistory.map(test => test.id).filter(id => id)
      );

      if (testIds.length === 0) {
        this.showError('No test results to export');
        return;
      }

      const result = await exportDiagnosticResults(this.routerIp, testIds);
      
      if (result.success && result.data) {
        const dataStr = JSON.stringify(result.data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `diagnostic-results-${this.routerIp}-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showSuccess('Diagnostic results exported successfully');
      } else {
        throw new Error(result.error || 'Failed to export results');
      }
    } catch (error) {
      this.showError(error instanceof Error ? error.message : 'Failed to export results');
    }
  }

  /** Clear test history */
  private clearHistory(): void {
    this.testHistory = [];
    this.updateTestResults();
    this.showSuccess('Test history cleared');
  }

  /** Update test results in UI */
  private updateTestResults(): void {
    const activeTestsContainer = document.getElementById('active-tests');
    const historyContainer = document.getElementById('test-history');

    if (activeTestsContainer) {
      activeTestsContainer.innerHTML = this.renderActiveTests();
    }

    if (historyContainer) {
      historyContainer.innerHTML = this.renderTestHistory();
    }
  }

  /** Update interface statistics view */
  private updateInterfaceView(interfaces: InterfaceStats[]): void {
    const container = document.getElementById('interfaces-content');
    if (container) {
      container.innerHTML = this.renderInterfaces(interfaces);
    }
  }

  /** Update neighbors view */
  private updateNeighborsView(neighbors: any[]): void {
    const container = document.getElementById('neighbors-content');
    if (container) {
      container.innerHTML = this.renderNeighbors(neighbors);
    }
  }

  /** Show form modal for test configuration */
  private showTestModal(testType: string): void {
    const title = this.getTestTitle(testType);
    const content = this.renderTestForm(testType);
    
    this.showModal(title, content, async (formData: any) => {
      try {
        switch (testType) {
          case 'ping':
            await this.startPing(this.parsePingConfig(formData));
            break;
          case 'traceroute':
            await this.startTraceroute(this.parseTracerouteConfig(formData));
            break;
          case 'bandwidth':
            await this.startBandwidth(this.parseBandwidthConfig(formData));
            break;
          case 'dns':
            await this.performDNS(this.parseDNSConfig(formData));
            break;
          case 'port-scan':
            await this.startPortScan(this.parsePortScanConfig(formData));
            break;
          case 'connection':
            await this.testConnectionTo(this.parseConnectionConfig(formData));
            break;
          case 'quality':
            await this.performQualityTest(formData.target);
            break;
        }
        return true;
      } catch (error) {
        this.showError(error instanceof Error ? error.message : 'Failed to start test');
        return false;
      }
    });
  }

  /** Parse form data to ping config */
  private parsePingConfig(formData: any): PingConfig {
    return {
      target: formData.target,
      count: parseInt(formData.count) || 4,
      size: parseInt(formData.size) || 64,
      interval: parseInt(formData.interval) || 1,
      timeout: parseInt(formData.timeout) || 1,
      srcAddress: formData.srcAddress || undefined,
    };
  }

  /** Parse form data to traceroute config */
  private parseTracerouteConfig(formData: any): TracerouteConfig {
    return {
      target: formData.target,
      maxHops: parseInt(formData.maxHops) || 30,
      timeout: parseInt(formData.timeout) || 1,
      protocol: formData.protocol || 'icmp',
      srcAddress: formData.srcAddress || undefined,
    };
  }

  /** Parse form data to bandwidth config */
  private parseBandwidthConfig(formData: any): BandwidthConfig {
    return {
      target: formData.target,
      direction: formData.direction || 'both',
      duration: parseInt(formData.duration) || 10,
      connections: parseInt(formData.connections) || 1,
      protocol: formData.protocol || 'tcp',
    };
  }

  /** Parse form data to DNS config */
  private parseDNSConfig(formData: any): DNSLookupConfig {
    return {
      hostname: formData.hostname,
      recordType: formData.recordType || 'A',
      server: formData.server || undefined,
      timeout: parseInt(formData.timeout) || 2,
    };
  }

  /** Parse form data to port scan config */
  private parsePortScanConfig(formData: any): PortScanConfig {
    return {
      target: formData.target,
      ports: formData.ports,
      protocol: formData.protocol || 'tcp',
      timeout: parseInt(formData.timeout) || 1,
      threads: parseInt(formData.threads) || 10,
    };
  }

  /** Parse form data to connection config */
  private parseConnectionConfig(formData: any): ConnectionTestConfig {
    return {
      target: formData.target,
      port: parseInt(formData.port),
      protocol: formData.protocol || 'tcp',
      timeout: parseInt(formData.timeout) || 3,
    };
  }

  /** Get test title */
  private getTestTitle(testType: string): string {
    const titles: Record<string, string> = {
      'ping': 'Ping Test Configuration',
      'traceroute': 'Traceroute Configuration',
      'bandwidth': 'Bandwidth Test Configuration',
      'dns': 'DNS Lookup Configuration',
      'port-scan': 'Port Scan Configuration',
      'connection': 'Connection Test Configuration',
      'quality': 'Network Quality Test',
    };
    return titles[testType] || 'Test Configuration';
  }

  /** Sets loading state */
  private setLoading(loading: boolean): void {
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
      loadingIndicator.style.display = loading ? 'block' : 'none';
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
          <button class="btn btn-primary">Start Test</button>
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

  /** Cleanup when component is destroyed */
  public destroy(): void {
    this.stopAutoRefresh();
  }

  /** Renders the network diagnostics interface */
  private render(): void {
    this.container.innerHTML = `
      <style>
        ${this.getStyles()}
      </style>
      
      <div class="network-diagnostics">
        <div class="diagnostics-header">
          <h2 class="diagnostics-title">
            <span class="title-icon">🔧</span>
            Network Diagnostics
          </h2>
          <div class="diagnostics-actions">
            <div id="loading-indicator" class="loading-indicator" style="display: none;">
              <div class="loading-spinner"></div>
              <span>Running test...</span>
            </div>
            <button class="action-button export" id="export-results">
              💾 Export Results
            </button>
            <button class="action-button clear" id="clear-history">
              🗑️ Clear History
            </button>
          </div>
        </div>
        
        <div class="diagnostics-tabs">
          ${this.renderTabs()}
        </div>
        
        <div class="diagnostics-content">
          ${this.renderCurrentView()}
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  /** Renders navigation tabs */
  private renderTabs(): string {
    const tabs = [
      { key: 'ping', label: 'Ping', icon: '📡' },
      { key: 'traceroute', label: 'Traceroute', icon: '🗺️' },
      { key: 'bandwidth', label: 'Bandwidth', icon: '⚡' },
      { key: 'dns', label: 'DNS Lookup', icon: '🔍' },
      { key: 'port-scan', label: 'Port Scan', icon: '🚪' },
      { key: 'connection', label: 'Connection', icon: '🔗' },
      { key: 'quality', label: 'Quality Test', icon: '📊' },
      { key: 'interfaces', label: 'Interfaces', icon: '🖧' },
      { key: 'neighbors', label: 'Neighbors', icon: '👥' },
    ];

    return tabs.map(tab => `
      <button class="diagnostic-tab ${this.currentView === tab.key ? 'active' : ''}" data-view="${tab.key}">
        <span class="tab-icon">${tab.icon}</span>
        <span class="tab-label">${tab.label}</span>
      </button>
    `).join('');
  }

  /** Renders the current view content */
  private renderCurrentView(): string {
    switch (this.currentView) {
      case 'ping':
      case 'traceroute':
      case 'bandwidth':
      case 'dns':
      case 'port-scan':
      case 'connection':
      case 'quality':
        return this.renderTestView();
      case 'interfaces':
        return this.renderInterfacesView();
      case 'neighbors':
        return this.renderNeighborsView();
      default:
        return '';
    }
  }

  /** Renders test view with configuration and results */
  private renderTestView(): string {
    return `
      <div class="test-view">
        <div class="test-controls">
          <button class="test-button start-test" id="start-test">
            <span class="test-icon">${this.getTestIcon(this.currentView)}</span>
            <span>Start ${this.currentView.charAt(0).toUpperCase() + this.currentView.slice(1)} Test</span>
          </button>
          <div class="test-description">
            ${this.getTestDescription(this.currentView)}
          </div>
        </div>
        
        <div class="test-results">
          <div class="results-section">
            <h3>Active Tests</h3>
            <div id="active-tests" class="active-tests">
              ${this.renderActiveTests()}
            </div>
          </div>
          
          <div class="results-section">
            <h3>Test History</h3>
            <div id="test-history" class="test-history">
              ${this.renderTestHistory()}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /** Renders interfaces view */
  private renderInterfacesView(): string {
    return `
      <div class="interfaces-view">
        <div class="view-controls">
          <button class="action-button refresh" id="refresh-interfaces">
            🔄 Refresh Interfaces
          </button>
        </div>
        <div id="interfaces-content" class="interfaces-content">
          <div class="loading-placeholder">Click refresh to load interface statistics</div>
        </div>
      </div>
    `;
  }

  /** Renders neighbors view */
  private renderNeighborsView(): string {
    return `
      <div class="neighbors-view">
        <div class="view-controls">
          <button class="action-button refresh" id="refresh-neighbors">
            🔄 Refresh Neighbors
          </button>
        </div>
        <div id="neighbors-content" class="neighbors-content">
          <div class="loading-placeholder">Click refresh to load network neighbors</div>
        </div>
      </div>
    `;
  }

  /** Renders active tests */
  private renderActiveTests(): string {
    if (this.activeTests.size === 0) {
      return '<div class="empty-state">No active tests</div>';
    }

    return Array.from(this.activeTests.values()).map(test => `
      <div class="test-result-card active">
        <div class="test-header">
          <span class="test-type">${test.type}</span>
          <span class="test-target">${test.target}</span>
          <span class="test-status ${test.status}">
            <span class="status-indicator"></span>
            ${test.status}
          </span>
          <button class="stop-test-btn" data-test-id="${test.id}" data-test-type="${test.type}">Stop</button>
        </div>
        <div class="test-content">
          ${this.renderTestProgress(test)}
        </div>
      </div>
    `).join('');
  }

  /** Renders test history */
  private renderTestHistory(): string {
    if (this.testHistory.length === 0) {
      return '<div class="empty-state">No test history</div>';
    }

    return this.testHistory.slice(0, 10).map(test => `
      <div class="test-result-card completed">
        <div class="test-header">
          <span class="test-type">${test.type}</span>
          <span class="test-target">${test.target || test.hostname || 'N/A'}</span>
          <span class="test-status ${test.status}">
            <span class="status-indicator"></span>
            ${test.status}
          </span>
          <span class="test-time">${this.formatTestTime(test.timestamp || test.startTime)}</span>
        </div>
        <div class="test-content">
          ${this.renderTestResult(test)}
        </div>
      </div>
    `).join('');
  }

  /** Renders test progress for active tests */
  private renderTestProgress(test: any): string {
    switch (test.type) {
      case 'ping':
        return `
          <div class="ping-progress">
            <div class="progress-stats">
              Sent: ${test.statistics?.sent || 0} | 
              Received: ${test.statistics?.received || 0} | 
              Loss: ${test.statistics?.lossPercent || 0}%
            </div>
            ${test.statistics?.avgTime ? `<div class="avg-time">Avg: ${test.statistics.avgTime.toFixed(2)}ms</div>` : ''}
          </div>
        `;
      case 'traceroute':
        return `
          <div class="traceroute-progress">
            <div class="progress-stats">
              Hops discovered: ${test.hops?.length || 0}
            </div>
          </div>
        `;
      case 'bandwidth':
        return `
          <div class="bandwidth-progress">
            <div class="speed-display">
              ↓ ${formatSpeed(test.downloadSpeed)} | ↑ ${formatSpeed(test.uploadSpeed)}
            </div>
            ${test.latency ? `<div class="latency">Latency: ${formatLatency(test.latency)}</div>` : ''}
          </div>
        `;
      default:
        return `<div class="generic-progress">Test in progress...</div>`;
    }
  }

  /** Renders completed test results */
  private renderTestResult(test: any): string {
    switch (test.type) {
      case 'ping':
        return `
          <div class="ping-result">
            <div class="result-stats">
              ${test.statistics?.sent}/${test.statistics?.received} packets 
              (${test.statistics?.lossPercent}% loss) 
              - Avg: ${test.statistics?.avgTime?.toFixed(2)}ms
            </div>
          </div>
        `;
      case 'dns':
        return `
          <div class="dns-result">
            <div class="result-stats">
              ${test.records?.length || 0} records found in ${test.responseTime}ms
            </div>
            ${test.records?.map((record: any) => `
              <div class="dns-record">${record.type}: ${record.data}</div>
            `).join('') || ''}
          </div>
        `;
      case 'quality':
        return `
          <div class="quality-result">
            <div class="quality-grade ${test.grade}">
              Grade: ${test.grade.toUpperCase()}
            </div>
            <div class="quality-metrics">
              Latency: ${formatLatency(test.latency)} | 
              Loss: ${test.packetLoss}% | 
              Speed: ${formatSpeed(test.downloadSpeed)}
            </div>
          </div>
        `;
      default:
        return `<div class="generic-result">${formatDiagnosticResult(test, test.type)}</div>`;
    }
  }

  /** Renders interfaces statistics */
  private renderInterfaces(interfaces: InterfaceStats[]): string {
    if (interfaces.length === 0) {
      return '<div class="empty-state">No interface statistics available</div>';
    }

    return `
      <div class="interfaces-table">
        <table class="data-table">
          <thead>
            <tr>
              <th>Interface</th>
              <th>Type</th>
              <th>Status</th>
              <th>MTU</th>
              <th>TX/RX Bytes</th>
              <th>TX/RX Packets</th>
              <th>Errors</th>
            </tr>
          </thead>
          <tbody>
            ${interfaces.map(iface => `
              <tr>
                <td><strong>${iface.name}</strong></td>
                <td>${iface.type}</td>
                <td>
                  <span class="status-badge ${iface.running ? 'running' : 'down'}">
                    ${iface.running ? 'UP' : 'DOWN'}
                  </span>
                </td>
                <td>${iface.mtu}</td>
                <td>
                  <div class="byte-stats">
                    <div>TX: ${this.formatBytes(iface.txBytes)}</div>
                    <div>RX: ${this.formatBytes(iface.rxBytes)}</div>
                  </div>
                </td>
                <td>
                  <div class="packet-stats">
                    <div>TX: ${iface.txPackets.toLocaleString()}</div>
                    <div>RX: ${iface.rxPackets.toLocaleString()}</div>
                  </div>
                </td>
                <td>
                  <div class="error-stats ${iface.txErrors + iface.rxErrors > 0 ? 'has-errors' : ''}">
                    <div>TX: ${iface.txErrors}</div>
                    <div>RX: ${iface.rxErrors}</div>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  /** Renders network neighbors */
  private renderNeighbors(neighbors: any[]): string {
    if (neighbors.length === 0) {
      return '<div class="empty-state">No network neighbors found</div>';
    }

    return `
      <div class="neighbors-table">
        <table class="data-table">
          <thead>
            <tr>
              <th>IP Address</th>
              <th>MAC Address</th>
              <th>Interface</th>
              <th>Status</th>
              <th>Comment</th>
            </tr>
          </thead>
          <tbody>
            ${neighbors.map(neighbor => `
              <tr>
                <td><strong>${neighbor.address || 'N/A'}</strong></td>
                <td><code>${neighbor['mac-address'] || 'N/A'}</code></td>
                <td>${neighbor.interface || 'N/A'}</td>
                <td>
                  <span class="status-badge ${neighbor.dynamic === 'true' ? 'dynamic' : 'static'}">
                    ${neighbor.dynamic === 'true' ? 'Dynamic' : 'Static'}
                  </span>
                </td>
                <td>${neighbor.comment || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  /** Renders test configuration form */
  private renderTestForm(testType: string): string {
    switch (testType) {
      case 'ping':
        return `
          <form>
            <div class="form-group">
              <label class="form-label">Target Host *</label>
              <input type="text" name="target" class="form-input" placeholder="192.168.1.1 or google.com" required>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Count</label>
                <input type="number" name="count" class="form-input" value="4" min="1" max="100">
              </div>
              <div class="form-group">
                <label class="form-label">Packet Size</label>
                <input type="number" name="size" class="form-input" value="64" min="32" max="65507">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Interval (s)</label>
                <input type="number" name="interval" class="form-input" value="1" min="1" max="10">
              </div>
              <div class="form-group">
                <label class="form-label">Timeout (s)</label>
                <input type="number" name="timeout" class="form-input" value="1" min="1" max="10">
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Source Address (optional)</label>
              <input type="text" name="srcAddress" class="form-input" placeholder="Source IP address">
            </div>
          </form>
        `;

      case 'traceroute':
        return `
          <form>
            <div class="form-group">
              <label class="form-label">Target Host *</label>
              <input type="text" name="target" class="form-input" placeholder="192.168.1.1 or google.com" required>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Max Hops</label>
                <input type="number" name="maxHops" class="form-input" value="30" min="1" max="64">
              </div>
              <div class="form-group">
                <label class="form-label">Timeout (s)</label>
                <input type="number" name="timeout" class="form-input" value="1" min="1" max="10">
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Protocol</label>
              <select name="protocol" class="form-select">
                <option value="icmp">ICMP</option>
                <option value="udp">UDP</option>
                <option value="tcp">TCP</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Source Address (optional)</label>
              <input type="text" name="srcAddress" class="form-input" placeholder="Source IP address">
            </div>
          </form>
        `;

      case 'bandwidth':
        return `
          <form>
            <div class="form-group">
              <label class="form-label">Target Host *</label>
              <input type="text" name="target" class="form-input" placeholder="192.168.1.1" required>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Direction</label>
                <select name="direction" class="form-select">
                  <option value="both">Both</option>
                  <option value="download">Download Only</option>
                  <option value="upload">Upload Only</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Duration (s)</label>
                <input type="number" name="duration" class="form-input" value="10" min="1" max="300">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Connections</label>
                <input type="number" name="connections" class="form-input" value="1" min="1" max="10">
              </div>
              <div class="form-group">
                <label class="form-label">Protocol</label>
                <select name="protocol" class="form-select">
                  <option value="tcp">TCP</option>
                  <option value="udp">UDP</option>
                </select>
              </div>
            </div>
          </form>
        `;

      case 'dns':
        return `
          <form>
            <div class="form-group">
              <label class="form-label">Hostname *</label>
              <input type="text" name="hostname" class="form-input" placeholder="google.com" required>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Record Type</label>
                <select name="recordType" class="form-select">
                  <option value="A">A (IPv4)</option>
                  <option value="AAAA">AAAA (IPv6)</option>
                  <option value="MX">MX (Mail)</option>
                  <option value="TXT">TXT (Text)</option>
                  <option value="CNAME">CNAME (Alias)</option>
                  <option value="NS">NS (Name Server)</option>
                  <option value="PTR">PTR (Reverse)</option>
                  <option value="SOA">SOA (Authority)</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Timeout (s)</label>
                <input type="number" name="timeout" class="form-input" value="2" min="1" max="10">
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">DNS Server (optional)</label>
              <input type="text" name="server" class="form-input" placeholder="8.8.8.8">
            </div>
          </form>
        `;

      case 'port-scan':
        return `
          <form>
            <div class="form-group">
              <label class="form-label">Target Host *</label>
              <input type="text" name="target" class="form-input" placeholder="192.168.1.1" required>
            </div>
            <div class="form-group">
              <label class="form-label">Ports *</label>
              <input type="text" name="ports" class="form-input" placeholder="22,80,443 or 1-1000" required>
              <small class="form-help">Examples: 80,443 or 1-1000 or 22,80,443,8080-8090</small>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Protocol</label>
                <select name="protocol" class="form-select">
                  <option value="tcp">TCP</option>
                  <option value="udp">UDP</option>
                  <option value="both">Both</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Timeout (s)</label>
                <input type="number" name="timeout" class="form-input" value="1" min="1" max="10">
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Threads</label>
              <input type="number" name="threads" class="form-input" value="10" min="1" max="50">
            </div>
          </form>
        `;

      case 'connection':
        return `
          <form>
            <div class="form-group">
              <label class="form-label">Target Host *</label>
              <input type="text" name="target" class="form-input" placeholder="192.168.1.1" required>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Port *</label>
                <input type="number" name="port" class="form-input" placeholder="80" min="1" max="65535" required>
              </div>
              <div class="form-group">
                <label class="form-label">Protocol</label>
                <select name="protocol" class="form-select">
                  <option value="tcp">TCP</option>
                  <option value="udp">UDP</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Timeout (s)</label>
              <input type="number" name="timeout" class="form-input" value="3" min="1" max="30">
            </div>
          </form>
        `;

      case 'quality':
        return `
          <form>
            <div class="form-group">
              <label class="form-label">Target Host *</label>
              <input type="text" name="target" class="form-input" placeholder="8.8.8.8 or google.com" required>
            </div>
            <div class="form-help">
              This test will perform multiple diagnostics (ping, bandwidth, DNS) to assess overall network quality.
            </div>
          </form>
        `;

      default:
        return '<div>Test configuration not available</div>';
    }
  }

  /** Get test icon */
  private getTestIcon(testType: string): string {
    const icons: Record<string, string> = {
      'ping': '📡',
      'traceroute': '🗺️',
      'bandwidth': '⚡',
      'dns': '🔍',
      'port-scan': '🚪',
      'connection': '🔗',
      'quality': '📊',
    };
    return icons[testType] || '🔧';
  }

  /** Get test description */
  private getTestDescription(testType: string): string {
    const descriptions: Record<string, string> = {
      'ping': 'Test network connectivity and measure round-trip time to a host',
      'traceroute': 'Trace the network path to a destination and identify routing hops',
      'bandwidth': 'Measure upload and download speeds between two RouterOS devices',
      'dns': 'Lookup DNS records for a hostname using various record types',
      'port-scan': 'Scan TCP/UDP ports on a target host to check service availability',
      'connection': 'Test if a specific port is reachable on a target host',
      'quality': 'Comprehensive network quality assessment with recommendations',
    };
    return descriptions[testType] || 'Network diagnostic test';
  }

  /** Format test timestamp */
  private formatTestTime(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  }

  /** Format bytes */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  /** Attaches event listeners */
  private attachEventListeners(): void {
    // Tab switching
    document.querySelectorAll('.diagnostic-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const view = tab.getAttribute('data-view') as typeof this.currentView;
        if (view) {
          this.switchView(view);
        }
      });
    });

    // Start test button
    document.getElementById('start-test')?.addEventListener('click', () => {
      this.showTestModal(this.currentView);
    });

    // Export results
    document.getElementById('export-results')?.addEventListener('click', () => {
      this.exportResults();
    });

    // Clear history
    document.getElementById('clear-history')?.addEventListener('click', () => {
      this.clearHistory();
    });

    // Refresh interfaces
    document.getElementById('refresh-interfaces')?.addEventListener('click', () => {
      this.loadInterfaces();
    });

    // Refresh neighbors
    document.getElementById('refresh-neighbors')?.addEventListener('click', () => {
      this.loadNeighbors();
    });

    // Stop test buttons
    document.querySelectorAll('.stop-test-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const testId = target.getAttribute('data-test-id');
        const testType = target.getAttribute('data-test-type');
        
        if (testId && testType) {
          this.stopTest(testId, testType);
        }
      });
    });
  }

  /** Gets comprehensive styles for the component */
  private getStyles(): string {
    return `
      .network-diagnostics {
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      
      .diagnostics-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
        padding-bottom: 16px;
        border-bottom: 2px solid #e9ecef;
      }
      
      .diagnostics-title {
        font-size: 24px;
        font-weight: 700;
        color: #2c3e50;
        margin: 0;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .title-icon {
        font-size: 28px;
      }
      
      .diagnostics-actions {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      
      .loading-indicator {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        background: #f8f9fa;
        border-radius: 6px;
        color: #6c757d;
        font-size: 14px;
      }
      
      .loading-spinner {
        width: 16px;
        height: 16px;
        border: 2px solid #e9ecef;
        border-top: 2px solid #007bff;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
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
      
      .action-button.export {
        background: #6f42c1;
      }
      
      .action-button.export:hover {
        background: #5a2c87;
      }
      
      .action-button.clear {
        background: #dc3545;
      }
      
      .action-button.clear:hover {
        background: #c82333;
      }
      
      .action-button.refresh {
        background: #28a745;
      }
      
      .action-button.refresh:hover {
        background: #1e7e34;
      }
      
      .diagnostics-tabs {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        margin-bottom: 24px;
        background: #f8f9fa;
        padding: 8px;
        border-radius: 12px;
      }
      
      .diagnostic-tab {
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
        min-width: 100px;
        justify-content: center;
      }
      
      .diagnostic-tab:hover {
        color: #007bff;
        background: rgba(0, 123, 255, 0.1);
      }
      
      .diagnostic-tab.active {
        color: #007bff;
        background: white;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
      
      .tab-icon {
        font-size: 16px;
      }
      
      .diagnostics-content {
        background: white;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        overflow: hidden;
      }
      
      .test-view {
        padding: 24px;
      }
      
      .test-controls {
        text-align: center;
        margin-bottom: 32px;
        padding: 24px;
        background: #f8f9fa;
        border-radius: 12px;
      }
      
      .test-button {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        border-radius: 12px;
        padding: 16px 32px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        display: inline-flex;
        align-items: center;
        gap: 12px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        margin-bottom: 16px;
      }
      
      .test-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
      }
      
      .test-icon {
        font-size: 20px;
      }
      
      .test-description {
        color: #6c757d;
        font-size: 14px;
        max-width: 500px;
        margin: 0 auto;
        line-height: 1.5;
      }
      
      .test-results {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 24px;
      }
      
      .results-section h3 {
        margin: 0 0 16px 0;
        color: #2c3e50;
        font-size: 18px;
        font-weight: 600;
        padding-bottom: 8px;
        border-bottom: 2px solid #e9ecef;
      }
      
      .test-result-card {
        background: #f8f9fa;
        border-radius: 8px;
        margin-bottom: 12px;
        overflow: hidden;
        transition: all 0.2s ease;
      }
      
      .test-result-card.active {
        border-left: 4px solid #007bff;
      }
      
      .test-result-card.completed {
        border-left: 4px solid #28a745;
      }
      
      .test-result-card:hover {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }
      
      .test-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        background: white;
        border-bottom: 1px solid #e9ecef;
      }
      
      .test-type {
        font-weight: 600;
        color: #2c3e50;
        text-transform: uppercase;
        font-size: 12px;
        letter-spacing: 0.5px;
      }
      
      .test-target {
        font-family: 'Monaco', 'Consolas', monospace;
        font-size: 13px;
        color: #495057;
      }
      
      .test-status {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        font-weight: 500;
        text-transform: uppercase;
      }
      
      .status-indicator {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: currentColor;
      }
      
      .test-status.running {
        color: #007bff;
      }
      
      .test-status.completed {
        color: #28a745;
      }
      
      .test-status.failed {
        color: #dc3545;
      }
      
      .test-status.success {
        color: #28a745;
      }
      
      .stop-test-btn {
        background: #dc3545;
        color: white;
        border: none;
        border-radius: 4px;
        padding: 4px 8px;
        font-size: 11px;
        cursor: pointer;
        transition: background-color 0.2s ease;
      }
      
      .stop-test-btn:hover {
        background: #c82333;
      }
      
      .test-time {
        font-size: 11px;
        color: #6c757d;
      }
      
      .test-content {
        padding: 12px 16px;
      }
      
      .ping-progress,
      .traceroute-progress,
      .bandwidth-progress,
      .generic-progress {
        font-size: 13px;
        color: #495057;
      }
      
      .progress-stats {
        margin-bottom: 4px;
      }
      
      .speed-display {
        font-family: 'Monaco', 'Consolas', monospace;
        font-weight: 600;
        color: #007bff;
      }
      
      .avg-time,
      .latency {
        font-size: 12px;
        color: #6c757d;
      }
      
      .ping-result,
      .dns-result,
      .quality-result,
      .generic-result {
        font-size: 13px;
        color: #495057;
      }
      
      .result-stats {
        font-family: 'Monaco', 'Consolas', monospace;
        margin-bottom: 8px;
      }
      
      .dns-record {
        font-family: 'Monaco', 'Consolas', monospace;
        font-size: 11px;
        color: #6c757d;
        margin-bottom: 2px;
      }
      
      .quality-grade {
        font-weight: 700;
        font-size: 16px;
        margin-bottom: 8px;
        text-transform: uppercase;
      }
      
      .quality-grade.excellent {
        color: #28a745;
      }
      
      .quality-grade.good {
        color: #20c997;
      }
      
      .quality-grade.fair {
        color: #ffc107;
      }
      
      .quality-grade.poor {
        color: #dc3545;
      }
      
      .quality-metrics {
        font-family: 'Monaco', 'Consolas', monospace;
        font-size: 12px;
        color: #6c757d;
      }
      
      .interfaces-view,
      .neighbors-view {
        padding: 24px;
      }
      
      .view-controls {
        margin-bottom: 20px;
      }
      
      .loading-placeholder {
        text-align: center;
        color: #6c757d;
        font-style: italic;
        padding: 40px 20px;
      }
      
      .data-table {
        width: 100%;
        border-collapse: collapse;
      }
      
      .data-table th {
        background: #f8f9fa;
        border-bottom: 2px solid #dee2e6;
        padding: 12px;
        text-align: left;
        font-weight: 600;
        color: #495057;
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
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .status-badge.running {
        background: #d4edda;
        color: #155724;
      }
      
      .status-badge.down {
        background: #f8d7da;
        color: #721c24;
      }
      
      .status-badge.dynamic {
        background: #cfe2ff;
        color: #084298;
      }
      
      .status-badge.static {
        background: #d1ecf1;
        color: #0c5460;
      }
      
      .byte-stats,
      .packet-stats,
      .error-stats {
        display: flex;
        flex-direction: column;
        gap: 2px;
        font-size: 12px;
      }
      
      .error-stats.has-errors {
        color: #dc3545;
        font-weight: 600;
      }
      
      .empty-state {
        text-align: center;
        color: #6c757d;
        font-style: italic;
        padding: 20px;
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
      
      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
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
        padding: 10px 12px;
        border: 1px solid #ced4da;
        border-radius: 6px;
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
        font-style: italic;
      }
      
      .btn {
        padding: 10px 20px;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
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
      
      @media (max-width: 768px) {
        .diagnostics-header {
          flex-direction: column;
          gap: 16px;
        }
        
        .diagnostics-tabs {
          flex-direction: column;
        }
        
        .diagnostic-tab {
          justify-content: flex-start;
        }
        
        .test-results {
          grid-template-columns: 1fr;
        }
        
        .form-row {
          grid-template-columns: 1fr;
        }
      }
    `;
  }
}