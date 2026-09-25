# Campus E-Waste Intelligence System (E-WISE) - Frontend

A comprehensive frontend application for the Campus E-Waste Intelligence, Logistics & Environmental Impact System. This application provides a user interface for electronic waste detection, inventory management, and analytics visualization.

## Features

### 1. Detection System
- **Camera Feed Simulation**: Visual interface for object detection
- **AI-Powered Detection**: Simulates YOLO-based object detection with confidence scores
- **Disassembly Protocol**: Routes intact devices to holding area for disassembly
- **Manual Override**: Handles low-confidence detections with manual input forms
- **Weight Measurement**: Simulates OCR-based weight reading from digital scales

### 2. Inventory Management
- **Real-time Bin Tracking**: Monitor current weight of all inventory bins
- **Progress Visualization**: Visual progress bars showing capacity utilization
- **Logistics Alerts**: Automatic notifications when bins reach pickup thresholds
- **Vendor Assignment**: Displays assigned recycling partners for each bin
- **Category Organization**: Bins organized by material type (PCB, Battery, Metal, Wire, etc.)

### 3. Analytics Dashboard
- **Key Metrics**: Total e-waste processed, carbon offset, components processed
- **Material Composition**: Doughnut chart showing material breakdown
- **Monthly Trends**: Line chart tracking waste and carbon over time
- **Real-time Updates**: Dashboard updates with each detection

## System States

The application operates through four main states:

1. **Waiting**: Idle state, ready for next item detection
2. **Disassembly Required**: Triggers when whole device is detected
3. **Manual Input Required**: Activates when confidence scores fall below threshold
4. **Complete**: Shows processing results and routing instructions

## Technology Stack

- **HTML5** (10%): Structure and semantic markup
- **JavaScript** (45%): Application logic, state management, UI control
- **CSS3** (45%): Styling, responsive design, animations
- **Chart.js**: Data visualization for dashboard

## File Structure

```
FrontEnd_Vedant/
├── index.html          # Main HTML structure
├── styles.css          # Complete styling with responsive design
├── app.js             # Application state management and UI logic
├── mockData.js        # Mock data and API simulation
├── dashboard.js       # Dashboard visualization controller
└── README.md          # Documentation
```

## Component Breakdown

### HTML (index.html)
- Header with navigation and status indicator
- Three main screens: Detection, Inventory, Dashboard
- Camera feed placeholder with detection overlay
- Manual input modal for low-confidence detections
- Toast notification system

### CSS (styles.css)
- Modern dark theme with gradient backgrounds
- Responsive grid layouts for all screen sizes
- Smooth animations and transitions
- Custom scrollbar styling
- Mobile-first design approach

### JavaScript (app.js)
- **AppState Class**: Manages application state and data
- **UIController Class**: Handles UI updates and user interactions
- **Event Handling**: Navigation, forms, modals, buttons
- **Detection Processing**: Confidence checking and routing logic
- **Inventory Management**: Bin updates and alert generation

### Mock Data (mockData.js)
- Inventory bins with current weights and thresholds
- Recycling partner information
- Object catalog (whole devices and components)
- Material database with emission factors
- Component-to-material mapping
- Historical data for dashboard

### Dashboard (dashboard.js)
- Chart.js integration for data visualization
- Material composition doughnut chart
- Monthly trend line chart
- Real-time metric updates

## How to Use

### 1. Setup
Simply open `index.html` in a modern web browser. No build process or server required.

### 2. Detection Workflow
1. Navigate to the **Detection** screen (default)
2. Click **"Simulate Detection"** to trigger a mock detection
3. The system will randomly generate:
   - Whole devices (30% chance) → Routes to disassembly
   - Components (70% chance) → Processes for materials
4. Low confidence detections trigger manual input modal
5. View detection details, materials, and routing instructions

### 3. Inventory Management
1. Navigate to the **Inventory** screen
2. View all inventory bins with current weights
3. Check progress bars for capacity utilization
4. Review logistics alerts for pickup scheduling
5. See assigned recycling partners for each bin

### 4. Analytics Dashboard
1. Navigate to the **Dashboard** screen
2. View key metrics (total waste, carbon offset, etc.)
3. Analyze material composition chart
4. Review monthly trends for waste and carbon
5. Track sustainability performance over time

## Key Functionality

### Confidence Thresholds
- **Object Confidence**: 70% threshold
- **Weight Confidence**: 70% threshold
- Below threshold triggers manual input requirement

### Disassembly Protocol
- Non-blocking workflow
- Whole devices route to Disassembly Holding Area
- System immediately returns to waiting state
- Components processed as fresh detections

### Material Mapping
- Components mapped to multiple materials
- Environmental impact calculated using emission factors
- Carbon offset estimated for each processed item

### Logistics Alerts
- Alerts generated at 80% capacity
- Pickup required at 100% threshold
- Vendor contact information provided

## Responsive Design

The application is fully responsive and works on:
- Desktop computers (1920x1080 and above)
- Tablets (768x1024)
- Mobile devices (320x568 and above)

## Browser Compatibility

Tested and compatible with:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Opera (latest)

## Future Enhancements

### Backend Integration
- Replace mock data with real API calls
- Connect to actual YOLO detection service
- Implement real camera feed integration
- Connect to SQLite database

### Additional Features
- User authentication and authorization
- Historical detection records
- Export functionality (PDF, CSV)
- Email notifications for logistics alerts
- Multi-campus support

### Performance
- Implement service worker for offline support
- Add loading states for async operations
- Optimize chart rendering for large datasets
- Implement virtual scrolling for large inventories

## Security Considerations

- Input validation on all forms
- XSS prevention through proper escaping
- CSRF protection for future API integration
- Secure handling of sensitive data

## License

This project is part of the Campus E-Waste Intelligence System.

## Contact

For questions or support, please contact the development team.