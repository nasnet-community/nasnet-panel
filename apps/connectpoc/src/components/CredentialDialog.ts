import { authenticate } from '@/services/auth';

import type { RouterInfo, RouterCredentials } from '@shared/routeros';

/**
 * Credential Dialog Component
 * Prompts user for credentials after router selection
 */
export class CredentialDialog {
  private container: HTMLElement;
  private router: RouterInfo;
  private onSuccess?: (router: RouterInfo, credentials: RouterCredentials) => void;
  private onCancel?: () => void;
  private isVisible = false;

  constructor(container: HTMLElement) {
    this.container = container;
    this.router = {} as RouterInfo;
  }

  /** Shows the credential dialog for a specific router */
  public show(
    router: RouterInfo,
    onSuccess?: (router: RouterInfo, credentials: RouterCredentials) => void,
    onCancel?: () => void
  ): void {
    this.router = router;
    this.onSuccess = onSuccess || undefined;
    this.onCancel = onCancel || undefined;
    this.isVisible = true;
    this.render();
    
    // Focus on username field
    setTimeout(() => {
      const usernameField = document.getElementById('credential-username') as HTMLInputElement;
      if (usernameField) {
        usernameField.focus();
      }
    }, 100);
  }

  /** Hides the credential dialog */
  public hide(): void {
    this.isVisible = false;
    this.container.innerHTML = '';
  }

  /** Handles form submission */
  private async handleSubmit(event: Event): Promise<void> {
    event.preventDefault();
    
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;
    const saveCredentials = formData.get('save-credentials') === 'on';
    
    if (!username.trim()) {
      this.showError('Username is required');
      return;
    }

    const credentials: RouterCredentials = {
      username: username.trim(),
      password: password || '',
    };

    // Show loading state
    this.setLoading(true);
    this.showError('');

    try {
      // Attempt authentication
      const authResult = await authenticate(this.router.ip, credentials, saveCredentials);
      
      if (authResult.success) {
        // Authentication successful
        this.setLoading(false);
        this.hide();
        
        if (this.onSuccess) {
          this.onSuccess(this.router, credentials);
        }
      } else {
        // Authentication failed
        this.setLoading(false);
        this.showError(authResult.error || 'Authentication failed');
      }
    } catch (error) {
      this.setLoading(false);
      this.showError(error instanceof Error ? error.message : 'Connection error');
    }
  }

  /** Sets loading state */
  private setLoading(loading: boolean): void {
    const submitButton = document.getElementById('credential-submit') as HTMLButtonElement;
    const cancelButton = document.getElementById('credential-cancel') as HTMLButtonElement;
    
    if (submitButton) {
      submitButton.disabled = loading;
      submitButton.textContent = loading ? 'Connecting...' : 'Connect';
    }
    
    if (cancelButton) {
      cancelButton.disabled = loading;
    }
  }

  /** Shows error message */
  private showError(message: string): void {
    const errorElement = document.getElementById('credential-error');
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = message ? 'block' : 'none';
    }
  }

  /** Renders the credential dialog */
  private render(): void {
    if (!this.isVisible) {
      this.container.innerHTML = '';
      return;
    }

    this.container.innerHTML = `
      <style>
        .credential-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        
        .credential-dialog {
          background: white;
          border-radius: 12px;
          padding: 32px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          max-width: 480px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
        }
        
        .credential-header {
          text-align: center;
          margin-bottom: 24px;
        }
        
        .credential-header h2 {
          margin: 0 0 8px 0;
          color: #333;
          font-size: 24px;
          font-weight: 600;
        }
        
        .credential-subtitle {
          color: #666;
          font-size: 14px;
          margin: 0;
        }
        
        .router-info {
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 24px;
        }
        
        .router-info-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        
        .router-info-item:last-child {
          margin-bottom: 0;
        }
        
        .router-info-label {
          font-weight: 500;
          color: #333;
        }
        
        .router-info-value {
          color: #666;
          font-family: monospace;
        }
        
        .credential-form {
          margin-bottom: 24px;
        }
        
        .form-group {
          margin-bottom: 20px;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 6px;
          font-weight: 500;
          color: #333;
        }
        
        .form-group input {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid #dee2e6;
          border-radius: 6px;
          font-size: 16px;
          transition: border-color 0.2s ease;
        }
        
        .form-group input:focus {
          outline: none;
          border-color: #007bff;
          box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
        }
        
        .form-group input:disabled {
          background-color: #f8f9fa;
          color: #6c757d;
        }
        
        .checkbox-group {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 16px;
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
        
        .credential-error {
          display: none;
          background: #f8d7da;
          border: 1px solid #f5c6cb;
          color: #721c24;
          padding: 12px 16px;
          border-radius: 6px;
          margin-bottom: 20px;
          font-size: 14px;
        }
        
        .credential-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }
        
        .credential-button {
          padding: 12px 24px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          min-width: 100px;
        }
        
        .credential-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .credential-button.primary {
          background: #007bff;
          color: white;
        }
        
        .credential-button.primary:hover:not(:disabled) {
          background: #0056b3;
        }
        
        .credential-button.secondary {
          background: #6c757d;
          color: white;
        }
        
        .credential-button.secondary:hover:not(:disabled) {
          background: #545b62;
        }
        
        .default-credentials-note {
          background: #d1ecf1;
          border: 1px solid #bee5eb;
          border-radius: 6px;
          padding: 12px;
          margin-bottom: 20px;
          font-size: 13px;
          color: #0c5460;
        }
        
        .default-credentials-note strong {
          font-weight: 600;
        }
      </style>
      
      <div class="credential-overlay" id="credential-overlay">
        <div class="credential-dialog">
          <div class="credential-header">
            <h2>Router Authentication</h2>
            <p class="credential-subtitle">Enter credentials to connect to the router</p>
          </div>
          
          <div class="router-info">
            <div class="router-info-item">
              <span class="router-info-label">Name:</span>
              <span class="router-info-value">${this.router.name}</span>
            </div>
            <div class="router-info-item">
              <span class="router-info-label">IP Address:</span>
              <span class="router-info-value">${this.router.ip}</span>
            </div>
            ${this.router.version ? `
              <div class="router-info-item">
                <span class="router-info-label">RouterOS:</span>
                <span class="router-info-value">${this.router.version}</span>
              </div>
            ` : ''}
          </div>
          
          <div class="default-credentials-note">
            <strong>Default MikroTik credentials:</strong><br>
            Username: <code>admin</code>, Password: <em>(empty)</em>
          </div>
          
          <div id="credential-error" class="credential-error"></div>
          
          <form id="credential-form" class="credential-form">
            <div class="form-group">
              <label for="credential-username">Username</label>
              <input 
                type="text" 
                id="credential-username" 
                name="username" 
                value="admin" 
                placeholder="Enter username"
                required
              />
            </div>
            
            <div class="form-group">
              <label for="credential-password">Password</label>
              <input 
                type="password" 
                id="credential-password" 
                name="password" 
                placeholder="Enter password (leave empty for default)"
              />
            </div>
            
            <div class="checkbox-group">
              <input 
                type="checkbox" 
                id="credential-save" 
                name="save-credentials"
              />
              <label for="credential-save">Save credentials for future use</label>
            </div>
          </form>
          
          <div class="credential-actions">
            <button 
              type="button" 
              id="credential-cancel" 
              class="credential-button secondary"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              id="credential-submit" 
              class="credential-button primary"
              form="credential-form"
            >
              Connect
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
    const form = document.getElementById('credential-form') as HTMLFormElement;
    if (form) {
      form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    // Cancel button
    const cancelButton = document.getElementById('credential-cancel');
    if (cancelButton) {
      cancelButton.addEventListener('click', () => {
        this.hide();
        if (this.onCancel) {
          this.onCancel();
        }
      });
    }

    // Close on overlay click
    const overlay = document.getElementById('credential-overlay');
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          this.hide();
          if (this.onCancel) {
            this.onCancel();
          }
        }
      });
    }

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isVisible) {
        this.hide();
        if (this.onCancel) {
          this.onCancel();
        }
      }
    });
  }
}