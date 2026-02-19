import {
  Chart,
  type ChartConfiguration,
  registerables,
  type ChartOptions,
} from 'chart.js';

// Register all components
Chart.register(...registerables);

/**
 * Chart service for creating and managing data visualizations
 */
export class ChartService {
  private charts: Map<string, Chart> = new Map();
  private readonly defaultOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
      },
    },
  };

  /**
   * Creates a line chart for network metrics
   */
  public createNetworkMetricsChart(
    canvasId: string,
    data: number[],
    label: string = 'Network Metrics'
  ): Chart | null {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) return null;

    // Destroy existing chart if it exists
    this.destroyChart(canvasId);

    const ctx = canvas.getContext('2d');
    const gradient = this.createGradient(ctx, '#10b981', '#059669');

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: data.map((_, i) => `${i}s`),
        datasets: [{
          label,
          data,
          borderColor: '#10b981',
          backgroundColor: gradient,
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 4,
          pointHoverBackgroundColor: '#10b981',
          pointHoverBorderColor: '#fff',
          pointHoverBorderWidth: 2,
        }],
      },
      options: {
        ...this.defaultOptions,
        scales: {
          x: {
            display: false,
          },
          y: {
            display: false,
          },
        },
        plugins: {
          ...this.defaultOptions.plugins,
          tooltip: {
            ...this.defaultOptions.plugins?.tooltip,
            displayColors: false,
            callbacks: {
              label: ((context: any) => `${label}: ${context.parsed.y}`) as any,
            },
          },
        },
      },
    };

    const chart = new Chart(canvas, config);
    this.charts.set(canvasId, chart);
    return chart;
  }

  /**
   * Creates a doughnut chart for router status distribution
   */
  public createRouterStatusChart(
    canvasId: string,
    online: number,
    offline: number,
    warning: number
  ): Chart | null {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) return null;

    this.destroyChart(canvasId);

    const config: ChartConfiguration = {
      type: 'doughnut',
      data: {
        labels: ['Online', 'Offline', 'Warning'],
        datasets: [{
          data: [online, offline, warning],
          backgroundColor: [
            '#10b981',
            '#ef4444',
            '#f59e0b',
          ],
          borderWidth: 0,
          hoverOffset: 4,
        }],
      },
      options: {
        ...this.defaultOptions,
        // cutout: '70%',  // Property doesn't exist in current type definition
        plugins: {
          ...this.defaultOptions.plugins,
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              padding: 15,
              usePointStyle: true,
              pointStyle: 'circle',
              font: {
                size: 11,
              },
            },
          },
          tooltip: {
            ...this.defaultOptions.plugins?.tooltip,
            callbacks: {
              label: ((context: any) => {
                const label = context.label || '';
                const value = context.parsed || 0;
                const total = context.dataset.data.reduce((a: number, b: unknown) => a + (b as number), 0);
                const percentage = ((value as number / total) * 100).toFixed(1);
                return `${label}: ${value} (${percentage}%)`;
              }) as any,
            },
          },
        },
      },
    };

    const chart = new Chart(canvas, config);
    this.charts.set(canvasId, chart);
    return chart;
  }

  /**
   * Creates a bar chart for scan performance
   */
  public createScanPerformanceChart(
    canvasId: string,
    ipsPerSecond: number[]
  ): Chart | null {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) return null;

    this.destroyChart(canvasId);

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: ipsPerSecond.map((_, i) => `Scan ${i + 1}`),
        datasets: [{
          label: 'IPs/sec',
          data: ipsPerSecond,
          backgroundColor: 'rgba(239, 199, 41, 0.8)',
          borderColor: '#EFC729',
          borderWidth: 2,
          borderRadius: 8,
        }],
      },
      options: {
        ...this.defaultOptions,
        scales: {
          x: {
            display: true,
            grid: {
              display: false,
            },
            ticks: {
              font: {
                size: 10,
              },
            },
          },
          y: {
            display: true,
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)',
            },
            ticks: {
              font: {
                size: 10,
              },
            },
          },
        },
        plugins: {
          ...this.defaultOptions.plugins,
          tooltip: {
            ...this.defaultOptions.plugins?.tooltip,
            callbacks: {
              label: ((context: any) => `Speed: ${context.parsed.y} IPs/sec`) as any,
            },
          },
        },
      },
    };

    const chart = new Chart(canvas, config);
    this.charts.set(canvasId, chart);
    return chart;
  }

  /**
   * Creates a real-time line chart for response times
   */
  public createResponseTimeChart(
    canvasId: string,
    responseTimes: number[]
  ): Chart | null {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) return null;

    this.destroyChart(canvasId);

    const ctx = canvas.getContext('2d');
    const gradient = this.createGradient(ctx, '#8b5cf6', '#7c3aed');

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: responseTimes.map((_, i) => `${i}s`),
        datasets: [{
          label: 'Response Time',
          data: responseTimes,
          borderColor: '#8b5cf6',
          backgroundColor: gradient,
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 4,
          pointHoverBackgroundColor: '#8b5cf6',
          pointHoverBorderColor: '#fff',
          pointHoverBorderWidth: 2,
        }],
      },
      options: {
        ...this.defaultOptions,
        animation: {
          duration: 0, // Disable animation for real-time updates
        },
        scales: {
          x: {
            display: false,
          },
          y: {
            display: false,
            beginAtZero: true,
          },
        },
        plugins: {
          ...this.defaultOptions.plugins,
          tooltip: {
            ...this.defaultOptions.plugins?.tooltip,
            displayColors: false,
            callbacks: {
              label: ((context: any) => `${context.parsed.y}ms`) as any,
            },
          },
        },
      },
    };

    const chart = new Chart(canvas, config);
    this.charts.set(canvasId, chart);
    return chart;
  }

  /**
   * Creates a sparkline chart (small inline chart)
   */
  public createSparkline(
    canvasId: string,
    data: number[],
    color: string = '#3b82f6'
  ): Chart | null {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) return null;

    this.destroyChart(canvasId);

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: data.map(() => ''),
        datasets: [{
          data,
          borderColor: color,
          borderWidth: 1.5,
          fill: false,
          tension: 0.4,
          pointRadius: 0,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            enabled: false,
          },
        },
        scales: {
          x: {
            display: false,
          },
          y: {
            display: false,
          },
        },
      },
    };

    const chart = new Chart(canvas, config);
    this.charts.set(canvasId, chart);
    return chart;
  }

  /**
   * Updates existing chart data
   */
  public updateChartData(
    chartId: string,
    data: number[],
    labels?: string[]
  ): void {
    const chart = this.charts.get(chartId);
    if (!chart) return;

    chart.data.datasets[0].data = data;
    if (labels) {
      chart.data.labels = labels;
    }
    chart.update('none'); // Update without animation
  }

  /**
   * Adds a data point to existing chart
   */
  public addDataPoint(
    chartId: string,
    value: number,
    label?: string,
    maxPoints: number = 30
  ): void {
    const chart = this.charts.get(chartId);
    if (!chart) return;

    const data = chart.data.datasets[0].data as number[];
    const labels = chart.data.labels as string[];

    data.push(value);
    if (label) {
      labels.push(label);
    }

    // Keep only last maxPoints
    if (data.length > maxPoints) {
      data.shift();
      labels.shift();
    }

    chart.update('none');
  }

  /**
   * Creates a gradient for chart backgrounds
   */
  private createGradient(
    ctx: CanvasRenderingContext2D | null,
    colorStart: string,
    colorEnd: string
  ): CanvasGradient | string {
    if (!ctx) return colorStart;
    const gradient = ctx.createLinearGradient(0, 0, 0, 200);
    gradient.addColorStop(0, colorStart + '33'); // 20% opacity
    gradient.addColorStop(1, colorEnd + '05'); // 2% opacity
    return gradient;
  }

  /**
   * Destroys a chart
   */
  public destroyChart(chartId: string): void {
    const chart = this.charts.get(chartId);
    if (chart) {
      chart.destroy();
      this.charts.delete(chartId);
    }
  }

  /**
   * Destroys all charts
   */
  public destroyAll(): void {
    this.charts.forEach(chart => chart.destroy());
    this.charts.clear();
  }

  /**
   * Resizes all charts
   */
  public resizeAll(): void {
    this.charts.forEach(chart => chart.resize());
  }
}

// Export singleton instance
export const chartService = new ChartService();