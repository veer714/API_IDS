"""
Hybrid Risk Fusion Framework
Part of API Sentinel ML Service

Mathematically combines multi-modal detection signals:
1. Behavioral anomaly score (Isolation Forest)
2. Payload maliciousness probability (Payload Classifier / TF-IDF)
3. Authentication anomaly indicator
4. Rate velocity anomaly indicator
5. Supervised attack probability (RF / XGBoost)

Weights are optimized on validation data via constrained convex optimization (Brier loss minimization).
"""

import os
from typing import Dict, List, Optional, Tuple, Any

import joblib
import numpy as np
from scipy.optimize import minimize


class HybridRiskFusion:
    """
    Weighted convex fusion model for composite threat risk scoring.
    """

    SIGNAL_NAMES = [
        "behavioral_anomaly",
        "payload_score",
        "auth_score",
        "rate_score",
        "classifier_prob",
    ]

    def __init__(
        self,
        weights: Optional[List[float]] = None,
        threshold_normal: float = 0.35,
        threshold_suspicious: float = 0.65,
        threshold_high: float = 0.85,
    ):
        # Default uniform weights before optimization
        self.weights = np.array(weights if weights else [0.20, 0.25, 0.15, 0.15, 0.25], dtype=np.float64)
        self.threshold_normal = threshold_normal
        self.threshold_suspicious = threshold_suspicious
        self.threshold_high = threshold_high
        self.is_optimized = False

    def fuse_signals(
        self,
        behavioral_anomaly: np.ndarray,
        payload_score: np.ndarray,
        auth_score: np.ndarray,
        rate_score: np.ndarray,
        classifier_prob: np.ndarray,
        custom_weights: Optional[np.ndarray] = None,
    ) -> np.ndarray:
        """Computes weighted composite risk score for vectors of signals."""
        w = custom_weights if custom_weights is not None else self.weights
        matrix = np.column_stack([
            behavioral_anomaly,
            payload_score,
            auth_score,
            rate_score,
            classifier_prob,
        ])
        risk = np.dot(matrix, w)
        return np.clip(risk, 0.0, 1.0)

    def optimize_weights(
        self,
        signals_matrix: np.ndarray,
        y_true_binary: np.ndarray,
        min_weight: float = 0.08,
    ) -> Dict[str, Any]:
        """
        Optimizes weights on validation partition to minimize Brier score with multi-modal regularization.
        Enforces min_weight to prevent overconfident tree models from zeroing out behavioral anomaly signals.
        """
        n_signals = signals_matrix.shape[1]
        initial_weights = np.ones(n_signals) / n_signals
        bounds = [(min_weight, 0.45) for _ in range(n_signals)]
        constraints = {"type": "eq", "fun": lambda w: np.sum(w) - 1.0}

        def loss_func(w):
            preds = np.dot(signals_matrix, w)
            brier = np.mean((preds - y_true_binary) ** 2)
            # Regularize slightly towards equal participation across all modalities
            reg = 0.01 * np.sum((w - (1.0 / n_signals)) ** 2)
            return brier + reg

        res = minimize(
            loss_func,
            initial_weights,
            method="SLSQP",
            bounds=bounds,
            constraints=constraints,
        )

        if res.success:
            self.weights = np.round(res.x, 4)
            self.weights = self.weights / np.sum(self.weights)  # re-normalize strictly to 1.0
            self.is_optimized = True

        return {
            "success": res.success,
            "optimized_weights": dict(zip(self.SIGNAL_NAMES, [round(float(v), 4) for v in self.weights])),
            "brier_score": float(res.fun),
        }

    def calibrate_thresholds(
        self,
        risk_scores: np.ndarray,
        y_true_binary: np.ndarray,
        target_max_fpr: float = 0.02,
    ) -> Dict[str, float]:
        """
        Calibrates threat level cutoffs using validation scores by searching for the
        F1-optimal operating threshold subject to false-positive rate constraint.
        """
        benign_mask = (y_true_binary == 0)
        best_f1 = -1.0
        best_thresh = 0.40

        for t in np.linspace(0.15, 0.85, 71):
            preds = (risk_scores >= t).astype(int)
            tp = np.sum((preds == 1) & (y_true_binary == 1))
            fp = np.sum((preds == 1) & (y_true_binary == 0))
            fn = np.sum((preds == 0) & (y_true_binary == 1))
            tn = np.sum((preds == 0) & (y_true_binary == 0))

            fpr = fp / max(1, (fp + tn))
            precision = tp / max(1, (tp + fp))
            recall = tp / max(1, (tp + fn))
            f1 = 2 * (precision * recall) / max(1e-6, (precision + recall))

            if fpr <= target_max_fpr and f1 > best_f1:
                best_f1 = f1
                best_thresh = t

        self.threshold_normal = float(round(best_thresh, 3))
        self.threshold_suspicious = float(round(min(0.85, self.threshold_normal + 0.20), 3))
        self.threshold_high = float(round(min(0.95, self.threshold_suspicious + 0.15), 3))

        return {
            "threshold_normal": self.threshold_normal,
            "threshold_suspicious": self.threshold_suspicious,
            "threshold_high": self.threshold_high,
            "validation_f1_at_threshold": round(float(best_f1), 4),
        }

    def categorize_risk(self, risk_score: float) -> Tuple[str, str]:
        """
        Maps a scalar risk score to:
        (prediction, severity_label)
        e.g. ('NORMAL', 'LOW'), ('SUSPICIOUS', 'MEDIUM'), ('MALICIOUS', 'HIGH'), ('MALICIOUS', 'CRITICAL')
        """
        if risk_score < self.threshold_normal:
            return "NORMAL", "LOW"
        elif risk_score < self.threshold_suspicious:
            return "SUSPICIOUS", "MEDIUM"
        elif risk_score < self.threshold_high:
            return "MALICIOUS", "HIGH"
        else:
            return "MALICIOUS", "CRITICAL"

    def score_single(
        self,
        behavioral_anomaly: float,
        payload_score: float,
        auth_score: float,
        rate_score: float,
        classifier_prob: float,
    ) -> Tuple[float, str, str]:
        """Scores a single request and returns (risk_score, prediction, severity)."""
        signals = np.array([
            [behavioral_anomaly, payload_score, auth_score, rate_score, classifier_prob]
        ], dtype=np.float64)
        risk = float(round(np.dot(signals, self.weights)[0], 4))
        risk = min(1.0, max(0.0, risk))
        prediction, severity = self.categorize_risk(risk)
        return risk, prediction, severity

    def save(self, filepath: str) -> None:
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        joblib.dump(self, filepath)

    @classmethod
    def load(cls, filepath: str) -> "HybridRiskFusion":
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"Hybrid fusion artifact not found at {filepath}")
        return joblib.load(filepath)
