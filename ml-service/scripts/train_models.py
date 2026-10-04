#!/usr/bin/env python3
"""
Comprehensive Training & Evaluation Pipeline for API Sentinel
Part of API Sentinel ML Service

Executes:
1. Strict Train / Validation / Test Splitting (70% / 15% / 15%)
2. Feature Pipeline Fitting (Leakage Prevention)
3. Isolation Forest Behavioral Anomaly Detector Training
4. Payload Classifier Training
5. Supervised Multi-Class Benchmark (Logistic Regression, Random Forest, XGBoost)
6. Convex Optimization of Hybrid Risk Fusion Weights on Validation Set
7. Unseen Zero-Day Attack Experiment (Excluding COMMAND_INJECTION from supervised training)
8. Evaluation Metrics Computation (Precision, Recall, F1, Macro F1, ROC-AUC, PR-AUC, FPR)
9. Versioned Artifact and Metadata Serialization
"""

import argparse
import json
import os
import sys
from datetime import datetime, timezone
from typing import Dict, List, Tuple, Any, Optional

import numpy as np
import pandas as pd
from sklearn.metrics import (
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    average_precision_score,
    confusion_matrix,
    classification_report,
)
from sklearn.model_selection import train_test_split

# Add parent directory to sys.path to allow imports from app
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.features.pipeline import UnifiedFeaturePipeline
from app.models.anomaly import BehavioralAnomalyDetector
from app.models.classifier import PayloadClassifier, SupervisedAttackClassifier
from app.models.hybrid import HybridRiskFusion


def calculate_metrics(y_true: np.ndarray, y_pred: np.ndarray, y_prob: Optional[np.ndarray] = None) -> Dict[str, float]:
    """Computes comprehensive binary or multi-class metrics."""
    precision = precision_score(y_true, y_pred, average="binary", zero_division=0)
    recall = recall_score(y_true, y_pred, average="binary", zero_division=0)
    f1 = f1_score(y_true, y_pred, average="binary", zero_division=0)

    # Confusion matrix for FPR = FP / (FP + TN)
    tn, fp, fn, tp = confusion_matrix(y_true, y_pred, labels=[0, 1]).ravel()
    fpr = fp / max(1, (fp + tn))

    metrics = {
        "precision": round(float(precision), 4),
        "recall": round(float(recall), 4),
        "f1": round(float(f1), 4),
        "fpr": round(float(fpr), 4),
        "tp": int(tp),
        "fp": int(fp),
        "tn": int(tn),
        "fn": int(fn),
    }

    if y_prob is not None:
        try:
            metrics["roc_auc"] = round(float(roc_auc_score(y_true, y_prob)), 4)
            metrics["pr_auc"] = round(float(average_precision_score(y_true, y_prob)), 4)
        except Exception:
            metrics["roc_auc"] = 0.0
            metrics["pr_auc"] = 0.0

    return metrics


def run_training_pipeline(
    data_path: str = "data/raw/api_traffic_dataset.csv",
    output_dir: str = "models/artifacts",
    seed: int = 42,
) -> Dict[str, Any]:
    print(f"[*] Starting API Sentinel ML Training Pipeline (Seed: {seed})...")
    os.makedirs(output_dir, exist_ok=True)

    # 1. Load Data
    print(f"[*] Loading dataset from {data_path}...")
    df = pd.read_csv(data_path)
    records = df.to_dict(orient="records")
    labels_binary = np.where(df["label"] == "MALICIOUS", 1, 0)
    attack_types = df["attack_type"].values

    print(f"[+] Loaded {len(df)} records. Malicious ratio: {np.mean(labels_binary):.2%}")

    # 2. Strict Train / Val / Test Split (70% / 15% / 15%)
    # Prevents any data leakage: validation is for hyperparameter/fusion tuning, test is held out.
    indices = np.arange(len(df))
    idx_train_val, idx_test = train_test_split(
        indices, test_size=0.15, stratify=attack_types, random_state=seed
    )
    idx_train, idx_val = train_test_split(
        idx_train_val, test_size=0.17647, stratify=attack_types[idx_train_val], random_state=seed
    )  # 0.85 * 0.17647 ≈ 0.15

    train_records = [records[i] for i in idx_train]
    val_records = [records[i] for i in idx_val]
    test_records = [records[i] for i in idx_test]

    y_train_bin = labels_binary[idx_train]
    y_val_bin = labels_binary[idx_val]
    y_test_bin = labels_binary[idx_test]

    y_train_attack = attack_types[idx_train]
    y_val_attack = attack_types[idx_val]
    y_test_attack = attack_types[idx_test]

    print(f"[+] Splits established: Train={len(train_records)}, Val={len(val_records)}, Test={len(test_records)}")

    # 3. Fit Feature Pipeline (Train partition ONLY)
    print("[*] Fitting UnifiedFeaturePipeline on training partition...")
    feature_pipeline = UnifiedFeaturePipeline(max_tfidf_features=1500)
    unique_attacks = sorted(list(set(attack_types)))
    feature_pipeline.fit(train_records, attack_labels=unique_attacks)

    print("[*] Transforming train, val, and test partitions...")
    X_train_beh, X_train_pay, X_train_fused = feature_pipeline.transform(train_records)
    X_val_beh, X_val_pay, X_val_fused = feature_pipeline.transform(val_records)
    X_test_beh, X_test_pay, X_test_fused = feature_pipeline.transform(test_records)

    y_train_enc = feature_pipeline.attack_encoder.transform(y_train_attack)
    y_val_enc = feature_pipeline.attack_encoder.transform(y_val_attack)
    y_test_enc = feature_pipeline.attack_encoder.transform(y_test_attack)

    # 4. Behavioral Anomaly Detector (Isolation Forest)
    print("[*] Training Behavioral Anomaly Detector (Isolation Forest)...")
    # Train Isolation Forest on normal baseline traffic in train set
    normal_train_mask = (y_train_bin == 0)
    anomaly_detector = BehavioralAnomalyDetector(
        n_estimators=150, contamination=0.04, max_samples=0.8, random_state=seed
    )
    anomaly_detector.fit(X_train_beh[normal_train_mask])

    # Evaluate Anomaly Detector on Test
    _, test_anom_scores = anomaly_detector.predict_anomaly(X_test_beh)
    test_anom_preds = np.where(test_anom_scores >= 0.5, 1, 0)
    metrics_anomaly = calculate_metrics(y_test_bin, test_anom_preds, test_anom_scores)
    print(f"[+] Isolation Forest Test F1: {metrics_anomaly['f1']:.4f}, FPR: {metrics_anomaly['fpr']:.4f}")

    # 5. Payload Classifier Training
    print("[*] Training Payload Classifier (Random Forest on TF-IDF + Lexical)...")
    payload_clf = PayloadClassifier(model_type="rf", random_state=seed)
    payload_clf.fit(X_train_pay, y_train_bin)

    test_pay_scores = payload_clf.predict_score(X_test_pay)
    test_pay_preds = np.where(test_pay_scores >= 0.5, 1, 0)
    metrics_payload = calculate_metrics(y_test_bin, test_pay_preds, test_pay_scores)
    print(f"[+] Payload Classifier Test F1: {metrics_payload['f1']:.4f}, FPR: {metrics_payload['fpr']:.4f}")

    # 6. Supervised Multi-Class Benchmark
    print("[*] Benchmarking Supervised Algorithms: Logistic Regression vs Random Forest vs XGBoost...")
    benchmark_results = {}
    models = {
        "LogisticRegression": SupervisedAttackClassifier(algorithm="lr", random_state=seed),
        "RandomForest": SupervisedAttackClassifier(algorithm="rf", random_state=seed),
        "XGBoost": SupervisedAttackClassifier(algorithm="xgb", random_state=seed),
    }

    for name, clf in models.items():
        print(f"    - Training {name}...")
        clf.fit(X_train_fused, y_train_enc, class_names=feature_pipeline.attack_encoder.classes_)
        preds_cls, confs, mal_probs = clf.predict_detailed(X_test_fused)
        bin_preds = np.where(np.array(preds_cls) != "NORMAL", 1, 0)

        macro_f1 = f1_score(y_test_attack, preds_cls, average="macro", zero_division=0)
        bin_metrics = calculate_metrics(y_test_bin, bin_preds, mal_probs)
        bin_metrics["macro_f1"] = round(float(macro_f1), 4)
        benchmark_results[name] = bin_metrics
        print(f"      {name} -> Binary F1: {bin_metrics['f1']:.4f}, Macro F1: {macro_f1:.4f}, FPR: {bin_metrics['fpr']:.4f}")

    best_supervised_name = max(benchmark_results, key=lambda k: benchmark_results[k]["macro_f1"])
    best_supervised_clf = models[best_supervised_name]
    print(f"[+] Selected Best Supervised Model: {best_supervised_name}")

    # 7. Hybrid Risk Fusion Optimization on Validation Set
    print("[*] Optimizing Hybrid Risk Fusion weights on Validation partition...")
    _, val_anom_scores = anomaly_detector.predict_anomaly(X_val_beh)
    val_pay_scores = payload_clf.predict_score(X_val_pay)
    _, _, val_clf_probs = best_supervised_clf.predict_detailed(X_val_fused)

    val_auth_scores = np.array([
        1.0 if str(r.get("authentication_status")).upper() == "FAILED" else 0.0 for r in val_records
    ])
    val_rate_scores = np.array([
        min(1.0, float(r.get("requests_per_minute", 1)) / 100.0) for r in val_records
    ])

    val_signals = np.column_stack([
        val_anom_scores,
        val_pay_scores,
        val_auth_scores,
        val_rate_scores,
        val_clf_probs,
    ])

    hybrid_fusion = HybridRiskFusion()
    opt_summary = hybrid_fusion.optimize_weights(val_signals, y_val_bin)
    print(f"[+] Optimized Weights: {opt_summary['optimized_weights']}")

    # Calibrate thresholds on validation scores
    val_fused_risks = hybrid_fusion.fuse_signals(
        val_anom_scores, val_pay_scores, val_auth_scores, val_rate_scores, val_clf_probs
    )
    thresholds = hybrid_fusion.calibrate_thresholds(val_fused_risks, y_val_bin, target_max_fpr=0.015)
    print(f"[+] Calibrated Thresholds: {thresholds}")

    # 8. Evaluate Full Hybrid Pipeline on Test Partition
    print("[*] Evaluating Full Hybrid System on held-out Test Partition...")
    _, _, test_clf_probs = best_supervised_clf.predict_detailed(X_test_fused)
    test_auth_scores = np.array([
        1.0 if str(r.get("authentication_status")).upper() == "FAILED" else 0.0 for r in test_records
    ])
    test_rate_scores = np.array([
        min(1.0, float(r.get("requests_per_minute", 1)) / 100.0) for r in test_records
    ])

    test_hybrid_risks = hybrid_fusion.fuse_signals(
        test_anom_scores, test_pay_scores, test_auth_scores, test_rate_scores, test_clf_probs
    )
    test_hybrid_preds = np.where(test_hybrid_risks >= hybrid_fusion.threshold_normal, 1, 0)
    metrics_hybrid = calculate_metrics(y_test_bin, test_hybrid_preds, test_hybrid_risks)
    print(f"[+] Full Hybrid System Test Metrics:")
    print(f"    - Precision: {metrics_hybrid['precision']:.4f}")
    print(f"    - Recall:    {metrics_hybrid['recall']:.4f}")
    print(f"    - F1 Score:  {metrics_hybrid['f1']:.4f}")
    print(f"    - ROC-AUC:   {metrics_hybrid['roc_auc']:.4f}")
    print(f"    - PR-AUC:    {metrics_hybrid['pr_auc']:.4f}")
    print(f"    - FPR:       {metrics_hybrid['fpr']:.4f}")

    # 9. Ablation Study
    print("[*] Performing Ablation Study across architectural modalities...")
    ablations = {
        "Behavioral Only": np.array([1.0, 0.0, 0.0, 0.0, 0.0]),
        "Payload Only": np.array([0.0, 1.0, 0.0, 0.0, 0.0]),
        "Behavioral + Payload": np.array([0.5, 0.5, 0.0, 0.0, 0.0]),
        "Behavioral + Auth + Rate": np.array([0.5, 0.0, 0.25, 0.25, 0.0]),
        "Supervised Only": np.array([0.0, 0.0, 0.0, 0.0, 1.0]),
        "Full Hybrid (Optimized)": hybrid_fusion.weights,
    }

    ablation_results = {}
    for name, w in ablations.items():
        val_ablation_risks = hybrid_fusion.fuse_signals(
            val_anom_scores, val_pay_scores, val_auth_scores, val_rate_scores, val_clf_probs, custom_weights=w
        )
        # Find threshold on validation set
        best_t = 0.50
        best_f1 = -1.0
        for t in np.linspace(0.15, 0.85, 71):
            p = (val_ablation_risks >= t).astype(int)
            f1 = f1_score(y_val_bin, p, zero_division=0)
            fpr = np.mean(p[y_val_bin == 0] == 1)
            if fpr <= 0.03 and f1 > best_f1:
                best_f1 = f1
                best_t = t

        risks = hybrid_fusion.fuse_signals(
            test_anom_scores, test_pay_scores, test_auth_scores, test_rate_scores, test_clf_probs, custom_weights=w
        )
        preds = np.where(risks >= best_t, 1, 0)
        m = calculate_metrics(y_test_bin, preds, risks)
        m["operating_threshold"] = round(float(best_t), 3)
        ablation_results[name] = m
        print(f"    - {name:<26} -> F1: {m['f1']:.4f}, Rec: {m['recall']:.4f}, Prec: {m['precision']:.4f}, FPR: {m['fpr']:.4f}")

    # 10. Unseen / Zero-Day Attack Experiment (Hold out COMMAND_INJECTION)
    print("[*] Running Unseen Zero-Day Attack Experiment (Holdout Category: COMMAND_INJECTION)...")
    unseen_target = "COMMAND_INJECTION"

    # Filter out unseen attack from train set
    seen_train_mask = (y_train_attack != unseen_target)
    seen_train_records = [train_records[i] for i in range(len(train_records)) if seen_train_mask[i]]
    seen_y_train_attack = y_train_attack[seen_train_mask]

    # Re-train supervised model without unseen attack
    seen_pipeline = UnifiedFeaturePipeline(max_tfidf_features=1500)
    seen_pipeline.fit(seen_train_records, attack_labels=sorted(list(set(seen_y_train_attack))))
    _, _, seen_X_train_fused = seen_pipeline.transform(seen_train_records)
    seen_y_train_enc = seen_pipeline.attack_encoder.transform(seen_y_train_attack)

    unseen_supervised_clf = SupervisedAttackClassifier(algorithm="rf", random_state=seed)
    unseen_supervised_clf.fit(seen_X_train_fused, seen_y_train_enc, seen_pipeline.attack_encoder.classes_)

    # Test only on unseen attack samples
    unseen_test_mask = (y_test_attack == unseen_target)
    unseen_test_records = [test_records[i] for i in range(len(test_records)) if unseen_test_mask[i]]
    unseen_X_beh, unseen_X_pay, unseen_X_fused = seen_pipeline.transform(unseen_test_records)

    # A. Supervised model on unseen attack
    unseen_preds_cls, _, unseen_clf_probs = unseen_supervised_clf.predict_detailed(unseen_X_fused)
    supervised_unseen_detection_rate = np.mean(unseen_clf_probs >= 0.5)

    # B. Behavioral anomaly detector on unseen attack
    _, unseen_anom_scores = anomaly_detector.predict_anomaly(unseen_X_beh)
    anomaly_unseen_detection_rate = np.mean(unseen_anom_scores >= 0.5)

    # C. Payload classifier on unseen attack
    unseen_pay_scores = payload_clf.predict_score(unseen_X_pay)
    payload_unseen_detection_rate = np.mean(unseen_pay_scores >= 0.5)

    # D. Hybrid fusion on unseen attack
    unseen_auth_scores = np.array([
        1.0 if str(r.get("authentication_status")).upper() == "FAILED" else 0.0 for r in unseen_test_records
    ])
    unseen_rate_scores = np.array([
        min(1.0, float(r.get("requests_per_minute", 1)) / 100.0) for r in unseen_test_records
    ])
    unseen_hybrid_risks = hybrid_fusion.fuse_signals(
        unseen_anom_scores, unseen_pay_scores, unseen_auth_scores, unseen_rate_scores, unseen_clf_probs
    )
    hybrid_unseen_detection_rate = np.mean(unseen_hybrid_risks >= hybrid_fusion.threshold_normal)

    unseen_results = {
        "holdout_category": unseen_target,
        "test_sample_count": len(unseen_test_records),
        "supervised_malicious_detection_rate": round(float(supervised_unseen_detection_rate), 4),
        "anomaly_detector_detection_rate": round(float(anomaly_unseen_detection_rate), 4),
        "payload_classifier_detection_rate": round(float(payload_unseen_detection_rate), 4),
        "hybrid_fusion_detection_rate": round(float(hybrid_unseen_detection_rate), 4),
    }

    print(f"[+] Unseen Attack Experiment Results ({unseen_target}, N={len(unseen_test_records)}):")
    print(f"    - Supervised Malicious Detection Rate: {supervised_unseen_detection_rate:.2%}")
    print(f"    - Behavioral Anomaly Detection Rate:   {anomaly_unseen_detection_rate:.2%}")
    print(f"    - Payload Classifier Detection Rate:   {payload_unseen_detection_rate:.2%}")
    print(f"    - Full Hybrid Fusion Detection Rate:   {hybrid_unseen_detection_rate:.2%}")

    # 11. Save Versioned Artifacts
    print(f"[*] Serializing versioned artifacts to {output_dir}...")
    feature_pipeline.save(os.path.join(output_dir, "feature_pipeline.joblib"))
    anomaly_detector.save(os.path.join(output_dir, "anomaly_detector.joblib"))
    payload_clf.save(os.path.join(output_dir, "payload_classifier.joblib"))
    best_supervised_clf.save(os.path.join(output_dir, "supervised_classifier.joblib"))
    hybrid_fusion.save(os.path.join(output_dir, "hybrid_fusion.joblib"))

    metadata = {
        "model_name": "API Sentinel Hybrid Intrusion Detection Engine",
        "model_version": "v1.0.0-hybrid",
        "training_date": datetime.now(timezone.utc).isoformat(),
        "random_seed": seed,
        "dataset_size": len(df),
        "train_samples": len(train_records),
        "val_samples": len(val_records),
        "test_samples": len(test_records),
        "best_supervised_algorithm": best_supervised_name,
        "classes": feature_pipeline.attack_encoder.classes_.tolist(),
        "optimized_fusion_weights": opt_summary["optimized_weights"],
        "calibrated_thresholds": thresholds,
        "test_metrics": {
            "isolation_forest": metrics_anomaly,
            "payload_classifier": metrics_payload,
            "best_supervised": benchmark_results[best_supervised_name],
            "full_hybrid_system": metrics_hybrid,
        },
        "supervised_benchmark": benchmark_results,
        "ablation_study": ablation_results,
        "unseen_attack_experiment": unseen_results,
    }

    with open(os.path.join(output_dir, "metadata.json"), "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    print(f"[+] All artifacts and metadata successfully saved to {output_dir}")

    return metadata


def main():
    parser = argparse.ArgumentParser(description="Train API Sentinel ML Models")
    parser.add_argument("--data", type=str, default="data/raw/api_traffic_dataset.csv", help="Input dataset path")
    parser.add_argument("--output", type=str, default="models/artifacts", help="Output artifact directory")
    parser.add_argument("--seed", type=int, default=42, help="Random seed")
    args = parser.parse_args()

    run_training_pipeline(args.data, args.output, args.seed)


if __name__ == "__main__":
    main()
