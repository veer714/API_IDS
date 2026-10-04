"""
Unit Tests for Machine Learning Models & Hybrid Fusion
"""

import numpy as np
import pytest

from app.models.anomaly import BehavioralAnomalyDetector
from app.models.classifier import PayloadClassifier, SupervisedAttackClassifier
from app.models.explain import PredictionExplainer
from app.models.hybrid import HybridRiskFusion


def test_behavioral_anomaly_detector():
    detector = BehavioralAnomalyDetector(n_estimators=30, contamination=0.1, random_state=42)
    # Synthetic normal data (18-dimensional features)
    rng = np.random.RandomState(42)
    X_normal = rng.normal(0, 1, size=(100, 18))

    detector.fit(X_normal)

    # Inlier sample
    sample_normal = np.zeros((1, 18))
    is_anom_norm, score_norm = detector.score_single(sample_normal)
    assert 0.0 <= score_norm <= 1.0

    # Extreme outlier sample
    sample_outlier = np.ones((1, 18)) * 10.0
    is_anom_out, score_out = detector.score_single(sample_outlier)
    assert score_out > score_norm


def test_hybrid_risk_fusion_convex_combination():
    fusion = HybridRiskFusion(
        weights=[0.10, 0.30, 0.10, 0.10, 0.40],
        threshold_normal=0.30,
        threshold_suspicious=0.60,
        threshold_high=0.80,
    )

    # Completely normal signals
    risk_norm, pred_norm, sev_norm = fusion.score_single(0.0, 0.0, 0.0, 0.0, 0.0)
    assert risk_norm == 0.0
    assert pred_norm == "NORMAL"
    assert sev_norm == "LOW"

    # Completely malicious signals
    risk_mal, pred_mal, sev_mal = fusion.score_single(1.0, 1.0, 1.0, 1.0, 1.0)
    assert risk_mal == 1.0
    assert pred_mal == "MALICIOUS"
    assert sev_mal == "CRITICAL"

    # Suspicious intermediate signals
    risk_sus, pred_sus, sev_sus = fusion.score_single(0.8, 0.1, 1.0, 0.9, 0.2)
    assert 0.30 <= risk_sus <= 0.65
    assert pred_sus in ["SUSPICIOUS", "MALICIOUS"]


def test_prediction_explainer(sample_sqli_request):
    reasons = PredictionExplainer.explain(
        sample_sqli_request,
        risk_score=0.92,
        anomaly_score=0.85,
        payload_score=0.98,
        predicted_attack="SQL_INJECTION",
    )

    assert isinstance(reasons, list)
    assert len(reasons) > 0
    # Explanations must mention concrete signals
    assert any("SQL" in r or "rate" in r or "Authentication" in r or "error" in r for r in reasons)
