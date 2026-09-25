// Dashboard Controller for data visualization
class DashboardController {
    constructor() {
        this.materialChart = null;
        this.trendChart = null;
        this.chartsLoaded = false;
    }

    initialize() {
        // Load Chart.js from CDN
        this.loadChartJS();
    }

    loadChartJS() {
        if (typeof Chart !== 'undefined') {
            this.chartsLoaded = true;
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
        script.onload = () => {
            this.chartsLoaded = true;
            console.log('Chart.js loaded successfully');
        };
        script.onerror = () => {
            console.error('Failed to load Chart.js');
        };
        document.head.appendChild(script);
    }

    updateDashboard() {
        if (!this.chartsLoaded) {
            // Wait for Chart.js to load
            setTimeout(() => this.updateDashboard(), 500);
            return;
        }

        this.updateMetrics();
        this.renderMaterialChart();
        this.renderTrendChart();
    }

    updateMetrics() {
        const stats = mockData.getDashboardStats();
        
        document.getElementById('total-waste').textContent = `${stats.totalWaste} kg`;
        document.getElementById('carbon-offset').textContent = `${stats.carbonOffset} kg CO₂e`;
        document.getElementById('components-count').textContent = stats.totalComponents;
        document.getElementById('active-bins').textContent = stats.activeBins;
    }

    renderMaterialChart() {
        const ctx = document.getElementById('material-chart');
        if (!ctx) return;

        const data = mockData.historicalData.materialComposition;

        if (this.materialChart) {
            this.materialChart.destroy();
        }

        this.materialChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.map(item => item.material),
                datasets: [{
                    data: data.map(item => item.percentage),
                    backgroundColor: [
                        '#2ecc71',
                        '#3498db',
                        '#9b59b6',
                        '#e74c3c',
                        '#f39c12',
                        '#1abc9c',
                        '#95a5a6'
                    ],
                    borderWidth: 2,
                    borderColor: '#16213e'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            color: '#a0a0a0',
                            font: {
                                size: 12
                            },
                            padding: 15
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.label}: ${context.raw}%`;
                            }
                        }
                    }
                }
            }
        });
    }

    renderTrendChart() {
        const ctx = document.getElementById('trend-chart');
        if (!ctx) return;

        const data = mockData.historicalData.monthlyData;

        if (this.trendChart) {
            this.trendChart.destroy();
        }

        this.trendChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map(item => item.month),
                datasets: [
                    {
                        label: 'E-Waste (kg)',
                        data: data.map(item => item.waste),
                        borderColor: '#2ecc71',
                        backgroundColor: 'rgba(46, 204, 113, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Carbon Offset (kg CO₂e)',
                        data: data.map(item => item.carbon),
                        borderColor: '#3498db',
                        backgroundColor: 'rgba(52, 152, 219, 0.1)',
                        tension: 0.4,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: '#a0a0a0',
                            font: {
                                size: 12
                            },
                            padding: 15
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#a0a0a0'
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#a0a0a0'
                        }
                    }
                }
            }
        });
    }

    // Update charts with real-time data
    updateChartsWithNewData(detection) {
        if (!this.chartsLoaded) return;

        // Update metrics
        this.updateMetrics();

        // Refresh charts
        this.renderMaterialChart();
        this.renderTrendChart();
    }
}

// Initialize dashboard controller
const dashboardController = new DashboardController();