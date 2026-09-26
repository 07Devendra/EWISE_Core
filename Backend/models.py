from __future__ import annotations
from typing import Optional
from pydantic import BaseModel, Field

# Request Model
class DetectionPayload(BaseModel):
    item_class:str=Field(...)
    category:str=Field(...)
    object_confidence:float=Field(..., ge=0.0, le=1.0)
    weight_grams:Optional[float]=Field(None, gt=0.0,)
    weight_confidence:Optional[float]=Field(None, ge=0.0, le=1.0)
    timestamp:str=Field(...)

class ManualPayload(BaseModel):
    detection_id:str=Field(...)
    item_class:Optional[str]=Field(None)
    category:Optional[str]=Field(None)
    weight_grams:Optional[float]=Field(None, gt=0.0)
    timestamp:Optional[str]=Field(None)

# Internal Model
class AIDetectionInfo(BaseModel):
    item_class:Optional[str]=None
    category:Optional[str]=None
    object_confidence:Optional[float]=None

class WeightInfo(BaseModel):
    weight_grams:float
    weight_confidence:Optional[float]=None

class RoutingInfo(BaseModel):
    bin_id:int
    bin_name:str
    color_code:str

class LCAMetrics(BaseModel):
    carbon_saved_grams:float
    material_types:list[str]

class LogisticsAlert(BaseModel):
    bin_id:int
    bin_name:str
    current_weight_kg:float
    threshold_kg:float
    partner_name:str
    contact_email:str
    message:str

# Detection Response Model
class DetectionResponse(BaseModel):
    detection_id:str
    system_state:str#waiting, disassembly_required, requires_manual_input, complete
    ai_detection:Optional[AIDetectionInfo]=None
    weight:Optional[WeightInfo]=None
    routing:Optional[RoutingInfo]=None
    lca_metrics:Optional[LCAMetrics]=None
    logistics_alert:Optional[LogisticsAlert]=None   
    timestamp:str

# Status Model
class StatusResponse(BaseModel):
    system_state:str="waiting"
    message:str
    timestamp:str