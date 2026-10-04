"""
API v1 Endpoints for API Sentinel ML Service
"""

import time
from typing import Dict, Any

from fastapi import APIRouter, HTTPException, status

from app.schemas.request import PredictionRequest, BatchPredictionRequest
from app.schemas.response import (
    PredictionResponse,
    BatchPredictionResponse,
    ModelInfoResponse,
)
from app.services.predictor import predictor

router = APIRouter()


@router.post(
    "/predict",
    response_model=PredictionResponse,
    summary="Predict threat level and attack type for an API request",
    description="Accepts API request telemetry, extracts multi-modal features, and returns composite threat score, attack classification, and explainable reasons.",
)
async def predict_api_request(request: PredictionRequest) -> PredictionResponse:
    try:
        return predictor.predict_single(request)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference error: {str(e)}",
        )


@router.post(
    "/predict/batch",
    response_model=BatchPredictionResponse,
    summary="Batch inference for multiple API request records",
    description="Processes up to 500 API request telemetry records in a single batch call.",
)
async def predict_batch_requests(batch: BatchPredictionRequest) -> BatchPredictionResponse:
    try:
        t0 = time.perf_counter()
        predictions = predictor.predict_batch(batch.requests)
        t_total = round((time.perf_counter() - t0) * 1000, 2)
        return BatchPredictionResponse(
            total_requests=len(predictions),
            predictions=predictions,
            total_time_ms=t_total,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Batch inference error: {str(e)}",
        )


@router.get(
    "/model-info",
    response_model=ModelInfoResponse,
    summary="Retrieve active model metadata, thresholds, and performance metrics",
)
async def get_model_info() -> ModelInfoResponse:
    if not predictor.is_loaded:
        predictor.load_artifacts()

    meta = predictor.metadata
    return ModelInfoResponse(
        model_name=meta.get("model_name", "API Sentinel ML IDS"),
        model_version=meta.get("model_version", "v1.0.0-hybrid"),
        training_date=meta.get("training_date", "2026-03-15T00:00:00Z"),
        best_supervised_algorithm=meta.get("best_supervised_algorithm", "XGBoost"),
        classes=meta.get("classes", []),
        fusion_weights=meta.get("optimized_fusion_weights", {}),
        calibrated_thresholds=meta.get("calibrated_thresholds", {}),
        test_metrics=meta.get("test_metrics", {}),
    )
