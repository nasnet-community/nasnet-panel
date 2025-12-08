import type { RouterCredentials, RouterInfo } from '@shared/routeros';
import { 
  testManualConnection, 
  addManualRouter, 
  getConnectionSuggestions
} from '@/services/manual-router';

/**
 * Manual Router Entry Component
 * Allows users to manually add routers by entering IP address and credentials
 */
export class ManualEntry {
  private container: HTMLElement;
  private onRouterAdded?: (router: RouterInfo) => void;
  private onCancel?: () => void;
  private isTestingConnection = false;
  private isAddingRouter = false;

  constructor(container: HTMLElement) {
    this.container = container;
    this.render();
    this.attachEventListeners();
  }

  /** Sets callback for when a router is successfully added */
  public onRouterAddedCallback(callback: (router: RouterInfo) => void): void {
    this.onRouterAdded = callback;
  }

  /** Sets callback for when the user cancels manual entry */
  public onCancelCallback(callback: () => void): void {
    this.onCancel = callback;
  }

  /** Renders the manual entry form */
  private render(): void {
    this.container.innerHTML = `
      <style>
        .manual-entry {
          padding: 24px;
          max-width: 500px;
          margin: 0 auto;
        }
        
        .manual-entry h3 {
          margin: 0 0 8px 0;
          color: #333;
          font-size: 24px;
          font-weight: 600;
        }
        
        .manual-entry .subtitle {
          margin: 0 0 24px 0;
          color: #666;
          font-size: 14px;
        }
        
        .form-group {
          margin-bottom: 20px;
        }
        
        .form-label {
          display: block;
          margin-bottom: 6px;
          color: #333;
          font-weight: 500;
          font-size: 14px;
        }
        
        .form-input {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
          font-family: inherit;
          box-sizing: border-box;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        
        .form-input:focus {
          outline: none;
          border-color: #007bff;
          box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
        }
        
        .form-input.error {
          border-color: #dc3545;
        }
        
        .form-input.success {
          border-color: #28a745;
        }
        
        .form-help {
          margin-top: 4px;
          font-size: 12px;
          color: #666;
        }
        
        .checkbox-group {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 8px;
        }
        
        .checkbox-input {
          width: auto;
        }
        
        .checkbox-label {
          margin: 0;
          font-size: 14px;
          cursor: pointer;
        }
        
        .button-group {
          display: flex;
          gap: 12px;
          margin-top: 28px;
        }
        
        .btn {
          padding: 12px 24px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s ease, transform 0.1s ease;
          min-width: 120px;
        }
        
        .btn:hover:not(:disabled) {
          transform: translateY(-1px);
        }
        
        .btn:active:not(:disabled) {
          transform: translateY(0);
        }
        
        .btn-primary {
          background: #007bff;
          color: white;
        }
        
        .btn-primary:hover:not(:disabled) {
          background: #0056b3;
        }
        
        .btn-secondary {
          background: #6c757d;
          color: white;
        }
        
        .btn-secondary:hover:not(:disabled) {
          background: #545b62;
        }
        
        .btn-success {
          background: #28a745;
          color: white;
        }
        
        .btn-success:hover:not(:disabled) {
          background: #1e7e34;
        }
        
        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }
        
        .status-message {
          margin-top: 16px;
          padding: 12px;
          border-radius: 6px;
          font-size: 14px;
          display: none;
        }
        
        .status-success {
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }
        
        .status-error {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }
        
        .status-info {
          background: #d1ecf1;
          color: #0c5460;
          border: 1px solid #bee5eb;
        }
        
        .suggestions {
          margin-top: 12px;
          padding: 12px;
          background: #f8f9fa;
          border-radius: 6px;
          border-left: 4px solid #007bff;
        }
        
        .suggestions h5 {
          margin: 0 0 8px 0;
          color: #333;
          font-size: 14px;
          font-weight: 600;
        }
        
        .suggestions ul {
          margin: 0;
          padding-left: 16px;
          color: #666;
          font-size: 13px;
        }
        
        .suggestions li {
          margin-bottom: 4px;
        }
        
        .loading {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        
        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid #transparent;
          border-top: 2px solid currentColor;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
      
      <div class="manual-entry">
        <h3>Add Router Manually</h3>
        <p class="subtitle">Enter router IP address and credentials to add it to your device list</p>
        
        <div class="form-group">
          <label for="router-ip" class="form-label">IP Address *</label>
          <input 
            type="text" 
            id="router-ip" 
            class="form-input" 
            placeholder="192.168.1.1" 
            value=""
          >
          <div class="form-help">Enter the IP address of your MikroTik router</div>
        </div>
        
        <div class="form-group">
          <label for="router-name" class="form-label">Router Name (Optional)</label>
          <input 
            type="text" 
            id="router-name" 
            class="form-input" 
            placeholder="My Router" 
            value=""
          >
          <div class="form-help">Custom name to identify this router (will use IP if empty)</div>
        </div>
        
        <div class="form-group">
          <label for="username" class="form-label">Username *</label>
          <input 
            type="text" 
            id="username" 
            class="form-input" 
            placeholder="admin" 
            value="admin"
          >
          <div class="form-help">RouterOS username (default: admin)</div>
        </div>
        
        <div class="form-group">
          <label for="password" class="form-label">Password</label>
          <input 
            type="password" 
            id="password" 
            class="form-input" 
            placeholder="(leave empty if no password)"
            value=""
          >
          <div class="form-help">RouterOS password (default: empty)</div>
          <div class="checkbox-group">
            <input 
              type="checkbox" 
              id="save-credentials" 
              class="checkbox-input"
            >
            <label for="save-credentials" class="checkbox-label">
              Save credentials for future use
            </label>
          </div>
        </div>
        
        <div id="suggestions-container"></div>
        
        <div class="button-group">
          <button id="test-connection-btn" class="btn btn-primary">
            Test Connection
          </button>
          <button id="add-router-btn" class="btn btn-success" disabled>
            Add Router
          </button>
          <button id="cancel-btn" class="btn btn-secondary">
            Cancel
          </button>
        </div>
        
        <div id="status-message" class="status-message"></div>
      </div>
    `;
  }

  /** Attaches event listeners */
  private attachEventListeners(): void {
    // IP address input changes
    const ipInput = this.container.querySelector('#router-ip') as HTMLInputElement;
    ipInput?.addEventListener('input', () => {
      this.onIpAddressChange();
      this.resetConnectionTest();
    });

    // Credentials input changes
    const usernameInput = this.container.querySelector('#username') as HTMLInputElement;
    const passwordInput = this.container.querySelector('#password') as HTMLInputElement;
    
    [usernameInput, passwordInput].forEach(input => {
      input?.addEventListener('input', () => {
        this.resetConnectionTest();
      });
    });

    // Test connection button
    const testBtn = this.container.querySelector('#test-connection-btn') as HTMLButtonElement;
    testBtn?.addEventListener('click', () => {
      this.testConnection();
    });

    // Add router button
    const addBtn = this.container.querySelector('#add-router-btn') as HTMLButtonElement;
    addBtn?.addEventListener('click', () => {
      this.addRouter();
    });

    // Cancel button
    const cancelBtn = this.container.querySelector('#cancel-btn') as HTMLButtonElement;
    cancelBtn?.addEventListener('click', () => {
      this.cancel();
    });

    // Enter key handling
    this.container.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        if (!this.isTestingConnection && !this.isAddingRouter) {
          const addBtn = this.container.querySelector('#add-router-btn') as HTMLButtonElement;
          if (!addBtn.disabled) {
            this.addRouter();
          } else {
            this.testConnection();
          }
        }
      } else if (e.key === 'Escape') {
        this.cancel();
      }
    });
  }

  /** Handle IP address input changes */
  private onIpAddressChange(): void {
    const ipInput = this.container.querySelector('#router-ip') as HTMLInputElement;
    const suggestionsContainer = this.container.querySelector('#suggestions-container') as HTMLElement;
    
    const ip = ipInput.value.trim();
    
    if (ip) {
      const suggestions = getConnectionSuggestions(ip);
      if (suggestions.length > 0) {
        suggestionsContainer.innerHTML = `
          <div class="suggestions">
            <h5>Connection Tips:</h5>
            <ul>
              ${suggestions.map(suggestion => `<li>${suggestion}</li>`).join('')}
            </ul>
          </div>
        `;
      } else {
        suggestionsContainer.innerHTML = '';
      }
    } else {
      suggestionsContainer.innerHTML = '';
    }
  }

  /** Reset connection test state */
  private resetConnectionTest(): void {
    const addBtn = this.container.querySelector('#add-router-btn') as HTMLButtonElement;
    const statusMessage = this.container.querySelector('#status-message') as HTMLElement;
    const ipInput = this.container.querySelector('#router-ip') as HTMLInputElement;
    
    addBtn.disabled = true;
    statusMessage.style.display = 'none';
    ipInput.classList.remove('success', 'error');
  }

  /** Test connection to router */
  private async testConnection(): Promise<void> {
    const ipInput = this.container.querySelector('#router-ip') as HTMLInputElement;
    const usernameInput = this.container.querySelector('#username') as HTMLInputElement;
    const passwordInput = this.container.querySelector('#password') as HTMLInputElement;
    const testBtn = this.container.querySelector('#test-connection-btn') as HTMLButtonElement;
    const addBtn = this.container.querySelector('#add-router-btn') as HTMLButtonElement;
    
    const ip = ipInput.value.trim();
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    
    // Basic validation
    if (!ip) {
      this.showStatus('Please enter an IP address', 'error');
      ipInput.focus();
      return;
    }
    
    if (!username) {
      this.showStatus('Please enter a username', 'error');
      usernameInput.focus();
      return;
    }

    this.isTestingConnection = true;
    testBtn.disabled = true;
    addBtn.disabled = true;
    
    testBtn.innerHTML = `
      <span class="loading">
        <span class="spinner"></span>
        Testing...
      </span>
    `;

    try {
      const credentials: RouterCredentials = { username, password };
      const result = await testManualConnection(ip, credentials);
      
      if (result.success) {
        this.showStatus(
          `Connection successful! ${result.routerOSVersion ? `RouterOS ${result.routerOSVersion}` : 'Router is reachable'}`, 
          'success'
        );
        ipInput.classList.add('success');
        ipInput.classList.remove('error');
        addBtn.disabled = false;
      } else {
        this.showStatus(`Connection failed: ${result.error}`, 'error');
        ipInput.classList.add('error');
        ipInput.classList.remove('success');
        addBtn.disabled = true;
      }
      
    } catch (error) {
      this.showStatus(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      ipInput.classList.add('error');
      ipInput.classList.remove('success');
      addBtn.disabled = true;
    } finally {
      this.isTestingConnection = false;
      testBtn.disabled = false;
      testBtn.innerHTML = 'Test Connection';
    }
  }

  /** Add router after successful connection test */
  private async addRouter(): Promise<void> {
    const ipInput = this.container.querySelector('#router-ip') as HTMLInputElement;
    const nameInput = this.container.querySelector('#router-name') as HTMLInputElement;
    const usernameInput = this.container.querySelector('#username') as HTMLInputElement;
    const passwordInput = this.container.querySelector('#password') as HTMLInputElement;
    const saveCredentialsInput = this.container.querySelector('#save-credentials') as HTMLInputElement;
    const addBtn = this.container.querySelector('#add-router-btn') as HTMLButtonElement;
    
    const ip = ipInput.value.trim();
    const customName = nameInput.value.trim();
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    const saveCredentials = saveCredentialsInput.checked;

    this.isAddingRouter = true;
    addBtn.disabled = true;
    
    addBtn.innerHTML = `
      <span class="loading">
        <span class="spinner"></span>
        Adding...
      </span>
    `;

    try {
      const credentials: RouterCredentials = { username, password };
      const result = await addManualRouter(ip, credentials, customName, saveCredentials);
      
      if (result.success && result.routerInfo) {
        this.showStatus('Router added successfully!', 'success');
        
        // Notify parent component
        if (this.onRouterAdded) {
          this.onRouterAdded(result.routerInfo);
        }
        
        // Reset form after short delay
        setTimeout(() => {
          this.resetForm();
        }, 1500);
        
      } else {
        this.showStatus(`Failed to add router: ${result.error}`, 'error');
      }
      
    } catch (error) {
      this.showStatus(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    } finally {
      this.isAddingRouter = false;
      addBtn.disabled = false;
      addBtn.innerHTML = 'Add Router';
    }
  }

  /** Cancel manual entry */
  private cancel(): void {
    if (this.onCancel) {
      this.onCancel();
    }
  }

  /** Show status message */
  private showStatus(message: string, type: 'success' | 'error' | 'info'): void {
    const statusMessage = this.container.querySelector('#status-message') as HTMLElement;
    
    statusMessage.className = `status-message status-${type}`;
    statusMessage.textContent = message;
    statusMessage.style.display = 'block';
    
    // Auto-hide success messages
    if (type === 'success') {
      setTimeout(() => {
        statusMessage.style.display = 'none';
      }, 3000);
    }
  }

  /** Reset form to initial state */
  private resetForm(): void {
    const form = this.container.querySelector('.manual-entry') as HTMLElement;
    const inputs = form.querySelectorAll('.form-input');
    const addBtn = this.container.querySelector('#add-router-btn') as HTMLButtonElement;
    const statusMessage = this.container.querySelector('#status-message') as HTMLElement;
    const suggestionsContainer = this.container.querySelector('#suggestions-container') as HTMLElement;
    const saveCredentialsInput = this.container.querySelector('#save-credentials') as HTMLInputElement;
    
    // Reset all inputs except username (keep default value)
    inputs.forEach((input, index) => {
      const htmlInput = input as HTMLInputElement;
      if (htmlInput.id === 'username') {
        htmlInput.value = 'admin'; // Keep default username
      } else {
        htmlInput.value = '';
      }
      htmlInput.classList.remove('success', 'error');
    });
    
    // Reset checkbox
    saveCredentialsInput.checked = false;
    
    // Reset buttons and status
    addBtn.disabled = true;
    statusMessage.style.display = 'none';
    suggestionsContainer.innerHTML = '';
  }
}