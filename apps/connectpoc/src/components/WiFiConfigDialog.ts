import { 
  updateWirelessInterface,
  configureSSID,
  setWirelessChannel,
  configureWPA2Security
} from '@/services/wireless';

import type { WirelessInterface, WirelessSecurityProfile } from '@shared/routeros';

/**
 * WiFi Configuration Dialog Component
 * Allows editing of wireless interface settings
 */
export class WiFiConfigDialog {
  private container: HTMLElement;
  private routerIp = '';
  private interface: WirelessInterface | null = null;
  private securityProfiles: WirelessSecurityProfile[] = [];
  private onSuccess?: () => void;
  private isVisible = false;
  private isLoading = false;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  /** Shows the configuration dialog */
  public show(
    routerIp: string,
    interfaceData: WirelessInterface,
    securityProfiles: WirelessSecurityProfile[],
    onSuccess?: () => void
  ): void {
    this.routerIp = routerIp;
    this.interface = { ...interfaceData }; // Create a copy
    this.securityProfiles = securityProfiles;
    this.onSuccess = onSuccess;
    this.isVisible = true;
    this.render();

    // Focus on SSID field
    setTimeout(() => {
      const ssidField = document.getElementById('wifi-ssid') as HTMLInputElement;
      if (ssidField) {
        ssidField.focus();
        ssidField.select();
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
    
    if (!this.interface) return;

    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    
    // Extract form data
    const ssid = formData.get('ssid') as string;
    const password = formData.get('password') as string;
    const hideSSID = formData.get('hide-ssid') === 'on';
    const channel = formData.get('channel') as string;
    const channelWidth = formData.get('channel-width') as string;
    const securityType = formData.get('security-type') as string;
    
    // Validate required fields
    if (!ssid.trim()) {
      this.showError('SSID is required');
      return;
    }
    
    if (securityType === 'wpa2-psk' && !password.trim()) {
      this.showError('Password is required for WPA2 security');
      return;
    }
    
    if (securityType === 'wpa2-psk' && password.length < 8) {
      this.showError('Password must be at least 8 characters long');
      return;
    }

    this.setLoading(true);
    this.showError('');

    try {
      const interfaceId = this.interface.name;
      
      // Update SSID configuration
      if (ssid !== this.interface.ssid || hideSSID !== this.interface.hideSSID) {
        const ssidResult = await configureSSID(this.routerIp, interfaceId, ssid, hideSSID);
        if (!ssidResult.success) {
          throw new Error(ssidResult.error || 'Failed to update SSID');
        }
      }
      
      // Update channel configuration
      if (channel !== 'auto' && channel !== this.interface.frequency?.toString()) {
        const channelResult = await setWirelessChannel(
          this.routerIp, 
          interfaceId, 
          parseInt(channel),
          channelWidth as any
        );
        if (!channelResult.success) {
          throw new Error(channelResult.error || 'Failed to update channel');
        }
      } else if (channel === 'auto' && this.interface.frequency !== undefined) {
        const channelResult = await setWirelessChannel(
          this.routerIp, 
          interfaceId, 
          'auto',
          channelWidth as any
        );
        if (!channelResult.success) {
          throw new Error(channelResult.error || 'Failed to set auto channel');
        }
      }
      
      // Update security configuration
      if (securityType === 'wpa2-psk' && password) {
        const securityResult = await configureWPA2Security(
          this.routerIp,
          interfaceId,
          password,
          `${interfaceId}-security`
        );
        if (!securityResult.success) {
          throw new Error(securityResult.error || 'Failed to update security');
        }
      }

      this.setLoading(false);
      this.showSuccess('WiFi configuration updated successfully');
      
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

  /** Sets loading state */
  private setLoading(loading: boolean): void {
    this.isLoading = loading;
    
    const submitButton = document.getElementById('wifi-submit') as HTMLButtonElement;
    const cancelButton = document.getElementById('wifi-cancel') as HTMLButtonElement;
    const form = document.getElementById('wifi-config-form') as HTMLFormElement;
    
    if (submitButton) {
      submitButton.disabled = loading;
      submitButton.textContent = loading ? 'Applying...' : 'Apply Changes';
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
    const errorElement = document.getElementById('wifi-config-error');
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = message ? 'block' : 'none';
    }
  }

  /** Shows success message */
  private showSuccess(message: string): void {
    const successElement = document.getElementById('wifi-config-success');
    if (successElement) {
      successElement.textContent = message;
      successElement.style.display = 'block';
    }
  }

  /** Gets available channels for 2.4GHz */
  private get24GHzChannels(): number[] {
    return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
  }

  /** Gets available channels for 5GHz */
  private get5GHzChannels(): number[] {
    return [36, 40, 44, 48, 52, 56, 60, 64, 100, 104, 108, 112, 116, 120, 124, 128, 132, 136, 140, 149, 153, 157, 161, 165];
  }

  /** Renders the configuration dialog */
  private render(): void {
    if (!this.isVisible || !this.interface) {
      this.container.innerHTML = '';
      return;
    }

    const channels = this.interface.band && this.interface.band.includes('5') ? this.get5GHzChannels() : this.get24GHzChannels();
    
    this.container.innerHTML = `
      <style>
        .wifi-config-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1100;
        }
        
        .wifi-config-dialog {
          background: white;
          border-radius: 12px;
          padding: 32px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          max-width: 600px;
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
        
        .interface-info {
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 24px;
        }
        
        .interface-info-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        
        .interface-info-item:last-child {
          margin-bottom: 0;
        }
        
        .interface-info-label {
          font-weight: 500;
          color: #333;
        }
        
        .interface-info-value {
          color: #666;
          font-family: monospace;
        }
        
        .config-form {
          margin-bottom: 24px;
        }
        
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
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
        .form-group select {
          padding: 12px 16px;
          border: 1px solid #dee2e6;
          border-radius: 6px;
          font-size: 14px;
          transition: border-color 0.2s ease;
        }
        
        .form-group input:focus,
        .form-group select:focus {
          outline: none;
          border-color: #007bff;
          box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
        }
        
        .form-group input:disabled,
        .form-group select:disabled {
          background-color: #f8f9fa;
          color: #6c757d;
        }
        
        .checkbox-group {
          display: flex;
          align-items: center;
          gap: 8px;
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
        
        .form-help {
          font-size: 12px;
          color: #666;
          margin-top: 4px;
        }
        
        .password-toggle {
          position: relative;
        }
        
        .password-toggle-btn {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #666;
          cursor: pointer;
          font-size: 12px;
          padding: 4px;
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
          min-width: 120px;
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
        
        .security-note {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 6px;
          padding: 12px;
          margin-top: 12px;
          font-size: 13px;
          color: #856404;
        }
      </style>
      
      <div class="wifi-config-overlay" id="wifi-config-overlay">
        <div class="wifi-config-dialog">
          <div class="config-header">
            <h2>Configure WiFi Interface</h2>
            <p class="config-subtitle">Edit wireless settings for ${this.interface.name}</p>
          </div>
          
          <div class="interface-info">
            <div class="interface-info-item">
              <span class="interface-info-label">Interface:</span>
              <span class="interface-info-value">${this.interface.name}</span>
            </div>
            <div class="interface-info-item">
              <span class="interface-info-label">Mode:</span>
              <span class="interface-info-value">${this.interface.mode || 'Unknown'}</span>
            </div>
            <div class="interface-info-item">
              <span class="interface-info-label">Band:</span>
              <span class="interface-info-value">${this.interface.band || 'Unknown'}</span>
            </div>
            ${(this.interface as any).macAddress ? `
              <div class="interface-info-item">
                <span class="interface-info-label">MAC:</span>
                <span class="interface-info-value">${(this.interface as any).macAddress}</span>
              </div>
            ` : ''}
          </div>
          
          <div id="wifi-config-error" class="config-error"></div>
          <div id="wifi-config-success" class="config-success"></div>
          
          <form id="wifi-config-form" class="config-form">
            <div class="form-row full">
              <div class="form-group">
                <label for="wifi-ssid">Network Name (SSID)</label>
                <input 
                  type="text" 
                  id="wifi-ssid" 
                  name="ssid" 
                  value="${this.interface.ssid || ''}" 
                  placeholder="Enter network name"
                  maxlength="32"
                  required
                />
                <div class="form-help">Maximum 32 characters</div>
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label for="wifi-security">Security Type</label>
                <select id="wifi-security" name="security-type">
                  <option value="none">None (Open)</option>
                  <option value="wpa2-psk" selected>WPA2-PSK</option>
                  <option value="wpa3-psk">WPA3-PSK</option>
                </select>
              </div>
              
              <div class="form-group">
                <label for="wifi-channel">Channel</label>
                <select id="wifi-channel" name="channel">
                  <option value="auto">Auto</option>
                  ${channels.map(ch => {
                    const freq = this.interface?.frequency;
                    return `
                    <option value="${ch}" ${freq === ch ? 'selected' : ''}>
                      Channel ${ch}
                    </option>
                  `;
                  }).join('')}
                </select>
              </div>
            </div>
            
            <div class="form-row" id="password-row">
              <div class="form-group">
                <label for="wifi-password">Password</label>
                <div class="password-toggle">
                  <input 
                    type="password" 
                    id="wifi-password" 
                    name="password" 
                    placeholder="Enter WiFi password"
                    minlength="8"
                  />
                  <button type="button" class="password-toggle-btn" id="toggle-password">Show</button>
                </div>
                <div class="form-help">Minimum 8 characters for WPA2/WPA3</div>
              </div>
              
              <div class="form-group">
                <label for="wifi-channel-width">Channel Width</label>
                <select id="wifi-channel-width" name="channel-width">
                  <option value="20mhz">20 MHz</option>
                  <option value="40mhz" selected>40 MHz</option>
                  ${this.interface.band?.includes('5') ? '<option value="80mhz">80 MHz</option>' : ''}
                </select>
              </div>
            </div>
            
            <div class="form-row full">
              <div class="form-group">
                <div class="checkbox-group">
                  <input 
                    type="checkbox" 
                    id="wifi-hide-ssid" 
                    name="hide-ssid"
                    ${this.interface.hideSSID ? 'checked' : ''}
                  />
                  <label for="wifi-hide-ssid">Hide network name (SSID)</label>
                </div>
                <div class="form-help">Network will not appear in WiFi scans</div>
              </div>
            </div>
            
            <div class="security-note">
              <strong>Security Note:</strong> WPA2-PSK is recommended for home and office networks. 
              WPA3-PSK provides enhanced security but may not be compatible with older devices.
            </div>
          </form>
          
          <div class="config-actions">
            <button 
              type="button" 
              id="wifi-cancel" 
              class="config-button secondary"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              id="wifi-submit" 
              class="config-button primary"
              form="wifi-config-form"
            >
              Apply Changes
            </button>
          </div>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  /** Attaches event listeners */
  private attachEventListeners(): void {
    // Form submission
    const form = document.getElementById('wifi-config-form') as HTMLFormElement;
    if (form) {
      form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    // Cancel button
    const cancelButton = document.getElementById('wifi-cancel');
    if (cancelButton) {
      cancelButton.addEventListener('click', () => this.hide());
    }

    // Password toggle
    const toggleButton = document.getElementById('toggle-password');
    const passwordInput = document.getElementById('wifi-password') as HTMLInputElement;
    if (toggleButton && passwordInput) {
      toggleButton.addEventListener('click', () => {
        const isPassword = passwordInput.type === 'password';
        passwordInput.type = isPassword ? 'text' : 'password';
        toggleButton.textContent = isPassword ? 'Hide' : 'Show';
      });
    }

    // Security type change
    const securitySelect = document.getElementById('wifi-security') as HTMLSelectElement;
    const passwordRow = document.getElementById('password-row');
    if (securitySelect && passwordRow) {
      const togglePasswordRow = () => {
        const requiresPassword = securitySelect.value !== 'none';
        passwordRow.style.display = requiresPassword ? 'grid' : 'none';
        
        if (passwordInput) {
          passwordInput.required = requiresPassword;
        }
      };
      
      securitySelect.addEventListener('change', togglePasswordRow);
      togglePasswordRow(); // Initial state
    }

    // Close on overlay click
    const overlay = document.getElementById('wifi-config-overlay');
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