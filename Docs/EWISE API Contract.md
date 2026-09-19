## EWISE: Electronic Waste Intelligence & Sorting Equipment
**Devendra — Backend & ML Integration Lead**

---

## System State Reference

| `system_state`          | Meaning                                                                             |
| ----------------------- | ----------------------------------------------------------------------------------- |
| `waiting`               | System is idle, ready for next item.                                                |
| `disassembly_required`  | Whole device detected, disassembly prompt shown to technician.                      |
| `requires_manual_input` | One or more ML confidences failed; UI dynamically renders inputs for `null` fields. |
| `complete`              | Component routed, LCA calculated, record logged to DB.                              |

---

## Confidence Thresholds (Locked)

| Signal              | Threshold | Action if Below                  |
| ------------------- | --------- | -------------------------------- |
| `object_confidence` | 0.70      | Triggers `requires_manual_input` |
| `weight_confidence` | 0.70      | Triggers `requires_manual_input` |

---

## Temporary In-Memory Store

```python
# Single-worker campus prototype — plain Python dict is sufficient
pending_detections = {}

# Structure keyed by detection_id (UUID)
pending_detections["<uuid>"] = {
    "item_class": "Motherboard",   # null if object_confidence failed
    "category": "component",       # null if object_confidence failed
    "weight_grams": 450,           # null if weight_confidence failed
    "pending_state": "requires_manual_input",
    "created_at": "2026-09-19T11:36:00.123Z"
}
# TTL: Background task purges record after 10 minutes of inactivity
```

---

## Contract 1 — YOLO → Backend
**Route:** `POST /api/detection`

```json
{
  "item_class": "Motherboard",
  "category": "component",
  "object_confidence": 0.45,
  "weight_grams": 450,
  "weight_confidence": 0.97,
  "timestamp": "2026-09-19T11:36:00.123Z"
}
```

### Field Reference

| Field | Type | Purpose |
|---|---|---|
| `item_class` | string | What YOLO detected |
| `category` | string | `"whole_device"` or `"component"` |
| `object_confidence` | float (0–1) | Below 0.70 → `requires_manual_input` |
| `weight_grams` | float | Read from scale display via YOLO OCR |
| `weight_confidence` | float (0–1) | Below 0.70 → `requires_manual_input` |
| `timestamp` | ISO 8601 UTC | Enables time-series trend analysis |

### Backend Decision Logic (Pseudocode)

```python
detection_id = generate_uuid()

if category == "whole_device":
    # detection_id returned for UI rendering only — NOT saved to memory or DB
    return system_state = "disassembly_required", detection_id

needs_class  = object_confidence < 0.70
needs_weight = weight_confidence < 0.70

if needs_class or needs_weight:
    # Preserve valid data, discard only what failed
    pending_detections[detection_id] = {
        "item_class":   item_class   if not needs_class  else None,
        "category":     category     if not needs_class  else None,
        "weight_grams": weight_grams if not needs_weight else None,
        "pending_state": "requires_manual_input",
        "created_at":   timestamp
    }
    schedule_async_task(purge_pending_detection, detection_id, delay_minutes=10)
    return system_state = "requires_manual_input", detection_id

# Both confidences passed — finalize immediately
calculate LCA
log to DETECTION_RECORDS
return system_state = "complete", detection_id
```

---

## Contract 2 — Backend → Frontend
**Response to:** `POST /api/detection` OR `POST /api/manual`

### State: `complete`
```json
{
  "detection_id": "550e8400-e29b-41d4-a716-446655440000",
  "system_state": "complete",
  "ai_detection": {
    "item_class": "Motherboard",
    "category": "component",
    "object_confidence": 0.92
  },
  "weight": {
    "weight_grams": 450,
    "weight_confidence": 0.97
  },
  "routing": {
    "bin_id": 2,
    "bin_name": "High-Value PCB Bin",
    "color_code": "#FF5733"
  },
  "lca_metrics": {
    "carbon_saved_grams": 1.2,
    "material_types": ["copper", "gold", "silicon"]
  },
  "timestamp": "2026-09-19T11:36:00.123Z"
}
```

### State: `requires_manual_input`
*(Example: classification failure, weight success — valid weight is passed through, not discarded)*
```json
{
  "detection_id": "550e8400-e29b-41d4-a716-446655440002",
  "system_state": "requires_manual_input",
  "ai_detection": {
    "item_class": null,
    "category": null,
    "object_confidence": 0.45
  },
  "weight": {
    "weight_grams": 450,
    "weight_confidence": 0.97
  },
  "routing": null,
  "lca_metrics": null,
  "timestamp": "2026-09-19T11:36:00.123Z"
}
```

### State: `disassembly_required`
```json
{
  "detection_id": "550e8400-e29b-41d4-a716-446655440001",
  "system_state": "disassembly_required",
  "ai_detection": {
    "item_class": "Laptop",
    "category": "whole_device",
    "object_confidence": 0.95
  },
  "weight": null,
  "routing": null,
  "lca_metrics": null,
  "timestamp": "2026-09-19T11:36:00.123Z"
}
```

### Null Field Rules

| State | `routing` | `lca_metrics` | `weight` |
|---|---|---|---|
| `complete` | populated | populated | populated |
| `disassembly_required` | `null` | `null` | `null` |
| `requires_manual_input` | `null` if class missing, populated if class known | `null` | `null` if weight missing, populated if weight known |

---

## Contract 3 — Health Check
**Route:** `GET /api/status`
**Purpose:** Frontend boot check to verify backend connectivity.

```json
{
  "system_state": "waiting",
  "message": "System idle. Ready for YOLO detection.",
  "timestamp": "2026-09-19T11:45:00.123Z"
}
```

> **Note for Person 2:** The `waiting` UI state is frontend-owned.
> After displaying `complete` or `disassembly_required`, Person 2 implements
> a local `setTimeout` (5 seconds) to reset the UI to idle.
> The backend does not push or maintain this state.

---

## Contract 4 — Manual Resolution → Backend
**Route:** `POST /api/manual`
**Purpose:** Technician submits missing data after `requires_manual_input` state.
**Frontend sends only the missing fields alongside `detection_id`.**

### Scenario A: Weight failure only (classification was successful)
```json
{
  "detection_id": "550e8400-e29b-41d4-a716-446655440002",
  "weight_grams": 450,
  "timestamp": "2026-09-19T11:45:00.123Z"
}
```

### Scenario B: Classification failure only (weight was successful)
```json
{
  "detection_id": "550e8400-e29b-41d4-a716-446655440002",
  "item_class": "Motherboard",
  "category": "component",
  "timestamp": "2026-09-19T11:45:00.123Z"
}
```

### Scenario C: Double failure (both missing)
```json
{
  "detection_id": "550e8400-e29b-41d4-a716-446655440002",
  "item_class": "Motherboard",
  "category": "component",
  "weight_grams": 450,
  "timestamp": "2026-09-19T11:45:00.123Z"
}
```

### Backend Resolution Logic (Pseudocode)

```python
stored = pending_detections.get(detection_id)

if not stored:
    return HTTP_404_NOT_FOUND  # TTL expired or invalid ID

# Merge: incoming manual payload fills in whatever was null
final_item_class = payload.item_class or stored["item_class"]
final_category   = payload.category   or stored["category"]
final_weight     = payload.weight_grams or stored["weight_grams"]

# Finalize
calculate LCA
lookup routing from DB
log to DETECTION_RECORDS

# Clean up temporary memory immediately
del pending_detections[detection_id]

# Return Contract 2 (State: complete)
return complete_payload
```

---

## Endpoint Summary

| Method | Route | Purpose |
|---|---|---|
| `POST` | `/api/detection` | YOLO sends detection payload |
| `POST` | `/api/manual` | Technician submits missing manual data |
| `GET` | `/api/status` | Frontend health check on boot |

---

## Architectural Decisions (Locked)

| Decision                | Value                                                                   |
| ----------------------- | ----------------------------------------------------------------------- |
| Whole device DB records | Not written — components only                                           |
| Temporary store         | Plain Python dict (`pending_detections`) in FastAPI memory              |
| TTL                     | 10 minutes — background task purges expired records                     |
| `null` handling         | Explicit `null` in all incomplete fields (never omitted, never `{}`)    |
| `color_code`            | Backend responsibility — sourced from Person 5's `INVENTORY_BINS` table |
| Weight source           | YOLO OCR on scale display (interim until USB scale approved)            |
| UI reset timer          | Person 2's responsibility — `setTimeout` on frontend, not backend       |
| `waiting` state         | Frontend-owned idle state, not pushed by backend                        |
