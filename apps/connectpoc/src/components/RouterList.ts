import { getManualRouter, removeManualRouter, type ManualRouterEntry } from '@/services/manual-router';
import { isMikroTikRouter } from '@/services/scanner';

import { CredentialDialog } from './CredentialDialog';

import type { RouterInfo, ScanResult, RouterCredentials } from '@shared/routeros';

/**
 * Simple Router List Component
 */
export class RouterList {
  private container: HTMLElement;
  private routers: RouterInfo[] = [];
  private onRouterAuthenticated?: (router: RouterInfo, credentials: RouterCredentials) => void;
  private manualRouters: Map<string, ManualRouterEntry> = new Map();
  private credentialDialog: CredentialDialog | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.initializeCredentialDialog();
    this.render();
  }

  /** Initialize the credential dialog */
  private initializeCredentialDialog(): void {
    const dialogContainer = document.createElement('div');
    document.body.appendChild(dialogContainer);
    this.credentialDialog = new CredentialDialog(dialogContainer);
  }

  /** Sets callback for when a router is authenticated */
  public onRouterAuthenticatedCallback(callback: (router: RouterInfo, credentials: RouterCredentials) => void): void {
    this.onRouterAuthenticated = callback;
  }

  /** Legacy method for backward compatibility */
  public onRouterSelectedCallback(callback: (router: RouterInfo) => void): void {
    // Convert old callback to new format
    this.onRouterAuthenticated = (router: RouterInfo, credentials: RouterCredentials) => {
      callback(router);
    };
  }

  /** Adds a router from scan results */
  public addFromScanResult(result: ScanResult): void {
    if (!isMikroTikRouter(result)) {
      return; // Only add MikroTik routers
    }

    // Check if router already exists
    const existingRouter = this.routers.find(r => r.ip === result.ip);
    if (existingRouter) {
      // Update existing router
      existingRouter.status = 'online';
      if (result.version) {
        existingRouter.version = result.version;
      }
      this.render();
      return;
    }

    // Create new router entry
    const newRouter: RouterInfo = {
      id: result.ip,
      name: result.hostname || `Router ${result.ip}`,
      ip: result.ip,
      ...(result.mac && { mac: result.mac }),
      ...(result.version && { version: result.version }),
      status: 'online',
    };

    this.routers.push(newRouter);
    this.render();
  }

  /** Adds a manually entered router */
  public addManualRouter(router: RouterInfo): void {
    // Check if router already exists
    const existingIndex = this.routers.findIndex(r => r.ip === router.ip);
    if (existingIndex !== -1) {
      // Create updated router object
      const updatedRouter: RouterInfo = {
        ...this.routers[existingIndex],
        status: router.status,
        name: router.name,
        ...(router.version && { version: router.version })
      };
      this.routers[existingIndex] = updatedRouter;
      
      // Store manual router info
      const manualEntry = getManualRouter(router.ip);
      if (manualEntry) {
        this.manualRouters.set(router.ip, manualEntry);
      }
      
      this.render();
      return;
    }

    // Add new manual router
    const manualEntry = getManualRouter(router.ip);
    if (manualEntry) {
      this.manualRouters.set(router.ip, manualEntry);
    }

    this.routers.push(router);
    this.render();
  }

  /** Gets the current list of routers */
  public getRouters(): RouterInfo[] {
    return [...this.routers];
  }

  /** Clears all routers */
  public clearRouters(): void {
    this.routers = [];
    this.manualRouters.clear();
    this.render();
  }

  /** Handles router selection by showing credential dialog */
  private handleRouterSelection(router: RouterInfo): void {
    if (!this.credentialDialog) {
      console.error('Credential dialog not initialized');
      return;
    }

    this.credentialDialog.show(
      router,
      (selectedRouter: RouterInfo, credentials: RouterCredentials) => {
        // Authentication successful
        if (this.onRouterAuthenticated) {
          this.onRouterAuthenticated(selectedRouter, credentials);
        }
      },
      () => {
        // Authentication cancelled
        console.log('Router authentication cancelled');
      }
    );
  }

  /** Remove a manual router by IP address */
  private async removeManualRouterByIp(ip: string): Promise<void> {
    try {
      // Remove from storage
      const success = await removeManualRouter(ip);
      
      if (success) {
        // Remove from local data
        this.routers = this.routers.filter(router => router.ip !== ip);
        this.manualRouters.delete(ip);
        
        // Re-render
        this.render();
        this.showToast(`Router ${ip} removed successfully`);
      } else {
        this.showToast(`Failed to remove router ${ip}`, 'error');
      }
    } catch (error) {
      console.error('Error removing manual router:', error);
      this.showToast(`Error removing router ${ip}`, 'error');
    }
  }

  /** Renders the router list */
  private render(): void {
    this.container.innerHTML = `
      <style>
        .router-list {
          padding: 0;
        }
        
        .router-list h4 {
          margin: 0 0 20px 0;
          color: #333;
          font-size: 18px;
        }
        
        .empty-state {
          text-align: center;
          color: #999;
          font-style: italic;
          padding: 40px 20px;
          border: 1px dashed #ddd;
          border-radius: 8px;
        }
        
        .router-item {
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .router-item:hover {
          background: #e9ecef;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .router-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        
        .router-name-section {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .router-name {
          font-weight: 600;
          font-size: 16px;
          color: #333;
        }
        
        .manual-badge {
          background: #28a745;
          color: white;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .auto-badge {
          background: #007bff;
          color: white;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .router-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .router-status {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .remove-btn {
          width: 24px;
          height: 24px;
          border: none;
          border-radius: 50%;
          background: #dc3545;
          color: white;
          font-size: 14px;
          font-weight: bold;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          opacity: 0.7;
        }
        
        .remove-btn:hover {
          opacity: 1;
          transform: scale(1.1);
        }
        
        .status-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #28a745;
        }
        
        .status-text {
          font-size: 12px;
          color: #666;
          text-transform: uppercase;
          font-weight: 500;
        }
        
        .router-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          font-size: 14px;
          color: #666;
        }
        
        .detail-item {
          display: flex;
          justify-content: space-between;
        }
        
        .detail-label {
          font-weight: 500;
          color: #333;
        }
        
        .clear-button {
          background: #6c757d;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
          margin-bottom: 20px;
        }
        
        .clear-button:hover {
          background: #5a6268;
        }
        
        .clear-button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }
      </style>
      
      <div class="router-list">
        ${this.routers.length > 0 ? `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h4>Discovered Devices (${this.routers.length})</h4>
            <button id="clear-routers-btn" class="clear-button">Clear All</button>
          </div>
        ` : '<h4>Device Management</h4>'}
        
        <div class="router-grid">
          ${this.routers.length === 0 ? this.renderEmptyState() : this.routers.map(router => this.renderRouterItem(router)).join('')}
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  /** Renders empty state */
  private renderEmptyState(): string {
    return `
      <div class="empty-state">
        <p><strong>No devices found yet</strong></p>
        <p>Use the Network Scanner to discover MikroTik routers on your network.</p>
      </div>
    `;
  }

  /** Renders a router item */
  private renderRouterItem(router: RouterInfo): string {
    const hasRestApi = router.version ? this.isRestApiSupported(router.version) : false;
    const isManual = this.manualRouters.has(router.ip);
    const manualEntry = isManual ? this.manualRouters.get(router.ip) : null;
    
    return `
      <div class="router-item" data-router-id="${router.id}">
        <div class="router-header">
          <div class="router-name-section">
            <div class="router-name">${router.name}</div>
            ${isManual ? '<span class="manual-badge">Manual</span>' : '<span class="auto-badge">Auto</span>'}
          </div>
          <div class="router-actions">
            <div class="router-status">
              <div class="status-indicator"></div>
              <span class="status-text">Online</span>
            </div>
            ${isManual ? `
              <button class="remove-btn" data-ip="${router.ip}" title="Remove manual router">
                ×
              </button>
            ` : ''}
          </div>
        </div>
        
        <div class="router-details">
          <div class="detail-item">
            <span class="detail-label">IP Address:</span>
            <span>${router.ip}</span>
          </div>
          ${router.version ? `
            <div class="detail-item">
              <span class="detail-label">RouterOS:</span>
              <span>${router.version}</span>
            </div>
          ` : ''}
          ${router.mac ? `
            <div class="detail-item">
              <span class="detail-label">MAC:</span>
              <span>${router.mac}</span>
            </div>
          ` : ''}
          <div class="detail-item">
            <span class="detail-label">REST API:</span>
            <span style="color: ${hasRestApi ? '#28a745' : '#dc3545'}">${hasRestApi ? 'Available' : 'Not Available'}</span>
          </div>
          ${isManual && manualEntry ? `
            <div class="detail-item">
              <span class="detail-label">Added:</span>
              <span>${new Date(manualEntry.dateAdded).toLocaleDateString()}</span>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  /** Attaches event listeners */
  private attachEventListeners(): void {
    // Router item clicks (excluding remove button clicks)
    const routerItems = this.container.querySelectorAll('.router-item');
    routerItems.forEach(item => {
      item.addEventListener('click', (e) => {
        // Don't trigger selection if remove button was clicked
        if ((e.target as HTMLElement).classList.contains('remove-btn')) {
          return;
        }
        
        const routerId = item.getAttribute('data-router-id');
        if (routerId) {
          const router = this.routers.find(r => r.id === routerId);
          if (router) {
            this.handleRouterSelection(router);
          }
        }
      });
    });

    // Remove button clicks
    const removeButtons = this.container.querySelectorAll('.remove-btn');
    removeButtons.forEach(button => {
      button.addEventListener('click', async (e) => {
        e.stopPropagation(); // Prevent router item click
        
        const ip = button.getAttribute('data-ip');
        if (ip && confirm(`Are you sure you want to remove the manual router ${ip}?`)) {
          await this.removeManualRouterByIp(ip);
        }
      });
    });

    // Clear all button
    const clearButton = this.container.querySelector('#clear-routers-btn') as HTMLButtonElement;
    clearButton?.addEventListener('click', () => {
      this.clearRouters();
      this.showToast('All devices cleared');
    });
  }

  /** Checks if REST API is supported for a given version */
  private isRestApiSupported(version: string): boolean {
    // REST API was introduced in RouterOS 7.1
    try {
      const versionParts = version.split('.');
      const major = parseInt(versionParts[0]);
      const minor = versionParts[1] ? parseInt(versionParts[1]) : 0;
      
      if (major > 7) return true;
      if (major === 7 && minor >= 1) return true;
      
      return false;
    } catch {
      return false;
    }
  }

  /** Shows a temporary toast message */
  private showToast(message: string, type: 'success' | 'error' = 'success'): void {
    const backgroundColor = type === 'error' ? '#dc3545' : '#28a745';
    
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${backgroundColor};
      color: white;
      padding: 12px 20px;
      border-radius: 6px;
      z-index: 1000;
      font-size: 14px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    `;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, type === 'error' ? 3000 : 2000); // Show errors longer
  }
}