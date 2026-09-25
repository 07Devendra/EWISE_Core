// Application State Management
class AppState {
    constructor() {
        this.currentScreen = 'detection';
        this.systemState = 'waiting'; // waiting, disassembly_required, requires_manual_input, complete
        this.currentDetection = null;
        this.pendingDetections = new Map();
        this.inventoryBins = [];
        this.detectionHistory = [];
        this.manualInputRequired = {
            classification: false,
            weight: false
        };
    }

    setSystemState(newState) {
        this.systemState = newState;
        this.updateUI();
    }

    setCurrentDetection(detection) {
        this.currentDetection = detection;
    }

    addPendingDetection(id, data) {
        this.pendingDetections.set(id, {
            ...data,
            timestamp: Date.now()
        });
        
        // Auto-expire after 10 minutes
        setTimeout(() => {
            this.pendingDetections.delete(id);
        }, 10 * 60 * 1000);
    }

    getPendingDetection(id) {
        return this.pendingDetections.get(id);
    }

    addDetectionRecord(record) {
        this.detectionHistory.push(record);
    }

    updateInventoryBin(binId, weight) {
        const bin = this.inventoryBins.find(b => b.bin_id === binId);
        if (bin) {
            bin.current_weight += weight;
            return bin;
        }
        return null;
    }
}

// UI Controller
class UIController {
    constructor(appState) {
        this.appState = appState;
        this.elements = {
            screens: document.querySelectorAll('.screen'),
            navButtons: document.querySelectorAll('.nav-btn'),
            systemState: document.getElementById('system-state'),
            detectionDetails: document.getElementById('detection-details'),
            actionButtons: document.getElementById('action-buttons'),
            manualModal: document.getElementById('manual-modal'),
            manualForm: document.getElementById('manual-form'),
            modalClose: document.getElementById('modal-close'),
            inventoryGrid: document.getElementById('inventory-grid'),
            inventoryAlerts: document.getElementById('inventory-alerts'),
            toastContainer: document.getElementById('toast-container')
        };

        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Navigation
        this.elements.navButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const screen = e.target.dataset.screen;
                this.switchScreen(screen);
            });
        });

        // Detection buttons
        document.getElementById('btn-detect').addEventListener('click', () => {
            this.simulateDetection();
        });

        document.getElementById('btn-manual').addEventListener('click', () => {
            this.openManualModal();
        });

        // Modal
        this.elements.modalClose.addEventListener('click', () => {
            this.closeManualModal();
        });

        this.elements.manualModal.addEventListener('click', (e) => {
            if (e.target === this.elements.manualModal) {
                this.closeManualModal();
            }
        });

        // Manual form submission
        this.elements.manualForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleManualSubmit();
        });
    }

    switchScreen(screenName) {
        this.appState.currentScreen = screenName;
        
        // Update navigation
        this.elements.navButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.screen === screenName);
        });

        // Update screens
        this.elements.screens.forEach(screen => {
            screen.classList.toggle('active', screen.id === `${screenName}-screen`);
        });

        // Refresh data if needed
        if (screenName === 'inventory') {
            this.renderInventory();
        } else if (screenName === 'dashboard') {
            dashboardController.updateDashboard();
        }
    }

    updateUI() {
        const state = this.appState.systemState;
        const stateElement = this.elements.systemState;

        // Update system state display
        const stateConfig = {
            waiting: {
                icon: '⏳',
                text: 'Waiting for item...',
                className: 'waiting'
            },
            disassembly_required: {
                icon: '🔧',
                text: 'Disassembly Required',
                className: 'disassembly'
            },
            requires_manual_input: {
                icon: '✏️',
                text: 'Manual Input Required',
                className: 'manual'
            },
            complete: {
                icon: '✅',
                text: 'Processing Complete',
                className: 'complete'
            }
        };

        const config = stateConfig[state] || stateConfig.waiting;
        stateElement.innerHTML = `
            <div class="state-indicator ${config.className}">
                <span class="state-icon">${config.icon}</span>
                <span class="state-text">${config.text}</span>
            </div>
        `;

        // Update detection details
        this.renderDetectionDetails();

        // Update action buttons based on state
        this.updateActionButtons(state);
    }

    renderDetectionDetails() {
        const detection = this.appState.currentDetection;
        const detailsElement = this.elements.detectionDetails;

        if (!detection) {
            detailsElement.innerHTML = `
                <div class="text-center" style="color: var(--text-secondary); padding: 2rem;">
                    <p>No detection data available</p>
                </div>
            `;
            return;
        }

        let detailsHTML = `
            <div class="detail-item">
                <span class="detail-label">Detected Object</span>
                <span class="detail-value">${detection.object_name}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Category</span>
                <span class="detail-value">${detection.category}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Confidence</span>
                <span class="detail-value">${(detection.confidence * 100).toFixed(1)}%</span>
            </div>
        `;

        if (detection.weight !== undefined) {
            detailsHTML += `
                <div class="detail-item">
                    <span class="detail-label">Weight</span>
                    <span class="detail-value">${detection.weight.toFixed(2)} kg</span>
                </div>
            `;
        }

        if (detection.materials && detection.materials.length > 0) {
            detailsHTML += `
                <div class="detail-item">
                    <span class="detail-label">Materials</span>
                    <span class="detail-value">${detection.materials.join(', ')}</span>
                </div>
            `;
        }

        if (detection.carbon_estimate !== undefined) {
            detailsHTML += `
                <div class="detail-item">
                    <span class="detail-label">Carbon Offset</span>
                    <span class="detail-value">${detection.carbon_estimate.toFixed(2)} kg CO₂e</span>
                </div>
            `;
        }

        if (detection.routing_instruction) {
            detailsHTML += `
                <div class="detail-item">
                    <span class="detail-label">Routing</span>
                    <span class="detail-value">${detection.routing_instruction}</span>
                </div>
            `;
        }

        detailsElement.innerHTML = detailsHTML;
    }

    updateActionButtons(state) {
        const buttonsElement = this.elements.actionButtons;

        const buttonConfigs = {
            waiting: `
                <button class="btn btn-primary" id="btn-detect">Simulate Detection</button>
                <button class="btn btn-secondary" id="btn-manual">Manual Input</button>
            `,
            disassembly_required: `
                <button class="btn btn-primary" onclick="app.acknowledgeDisassembly()">Acknowledge & Continue</button>
            `,
            requires_manual_input: `
                <button class="btn btn-primary" onclick="app.openManualModal()">Provide Input</button>
            `,
            complete: `
                <button class="btn btn-primary" onclick="app.resetToWaiting()">Process Next Item</button>
            `
        };

        buttonsElement.innerHTML = buttonConfigs[state] || buttonConfigs.waiting;

        // Re-attach event listeners for dynamically created buttons
        if (state === 'waiting') {
            document.getElementById('btn-detect').addEventListener('click', () => this.simulateDetection());
            document.getElementById('btn-manual').addEventListener('click', () => this.openManualModal());
        }
    }

    simulateDetection() {
        // Simulate a random detection
        const mockDetections = mockData.getMockDetection();
        this.processDetection(mockDetections);
    }

    processDetection(detection) {
        this.appState.setCurrentDetection(detection);

        // Check if it's a whole device
        if (detection.category === 'whole_device') {
            this.appState.setSystemState('disassembly_required');
            this.showToast('Intact device detected. Please disassemble.', 'warning');
        } else {
            // Check confidence thresholds
            const objectConfidence = detection.confidence;
            const weightConfidence = detection.weight_confidence || 0.8;

            if (objectConfidence < 0.7 || weightConfidence < 0.7) {
                this.appState.manualInputRequired = {
                    classification: objectConfidence < 0.7,
                    weight: weightConfidence < 0.7
                };
                this.appState.setSystemState('requires_manual_input');
                this.showToast('Low confidence. Manual input required.', 'error');
            } else {
                // Process the detection
                this.completeDetection(detection);
            }
        }
    }

    completeDetection(detection) {
        // Calculate carbon estimate
        const carbonEstimate = this.calculateCarbonOffset(detection);
        detection.carbon_estimate = carbonEstimate;

        // Get routing instruction
        detection.routing_instruction = this.getRoutingInstruction(detection);

        // Update inventory
        const bin = this.assignToBin(detection);
        if (bin) {
            this.appState.updateInventoryBin(bin.bin_id, detection.weight);
        }

        // Add to history
        this.appState.addDetectionRecord({
            ...detection,
            timestamp: new Date().toISOString(),
            assigned_bin_id: bin ? bin.bin_id : null
        });

        this.appState.setSystemState('complete');
        this.showToast('Detection processed successfully!', 'success');

        // Auto-reset after 5 seconds
        setTimeout(() => {
            this.resetToWaiting();
        }, 5000);
    }

    calculateCarbonOffset(detection) {
        // Simplified carbon calculation
        const emissionFactors = {
            'PCB': 2.5,
            'RAM': 1.8,
            'Battery': 3.2,
            'HardDrive': 2.1,
            'CoolingFan': 0.8,
            'Cables': 1.2
        };

        const factor = emissionFactors[detection.object_name] || 1.5;
        return detection.weight * factor;
    }

    getRoutingInstruction(detection) {
        const routingMap = {
            'PCB': 'Store in High-Value PCB Bin. Ultimate Destination: Specialized Precious Metal Smelter.',
            'RAM': 'Store in High-Value PCB Bin. Ultimate Destination: Specialized Precious Metal Smelter.',
            'Battery': 'Store in Fire-Safe Battery Bin. Ultimate Destination: Battery Processing Facility.',
            'HardDrive': 'Store in Mixed Electronics Bin. Ultimate Destination: General E-Waste Recycler.',
            'CoolingFan': 'Store in Metal Components Bin. Ultimate Destination: Metal Scrap Recycler.',
            'Cables': 'Store in Wire Bin. Ultimate Destination: General Copper Shredder.'
        };

        return routingMap[detection.object_name] || 'Store in General E-Waste Bin.';
    }

    assignToBin(detection) {
        const binMapping = {
            'PCB': 1,
            'RAM': 1,
            'Battery': 2,
            'HardDrive': 3,
            'CoolingFan': 4,
            'Cables': 5
        };

        const binId = binMapping[detection.object_name];
        return this.appState.inventoryBins.find(b => b.bin_id === binId);
    }

    acknowledgeDisassembly() {
        this.showToast('Device routed to Disassembly Holding Area.', 'info');
        setTimeout(() => {
            this.resetToWaiting();
        }, 3000);
    }

    resetToWaiting() {
        this.appState.setCurrentDetection(null);
        this.appState.setSystemState('waiting');
    }

    openManualModal() {
        const required = this.appState.manualInputRequired;
        
        // Show/hide form fields based on what's required
        document.getElementById('classification-group').style.display = 
            required.classification ? 'block' : 'none';
        document.getElementById('weight-group').style.display = 
            required.weight ? 'block' : 'none';

        // Set required attributes
        document.getElementById('classification').required = required.classification;
        document.getElementById('weight').required = required.weight;

        this.elements.manualModal.classList.add('active');
    }

    closeManualModal() {
        this.elements.manualModal.classList.remove('active');
        this.elements.manualForm.reset();
    }

    handleManualSubmit() {
        const classification = document.getElementById('classification').value;
        const weight = parseFloat(document.getElementById('weight').value);

        // Update current detection with manual input
        if (this.appState.currentDetection) {
            if (classification) {
                this.appState.currentDetection.object_name = classification;
                this.appState.currentDetection.confidence = 1.0; // Manual input = 100% confidence
            }
            if (weight) {
                this.appState.currentDetection.weight = weight;
                this.appState.currentDetection.weight_confidence = 1.0;
            }

            // Re-process with updated data
            this.completeDetection(this.appState.currentDetection);
        }

        this.closeManualModal();
    }

    renderInventory() {
        const bins = this.appState.inventoryBins;
        const gridElement = this.elements.inventoryGrid;

        gridElement.innerHTML = bins.map(bin => `
            <div class="inventory-bin">
                <div class="bin-header">
                    <span class="bin-name">${bin.bin_name}</span>
                    <span class="bin-icon">${this.getBinIcon(bin.category)}</span>
                </div>
                <div class="bin-progress">
                    <div class="bin-info">
                        <span>${bin.current_weight.toFixed(1)} kg</span>
                        <span>${bin.threshold_limit} kg</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${(bin.current_weight / bin.threshold_limit) * 100}%"></div>
                    </div>
                </div>
                <div class="bin-vendor">
                    ${bin.assigned_partner_id ? `Vendor: ${this.getPartnerName(bin.assigned_partner_id)}` : 'No vendor assigned'}
                </div>
            </div>
        `).join('');

        this.renderInventoryAlerts();
    }

    getBinIcon(category) {
        const icons = {
            'PCB': '🔲',
            'Battery': '🔋',
            'Metal': '⚙️',
            'Wire': '🔌',
            'Mixed': '📦',
            'Holding': '🔧'
        };
        return icons[category] || '📦';
    }

    getPartnerName(partnerId) {
        const partner = mockData.recyclingPartners.find(p => p.partner_id === partnerId);
        return partner ? partner.partner_name : 'Unknown';
    }

    renderInventoryAlerts() {
        const alerts = [];
        const bins = this.appState.inventoryBins;

        bins.forEach(bin => {
            if (bin.current_weight >= bin.threshold_limit) {
                alerts.push({
                    title: `${bin.bin_name} Ready for Pickup`,
                    message: `Current weight: ${bin.current_weight.toFixed(1)} kg exceeds threshold of ${bin.threshold_limit} kg. Schedule vendor pickup.`
                });
            } else if (bin.current_weight >= bin.threshold_limit * 0.8) {
                alerts.push({
                    title: `${bin.bin_name} Near Capacity`,
                    message: `Current weight: ${bin.current_weight.toFixed(1)} kg is 80% of threshold. Prepare for pickup.`
                });
            }
        });

        const alertsElement = this.elements.inventoryAlerts;

        if (alerts.length === 0) {
            alertsElement.innerHTML = `
                <div class="text-center" style="color: var(--text-secondary); padding: 2rem;">
                    <p>No logistics alerts at this time.</p>
                </div>
            `;
        } else {
            alertsElement.innerHTML = `
                <h3 style="margin-bottom: 1rem;">Logistics Alerts</h3>
                ${alerts.map(alert => `
                    <div class="alert-item">
                        <span class="alert-icon">⚠️</span>
                        <div class="alert-content">
                            <div class="alert-title">${alert.title}</div>
                            <div class="alert-message">${alert.message}</div>
                        </div>
                    </div>
                `).join('')}
            `;
        }
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <span>${this.getToastIcon(type)}</span>
            <span>${message}</span>
        `;

        this.elements.toastContainer.appendChild(toast);

        // Remove after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    getToastIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || 'ℹ️';
    }
}

// Initialize Application
const appState = new AppState();
const uiController = new UIController(appState);

// Global app object for event handlers
const app = {
    acknowledgeDisassembly: () => uiController.acknowledgeDisassembly(),
    resetToWaiting: () => uiController.resetToWaiting(),
    openManualModal: () => uiController.openManualModal()
};

// Load initial data
document.addEventListener('DOMContentLoaded', () => {
    // Load inventory bins from mock data
    appState.inventoryBins = mockData.inventoryBins;
    
    // Initialize dashboard
    dashboardController.initialize();
    
    console.log('E-WISE Frontend initialized');
});