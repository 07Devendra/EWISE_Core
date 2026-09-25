// Mock Data for E-WISE Frontend
const mockData = {
    // Inventory Bins
    inventoryBins: [
        {
            bin_id: 0,
            category: 'Holding',
            bin_name: 'Disassembly Holding Area',
            color_code: '#f39c12',
            current_weight: 5.2,
            threshold_limit: null,
            assigned_partner_id: null
        },
        {
            bin_id: 1,
            category: 'PCB',
            bin_name: 'High-Value PCB Bin',
            color_code: '#9b59b6',
            current_weight: 23.5,
            threshold_limit: 50,
            assigned_partner_id: 1
        },
        {
            bin_id: 2,
            category: 'Battery',
            bin_name: 'Fire-Safe Battery Bin',
            color_code: '#e74c3c',
            current_weight: 42.8,
            threshold_limit: 50,
            assigned_partner_id: 2
        },
        {
            bin_id: 3,
            category: 'Mixed',
            bin_name: 'Mixed Electronics Bin',
            color_code: '#3498db',
            current_weight: 18.3,
            threshold_limit: 100,
            assigned_partner_id: 3
        },
        {
            bin_id: 4,
            category: 'Metal',
            bin_name: 'Metal Components Bin',
            color_code: '#95a5a6',
            current_weight: 35.7,
            threshold_limit: 75,
            assigned_partner_id: 4
        },
        {
            bin_id: 5,
            category: 'Wire',
            bin_name: 'Wire Bin',
            color_code: '#e67e22',
            current_weight: 28.9,
            threshold_limit: 40,
            assigned_partner_id: 5
        }
    ],

    // Recycling Partners
    recyclingPartners: [
        {
            partner_id: 1,
            partner_name: 'Precious Metal Smelters Inc.',
            specialty: 'PCB and precious metal recovery',
            minimum_pickup_weight: 50,
            contact_email: 'pickup@preciousmetals.com'
        },
        {
            partner_id: 2,
            partner_name: 'BatterySafe Solutions',
            specialty: 'Lithium-ion battery processing',
            minimum_pickup_weight: 50,
            contact_email: 'logistics@batterysafe.com'
        },
        {
            partner_id: 3,
            partner_name: 'General E-Waste Recyclers',
            specialty: 'Mixed electronics recycling',
            minimum_pickup_weight: 100,
            contact_email: 'schedule@genericewaste.com'
        },
        {
            partner_id: 4,
            partner_name: 'MetalScrap Processing',
            specialty: 'Metal component recycling',
            minimum_pickup_weight: 75,
            contact_email: 'pickup@metalscrap.com'
        },
        {
            partner_id: 5,
            partner_name: 'CopperWire Shredders',
            specialty: 'Wire and cable recycling',
            minimum_pickup_weight: 40,
            contact_email: 'logistics@copperwire.com'
        }
    ],

    // Object Catalog
    objectCatalog: {
        whole_devices: [
            { object_id: 1, object_name: 'Mobile', category: 'whole_device' },
            { object_id: 2, object_name: 'Laptop', category: 'whole_device' },
            { object_id: 3, object_name: 'Desktop', category: 'whole_device' },
            { object_id: 4, object_name: 'Monitor', category: 'whole_device' },
            { object_id: 5, object_name: 'Keyboard', category: 'whole_device' },
            { object_id: 6, object_name: 'Mouse', category: 'whole_device' },
            { object_id: 7, object_name: 'Printer', category: 'whole_device' },
            { object_id: 8, object_name: 'Router', category: 'whole_device' }
        ],
        components: [
            { object_id: 9, object_name: 'PCB', category: 'component' },
            { object_id: 10, object_name: 'RAM', category: 'component' },
            { object_id: 11, object_name: 'Battery', category: 'component' },
            { object_id: 12, object_name: 'HardDrive', category: 'component' },
            { object_id: 13, object_name: 'CoolingFan', category: 'component' },
            { object_id: 14, object_name: 'Cables', category: 'component' }
        ]
    },

    // Material Database
    materials: [
        { material_id: 1, material_name: 'Copper', material_type: 'metal', emission_factor: 2.1 },
        { material_id: 2, material_name: 'Gold', material_type: 'precious_metal', emission_factor: 3.5 },
        { material_id: 3, material_name: 'Silver', material_type: 'precious_metal', emission_factor: 2.8 },
        { material_id: 4, material_name: 'Fiberglass', material_type: 'composite', emission_factor: 1.2 },
        { material_id: 5, material_name: 'Plastics', material_type: 'polymer', emission_factor: 0.8 },
        { material_id: 6, material_name: 'Silicon', material_type: 'semiconductor', emission_factor: 1.5 },
        { material_id: 7, material_name: 'Lithium', material_type: 'metal', emission_factor: 3.2 },
        { material_id: 8, material_name: 'Aluminum', material_type: 'metal', emission_factor: 1.8 },
        { material_id: 9, material_name: 'Steel', material_type: 'metal', emission_factor: 1.9 }
    ],

    // Component to Material Mapping
    componentMaterials: {
        'PCB': [1, 2, 3, 4, 5, 6], // Copper, Gold, Silver, Fiberglass, Plastics, Silicon
        'RAM': [1, 2, 3, 6], // Copper, Gold, Silver, Silicon
        'Battery': [5, 6, 7], // Plastics, Silicon, Lithium
        'HardDrive': [1, 5, 8, 9], // Copper, Plastics, Aluminum, Steel
        'CoolingFan': [8, 9], // Aluminum, Steel
        'Cables': [1, 5] // Copper, Plastics
    },

    // Get materials for a component
    getMaterialsForComponent(componentName) {
        const materialIds = this.componentMaterials[componentName] || [];
        return materialIds.map(id => {
            const material = this.materials.find(m => m.material_id === id);
            return material ? material.material_name : 'Unknown';
        });
    },

    // Generate mock detection
    getMockDetection() {
        const components = ['PCB', 'RAM', 'Battery', 'HardDrive', 'CoolingFan', 'Cables'];
        const wholeDevices = ['Mobile', 'Laptop', 'Desktop', 'Monitor', 'Keyboard', 'Mouse', 'Printer', 'Router'];
        
        // 30% chance of whole device, 70% chance of component
        const isWholeDevice = Math.random() < 0.3;
        
        let objectName, category;
        if (isWholeDevice) {
            objectName = wholeDevices[Math.floor(Math.random() * wholeDevices.length)];
            category = 'whole_device';
        } else {
            objectName = components[Math.floor(Math.random() * components.length)];
            category = 'component';
        }

        // Random confidence (sometimes below threshold)
        const confidence = Math.random() < 0.2 ? 0.5 + Math.random() * 0.2 : 0.7 + Math.random() * 0.3;
        
        // Random weight
        const weight = 0.1 + Math.random() * 2.0;
        
        // Weight confidence (sometimes below threshold)
        const weightConfidence = Math.random() < 0.15 ? 0.5 + Math.random() * 0.2 : 0.7 + Math.random() * 0.3;

        const detection = {
            detection_id: this.generateUUID(),
            object_name: objectName,
            category: category,
            confidence: confidence,
            weight: weight,
            weight_confidence: weightConfidence,
            timestamp: new Date().toISOString()
        };

        // Add materials if it's a component
        if (category === 'component') {
            detection.materials = this.getMaterialsForComponent(objectName);
        }

        return detection;
    },

    // Generate UUID
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    },

    // Historical data for dashboard
    historicalData: {
        monthlyData: [
            { month: 'Jan', waste: 45.2, carbon: 112.5, components: 23 },
            { month: 'Feb', waste: 52.8, carbon: 128.3, components: 28 },
            { month: 'Mar', waste: 48.6, carbon: 118.7, components: 25 },
            { month: 'Apr', waste: 61.3, carbon: 149.2, components: 32 },
            { month: 'May', waste: 55.7, carbon: 135.8, components: 29 },
            { month: 'Jun', waste: 67.4, carbon: 164.1, components: 35 }
        ],
        materialComposition: [
            { material: 'Copper', percentage: 35 },
            { material: 'Plastics', percentage: 25 },
            { material: 'Steel', percentage: 15 },
            { material: 'Aluminum', percentage: 10 },
            { material: 'Gold', percentage: 5 },
            { material: 'Silver', percentage: 5 },
            { material: 'Other', percentage: 5 }
        ]
    },

    // Get dashboard statistics
    getDashboardStats() {
        const bins = this.inventoryBins;
        const totalWaste = bins.reduce((sum, bin) => sum + bin.current_weight, 0);
        const totalComponents = 156; // Mock total
        const activeBins = bins.filter(bin => bin.current_weight > 0).length;
        
        // Calculate carbon offset based on materials
        const carbonOffset = totalWaste * 2.4; // Simplified calculation

        return {
            totalWaste: totalWaste.toFixed(1),
            carbonOffset: carbonOffset.toFixed(1),
            totalComponents: totalComponents,
            activeBins: activeBins
        };
    }
};