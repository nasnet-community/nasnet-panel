import { 
  createWireGuardInterface,
  updateWireGuardInterface,
  addWireGuardPeer,
  createVPNUser,
  updateVPNUser,
  configureL2TPServer,
  configurePPTPServer,
  configureSSTPServer,
  configureOpenVPNServer,
  setupRoadWarriorVPN
} from '@/services/vpn';

import type { WireGuardInterface, WireGuardPeer } from '@shared/routeros';

/**
 * VPN Configuration Dialog Component
 * Handles configuration of various VPN types
 */
export class VPNConfigDialog {
  private container: HTMLElement;
  private routerIp = '';
  private vpnType: 'wireguard' | 'l2tp' | 'pptp' | 'sstp' | 'openvpn' | 'user' = 'wireguard';
  private editData: any = null;
  private onSuccess?: () => void;
  private isVisible = false;
  private isLoading = false;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  /** Shows the VPN configuration dialog */
  public show(
    routerIp: string,
    vpnType: 'wireguard' | 'l2tp' | 'pptp' | 'sstp' | 'openvpn' | 'user',
    editData?: any,
    onSuccess?: () => void
  ): void {
    this.routerIp = routerIp;
    this.vpnType = vpnType;
    this.editData = editData || null;
    this.onSuccess = onSuccess || undefined;
    this.isVisible = true;
    this.render();

    // Focus on first input field
    setTimeout(() => {
      const firstInput = document.querySelector('.vpn-config-form input, .vpn-config-form select') as HTMLElement;
      if (firstInput) {
        firstInput.focus();
      }
    }, 100);
  }

  /** Hides the configuration dialog */
  public hide(): void {
    this.isVisible = false;
    this.container.innerHTML = '';
  }

  /** Handles form submission */
  private async handleSubmit(event: Event): Promise<void> {
    event.preventDefault();
    
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    
    this.setLoading(true);
    this.showError('');

    try {
      switch (this.vpnType) {
        case 'wireguard':
          await this.handleWireGuardSubmit(formData);
          break;
        case 'l2tp':
          await this.handleL2TPSubmit(formData);
          break;
        case 'pptp':
          await this.handlePPTPSubmit(formData);
          break;
        case 'sstp':
          await this.handleSSTPSubmit(formData);
          break;
        case 'openvpn':
          await this.handleOpenVPNSubmit(formData);
          break;
        case 'user':
          await this.handleUserSubmit(formData);
          break;
      }

      this.setLoading(false);
      this.showSuccess(`${this.getVPNTypeLabel()} configuration saved successfully`);
      
      // Close dialog after a short delay
      setTimeout(() => {
        this.hide();
        if (this.onSuccess) {
          this.onSuccess();
        }
      }, 1500);

    } catch (error) {
      this.setLoading(false);
      this.showError(error instanceof Error ? error.message : 'Configuration failed');
    }
  }

  /** Handles WireGuard configuration */
  private async handleWireGuardSubmit(formData: FormData): Promise<void> {
    const config = {
      name: formData.get('name') as string,
      listenPort: parseInt(formData.get('listen-port') as string) || undefined,
      privateKey: formData.get('private-key') as string,
      disabled: formData.get('disabled') === 'on',
    };

    if (!config.name) {
      throw new Error('Interface name is required');
    }

    if (this.editData) {
      const result = await updateWireGuardInterface(this.routerIp, this.editData.name, config);
      if (!result.success) {
        throw new Error(result.error || 'Failed to update WireGuard interface');
      }
    } else {
      const result = await createWireGuardInterface(this.routerIp, config);
      if (!result.success) {
        throw new Error(result.error || 'Failed to create WireGuard interface');
      }
    }
  }

  /** Handles L2TP configuration */
  private async handleL2TPSubmit(formData: FormData): Promise<void> {
    const isQuickSetup = formData.get('setup-type') === 'quick';
    
    if (isQuickSetup) {
      // Quick setup for road warrior VPN
      const config = {
        vpnPoolStart: formData.get('pool-start') as string,
        vpnPoolEnd: formData.get('pool-end') as string,
        dnsServers: [formData.get('dns-primary') as string, formData.get('dns-secondary') as string].filter(Boolean),
        ipsecSecret: formData.get('ipsec-secret') as string,
        users: [
          {
            username: formData.get('username') as string,
            password: formData.get('password') as string
          }
        ]
      };

      const result = await setupRoadWarriorVPN(this.routerIp, config);
      if (!result.success) {
        throw new Error(result.error || 'Failed to setup L2TP/IPSec VPN');
      }
    } else {
      // Advanced configuration
      const config = {
        enabled: formData.get('enabled') === 'on',
        maxMtu: parseInt(formData.get('max-mtu') as string) || 1460,
        maxMru: parseInt(formData.get('max-mru') as string) || 1460,
        authentication: ['mschap2'] as ("pap" | "chap" | "mschap1" | "mschap2")[], // Default to mschap2
        useIPSec: 'required' as "no" | "yes" | "required",
        ipsecSecret: formData.get('ipsec-secret') as string,
      };

      const result = await configureL2TPServer(this.routerIp, config);
      if (!result.success) {
        throw new Error(result.error || 'Failed to configure L2TP server');
      }
    }
  }

  /** Handles PPTP configuration */
  private async handlePPTPSubmit(formData: FormData): Promise<void> {
    const config = {
      enabled: formData.get('enabled') === 'on',
      maxMtu: parseInt(formData.get('max-mtu') as string) || 1460,
      maxMru: parseInt(formData.get('max-mru') as string) || 1460,
    };

    const result = await configurePPTPServer(this.routerIp, config);
    if (!result.success) {
      throw new Error(result.error || 'Failed to configure PPTP server');
    }
  }

  /** Handles SSTP configuration */
  private async handleSSTPSubmit(formData: FormData): Promise<void> {
    const config = {
      enabled: formData.get('enabled') === 'on',
      defaultProfile: formData.get('default-profile') as string || 'default',
      maxMtu: parseInt(formData.get('max-mtu') as string) || 1500,
      maxMru: parseInt(formData.get('max-mru') as string) || 1500,
    };

    const result = await configureSSTPServer(this.routerIp, config);
    if (!result.success) {
      throw new Error(result.error || 'Failed to configure SSTP server');
    }
  }

  /** Handles OpenVPN configuration */
  private async handleOpenVPNSubmit(formData: FormData): Promise<void> {
    const config = {
      enabled: formData.get('enabled') === 'on',
      port: parseInt(formData.get('port') as string) || 1194,
      mode: (formData.get('mode') as string || 'ip') as "ip" | "ethernet",
      protocol: formData.get('protocol') as string || 'tcp',
    };

    const result = await configureOpenVPNServer(this.routerIp, config);
    if (!result.success) {
      throw new Error(result.error || 'Failed to configure OpenVPN server');
    }
  }

  /** Handles VPN user configuration */
  private async handleUserSubmit(formData: FormData): Promise<void> {
    const user = {
      name: formData.get('username') as string,
      password: formData.get('password') as string,
      service: formData.get('service') as string || undefined,
      profile: formData.get('profile') as string || undefined,
      localAddress: formData.get('local-address') as string || undefined,
      remoteAddress: formData.get('remote-address') as string || undefined,
      comment: formData.get('comment') as string || undefined,
    };

    if (!user.name || !user.password) {
      throw new Error('Username and password are required');
    }

    if (this.editData) {
      const result = await updateVPNUser(this.routerIp, this.editData['.id'], user);
      if (!result.success) {
        throw new Error(result.error || 'Failed to update VPN user');
      }
    } else {
      const result = await createVPNUser(this.routerIp, user);
      if (!result.success) {
        throw new Error(result.error || 'Failed to create VPN user');
      }
    }
  }

  /** Sets loading state */
  private setLoading(loading: boolean): void {
    this.isLoading = loading;
    
    const submitButton = document.getElementById('vpn-submit') as HTMLButtonElement;
    const cancelButton = document.getElementById('vpn-cancel') as HTMLButtonElement;
    const form = document.querySelector('.vpn-config-form') as HTMLFormElement;
    
    if (submitButton) {
      submitButton.disabled = loading;
      submitButton.textContent = loading ? 'Saving...' : 'Save Configuration';
    }
    
    if (cancelButton) {
      cancelButton.disabled = loading;
    }
    
    if (form) {
      const inputs = form.querySelectorAll('input, select');
      inputs.forEach(input => {
        (input as HTMLInputElement).disabled = loading;
      });
    }
  }

  /** Shows error message */
  private showError(message: string): void {
    const errorElement = document.getElementById('vpn-config-error');
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = message ? 'block' : 'none';
    }
  }

  /** Shows success message */
  private showSuccess(message: string): void {
    const successElement = document.getElementById('vpn-config-success');
    if (successElement) {
      successElement.textContent = message;
      successElement.style.display = 'block';
    }
  }

  /** Gets VPN type label */
  private getVPNTypeLabel(): string {
    const labels = {
      wireguard: 'WireGuard',
      l2tp: 'L2TP/IPSec',
      pptp: 'PPTP',
      sstp: 'SSTP',
      openvpn: 'OpenVPN',
      user: 'VPN User'
    };
    return labels[this.vpnType] || 'VPN';
  }

  /** Generates a random WireGuard private key (placeholder) */
  private generateWireGuardKey(): string {
    // This is a placeholder - in reality, you'd use proper crypto
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    for (let i = 0; i < 44; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /** Renders the configuration dialog */
  private render(): void {
    if (!this.isVisible) {
      this.container.innerHTML = '';
      return;
    }

    this.container.innerHTML = `
      <style>
        .vpn-config-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1200;
        }
        
        .vpn-config-dialog {
          background: white;
          border-radius: 12px;
          padding: 32px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          max-width: 700px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
        }
        
        .config-header {
          text-align: center;
          margin-bottom: 24px;
        }
        
        .config-header h2 {
          margin: 0 0 8px 0;
          color: #333;
          font-size: 24px;
          font-weight: 600;
        }
        
        .config-subtitle {
          color: #666;
          font-size: 14px;
          margin: 0;
        }
        
        .vpn-config-form {
          margin-bottom: 24px;
        }
        
        .form-section {
          margin-bottom: 24px;
          padding-bottom: 20px;
          border-bottom: 1px solid #f0f0f0;
        }
        
        .form-section:last-child {
          border-bottom: none;
        }
        
        .section-title {
          font-size: 16px;
          font-weight: 600;
          color: #333;
          margin: 0 0 16px 0;
        }
        
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 16px;
        }
        
        .form-row.full {
          grid-template-columns: 1fr;
        }
        
        .form-group {
          display: flex;
          flex-direction: column;
        }
        
        .form-group label {
          margin-bottom: 6px;
          font-weight: 500;
          color: #333;
          font-size: 14px;
        }
        
        .form-group input,
        .form-group select,
        .form-group textarea {
          padding: 12px 16px;
          border: 1px solid #dee2e6;
          border-radius: 6px;
          font-size: 14px;
          transition: border-color 0.2s ease;
        }
        
        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #007bff;
          box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
        }
        
        .form-group input:disabled,
        .form-group select:disabled,
        .form-group textarea:disabled {
          background-color: #f8f9fa;
          color: #6c757d;
        }
        
        .form-help {
          font-size: 12px;
          color: #666;
          margin-top: 4px;
        }
        
        .checkbox-group {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 12px;
        }
        
        .checkbox-group input[type="checkbox"] {
          width: auto;
          margin: 0;
        }
        
        .checkbox-group label {
          margin: 0;
          font-weight: normal;
          color: #666;
          font-size: 14px;
        }
        
        .key-generator {
          display: flex;
          gap: 8px;
          align-items: end;
        }
        
        .key-generator input {
          flex: 1;
        }
        
        .generate-key-btn {
          background: #28a745;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 12px 16px;
          font-size: 12px;
          cursor: pointer;
          white-space: nowrap;
        }
        
        .generate-key-btn:hover {
          background: #1e7e34;
        }
        
        .config-error {
          display: none;
          background: #f8d7da;
          border: 1px solid #f5c6cb;
          color: #721c24;
          padding: 12px 16px;
          border-radius: 6px;
          margin-bottom: 20px;
          font-size: 14px;
        }
        
        .config-success {
          display: none;
          background: #d4edda;
          border: 1px solid #c3e6cb;
          color: #155724;
          padding: 12px 16px;
          border-radius: 6px;
          margin-bottom: 20px;
          font-size: 14px;
        }
        
        .config-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }
        
        .config-button {
          padding: 12px 24px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          min-width: 140px;
        }
        
        .config-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .config-button.primary {
          background: #007bff;
          color: white;
        }
        
        .config-button.primary:hover:not(:disabled) {
          background: #0056b3;
        }
        
        .config-button.secondary {
          background: #6c757d;
          color: white;
        }
        
        .config-button.secondary:hover:not(:disabled) {
          background: #545b62;
        }
        
        .warning-note {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 6px;
          padding: 12px;
          margin-bottom: 16px;
          font-size: 13px;
          color: #856404;
        }
        
        .setup-type-selector {
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
        }
        
        .setup-type-option {
          flex: 1;
          padding: 16px;
          border: 2px solid #dee2e6;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .setup-type-option.selected {
          border-color: #007bff;
          background: rgba(0, 123, 255, 0.05);
        }
        
        .setup-type-title {
          font-weight: 600;
          color: #333;
          margin: 0 0 4px 0;
        }
        
        .setup-type-desc {
          font-size: 12px;
          color: #666;
          margin: 0;
        }
      </style>
      
      <div class="vpn-config-overlay" id="vpn-config-overlay">
        <div class="vpn-config-dialog">
          <div class="config-header">
            <h2>Configure ${this.getVPNTypeLabel()}</h2>
            <p class="config-subtitle">
              ${this.editData ? 'Edit existing configuration' : 'Create new configuration'}
            </p>
          </div>
          
          <div id="vpn-config-error" class="config-error"></div>
          <div id="vpn-config-success" class="config-success"></div>
          
          <form class="vpn-config-form" id="vpn-config-form">
            ${this.renderFormContent()}
          </form>
          
          <div class="config-actions">
            <button 
              type="button" 
              id="vpn-cancel" 
              class="config-button secondary"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              id="vpn-submit" 
              class="config-button primary"
              form="vpn-config-form"
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  /** Renders form content based on VPN type */
  private renderFormContent(): string {
    switch (this.vpnType) {
      case 'wireguard':
        return this.renderWireGuardForm();
      case 'l2tp':
        return this.renderL2TPForm();
      case 'pptp':
        return this.renderPPTPForm();
      case 'sstp':
        return this.renderSSTPForm();
      case 'openvpn':
        return this.renderOpenVPNForm();
      case 'user':
        return this.renderUserForm();
      default:
        return '<p>Unknown VPN type</p>';
    }
  }

  /** Renders WireGuard configuration form */
  private renderWireGuardForm(): string {
    return `
      <div class="form-section">
        <h3 class="section-title">Interface Settings</h3>
        
        <div class="form-row">
          <div class="form-group">
            <label for="wg-name">Interface Name</label>
            <input 
              type="text" 
              id="wg-name" 
              name="name" 
              value="${this.editData?.name || 'wg0'}" 
              placeholder="e.g., wg0"
              required
              ${this.editData ? 'readonly' : ''}
            />
            <div class="form-help">Unique interface identifier</div>
          </div>
          
          <div class="form-group">
            <label for="wg-listen-port">Listen Port</label>
            <input 
              type="number" 
              id="wg-listen-port" 
              name="listen-port" 
              value="${this.editData?.listenPort || ''}" 
              placeholder="51820"
              min="1"
              max="65535"
            />
            <div class="form-help">Leave empty for auto-assignment</div>
          </div>
        </div>
        
        <div class="form-row full">
          <div class="form-group">
            <label for="wg-private-key">Private Key</label>
            <div class="key-generator">
              <input 
                type="text" 
                id="wg-private-key" 
                name="private-key" 
                value="${this.editData?.privateKey || ''}" 
                placeholder="Private key will be generated"
                readonly
              />
              <button type="button" class="generate-key-btn" id="generate-key">
                Generate
              </button>
            </div>
            <div class="form-help">Private key for this WireGuard interface</div>
          </div>
        </div>
        
        <div class="checkbox-group">
          <input 
            type="checkbox" 
            id="wg-disabled" 
            name="disabled"
            ${this.editData?.disabled ? 'checked' : ''}
          />
          <label for="wg-disabled">Disable interface</label>
        </div>
      </div>
    `;
  }

  /** Renders L2TP configuration form */
  private renderL2TPForm(): string {
    return `
      <div class="form-section">
        <h3 class="section-title">Setup Type</h3>
        <div class="setup-type-selector">
          <div class="setup-type-option selected" data-setup-type="quick">
            <h4 class="setup-type-title">Quick Setup</h4>
            <p class="setup-type-desc">Configure L2TP/IPSec for road warrior VPN</p>
          </div>
          <div class="setup-type-option" data-setup-type="advanced">
            <h4 class="setup-type-title">Advanced</h4>
            <p class="setup-type-desc">Manual server configuration</p>
          </div>
        </div>
        <input type="hidden" name="setup-type" value="quick" id="setup-type-input">
      </div>
      
      <div id="quick-setup" class="form-section">
        <h3 class="section-title">Quick Setup - Road Warrior VPN</h3>
        
        <div class="form-row">
          <div class="form-group">
            <label for="l2tp-pool-start">VPN Pool Start</label>
            <input 
              type="text" 
              id="l2tp-pool-start" 
              name="pool-start" 
              value="192.168.100.2" 
              placeholder="192.168.100.2"
              required
            />
          </div>
          
          <div class="form-group">
            <label for="l2tp-pool-end">VPN Pool End</label>
            <input 
              type="text" 
              id="l2tp-pool-end" 
              name="pool-end" 
              value="192.168.100.100" 
              placeholder="192.168.100.100"
              required
            />
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="l2tp-dns-primary">Primary DNS</label>
            <input 
              type="text" 
              id="l2tp-dns-primary" 
              name="dns-primary" 
              value="8.8.8.8" 
              placeholder="8.8.8.8"
              required
            />
          </div>
          
          <div class="form-group">
            <label for="l2tp-dns-secondary">Secondary DNS</label>
            <input 
              type="text" 
              id="l2tp-dns-secondary" 
              name="dns-secondary" 
              value="8.8.4.4" 
              placeholder="8.8.4.4"
            />
          </div>
        </div>
        
        <div class="form-row full">
          <div class="form-group">
            <label for="l2tp-ipsec-secret">IPSec Pre-shared Key</label>
            <input 
              type="password" 
              id="l2tp-ipsec-secret" 
              name="ipsec-secret" 
              placeholder="Enter pre-shared key"
              required
            />
            <div class="form-help">Shared secret for IPSec authentication</div>
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="l2tp-username">VPN Username</label>
            <input 
              type="text" 
              id="l2tp-username" 
              name="username" 
              placeholder="vpnuser"
              required
            />
          </div>
          
          <div class="form-group">
            <label for="l2tp-password">VPN Password</label>
            <input 
              type="password" 
              id="l2tp-password" 
              name="password" 
              placeholder="Enter password"
              required
            />
          </div>
        </div>
      </div>
      
      <div id="advanced-setup" class="form-section" style="display: none;">
        <h3 class="section-title">Advanced L2TP Server Settings</h3>
        
        <div class="checkbox-group">
          <input type="checkbox" id="l2tp-enabled" name="enabled" checked>
          <label for="l2tp-enabled">Enable L2TP Server</label>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="l2tp-max-mtu">Max MTU</label>
            <input 
              type="number" 
              id="l2tp-max-mtu" 
              name="max-mtu" 
              value="1460" 
              min="576" 
              max="1500"
            />
          </div>
          
          <div class="form-group">
            <label for="l2tp-max-mru">Max MRU</label>
            <input 
              type="number" 
              id="l2tp-max-mru" 
              name="max-mru" 
              value="1460" 
              min="576" 
              max="1500"
            />
          </div>
        </div>
        
        <div class="form-row full">
          <div class="form-group">
            <label for="l2tp-ipsec-secret-adv">IPSec Pre-shared Key</label>
            <input 
              type="password" 
              id="l2tp-ipsec-secret-adv" 
              name="ipsec-secret" 
              placeholder="Enter pre-shared key"
            />
          </div>
        </div>
      </div>
    `;
  }

  /** Renders PPTP configuration form */
  private renderPPTPForm(): string {
    return `
      <div class="warning-note">
        <strong>Security Warning:</strong> PPTP uses weak encryption and is vulnerable to attacks. 
        Consider using L2TP/IPSec or WireGuard instead.
      </div>
      
      <div class="form-section">
        <h3 class="section-title">PPTP Server Settings</h3>
        
        <div class="checkbox-group">
          <input type="checkbox" id="pptp-enabled" name="enabled" checked>
          <label for="pptp-enabled">Enable PPTP Server</label>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="pptp-max-mtu">Max MTU</label>
            <input 
              type="number" 
              id="pptp-max-mtu" 
              name="max-mtu" 
              value="1460" 
              min="576" 
              max="1500"
            />
          </div>
          
          <div class="form-group">
            <label for="pptp-max-mru">Max MRU</label>
            <input 
              type="number" 
              id="pptp-max-mru" 
              name="max-mru" 
              value="1460" 
              min="576" 
              max="1500"
            />
          </div>
        </div>
      </div>
    `;
  }

  /** Renders SSTP configuration form */
  private renderSSTPForm(): string {
    return `
      <div class="form-section">
        <h3 class="section-title">SSTP Server Settings</h3>
        
        <div class="checkbox-group">
          <input type="checkbox" id="sstp-enabled" name="enabled" checked>
          <label for="sstp-enabled">Enable SSTP Server</label>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="sstp-default-profile">Default Profile</label>
            <input 
              type="text" 
              id="sstp-default-profile" 
              name="default-profile" 
              value="default" 
              placeholder="default"
            />
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="sstp-max-mtu">Max MTU</label>
            <input 
              type="number" 
              id="sstp-max-mtu" 
              name="max-mtu" 
              value="1500" 
              min="576" 
              max="1500"
            />
          </div>
          
          <div class="form-group">
            <label for="sstp-max-mru">Max MRU</label>
            <input 
              type="number" 
              id="sstp-max-mru" 
              name="max-mru" 
              value="1500" 
              min="576" 
              max="1500"
            />
          </div>
        </div>
      </div>
    `;
  }

  /** Renders OpenVPN configuration form */
  private renderOpenVPNForm(): string {
    return `
      <div class="form-section">
        <h3 class="section-title">OpenVPN Server Settings</h3>
        
        <div class="checkbox-group">
          <input type="checkbox" id="ovpn-enabled" name="enabled" checked>
          <label for="ovpn-enabled">Enable OpenVPN Server</label>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="ovpn-port">Port</label>
            <input 
              type="number" 
              id="ovpn-port" 
              name="port" 
              value="1194" 
              min="1" 
              max="65535"
            />
          </div>
          
          <div class="form-group">
            <label for="ovpn-protocol">Protocol</label>
            <select id="ovpn-protocol" name="protocol">
              <option value="tcp">TCP</option>
              <option value="udp">UDP</option>
            </select>
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="ovpn-mode">Mode</label>
            <select id="ovpn-mode" name="mode">
              <option value="ip">IP</option>
              <option value="ethernet">Ethernet</option>
            </select>
          </div>
        </div>
      </div>
    `;
  }

  /** Renders VPN user configuration form */
  private renderUserForm(): string {
    return `
      <div class="form-section">
        <h3 class="section-title">User Credentials</h3>
        
        <div class="form-row">
          <div class="form-group">
            <label for="user-username">Username</label>
            <input 
              type="text" 
              id="user-username" 
              name="username" 
              value="${this.editData?.name || ''}" 
              placeholder="Enter username"
              required
            />
          </div>
          
          <div class="form-group">
            <label for="user-password">Password</label>
            <input 
              type="password" 
              id="user-password" 
              name="password" 
              placeholder="Enter password"
              required
            />
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="user-service">Service</label>
            <select id="user-service" name="service">
              <option value="">Any</option>
              <option value="ppp">PPP</option>
              <option value="l2tp">L2TP</option>
              <option value="pptp">PPTP</option>
              <option value="sstp">SSTP</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="user-profile">Profile</label>
            <input 
              type="text" 
              id="user-profile" 
              name="profile" 
              value="${this.editData?.profile || 'default'}" 
              placeholder="default"
            />
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="user-local-address">Local Address</label>
            <input 
              type="text" 
              id="user-local-address" 
              name="local-address" 
              value="${this.editData?.localAddress || ''}" 
              placeholder="192.168.1.1"
            />
            <div class="form-help">Leave empty for automatic assignment</div>
          </div>
          
          <div class="form-group">
            <label for="user-remote-address">Remote Address</label>
            <input 
              type="text" 
              id="user-remote-address" 
              name="remote-address" 
              value="${this.editData?.remoteAddress || ''}" 
              placeholder="192.168.1.100"
            />
            <div class="form-help">Leave empty for automatic assignment</div>
          </div>
        </div>
        
        <div class="form-row full">
          <div class="form-group">
            <label for="user-comment">Comment</label>
            <textarea 
              id="user-comment" 
              name="comment" 
              rows="3" 
              placeholder="Optional description"
            >${this.editData?.comment || ''}</textarea>
          </div>
        </div>
      </div>
    `;
  }

  /** Attaches event listeners */
  private attachEventListeners(): void {
    // Form submission
    const form = document.getElementById('vpn-config-form') as HTMLFormElement;
    if (form) {
      form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    // Cancel button
    const cancelButton = document.getElementById('vpn-cancel');
    if (cancelButton) {
      cancelButton.addEventListener('click', () => this.hide());
    }

    // WireGuard key generation
    const generateKeyButton = document.getElementById('generate-key');
    if (generateKeyButton) {
      generateKeyButton.addEventListener('click', () => {
        const privateKeyInput = document.getElementById('wg-private-key') as HTMLInputElement;
        if (privateKeyInput) {
          privateKeyInput.value = this.generateWireGuardKey();
        }
      });
    }

    // L2TP setup type selector
    const setupOptions = document.querySelectorAll('.setup-type-option');
    setupOptions.forEach(option => {
      option.addEventListener('click', () => {
        const setupType = option.getAttribute('data-setup-type');
        
        // Update selection
        setupOptions.forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');
        
        // Update form sections
        const quickSetup = document.getElementById('quick-setup');
        const advancedSetup = document.getElementById('advanced-setup');
        const setupTypeInput = document.getElementById('setup-type-input') as HTMLInputElement;
        
        if (setupType === 'quick') {
          quickSetup!.style.display = 'block';
          advancedSetup!.style.display = 'none';
          setupTypeInput.value = 'quick';
        } else {
          quickSetup!.style.display = 'none';
          advancedSetup!.style.display = 'block';
          setupTypeInput.value = 'advanced';
        }
      });
    });

    // Close on overlay click
    const overlay = document.getElementById('vpn-config-overlay');
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          this.hide();
        }
      });
    }

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isVisible) {
        this.hide();
      }
    });
  }
}