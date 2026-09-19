# Campus E-Waste Intelligence, Logistics & Environmental Impact System

### 1. Project Overview

This project is a campus e-waste intelligence and logistics system that uses computer vision, a backend database, material knowledge, and data analytics to help a campus properly identify, process, and route electronic waste.

A user or lab assistant places an electronic item under a camera. The system identifies the object. If it is an intact device, the system routes it to a Disassembly Holding Area and prompts the technician to disassemble it — without halting the system. Once disassembled, components are placed under the camera as fresh detections. The system then identifies the internal components, maps them to base materials, calculates environmental impact, and routes the specific components to their appropriate specialized recycling bins. It tracks cumulative inventory and triggers logistics alerts when enough material is gathered to dispatch to specialized third-party recycling vendors.

### 2. Problem Statement

Educational institutions generate vast amounts of e-waste. Currently, most campuses dump all e-waste into a single bin without detailed information about:

- What components are inside the devices.
- What materials (and value) can potentially be recovered.
- The carbon footprint of the waste.
- How to properly route specific components (like lithium batteries vs. gold-plated RAM) to specialized recyclers rather than general scrap yards.

This project transforms a simple e-waste drop-off into a smart **Enterprise Resource Planning (ERP) tool for sustainability**, managing the entire pipeline from detection to logistics dispatch.

### 3. Main Objective

To develop a computer-vision and backend-driven campus e-waste system that identifies electronic components, mandates the disassembly of intact devices, maps parts to raw materials, estimates environmental impact, and acts as a logistics dashboard for routing specialized e-waste to the correct recycling vendors based on inventory trends.

### 4. Important Design Principle

The system acts as an intelligence and tracking layer, not an autonomous robotic sorter.

The workflow is practical and human-in-the-loop:

**AI Identifies Object** → **Routes to Disassembly Holding Area if intact (non-blocking)** → **Fresh component detections after disassembly** → **Maps Materials & Carbon** → **Recommends Bin/Vendor Routing** → **Logs Data for Trends**.

### 5. Complete System Architecture & Flow

```
                    USER / LAB ASSISTANT
                           │
                           ▼
                         CAMERA
                           │
                           ▼
                  YOLO OBJECT DETECTION
                  (Object Class + Confidence)
                           │
                           ▼
                  IS IT A WHOLE DEVICE?
             ┌────────────┴────────────┐
             ▼                         ▼
            YES                        NO (Component)
             │                         │
             ▼                         ▼
    ROUTE TO DISASSEMBLY          CONFIDENCE CHECK
    HOLDING AREA                  (Object + Weight)
    (Non-Blocking Prompt)              │
                           ┌───────────┴───────────┐
                           ▼                       ▼
                     HIGH CONFIDENCE         LOW CONFIDENCE
                           │                       │
                           ▼                       ▼
                    WEIGHT MEASUREMENT      MANUAL INPUT PROMPT
                    (YOLO OCR on Scale)     (Class and/or Weight)
                           │                       │
                           └───────────┬───────────┘
                                       ▼
                              CARBON / LCA ENGINE
                                       │
                                       ▼
                          DOWNSTREAM ROUTING ENGINE
                  (e.g., "Place in High-Value PCB Bin")
                                       │
                                       ▼
                      INVENTORY & LOGISTICS LOGGING
                 (Check threshold for Vendor Dispatch)
                                       │
                                       ▼
                        DATA TRENDS & DASHBOARD
```

### 6. Object Identification (Whole vs. Component)

The AI model (YOLO) will be trained to recognize both **whole devices** and **internal components**.

- **Whole-device classes:** Mobile, Laptop, Desktop, Monitor, Keyboard, Mouse, Printer, Router.
- **Component classes:** PCB/Motherboard, RAM, Cooling Fan, Battery, Hard Drive/SSD, Cables.

Every detection payload includes an explicit `category` field (`"whole_device"` or `"component"`). This allows the backend to make routing decisions without hard-coding every possible object name, and makes the system extensible when new device types are added.

### 7. Confidence and Manual Override

A real-world system must account for AI uncertainty.

Two separate confidence thresholds are defined:

| Signal              | Threshold | Action if Below                  |
| ------------------- | --------- | -------------------------------- |
| `object_confidence` | 0.70      | Triggers `requires_manual_input` |
| `weight_confidence` | 0.70      | Triggers `requires_manual_input` |

Both confidences are evaluated simultaneously. If either or both fail, the system enters a single consolidated `requires_manual_input` state. The UI dynamically renders only the inputs needed (classification dropdown, weight entry, or both). Valid data from the passing confidence is preserved and passed through — not discarded.

A temporary in-memory session store (`pending_detections` dictionary) holds partial detection data keyed by a UUID (`detection_id`) with a 10-minute TTL to prevent memory leaks.

### 8. Disassembly Protocol

Disassembly is non-blocking. The system does not halt when a whole device is detected.

1. **System identifies:** "Laptop" (Whole Device, `category: whole_device`)
2. **UI displays:** *"Intact device detected. Please disassemble and place components under the camera."*
3. **System routes:** Device to **Disassembly Holding Area** bin (non-dispatch staging bin in DB).
4. **System resets:** Immediately returns to `waiting` state, ready for next item.
5. **Technician disassembles** at their own pace and places components under the camera.
6. **Each component** is treated as a fresh, independent detection with no link to the original device.

Whole device detections are not written to `DETECTION_RECORDS`. Only components generate database records.

### 9. Component → Material Mapping

Once components are identified, the knowledge database maps them to raw materials.

- **Component:** PCB/Motherboard
- **Materials:** Copper, Gold, Silver, Fiberglass, Plastics

*The database distinguishes between known exact values and generic industry estimates.*

The `material_types` field in the API response is an array (e.g., `["copper", "gold", "silicon"]`) to correctly represent that a single component maps to multiple materials simultaneously.

### 10. Downstream Routing & Vendor Recommendations

E-waste recycling is highly specialized. The system directs the user on exactly *where* to put the component and tracks it for dispatch.

- **RAM / Motherboards:** *"Store in High-Value PCB Bin. Ultimate Destination: Specialized Precious Metal Smelter (Vendor A)."*
- **Batteries (Lithium-ion):** *"Store in Fire-Safe Battery Bin. Ultimate Destination: Battery Processing Facility (Vendor B)."*
- **Cables:** *"Store in Wire Bin. Ultimate Destination: General Copper Shredder."*
- **Whole Devices (pre-disassembly):** *"Store in Disassembly Holding Area."* (Staging only — no vendor dispatch threshold.)

### 11. Weight Measurement & Inventory Thresholds

Weight measurement is a separate pipeline from object detection. YOLO performs OCR on the digital scale display to read the weight value and returns it alongside the object detection in a single payload — but as a distinct field with its own confidence score (`weight_confidence`).

If the USB scale budget is approved, the weight pipeline will be replaced with direct hardware integration. The API contract accommodates both methods without structural changes.

- The weight is added to the running total for that specific component's **Inventory Bin**.
- **Logistics Alerts:** When a bin hits an economically viable transport threshold (e.g., "50 kg of Lithium-ion batteries reached"), the system generates an alert to schedule a truck pickup.

### 12. Carbon / Environmental Analysis

The system estimates environmental impact using documented factors.

- **Formula:** `CO₂e = Mass × Emission Factor`
- Shows the CO₂ emissions offset by sending the component to a specialized recycler instead of a landfill.

### 13. Data Trends & Visualization

All processed components feed into an analytics dashboard for campus administrators. Note: because whole devices are not logged, all trend data is component-level only.

- **Time-Series Analysis:** Track peak e-waste generation periods.
- **Component Yields:** Pie charts showing the breakdown of materials recovered.
- **Sustainability Metrics:** Total carbon offset mapped over months/years.

### 14. Database Design

The `INVENTORY_BINS` table includes a **Disassembly Holding Area** entry (bin_id: 0) with no threshold limit and no assigned vendor, used solely as a staging bin for whole devices awaiting disassembly.

```
OBJECT_CATALOG         MATERIALS                  COMPONENT_MATERIALS
--------------         ---------                  -------------------
object_id              material_id                component_id
object_name            material_name              material_id
type (Whole/Comp)      material_type              mass_fraction
category               emission_factor

RECYCLING_PARTNERS     INVENTORY_BINS             DETECTION_RECORDS
------------------     --------------             -----------------
partner_id             bin_id                     record_id
partner_name           category                   timestamp
specialty              bin_name                   detected_object
minimum_pickup_weight  color_code                 weight
contact_email          current_weight             assigned_bin_id
                       threshold_limit            carbon_estimate
                       assigned_partner_id        detection_id (UUID)
```

`DETECTION_RECORDS` includes a `detection_id` (UUID) field for session tracking across multi-step manual resolution flows.

### 15. Technology Stack

- **Language:** Python
- **Computer Vision:** OpenCV, NumPy
- **AI/ML:** YOLO (Ultralytics + PyTorch)
- **Backend:** FastAPI
- **Session Store:** In-memory Python dictionary with TTL (single-worker prototype)
- **Database:** SQLite
- **Frontend:** Sveltekit/solidJS
- **Data Visualization:** Chart.js or Plotly.js

### 16. Frontend UI

System states driving UI screens:

| `system_state` | UI Screen |
|---|---|
| `waiting` | Idle screen — ready for next item |
| `disassembly_required` | Disassembly prompt + Holding Area routing instruction |
| `requires_manual_input` | Dynamic form — renders only missing inputs (class dropdown and/or weight field) |
| `complete` | Routing instruction + carbon offset display |

The `waiting` state is frontend-owned. After displaying `complete` or `disassembly_required`, Vedant Patil implements a local `setTimeout` (5 seconds) to reset the UI to idle. The backend does not push this state.

### 17. Dataset Strategy

The dataset must contain images of:

- Intact devices (laptops, routers, etc.).
- Disassembled components (bare motherboards, extracted fans, exposed batteries, RAM sticks).
- Digital scale displays showing weight readings (for YOLO OCR weight reading).
- Different lighting, angles, and campus backgrounds.

### 18. API Endpoint Summary

Three backend endpoints defined:

| Method | Route | Purpose |
|---|---|---|
| `POST` | `/api/detection` | YOLO sends detection + weight OCR payload |
| `POST` | `/api/manual` | Technician submits missing classification and/or weight |
| `GET` | `/api/status` | Frontend health check on boot |

*Full JSON contracts defined in `API_Contracts_v2.md`.*

### 19. One-Line Project Definition

A computer-vision and logistics-driven e-waste ERP system that mandates device disassembly, identifies internal components, routes materials to specialized recycling bins, tracks inventory thresholds for vendor dispatch, and visualizes campus environmental impact.
