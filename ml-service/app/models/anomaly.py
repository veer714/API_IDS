"""
Behavioral Anomaly Detection Model (Isolation Forest)
Part of API Sentinel ML Service

Implements unsupervised behavioral outlier detection trained on benign baseline traffic
to identify novel, zero-day, and anomalous client behaviors.
"""

import os
from typing import Dict, Any, Tuple

import joblib
import numpy as np
from sklearn.ensemble import IsolationForest


class BehavioralAnomalyDetector:
    """
    Isolation Forest anomaly detector fitted on behavioral feature vectors.
    Calibrates decision function to an interpretable [0, 1] anomaly score.
    """

    def __init__(
        self,
        n_estimators: int = 150,
        contamination: float = 0.05,
        max_samples: float = 0.8,
        random_state: int = 42,
    ):
        self.n_estimators = n_estimators
        self.contamination = contamination
        self.max_samples = max_samples
        self.random_state = random_state

        self.model = IsolationForest(
            n_estimators=self.n_estimators,
            contamination=self.contamination,
            max_samples=self.max_samples,
            random_state=self.random_state,
            n_jobs=-1,
        )

        self.score_min = -0.5
        self.score_max = 0.5
        self.is_fitted = False

    def fit(self, X_behavioral: np.ndarray) -> "BehavioralAnomalyDetector":
        """Fits the Isolation Forest solely on training behavioral representations."""
        self.model.fit(X_behavioral)
        raw_scores = self.model.decision_function(X_behavioral)

        # Store calibration boundaries for score normalization
        self.score_min = float(np.percentile(raw_scores, 1))
        self.score_max = float(np.percentile(raw_scores, 99))
        self.is_fitted = True
        return self

    def predict_anomaly(self, X_behavioral: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """
        Predicts anomaly status and calibrated anomaly score in [0, 1].
        Higher score represents higher anomaly probability.
        """
        if not self.is_fitted:
            raise RuntimeError("BehavioralAnomalyDetector must be fitted before predict_anomaly().")

        # Isolation forest returns +1 for inliers, -1 for outliers
        preds = self.model.predict(X_behavioral)
        is_anomaly = np.where(preds == -1, True, False)

        # Decision function: large positive = very normal, negative = anomalous
        raw_scores = self.model.decision_function(X_behavioral)

        # Invert and clip to [0, 1] so that 1.0 = highly anomalous, 0.0 = completely normal
        denom = max(1e-5, (self.score_max - self.score_min))
        normalized = (self.score_max - raw_scores) / denom
        anomaly_scores = np.clip(normalized, 0.0, 1.0)

        return is_anomaly, anomaly_scores

    def score_single(self, x_vector: np.ndarray) -> Tuple[bool, float]:
        """Convenience method for scoring a single 1D feature vector."""
        if x_vector.ndim == 1:
            x_vector = x_vector.reshape(1, -1)
        is_anom, scores = self.predict_anomaly(x_vector)
        return bool(is_anom[0]), float(round(scores[0], 4))

    def save(self, filepath: str) -> None:
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        joblib.dump(self, filepath)

    @classmethod
    def load(cls, filepath: str) -> "BehavioralAnomalyDetector":
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"Anomaly detector artifact not found at {filepath}")
        return joblib.load(filepath)
