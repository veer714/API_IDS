"""
Core Configuration for API Sentinel ML Service
"""

import os
from pydantic import BaseModel


class Settings(BaseModel):
    # Service settings
    PROJECT_NAME: str = "API Sentinel - Machine Learning Intrusion Detection Service"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    PORT: int = 8000
    HOST: str = "0.0.0.0"

    # Paths
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    ML_SERVICE_DIR: str = os.path.dirname(BASE_DIR)
    MODELS_DIR: str = os.path.join(ML_SERVICE_DIR, "models", "artifacts")
    DATA_DIR: str = os.path.join(ML_SERVICE_DIR, "data")

    # Default Threat Thresholds (calibrated via validation experiments)
    THRESHOLD_NORMAL: float = 0.35
    THRESHOLD_SUSPICIOUS: float = 0.65
    THRESHOLD_HIGH: float = 0.85

    # Model Version
    ACTIVE_MODEL_VERSION: str = "v1.0.0-hybrid"


settings = Settings()
