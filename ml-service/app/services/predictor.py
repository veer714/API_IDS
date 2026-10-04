"""
ML Prediction Engine Service
Part of API Sentinel ML Service

Coordinates model loading, inference pipelines, and risk fusion.
"""

import json
import logging
import os
import time
from typing import Dict, List, Optional, Any

from app.core.config import settings
from app.features.pipeline import UnifiedFeaturePipeline
from app.models.anomaly import BehavioralAnomalyDetector
from app.models.classifier import PayloadClassifier, SupervisedAttackClassifier
from app.models.explain import PredictionExplainer
from app.models.hybrid import HybridRiskFusion
from app.schemas.request import PredictionRequest
from app.schemas.response import PredictionResponse

logger = logging.getLogger("api_sentinel.predictor")


class MLPredictor:
    """
    Singleton service managing loaded ML models and inference execution.
    """

    def __init__(self, artifacts_dir: Optional[str] = None):
        self.artifacts_dir = artifacts_dir or settings.MODELS_DIR
        self.pipeline: Optional[UnifiedFeaturePipeline] = None
        self.anomaly_detector: Optional[BehavioralAnomalyDetector] = None
        self.payload_clf: Optional[PayloadClassifier] = None
        self.supervised_clf: Optional[SupervisedAttackClassifier] = None
        self.hybrid_fusion: Optional[HybridRiskFusion] = None
        self.metadata: Dict[str, Any] = {}
        self.is_loaded: bool = False

    def load_artifacts(self) -> None:
        """Loads serialized model artifacts into memory."""
        logger.info(f"Loading ML model artifacts from {self.artifacts_dir}...")
        try:
            pipeline_path = os.path.join(self.artifacts_dir, "feature_pipeline.joblib")
            anom_path = os.path.join(self.artifacts_dir, "anomaly_detector.joblib")
            pay_path = os.path.join(self.artifacts_dir, "payload_classifier.joblib")
            sup_path = os.path.join(self.artifacts_dir, "supervised_classifier.joblib")
            fusion_path = os.path.join(self.artifacts_dir, "hybrid_fusion.joblib")
            meta_path = os.path.join(self.artifacts_dir, "metadata.json")

            self.pipeline = UnifiedFeaturePipeline.load(pipeline_path)
            self.anomaly_detector = BehavioralAnomalyDetector.load(anom_path)
            self.payload_clf = PayloadClassifier.load(pay_path)
            self.supervised_clf = SupervisedAttackClassifier.load(sup_path)
            self.hybrid_fusion = HybridRiskFusion.load(fusion_path)

            if os.path.exists(meta_path):
                with open(meta_path, "r", encoding="utf-8") as f:
                    self.metadata = json.load(f)

            self.is_loaded = True
            logger.info("All ML model artifacts loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load ML artifacts: {e}", exc_info=True)
            self.is_loaded = False
            raise RuntimeError(f"ML artifacts loading failed: {str(e)}")

    def predict_single(self, request: PredictionRequest) -> PredictionResponse:
        """Executes full hybrid inference for a single API request."""
        if not self.is_loaded:
            self.load_artifacts()

        t_start = time.perf_counter()
        req_dict = request.model_dump()

        # Step 1: Feature Extraction
        x_beh, x_pay, x_fused = self.pipeline.transform_single(req_dict)

        # Step 2: Behavioral Anomaly Detection
        is_anom, anom_score = self.anomaly_detector.score_single(x_beh)

        # Step 3: Payload Maliciousness Scoring
        pay_score = self.payload_clf.score_single(x_pay)

        # Step 4: Supervised Attack Classification
        pred_classes, confidences, mal_probs = self.supervised_clf.predict_detailed(x_fused)
        predicted_attack = pred_classes[0]
        confidence = float(round(confidences[0], 4))
        mal_prob = float(mal_probs[0])

        # Step 5: Hybrid Risk Fusion
        auth_score = 1.0 if str(request.authentication_status).upper() == "FAILED" else 0.0
        rpm = req_dict.get("requests_per_minute") or 1.0
        rate_score = min(1.0, float(rpm) / 100.0)

        risk_score, prediction, severity = self.hybrid_fusion.score_single(
            anom_score, pay_score, auth_score, rate_score, mal_prob
        )

        # Override attack type to NORMAL if prediction is classified as NORMAL
        if prediction == "NORMAL" and risk_score < self.hybrid_fusion.threshold_normal:
            attack_type = "NORMAL"
        else:
            attack_type = predicted_attack if predicted_attack != "NORMAL" else "ANOMALOUS_BEHAVIOR"

        # Step 6: Explainability
        reasons = PredictionExplainer.explain(
            req_dict, risk_score, anom_score, pay_score, attack_type
        )

        t_end = time.perf_counter()
        latency_ms = round((t_end - t_start) * 1000, 2)

        return PredictionResponse(
            prediction=prediction,
            severity=severity,
            attack_type=attack_type,
            risk_score=risk_score,
            anomaly_score=anom_score,
            payload_score=pay_score,
            confidence=confidence,
            reasons=reasons,
            model_version=self.metadata.get("model_version", settings.ACTIVE_MODEL_VERSION),
            inference_time_ms=latency_ms,
        )

    def predict_batch(self, requests: List[PredictionRequest]) -> List[PredictionResponse]:
        """Processes a batch of prediction requests."""
        return [self.predict_single(r) for r in requests]


# Global singleton instance
predictor = MLPredictor()
