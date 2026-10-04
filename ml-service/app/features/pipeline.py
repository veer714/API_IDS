"""
Unified Feature Pipeline for API Sentinel
Part of API Sentinel ML Service

Orchestrates behavioral, temporal, and payload feature extractors.
Guarantees strict train/test isolation (no data leakage).
"""

import os
from typing import Dict, List, Optional, Tuple, Any, Union

import joblib
import numpy as np
import pandas as pd
from scipy.sparse import hstack, csr_matrix
from sklearn.preprocessing import LabelEncoder

from app.features.behavioral import BehavioralFeatureExtractor, TrafficStateTracker
from app.features.payload import PayloadFeatureExtractor


class UnifiedFeaturePipeline:
    """
    Coordinates behavioral and payload feature transformations.
    Fits internal scalers, encoders, and vectorizers solely on training sets.
    """

    def __init__(self, max_tfidf_features: int = 1500):
        self.max_tfidf_features = max_tfidf_features
        self.behavioral_extractor = BehavioralFeatureExtractor()
        self.payload_extractor = PayloadFeatureExtractor(max_tfidf_features=max_tfidf_features)
        self.attack_encoder = LabelEncoder()
        self.state_tracker = TrafficStateTracker()
        self.is_fitted = False
        self.feature_version = "v1.0"

    def fit(self, records: List[Dict[str, Any]], attack_labels: Optional[List[str]] = None) -> "UnifiedFeaturePipeline":
        """Fits behavioral scalers and payload vectorizers on training records."""
        # 1. Fit behavioral features
        self.behavioral_extractor.fit(records)

        # 2. Fit payload features
        payloads = [str(r.get("payload", "") or "") for r in records]
        self.payload_extractor.fit(payloads)

        # 3. Fit multi-class attack encoder
        if attack_labels is not None:
            self.attack_encoder.fit(attack_labels)

        self.is_fitted = True
        return self

    def transform(
        self, records: List[Dict[str, Any]]
    ) -> Tuple[np.ndarray, csr_matrix, csr_matrix]:
        """
        Transforms raw records into:
        1. X_behavioral (dense numpy array, standard scaled)
        2. X_payload (sparse CSR matrix of lexical stats + TF-IDF)
        3. X_fused (sparse CSR matrix combining behavioral + payload)
        """
        if not self.is_fitted:
            raise RuntimeError("UnifiedFeaturePipeline must be fitted before calling transform().")

        # Behavioral transform
        X_behavioral = self.behavioral_extractor.transform(records)

        # Payload transform
        payloads = [str(r.get("payload", "") or "") for r in records]
        X_payload = self.payload_extractor.transform(payloads, combine_sparse=True)

        # Fused transform
        X_fused = hstack([csr_matrix(X_behavioral), X_payload], format="csr")

        return X_behavioral, X_payload, X_fused

    def transform_single(self, record: Dict[str, Any]) -> Tuple[np.ndarray, csr_matrix, csr_matrix]:
        """Convenience method for transforming a single incoming inference request."""
        # If rate features are not supplied, compute them dynamically using state tracker
        if "requests_per_minute" not in record or record.get("requests_per_minute") is None:
            ip = record.get("source_ip", "127.0.0.1")
            endpoint = record.get("endpoint", "/")
            status_code = int(record.get("status_code", 200) or 200)
            rpm, fails, unique_eps = self.state_tracker.record_and_compute(ip, endpoint, status_code)
            record["requests_per_minute"] = rpm
            record["failed_requests"] = fails
            record["unique_endpoints"] = unique_eps

        return self.transform([record])

    def save(self, filepath: str) -> None:
        """Serializes the fitted pipeline artifact."""
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        joblib.dump(self, filepath)

    @classmethod
    def load(cls, filepath: str) -> "UnifiedFeaturePipeline":
        """Loads a serialized pipeline artifact."""
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"Feature pipeline artifact not found at {filepath}")
        return joblib.load(filepath)
