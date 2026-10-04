"""
Pydantic Response Schemas for API Sentinel ML Service
"""

from typing import Dict, List, Any
from pydantic import BaseModel, Field


class PredictionResponse(BaseModel):
    prediction: str = Field(..., description="Categorical threat decision: NORMAL, SUSPICIOUS, or MALICIOUS")
    severity: str = Field(..., description="Severity level: LOW, MEDIUM, HIGH, or CRITICAL")
    attack_type: str = Field(..., description="Classified attack category (e.g. SQL_INJECTION, BRUTE_FORCE, NORMAL)")
    risk_score: float = Field(..., description="Fused composite risk score in [0.0, 1.0]")
    anomaly_score: float = Field(..., description="Unsupervised behavioral anomaly score in [0.0, 1.0]")
    payload_score: float = Field(..., description="Payload maliciousness probability in [0.0, 1.0]")
    confidence: float = Field(..., description="Supervised classifier confidence score in [0.0, 1.0]")
    reasons: List[str] = Field(..., description="Feature-grounded rationales explaining the prediction")
    model_version: str = Field(..., description="Active ML pipeline model version tag")
    inference_time_ms: float = Field(..., description="Pipeline execution latency in milliseconds")


class BatchPredictionResponse(BaseModel):
    total_requests: int
    predictions: List[PredictionResponse]
    total_time_ms: float


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    models_loaded: bool


class ModelInfoResponse(BaseModel):
    model_name: str
    model_version: str
    training_date: str
    best_supervised_algorithm: str
    classes: List[str]
    fusion_weights: Dict[str, float]
    calibrated_thresholds: Dict[str, float]
    test_metrics: Dict[str, Any]
