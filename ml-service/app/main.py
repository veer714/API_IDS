"""
API Sentinel - Machine Learning Intrusion Detection Microservice
Part of API Sentinel / API_IDS Project

Provides high-performance REST inference endpoints for real-time API threat detection,
behavioral anomaly scoring, payload analysis, and model explainability.
"""

import logging
from contextlib import asynccontextmanager
from typing import Dict, Any

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.endpoints import router as api_v1_router
from app.core.config import settings
from app.schemas.response import HealthResponse
from app.services.predictor import predictor

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("api_sentinel.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initializes ML model artifacts into memory on server startup."""
    logger.info("Initializing API Sentinel ML Service...")
    try:
        predictor.load_artifacts()
        logger.info(f"ML Models initialized successfully. Version: {predictor.metadata.get('model_version')}")
    except Exception as e:
        logger.warning(f"Could not load ML artifacts during startup: {e}. Will attempt on first request.")
    yield
    logger.info("Shutting down API Sentinel ML Service...")


app = FastAPI(
    title="API Sentinel - ML Intrusion Detection Engine",
    description=(
        "Hybrid Behavioral and Payload-Aware Machine Learning Framework "
        "for Real-Time API Intrusion Detection."
    ),
    version=settings.VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# Cross-Origin Resource Sharing (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Exception Handlers (Prevent stack trace leakage)
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Custom handler for Pydantic validation errors (returns 422 with clean details)."""
    errors = []
    for err in exc.errors():
        loc = " -> ".join(str(l) for l in err.get("loc", []))
        msg = err.get("msg", "Invalid value")
        errors.append(f"{loc}: {msg}")

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "Validation Error",
            "message": "One or more request fields are invalid.",
            "details": errors,
        },
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Catch-all handler ensuring internal server stack traces are never exposed."""
    logger.error(f"Unhandled exception during request processing: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal Server Error",
            "message": "An unexpected error occurred while processing the ML inference request.",
        },
    )


# Health & Metadata Endpoints
@app.get(
    "/health",
    response_model=HealthResponse,
    tags=["System"],
    summary="Health check endpoint",
)
async def health_check() -> HealthResponse:
    return HealthResponse(
        status="ok" if predictor.is_loaded else "degraded",
        service="api-sentinel-ml-service",
        version=settings.VERSION,
        models_loaded=predictor.is_loaded,
    )


@app.get(
    "/",
    tags=["System"],
    summary="Root service descriptor",
)
async def root() -> Dict[str, Any]:
    return {
        "service": "API Sentinel - ML Intrusion Detection Engine",
        "version": settings.VERSION,
        "status": "online",
        "documentation": "/docs",
        "health": "/health",
        "predict_endpoint": "/api/v1/predict",
    }


# Include v1 API router
app.include_router(api_v1_router, prefix=settings.API_V1_STR, tags=["Inference"])
