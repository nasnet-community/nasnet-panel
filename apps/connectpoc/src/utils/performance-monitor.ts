/**
 * Performance Monitor for Ultra-Fast Network Scanner
 * Tracks response times per subnet, dynamically adjusts timeouts
 * Skips unresponsive subnets and provides real-time performance metrics
 */

export interface SubnetPerformanceMetrics {
  readonly subnetId: string;
  readonly responseTimes: readonly number[];
  readonly averageResponseTime: number;
  readonly successRate: number; // 0-1
  readonly timeoutCount: number;
  readonly totalRequests: number;
  readonly lastUpdated: number;
  readonly recommendedTimeout: number;
}

export interface GlobalPerformanceMetrics {
  readonly totalScanned: number;
  readonly totalFound: number;
  readonly globalAverageResponseTime: number;
  readonly scansPerSecond: number;
  readonly optimalConcurrency: number;
  readonly recommendedTimeout: number;
  readonly fastestSubnet: string | null;
  readonly slowestSubnet: string | null;
  readonly totalElapsedTime: number;
  readonly efficiency: number; // 0-1, higher is better
}

export interface PerformanceAlert {
  readonly type: 'slow_subnet' | 'high_timeout_rate' | 'low_efficiency' | 'optimization_suggestion';
  readonly message: string;
  readonly severity: 'info' | 'warning' | 'critical';
  readonly subnetId?: string;
  readonly suggestedAction?: string;
  readonly timestamp: number;
}

/** Performance monitoring state */
class PerformanceMonitor {
  private subnetMetrics = new Map<string, SubnetPerformanceMetrics>();
  private globalMetrics: GlobalPerformanceMetrics;
  private alerts: PerformanceAlert[] = [];
  private startTime: number = 0;
  private onAlertCallback?: (alert: PerformanceAlert) => void;
  
  // Configuration
  private readonly MAX_RESPONSE_TIME_HISTORY = 100; // Keep last 100 response times
  private readonly SLOW_SUBNET_THRESHOLD = 300; // ms
  private readonly HIGH_TIMEOUT_RATE_THRESHOLD = 0.5; // 50%
  private readonly LOW_EFFICIENCY_THRESHOLD = 0.3; // 30%
  
  constructor() {
    this.globalMetrics = {
      totalScanned: 0,
      totalFound: 0,
      globalAverageResponseTime: 0,
      scansPerSecond: 0,
      optimalConcurrency: 50,
      recommendedTimeout: 150,
      fastestSubnet: null,
      slowestSubnet: null,
      totalElapsedTime: 0,
      efficiency: 1.0,
    };
  }
  
  /**
   * Starts performance monitoring for a new scan
   */
  startMonitoring(onAlert?: (alert: PerformanceAlert) => void): void {
    this.startTime = performance.now();
    this.subnetMetrics.clear();
    this.alerts = [];
    if (onAlert !== undefined) {
      this.onAlertCallback = onAlert;
    }
    
    this.globalMetrics = {
      totalScanned: 0,
      totalFound: 0,
      globalAverageResponseTime: 0,
      scansPerSecond: 0,
      optimalConcurrency: 50,
      recommendedTimeout: 150,
      fastestSubnet: null,
      slowestSubnet: null,
      totalElapsedTime: 0,
      efficiency: 1.0,
    };
  }
  
  /**
   * Records performance data for a subnet scan
   */
  recordSubnetPerformance(
    subnetId: string,
    responseTime: number,
    wasSuccess: boolean,
    wasTimeout: boolean
  ): void {
    const now = performance.now();
    const existing = this.subnetMetrics.get(subnetId);
    
    if (existing) {
      // Update existing metrics
      const newResponseTimes = [...existing.responseTimes, responseTime]
        .slice(-this.MAX_RESPONSE_TIME_HISTORY);
      
      const newTimeoutCount = existing.timeoutCount + (wasTimeout ? 1 : 0);
      const newTotalRequests = existing.totalRequests + 1;
      const newSuccessRate = (existing.totalRequests * existing.successRate + (wasSuccess ? 1 : 0)) / newTotalRequests;
      
      const newAverageResponseTime = newResponseTimes.reduce((sum, rt) => sum + rt, 0) / newResponseTimes.length;
      const recommendedTimeout = this.calculateRecommendedTimeout(newAverageResponseTime, newSuccessRate);
      
      const updated: SubnetPerformanceMetrics = {
        subnetId,
        responseTimes: newResponseTimes,
        averageResponseTime: newAverageResponseTime,
        successRate: newSuccessRate,
        timeoutCount: newTimeoutCount,
        totalRequests: newTotalRequests,
        lastUpdated: now,
        recommendedTimeout,
      };
      
      this.subnetMetrics.set(subnetId, updated);
    } else {
      // Create new metrics
      const recommendedTimeout = this.calculateRecommendedTimeout(responseTime, wasSuccess ? 1 : 0);
      
      const newMetrics: SubnetPerformanceMetrics = {
        subnetId,
        responseTimes: [responseTime],
        averageResponseTime: responseTime,
        successRate: wasSuccess ? 1 : 0,
        timeoutCount: wasTimeout ? 1 : 0,
        totalRequests: 1,
        lastUpdated: now,
        recommendedTimeout,
      };
      
      this.subnetMetrics.set(subnetId, newMetrics);
    }
    
    // Update global metrics
    this.updateGlobalMetrics();
    
    // Check for performance alerts
    this.checkForAlerts(subnetId);
  }
  
  /**
   * Updates global performance metrics
   */
  private updateGlobalMetrics(): void {
    const allMetrics = Array.from(this.subnetMetrics.values());
    
    if (allMetrics.length === 0) return;
    
    const totalRequests = allMetrics.reduce((sum, m) => sum + m.totalRequests, 0);
    const totalSuccesses = allMetrics.reduce((sum, m) => sum + (m.totalRequests * m.successRate), 0);
    const allResponseTimes = allMetrics.flatMap(m => m.responseTimes);
    
    const globalAverageResponseTime = allResponseTimes.length > 0
      ? allResponseTimes.reduce((sum, rt) => sum + rt, 0) / allResponseTimes.length
      : 0;
    
    const totalElapsedTime = (performance.now() - this.startTime) / 1000; // seconds
    const scansPerSecond = totalRequests / Math.max(totalElapsedTime, 0.001);
    
    // Find fastest and slowest subnets
    let fastestSubnet: string | null = null;
    let slowestSubnet: string | null = null;
    let fastestTime = Infinity;
    let slowestTime = 0;
    
    for (const metrics of allMetrics) {
      if (metrics.averageResponseTime < fastestTime) {
        fastestTime = metrics.averageResponseTime;
        fastestSubnet = metrics.subnetId;
      }
      if (metrics.averageResponseTime > slowestTime) {
        slowestTime = metrics.averageResponseTime;
        slowestSubnet = metrics.subnetId;
      }
    }
    
    // Calculate efficiency (successful scans per second)
    const efficiency = Math.min(1.0, totalSuccesses / Math.max(totalRequests, 1));
    
    // Calculate optimal concurrency based on response times
    const optimalConcurrency = this.calculateOptimalConcurrency(globalAverageResponseTime, efficiency);
    
    // Calculate recommended timeout
    const recommendedTimeout = this.calculateRecommendedTimeout(globalAverageResponseTime, efficiency);
    
    this.globalMetrics = {
      totalScanned: totalRequests,
      totalFound: Math.round(totalSuccesses),
      globalAverageResponseTime,
      scansPerSecond,
      optimalConcurrency,
      recommendedTimeout,
      fastestSubnet,
      slowestSubnet,
      totalElapsedTime,
      efficiency,
    };
  }
  
  /**
   * Calculates optimal concurrency based on performance
   */
  private calculateOptimalConcurrency(averageResponseTime: number, efficiency: number): number {
    // Base concurrency on response time and efficiency
    let optimalConcurrency = 50; // Default
    
    if (averageResponseTime < 100) {
      // Fast responses - can handle more concurrency
      optimalConcurrency = Math.min(100, Math.round(100 * efficiency));
    } else if (averageResponseTime < 200) {
      // Medium responses
      optimalConcurrency = Math.min(75, Math.round(75 * efficiency));
    } else {
      // Slow responses - reduce concurrency
      optimalConcurrency = Math.min(25, Math.round(50 * efficiency));
    }
    
    return Math.max(10, optimalConcurrency); // Minimum 10
  }
  
  /**
   * Calculates recommended timeout based on performance
   */
  private calculateRecommendedTimeout(averageResponseTime: number, successRate: number): number {
    // Base timeout on average response time + buffer
    let recommendedTimeout = Math.round(averageResponseTime * 2.5); // 2.5x average for buffer
    
    // Adjust based on success rate
    if (successRate < 0.5) {
      // Low success rate - might need more time
      recommendedTimeout = Math.round(recommendedTimeout * 1.5);
    } else if (successRate > 0.8) {
      // High success rate - can be more aggressive
      recommendedTimeout = Math.round(recommendedTimeout * 0.8);
    }
    
    // Clamp to reasonable bounds
    return Math.max(100, Math.min(500, recommendedTimeout));
  }
  
  /**
   * Checks for performance issues and generates alerts
   */
  private checkForAlerts(subnetId: string): void {
    const metrics = this.subnetMetrics.get(subnetId);
    if (!metrics) return;
    
    const now = Date.now();
    
    // Check for slow subnet
    if (metrics.averageResponseTime > this.SLOW_SUBNET_THRESHOLD && metrics.totalRequests >= 5) {
      this.addAlert({
        type: 'slow_subnet',
        message: `Subnet ${subnetId} is responding slowly (avg: ${metrics.averageResponseTime.toFixed(0)}ms)`,
        severity: 'warning',
        subnetId,
        suggestedAction: 'Consider increasing timeout or reducing concurrency for this subnet',
        timestamp: now,
      });
    }
    
    // Check for high timeout rate
    if (metrics.totalRequests >= 10 && (metrics.timeoutCount / metrics.totalRequests) > this.HIGH_TIMEOUT_RATE_THRESHOLD) {
      this.addAlert({
        type: 'high_timeout_rate',
        message: `Subnet ${subnetId} has high timeout rate (${((metrics.timeoutCount / metrics.totalRequests) * 100).toFixed(1)}%)`,
        severity: 'critical',
        subnetId,
        suggestedAction: 'Skip this subnet or increase timeout significantly',
        timestamp: now,
      });
    }
    
    // Check for low efficiency
    if (this.globalMetrics.efficiency < this.LOW_EFFICIENCY_THRESHOLD && this.globalMetrics.totalScanned >= 50) {
      this.addAlert({
        type: 'low_efficiency',
        message: `Overall scan efficiency is low (${(this.globalMetrics.efficiency * 100).toFixed(1)}%)`,
        severity: 'warning',
        suggestedAction: 'Consider reducing concurrency or increasing timeouts',
        timestamp: now,
      });
    }
  }
  
  /**
   * Adds an alert and calls the callback
   */
  private addAlert(alert: PerformanceAlert): void {
    // Prevent duplicate alerts
    const isDuplicate = this.alerts.some(existing => 
      existing.type === alert.type && 
      existing.subnetId === alert.subnetId &&
      (alert.timestamp - existing.timestamp) < 5000 // Within 5 seconds
    );
    
    if (!isDuplicate) {
      this.alerts.push(alert);
      this.onAlertCallback?.(alert);
    }
  }
  
  /**
   * Gets current performance metrics for a subnet
   */
  getSubnetMetrics(subnetId: string): SubnetPerformanceMetrics | null {
    return this.subnetMetrics.get(subnetId) || null;
  }
  
  /**
   * Gets all subnet metrics
   */
  getAllSubnetMetrics(): readonly SubnetPerformanceMetrics[] {
    return Array.from(this.subnetMetrics.values());
  }
  
  /**
   * Gets current global metrics
   */
  getGlobalMetrics(): GlobalPerformanceMetrics {
    this.updateGlobalMetrics(); // Ensure up-to-date
    return this.globalMetrics;
  }
  
  /**
   * Gets all alerts
   */
  getAlerts(): readonly PerformanceAlert[] {
    return this.alerts;
  }
  
  /**
   * Determines if a subnet should be skipped based on performance
   */
  shouldSkipSubnet(subnetId: string): boolean {
    const metrics = this.subnetMetrics.get(subnetId);
    if (!metrics || metrics.totalRequests < 10) return false;
    
    // Skip if timeout rate is very high
    const timeoutRate = metrics.timeoutCount / metrics.totalRequests;
    if (timeoutRate > 0.8) return true;
    
    // Skip if average response time is extremely high and success rate is low
    if (metrics.averageResponseTime > 1000 && metrics.successRate < 0.1) return true;
    
    return false;
  }
  
  /**
   * Gets optimization suggestions based on current performance
   */
  getOptimizationSuggestions(): readonly string[] {
    const suggestions: string[] = [];
    const global = this.getGlobalMetrics();
    
    if (global.efficiency < 0.5) {
      suggestions.push('Reduce concurrency to improve stability');
    }
    
    if (global.globalAverageResponseTime > 300) {
      suggestions.push('Increase timeouts to reduce failures');
    }
    
    if (global.scansPerSecond < 50) {
      suggestions.push('Increase concurrency to improve speed');
    }
    
    const slowSubnets = this.getAllSubnetMetrics()
      .filter(m => m.averageResponseTime > this.SLOW_SUBNET_THRESHOLD)
      .map(m => m.subnetId);
    
    if (slowSubnets.length > 0) {
      suggestions.push(`Consider skipping slow subnets: ${slowSubnets.join(', ')}`);
    }
    
    return suggestions;
  }
  
  /**
   * Resets all performance data
   */
  reset(): void {
    this.subnetMetrics.clear();
    this.alerts = [];
    this.startTime = 0;
    this.globalMetrics = {
      totalScanned: 0,
      totalFound: 0,
      globalAverageResponseTime: 0,
      scansPerSecond: 0,
      optimalConcurrency: 50,
      recommendedTimeout: 150,
      fastestSubnet: null,
      slowestSubnet: null,
      totalElapsedTime: 0,
      efficiency: 1.0,
    };
  }
}

// Global performance monitor instance
const performanceMonitor = new PerformanceMonitor();

// Export the performance monitor functions
export const startPerformanceMonitoring = (onAlert?: (alert: PerformanceAlert) => void): void => {
  performanceMonitor.startMonitoring(onAlert);
};

export const recordPerformance = (
  subnetId: string,
  responseTime: number,
  wasSuccess: boolean,
  wasTimeout: boolean
): void => {
  performanceMonitor.recordSubnetPerformance(subnetId, responseTime, wasSuccess, wasTimeout);
};

export const getSubnetPerformance = (subnetId: string): SubnetPerformanceMetrics | null => {
  return performanceMonitor.getSubnetMetrics(subnetId);
};

export const getAllSubnetPerformance = (): readonly SubnetPerformanceMetrics[] => {
  return performanceMonitor.getAllSubnetMetrics();
};

export const getGlobalPerformance = (): GlobalPerformanceMetrics => {
  return performanceMonitor.getGlobalMetrics();
};

export const getPerformanceAlerts = (): readonly PerformanceAlert[] => {
  return performanceMonitor.getAlerts();
};

export const shouldSkipSubnet = (subnetId: string): boolean => {
  return performanceMonitor.shouldSkipSubnet(subnetId);
};

export const getOptimizationSuggestions = (): readonly string[] => {
  return performanceMonitor.getOptimizationSuggestions();
};

export const resetPerformanceMonitoring = (): void => {
  performanceMonitor.reset();
};

/**
 * Helper function to format performance metrics for display
 */
export const formatPerformanceReport = (): string => {
  const global = getGlobalPerformance();
  const alerts = getPerformanceAlerts();
  
  let report = '📊 Performance Report\n';
  report += `==================\n`;
  report += `Total Scanned: ${global.totalScanned}\n`;
  report += `Total Found: ${global.totalFound}\n`;
  report += `Scan Speed: ${global.scansPerSecond.toFixed(1)} IPs/sec\n`;
  report += `Efficiency: ${(global.efficiency * 100).toFixed(1)}%\n`;
  report += `Avg Response: ${global.globalAverageResponseTime.toFixed(0)}ms\n`;
  report += `Optimal Concurrency: ${global.optimalConcurrency}\n`;
  report += `Recommended Timeout: ${global.recommendedTimeout}ms\n`;
  
  if (global.fastestSubnet) {
    report += `Fastest Subnet: ${global.fastestSubnet}\n`;
  }
  
  if (global.slowestSubnet) {
    report += `Slowest Subnet: ${global.slowestSubnet}\n`;
  }
  
  if (alerts.length > 0) {
    report += `\n⚠️  Alerts (${alerts.length}):\n`;
    alerts.slice(-3).forEach(alert => {
      report += `- ${alert.message}\n`;
    });
  }
  
  const suggestions = getOptimizationSuggestions();
  if (suggestions.length > 0) {
    report += `\n💡 Optimization Suggestions:\n`;
    suggestions.forEach(suggestion => {
      report += `- ${suggestion}\n`;
    });
  }
  
  return report;
};