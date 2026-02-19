import { scanEntireRange, type FastScanResult, type FastScanProgress } from '@/services/fast-scanner';
import { manualRouterToScanResult } from '@/services/manual-router';
import { 
  smartScan, 
  isBackendAvailable, 
  autoScanGateways, 
  isAutoScanSupported, 
  getAutoScanConfig,
  startAutoScanWithRealTimeResults 
} from '@/services/scanner';

import { ManualEntry } from './ManualEntry';


import type { ScanResult, RouterInfo } from '@shared/routeros';

/**
 * Enhanced Network Scanner Component with Auto-Scan Support - Updated with Tailwind
 */
type ScannerMode = 'auto' | 'manual';

interface ScannerOptions {
  autoStart?: boolean; // Whether to start auto-scan immediately
  showAutoScanStatus?: boolean; // Whether to show auto-scan status
}

export class Scanner {
  private container: HTMLElement;
  private isScanning = false;
  private onRouterFound?: (result: ScanResult) => void;
  private foundDevices: ScanResult[] = [];
  private currentMode: ScannerMode = 'auto';
  private manualEntry: ManualEntry | null = null;
  private options: ScannerOptions;
  private autoScanSupported = false;

  constructor(container: HTMLElement, options: ScannerOptions = {}) {
    this.container = container;
    this.options = {
      autoStart: true,
      showAutoScanStatus: true,
      ...options
    };
    this.init();
  }

  /** Initialize scanner with auto-scan check */
  private init(): void {
    // Initial render
    this.render();
    this.attachEventListeners();
    
    // Check auto-scan support and start if needed (async)
    this.checkAutoScanSupport();
  }

  /** Check if auto-scan is supported and update UI accordingly */
  private async checkAutoScanSupport(): Promise<void> {
    try {
      this.autoScanSupported = await isAutoScanSupported();
      console.log('🔍 Auto-scan supported:', this.autoScanSupported);
      
      // Update UI based on auto-scan support
      this.updateAutoScanStatus();
      
      // Start auto-scan if enabled and supported
      if (this.autoScanSupported && this.options.autoStart && this.currentMode === 'auto') {
        console.log('🚀 Starting auto-scan...');
        await this.startAutoScan();
      }
    } catch (error) {
      console.warn('❌ Failed to check auto-scan support:', error);
      this.autoScanSupported = false;
      this.updateAutoScanStatus();
    }
  }

  /** Update the UI based on auto-scan support */
  private updateAutoScanStatus(): void {
    // Update subtitle
    const subtitle = this.container.querySelector('.subtitle') as HTMLElement;
    if (subtitle) {
      subtitle.textContent = this.autoScanSupported ? 
        'Auto-scanning 192.168.0-255.1 for HTTP API endpoints...' : 
        'Find and add MikroTik routers to your network';
    }

    // Update button text
    const scanBtn = this.container.querySelector('#scan-btn') as HTMLButtonElement;
    if (scanBtn && !this.isScanning) {
      scanBtn.textContent = this.autoScanSupported ? 'Manual Scan' : 'Scan Network';
    }

    // Update no results message
    const resultsList = this.container.querySelector('#results-list') as HTMLElement;
    const noResults = resultsList?.querySelector('.no-results') as HTMLElement;
    if (noResults && !this.isScanning) {
      noResults.textContent = this.autoScanSupported ? 
        'Initializing auto-scan...' : 
        'No devices found yet. Click "Scan Network" to start.';
    }
  }

  /** Sets callback for when a router is found */
  public onRouterFoundCallback(callback: (result: ScanResult) => void): void {
    this.onRouterFound = callback;
  }

  /** Renders the scanner interface with mode toggle using Tailwind */
  private render(): void {
    this.container.innerHTML = `
      <div class="p-6 md:p-8 max-w-4xl mx-auto">
        <!-- Header Section -->
        <div class="text-center mb-8 animate-fade-in">
          <h3 class="text-3xl font-bold text-gray-900 dark:text-white mb-3 bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
            Router Discovery
          </h3>
          <p class="subtitle text-gray-600 dark:text-gray-400 text-sm mb-6">
            Find and add MikroTik routers to your network
          </p>
          
          <!-- Mode Toggle -->
          <div class="inline-flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 max-w-sm mx-auto mb-8 shadow-sm">
            <button id="auto-mode-btn" class="mode-button flex-1 px-6 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
              this.currentMode === 'auto' 
                ? 'bg-primary-500 text-white shadow-primary' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-primary-50 dark:hover:bg-primary-950 hover:text-primary-600'
            }">
              <span class="flex items-center justify-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                </svg>
                Auto Scan
              </span>
            </button>
            <button id="manual-mode-btn" class="mode-button flex-1 px-6 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
              this.currentMode === 'manual' 
                ? 'bg-primary-500 text-white shadow-primary' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-primary-50 dark:hover:bg-primary-950 hover:text-primary-600'
            }">
              <span class="flex items-center justify-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                Add Manually
              </span>
            </button>
          </div>
        </div>
        
        <!-- Content Area -->
        <div class="min-h-96">
          <!-- Auto Scan Mode -->
          <div id="auto-scan-content" class="auto-scan ${this.currentMode === 'auto' ? 'block' : 'hidden'} animate-fade-in">
            <div class="text-center mb-8">
              <button id="scan-btn" class="btn btn-primary text-lg px-8 py-4 min-w-48 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
                <span class="flex items-center justify-center gap-2">
                  ${this.isScanning ? `
                    <svg class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Stop Scan
                  ` : `
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                    Scan Network
                  `}
                </span>
              </button>
            </div>
            
            <!-- Progress Bar -->
            <div id="progress-container" class="mb-8 max-w-md mx-auto">
              <div class="bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden shadow-inner">
                <div id="progress-fill" class="bg-gradient-to-r from-primary-500 to-secondary-500 h-full w-0 transition-all duration-300 ease-out rounded-full shadow-primary"></div>
              </div>
              <div id="progress-text" class="text-sm text-gray-600 dark:text-gray-400 text-center mt-3 font-medium">
                Scanning network...
              </div>
            </div>
            
            <!-- Results Section -->
            <div class="results">
              <h4 id="results-title" class="hidden text-xl font-semibold text-gray-900 dark:text-white mb-6 text-center">
                Found Devices (<span id="device-count" class="text-primary-600 dark:text-primary-400">0</span>)
              </h4>
              <div id="results-list" class="space-y-4 max-w-2xl mx-auto">
                <div class="no-results text-center text-gray-500 dark:text-gray-400 italic py-12 px-6 bg-gray-50 dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600">
                  <svg class="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0012 20.4a7.962 7.962 0 01-5-1.691V20h10v-1.291z"></path>
                  </svg>
                  No devices found yet. Click "Scan Network" to start.
                </div>
              </div>
            </div>
          </div>
          
          <!-- Manual Entry Mode -->
          <div id="manual-entry-content" class="manual-entry-container ${this.currentMode === 'manual' ? 'block' : 'hidden'} animate-fade-in">
            <!-- ManualEntry component will be injected here -->
          </div>
        </div>
      </div>
    `;
    
    // Initialize manual entry component if in manual mode
    if (this.currentMode === 'manual') {
      this.initializeManualEntry();
    }
  }

  /** Attaches event listeners */
  private attachEventListeners(): void {
    // Mode toggle buttons
    const autoModeBtn = this.container.querySelector('#auto-mode-btn') as HTMLButtonElement;
    const manualModeBtn = this.container.querySelector('#manual-mode-btn') as HTMLButtonElement;
    
    autoModeBtn?.addEventListener('click', () => this.switchMode('auto'));
    manualModeBtn?.addEventListener('click', () => this.switchMode('manual'));

    // Scan button
    const scanBtn = this.container.querySelector('#scan-btn') as HTMLButtonElement;
    scanBtn?.addEventListener('click', () => this.toggleScan());
  }

  /** Switch between scanner modes */
  private switchMode(mode: ScannerMode): void {
    if (this.currentMode === mode) return;
    
    this.currentMode = mode;
    
    // Re-render to update mode toggle and content
    this.render();
    
    // Re-attach event listeners after re-render
    this.attachEventListeners();
    
    console.log(`🔄 Switched to ${mode} mode`);
  }

  /** Toggle scan state */
  private async toggleScan(): Promise<void> {
    if (this.isScanning) {
      this.stopScan();
    } else {
      if (this.autoScanSupported) {
        await this.startAutoScan();
      } else {
        await this.startManualScan();
      }
    }
  }

  /** Start auto-scan */
  private async startAutoScan(): Promise<void> {
    this.isScanning = true;
    this.updateScanButton();
    this.foundDevices = [];
    this.updateResults();
    
    try {
      console.log('🔍 Starting auto-scan...');
      await startAutoScanWithRealTimeResults((result) => {
        console.log('📡 Auto-scan found device:', result);
        this.addDevice(result);
      });
    } catch (error) {
      console.error('❌ Auto-scan failed:', error);
    }
    
    this.isScanning = false;
    this.updateScanButton();
  }

  /** Start manual scan */
  private async startManualScan(): Promise<void> {
    this.isScanning = true;
    this.updateScanButton();
    this.foundDevices = [];
    this.updateResults();
    
    try {
      console.log('🔍 Starting manual scan...');
      const scanResult = await scanEntireRange({}, (progress: FastScanProgress) => {
        const percentage = progress.totalHosts > 0 ? (progress.scannedHosts / progress.totalHosts) * 100 : 0;
        const message = `Scanning ${progress.scannedHosts}/${progress.totalHosts} hosts - Found: ${progress.foundHosts}`;
        this.updateProgress(percentage, message);
      });
      
      for (const result of scanResult.results) {
        this.addDevice(result);
      }
    } catch (error) {
      console.error('❌ Manual scan failed:', error);
    }
    
    this.isScanning = false;
    this.updateScanButton();
    this.hideProgress();
  }

  /** Stop current scan */
  private stopScan(): void {
    this.isScanning = false;
    this.updateScanButton();
    this.hideProgress();
    console.log('⏹️ Scan stopped');
  }

  /** Update scan button state */
  private updateScanButton(): void {
    const scanBtn = this.container.querySelector('#scan-btn') as HTMLButtonElement;
    if (scanBtn) {
      const baseText = this.autoScanSupported ? 'Manual Scan' : 'Scan Network';
      
      if (this.isScanning) {
        scanBtn.innerHTML = `
          <span class="flex items-center justify-center gap-2">
            <svg class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Stop Scan
          </span>
        `;
      } else {
        scanBtn.innerHTML = `
          <span class="flex items-center justify-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
            ${baseText}
          </span>
        `;
      }
      scanBtn.disabled = false;
    }
  }

  /** Update progress bar */
  private updateProgress(percentage: number, message: string): void {
    const progressFill = this.container.querySelector('#progress-fill') as HTMLElement;
    const progressText = this.container.querySelector('#progress-text') as HTMLElement;
    const progressContainer = this.container.querySelector('#progress-container') as HTMLElement;
    
    if (progressContainer) progressContainer.style.display = 'block';
    if (progressFill) progressFill.style.width = `${percentage}%`;
    if (progressText) progressText.textContent = message;
  }

  /** Hide progress bar */
  private hideProgress(): void {
    const progressContainer = this.container.querySelector('#progress-container') as HTMLElement;
    if (progressContainer) progressContainer.style.display = 'none';
  }

  /** Add found device to results */
  private addDevice(result: ScanResult): void {
    // Avoid duplicates
    if (this.foundDevices.some(d => d.ip === result.ip)) {
      return;
    }
    
    this.foundDevices.push(result);
    this.updateResults();
    
    // Call callback if provided
    if (this.onRouterFound) {
      this.onRouterFound(result);
    }
  }

  /** Update results display */
  private updateResults(): void {
    const resultsList = this.container.querySelector('#results-list') as HTMLElement;
    const resultsTitle = this.container.querySelector('#results-title') as HTMLElement;
    const deviceCount = this.container.querySelector('#device-count') as HTMLElement;
    
    if (!resultsList) return;
    
    if (this.foundDevices.length === 0) {
      resultsList.innerHTML = `
        <div class="no-results text-center text-gray-500 dark:text-gray-400 italic py-12 px-6 bg-gray-50 dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600">
          <svg class="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0012 20.4a7.962 7.962 0 01-5-1.691V20h10v-1.291z"></path>
          </svg>
          ${this.isScanning ? 'Scanning...' : 'No devices found yet. Click "Scan Network" to start.'}
        </div>
      `;
      resultsTitle?.classList.add('hidden');
    } else {
      // Show results title
      resultsTitle?.classList.remove('hidden');
      if (deviceCount) deviceCount.textContent = this.foundDevices.length.toString();
      
      // Render device list
      resultsList.innerHTML = this.foundDevices.map(device => `
        <div class="device-item panel hover:panel-elevated cursor-pointer transform hover:scale-105 transition-all duration-200 animate-fade-in" data-ip="${device.ip}">
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <div class="device-name text-lg font-semibold text-gray-900 dark:text-white mb-2">
                ${device.identity || 'Unknown Device'}
                <span class="status-indicator status-online"></span>
              </div>
              <div class="device-info text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <div class="flex items-center gap-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9"></path>
                  </svg>
                  <strong>IP:</strong> ${device.ip}:${device.port || 80}
                </div>
                ${device.version ? `
                  <div class="flex items-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <strong>Version:</strong> ${device.version}
                  </div>
                ` : ''}
                ${device.board ? `
                  <div class="flex items-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"></path>
                    </svg>
                    <strong>Board:</strong> ${device.board}
                  </div>
                ` : ''}
              </div>
            </div>
            <div class="flex-shrink-0 ml-4">
              <svg class="w-6 h-6 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </div>
          </div>
        </div>
      `).join('');
      
      // Add click handlers for devices
      resultsList.querySelectorAll('.device-item').forEach(item => {
        item.addEventListener('click', () => {
          const ip = item.getAttribute('data-ip');
          const device = this.foundDevices.find(d => d.ip === ip);
          if (device && this.onRouterFound) {
            this.onRouterFound(device);
          }
        });
      });
    }
  }

  /** Initialize manual entry component */
  private initializeManualEntry(): void {
    const container = this.container.querySelector('#manual-entry-content') as HTMLElement;
    if (container && !this.manualEntry) {
      this.manualEntry = new ManualEntry(container);
      this.manualEntry.onRouterAddedCallback((routerInfo) => {
        const manualEntry = { 
          ip: routerInfo.ip,
          name: routerInfo.name,
          credentials: { username: 'admin', password: '' },
          addedManually: true as const,
          dateAdded: Date.now()
        };
        const scanResult = manualRouterToScanResult(manualEntry);
        this.addDevice(scanResult);
        if (this.onRouterFound) {
          this.onRouterFound(scanResult);
        }
      });
    }
  }

  /** Clean up resources */
  public destroy(): void {
    this.stopScan();
    // ManualEntry doesn't have a destroy method, just remove reference
    this.manualEntry = null;
  }
}