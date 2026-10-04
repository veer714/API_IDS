"""
Unit Tests for Behavioral & Payload Feature Pipelines
"""

from datetime import datetime, timedelta
import numpy as np
import pytest

from app.features.behavioral import BehavioralFeatureExtractor, TrafficStateTracker
from app.features.payload import (
    PayloadFeatureExtractor,
    normalize_payload,
    calculate_entropy,
)
from app.features.pipeline import UnifiedFeaturePipeline


def test_normalize_payload():
    # URL decoding and digit normalization
    encoded = "admin%27%20OR%201%3D1"
    normalized = normalize_payload(encoded)
    assert "admin'" in normalized
    assert "or" in normalized
    assert "<num>=<num>" in normalized


def test_calculate_entropy():
    # Empty string should yield 0.0 entropy
    assert calculate_entropy("") == 0.0

    # Low entropy for repetitive strings
    low_ent = calculate_entropy("aaaaaaaaaa")
    assert low_ent == 0.0

    # High entropy for diverse base64/random strings
    high_ent = calculate_entropy("a8!Z$9#1pQ@L%v2^kM")
    assert high_ent > 3.5


def test_traffic_state_tracker_temporal_causality():
    tracker = TrafficStateTracker(window_1m_seconds=60, window_5m_seconds=300)
    ip = "192.168.1.100"

    t0 = datetime(2026, 3, 15, 10, 0, 0)

    # First request: 1 req/min, 0 fails, 1 unique endpoint
    rpm, fails, eps = tracker.record_and_compute(ip, "/api/v1/products", 200, timestamp=t0)
    assert rpm == 1
    assert fails == 0
    assert eps == 1

    # Second request 5 seconds later with 401 error
    t1 = t0 + timedelta(seconds=5)
    rpm, fails, eps = tracker.record_and_compute(ip, "/api/v1/auth/login", 401, timestamp=t1)
    assert rpm == 2
    assert fails == 1
    assert eps == 2

    # Request after 65 seconds (1st request should expire from 1m window, but failure retained in 5m window)
    t2 = t0 + timedelta(seconds=65)
    rpm, fails, eps = tracker.record_and_compute(ip, "/api/v1/users", 200, timestamp=t2)
    assert rpm == 2  # t1 and t2 only
    assert fails == 1  # 401 at t1 still within 5 minutes
    assert eps == 3  # 3 endpoints visited in 5 minutes


def test_behavioral_feature_extractor():
    extractor = BehavioralFeatureExtractor()
    sample_records = [
        {
            "requests_per_minute": 5,
            "failed_requests": 0,
            "unique_endpoints": 1,
            "response_time": 20.0,
            "request_size": 100,
            "response_size": 500,
            "method": "GET",
            "status_code": 200,
            "authentication_status": "AUTHENTICATED",
            "endpoint": "/api/v1/products",
            "user_agent": "Mozilla/5.0",
        },
        {
            "requests_per_minute": 100,
            "failed_requests": 20,
            "unique_endpoints": 5,
            "response_time": 150.0,
            "request_size": 300,
            "response_size": 200,
            "method": "POST",
            "status_code": 401,
            "authentication_status": "FAILED",
            "endpoint": "/api/v1/auth/login",
            "user_agent": "sqlmap/1.7.2",
        },
    ]

    extractor.fit(sample_records)
    transformed = extractor.transform(sample_records)

    assert isinstance(transformed, np.ndarray)
    assert transformed.shape == (2, len(BehavioralFeatureExtractor.FEATURE_NAMES))
    # Check that scaler mean is close to 0
    assert np.allclose(transformed.mean(axis=0), 0.0, atol=1e-5)


def test_payload_feature_extractor():
    extractor = PayloadFeatureExtractor(max_tfidf_features=100)
    payloads = [
        "{}",
        "{\"username\": \"admin\", \"password\": \"secret\"}",
        "' OR '1'='1",
        "<script>alert(1)</script>",
        "../../../../etc/passwd",
    ]

    extractor.fit(payloads)
    sparse_matrix = extractor.transform(payloads)

    assert sparse_matrix.shape[0] == len(payloads)
    assert sparse_matrix.shape[1] > 10  # Lexical features + TF-IDF n-grams


def test_unified_feature_pipeline_empty_payload(sample_benign_request):
    pipeline = UnifiedFeaturePipeline(max_tfidf_features=50)
    pipeline.fit([sample_benign_request], attack_labels=["NORMAL"])

    x_beh, x_pay, x_fused = pipeline.transform([sample_benign_request])
    assert x_beh.shape[0] == 1
    assert x_pay.shape[0] == 1
    assert x_fused.shape[0] == 1
