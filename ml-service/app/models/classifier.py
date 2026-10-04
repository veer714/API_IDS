"""
Supervised Attack Classification Pipeline
Part of API Sentinel ML Service

Implements multi-class attack classification and standalone payload maliciousness scoring.
Evaluates and benchmarks Logistic Regression, Random Forest, and XGBoost models.
"""

import os
from typing import Dict, List, Optional, Tuple, Any

import joblib
import numpy as np
from scipy.sparse import csr_matrix
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from xgboost import XGBClassifier


class PayloadClassifier:
    """
    Supervised binary or multi-class classifier focused exclusively on payload features
    (lexical metrics + TF-IDF n-grams) to assign a dedicated payload maliciousness score.
    """

    def __init__(self, model_type: str = "rf", random_state: int = 42):
        self.model_type = model_type
        self.random_state = random_state

        if model_type == "rf":
            self.model = RandomForestClassifier(
                n_estimators=100,
                max_depth=14,
                class_weight="balanced",
                random_state=random_state,
                n_jobs=-1,
            )
        elif model_type == "lr":
            self.model = LogisticRegression(
                class_weight="balanced",
                max_iter=1000,
                random_state=random_state,
            )
        elif model_type == "xgb":
            self.model = XGBClassifier(
                n_estimators=100,
                max_depth=5,
                learning_rate=0.1,
                random_state=random_state,
                eval_metric="logloss",
                n_jobs=-1,
            )
        else:
            raise ValueError(f"Unknown payload model type: {model_type}")

        self.is_fitted = False

    def fit(self, X_payload: csr_matrix, y_binary: np.ndarray) -> "PayloadClassifier":
        self.model.fit(X_payload, y_binary)
        self.is_fitted = True
        return self

    def predict_score(self, X_payload: csr_matrix) -> np.ndarray:
        """Returns probability of payload being malicious in [0, 1]."""
        if not self.is_fitted:
            raise RuntimeError("PayloadClassifier must be fitted before predict_score().")
        probs = self.model.predict_proba(X_payload)
        # Class 1 is MALICIOUS
        return probs[:, 1] if probs.shape[1] > 1 else np.zeros(X_payload.shape[0])

    def score_single(self, x_payload: csr_matrix) -> float:
        score = self.predict_score(x_payload)[0]
        return float(round(score, 4))

    def save(self, filepath: str) -> None:
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        joblib.dump(self, filepath)

    @classmethod
    def load(cls, filepath: str) -> "PayloadClassifier":
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"PayloadClassifier artifact not found at {filepath}")
        return joblib.load(filepath)


class SupervisedAttackClassifier:
    """
    Multi-class classifier for detecting specific attack categories across fused features.
    Supports Logistic Regression, Random Forest, and XGBoost.
    """

    def __init__(self, algorithm: str = "rf", random_state: int = 42):
        self.algorithm = algorithm
        self.random_state = random_state
        self.classes_: List[str] = []

        if algorithm == "lr":
            self.model = LogisticRegression(
                class_weight="balanced",
                max_iter=1000,
                random_state=random_state,
            )
        elif algorithm == "rf":
            self.model = RandomForestClassifier(
                n_estimators=150,
                max_depth=16,
                class_weight="balanced",
                random_state=random_state,
                n_jobs=-1,
            )
        elif algorithm == "xgb":
            self.model = XGBClassifier(
                n_estimators=150,
                max_depth=6,
                learning_rate=0.1,
                random_state=random_state,
                eval_metric="mlogloss",
                n_jobs=-1,
            )
        else:
            raise ValueError(f"Unsupported algorithm: {algorithm}")

        self.is_fitted = False

    def fit(self, X_fused: csr_matrix, y_encoded: np.ndarray, class_names: List[str]) -> "SupervisedAttackClassifier":
        self.classes_ = list(class_names)
        self.model.fit(X_fused, y_encoded)
        self.is_fitted = True
        return self

    def predict(self, X_fused: csr_matrix) -> np.ndarray:
        return self.model.predict(X_fused)

    def predict_proba(self, X_fused: csr_matrix) -> np.ndarray:
        return self.model.predict_proba(X_fused)

    def predict_detailed(self, X_fused: csr_matrix) -> Tuple[List[str], np.ndarray, np.ndarray]:
        """
        Returns:
        1. Predicted class names (e.g. ['SQL_INJECTION', ...])
        2. Top-1 class confidence scores
        3. Binary maliciousness probability (sum of probabilities for non-NORMAL classes)
        """
        if not self.is_fitted:
            raise RuntimeError("Classifier must be fitted before predict_detailed().")

        probs = self.predict_proba(X_fused)
        top_indices = np.argmax(probs, axis=1)
        predicted_classes = [self.classes_[i] for i in top_indices]
        confidences = np.max(probs, axis=1)

        # Malicious probability = 1.0 - P(NORMAL)
        normal_idx = self.classes_.index("NORMAL") if "NORMAL" in self.classes_ else -1
        if normal_idx != -1:
            malicious_probs = 1.0 - probs[:, normal_idx]
        else:
            malicious_probs = np.where(np.array(predicted_classes) != "NORMAL", 1.0, 0.0)

        return predicted_classes, confidences, malicious_probs

    def save(self, filepath: str) -> None:
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        joblib.dump(self, filepath)

    @classmethod
    def load(cls, filepath: str) -> "SupervisedAttackClassifier":
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"Classifier artifact not found at {filepath}")
        return joblib.load(filepath)
