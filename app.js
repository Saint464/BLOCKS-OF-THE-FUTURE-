/**
 * Blocks of the Future - Platform Analysis Dashboard
 * Main application controller
 */

class DashboardApp {
    constructor() {
        this.components = {};
        this.updateInterval = null;
        this.isInitialized = false;
        this.errorCount = 0;
        this.maxRetries = 3;
        
        this.init();
    }

    async init() {
        try {
            console.log('Initializing Blocks of the Future Dashboard...');
            
            // Show loading overlay
            this.showLoading();
            
            // Initialize components
            await this.initializeComponents();
            
            // Load initial data
            await this.loadInitialData();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Start periodic updates
            this.startPeriodicUpdates();
            
            // Hide loading overlay
            this.hideLoading();
            
            // Update platform status
            this.updatePlatformStatus('online');
            
            console.log('Dashboard initialized successfully');
            this.isInitialized = true;
            
        } catch (error) {
            console.error('Failed to initialize dashboard:', error);
            this.handleError('Dashboard Initialization Failed', error.message);
            this.hideLoading();
        }
    }

    async initializeComponents() {
        try {
            // Initialize status cards component
            this.components.statusCards = new StatusCard();
            
            // Initialize metrics chart component
            this.components.metricsChart = new MetricsChart('metricsChart');
            
            // Initialize compliance tracker
            this.components.complianceTracker = new ComplianceTracker();
            
            // Initialize integration status monitor
            this.components.integrationStatus = new IntegrationStatus();
            
            // Initialize security monitor
            this.components.securityMonitor = new SecurityMonitor();
            
            // Initialize recommendation engine
            this.components.recommendationEngine = new RecommendationEngine();
            
        } catch (error) {
            throw new Error(`Component initialization failed: ${error.message}`);
        }
    }

    async loadInitialData() {
        try {
            console.log('Loading initial platform data...');
            
            // Load platform overview data
            const overviewData = await API.getPlatformOverview();
            if (overviewData) {
                this.updateOverviewCards(overviewData);
            }
            
            // Load metrics data
            const metricsData = await API.getMetricsData('24h');
            if (metricsData) {
                this.components.metricsChart.updateChart(metricsData);
            }
            
            // Load compliance data
            const complianceData = await API.getComplianceStatus();
            if (complianceData) {
                this.components.complianceTracker.updateCompliance(complianceData);
            }
            
            // Load integration status
            const integrationData = await API.getIntegrationStatus();
            if (integrationData) {
                this.components.integrationStatus.updateStatus(integrationData);
            }
            
            // Load security status
            const securityData = await API.getSecurityStatus();
            if (securityData) {
                this.components.securityMonitor.updateSecurity(securityData);
            }
            
            // Load recommendations
            const recommendationsData = await API.getRecommendations();
            if (recommendationsData) {
                this.components.recommendationEngine.updateRecommendations(recommendationsData);
            }
            
            // Update last updated timestamp
            this.updateLastUpdated();
            
        } catch (error) {
            console.error('Failed to load initial data:', error);
            this.showEmptyStates();
        }
    }

    updateOverviewCards(data) {
        try {
            // Update user count
            const userElement = document.getElementById('totalUsers');
            if (userElement) {
                userElement.textContent = this.formatNumber(data.totalUsers || 0);
            }
            
            // Update transaction volume
            const volumeElement = document.getElementById('transactionVolume');
            if (volumeElement) {
                volumeElement.textContent = this.formatCurrency(data.transactionVolume || 0);
            }
            
            // Update active nodes
            const nodesElement = document.getElementById('activeNodes');
            if (nodesElement) {
                nodesElement.textContent = this.formatNumber(data.activeNodes || 0);
            }
            
            // Update compliance score
            const complianceElement = document.getElementById('complianceScore');
            if (complianceElement) {
                complianceElement.textContent = `${data.complianceScore || 0}%`;
            }
            
        } catch (error) {
            console.error('Failed to update overview cards:', error);
        }
    }

    setupEventListeners() {
        // Chart timeframe controls
        const chartControls = document.querySelectorAll('.chart-control');
        chartControls.forEach(control => {
            control.addEventListener('click', async (e) => {
                const timeframe = e.target.dataset.timeframe;
                await this.updateChartTimeframe(timeframe);
            });
        });

        // Window resize handler for responsive charts
        window.addEventListener('resize', () => {
            if (this.components.metricsChart) {
                this.components.metricsChart.resize();
            }
        });

        // Visibility change handler to pause/resume updates
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseUpdates();
            } else {
                this.resumeUpdates();
            }
        });

        // Error handling for unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            this.handleError('System Error', 'An unexpected error occurred. Please refresh the page.');
        });
    }

    async updateChartTimeframe(timeframe) {
        try {
            // Update active control
            document.querySelectorAll('.chart-control').forEach(control => {
                control.classList.remove('active');
            });
            document.querySelector(`[data-timeframe="${timeframe}"]`).classList.add('active');
            
            // Load new data
            const metricsData = await API.getMetricsData(timeframe);
            if (metricsData) {
                this.components.metricsChart.updateChart(metricsData);
            }
            
        } catch (error) {
            console.error('Failed to update chart timeframe:', error);
            this.handleError('Chart Update Failed', 'Unable to load metrics data for the selected timeframe.');
        }
    }

    startPeriodicUpdates() {
        // Update every 30 seconds
        this.updateInterval = setInterval(async () => {
            if (!document.hidden && this.isInitialized) {
                await this.refreshData();
            }
        }, CONSTANTS.UPDATE_INTERVALS.DASHBOARD);
    }

    pauseUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    resumeUpdates() {
        if (!this.updateInterval && this.isInitialized) {
            this.startPeriodicUpdates();
        }
    }

    async refreshData() {
        try {
            // Refresh overview data
            const overviewData = await API.getPlatformOverview();
            if (overviewData) {
                this.updateOverviewCards(overviewData);
            }
            
            // Update last updated timestamp
            this.updateLastUpdated();
            
            // Reset error count on successful update
            this.errorCount = 0;
            
        } catch (error) {
            console.error('Failed to refresh data:', error);
            this.errorCount++;
            
            if (this.errorCount >= this.maxRetries) {
                this.updatePlatformStatus('error');
                this.handleError('Connection Lost', 'Unable to refresh platform data. Please check your connection.');
            } else {
                this.updatePlatformStatus('warning');
            }
        }
    }

    updatePlatformStatus(status) {
        const statusElement = document.getElementById('platformStatus');
        if (statusElement) {
            // Remove existing status classes
            statusElement.classList.remove('online', 'warning', 'error');
            
            // Add new status class
            statusElement.classList.add(status);
            
            // Update status text
            const statusText = statusElement.querySelector('span');
            if (statusText) {
                switch (status) {
                    case 'online':
                        statusText.textContent = 'Platform Online';
                        break;
                    case 'warning':
                        statusText.textContent = 'Connection Issues';
                        break;
                    case 'error':
                        statusText.textContent = 'Platform Offline';
                        break;
                    default:
                        statusText.textContent = 'Platform Status';
                }
            }
        }
    }

    updateLastUpdated() {
        const lastUpdatedElement = document.getElementById('lastUpdated');
        if (lastUpdatedElement) {
            const timeElement = lastUpdatedElement.querySelector('span');
            if (timeElement) {
                timeElement.textContent = `Updated ${this.formatRelativeTime(new Date())}`;
            }
        }
    }

    showEmptyStates() {
        // Show empty states for all components when data fails to load
        const emptyStateMessage = 'No data available';
        
        // Update overview cards with empty states
        document.getElementById('totalUsers').textContent = emptyStateMessage;
        document.getElementById('transactionVolume').textContent = emptyStateMessage;
        document.getElementById('activeNodes').textContent = emptyStateMessage;
        document.getElementById('complianceScore').textContent = emptyStateMessage;
        
        // Update component empty states
        Object.values(this.components).forEach(component => {
            if (component.showEmptyState) {
                component.showEmptyState();
            }
        });
    }

    showLoading() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'flex';
        }
    }

    hideLoading() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
    }

    handleError(title, message) {
        console.error(`${title}: ${message}`);
        
        // Show error modal
        const errorModal = document.getElementById('errorModal');
        const errorContent = document.getElementById('errorContent');
        
        if (errorModal && errorContent) {
            errorContent.innerHTML = `
                <div class="error-details">
                    <h4>${title}</h4>
                    <p>${message}</p>
                    <small>Time: ${new Date().toLocaleString()}</small>
                </div>
            `;
            
            errorModal.style.display = 'flex';
        }
    }

    // Utility methods
    formatNumber(num) {
        if (typeof num !== 'number' || isNaN(num)) return '0';
        
        if (num >= 1000000) {
            return `${(num / 1000000).toFixed(1)}M`;
        } else if (num >= 1000) {
            return `${(num / 1000).toFixed(1)}K`;
        }
        return num.toLocaleString();
    }

    formatCurrency(amount) {
        if (typeof amount !== 'number' || isNaN(amount)) return '$0';
        
        if (amount >= 1000000000) {
            return `$${(amount / 1000000000).toFixed(1)}B`;
        } else if (amount >= 1000000) {
            return `$${(amount / 1000000).toFixed(1)}M`;
        } else if (amount >= 1000) {
            return `$${(amount / 1000).toFixed(1)}K`;
        }
        return `$${amount.toLocaleString()}`;
    }

    formatRelativeTime(date) {
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) {
            return 'just now';
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        } else {
            return date.toLocaleTimeString();
        }
    }
}

// Global error modal close function
function closeErrorModal() {
    const errorModal = document.getElementById('errorModal');
    if (errorModal) {
        errorModal.style.display = 'none';
    }
}

// Initialize the dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboardApp = new DashboardApp();
});

// Feather icons initialization
document.addEventListener('DOMContentLoaded', () => {
    if (typeof feather !== 'undefined') {
        feather.replace();
    }
});
