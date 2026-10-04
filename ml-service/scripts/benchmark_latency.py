#!/usr/bin/env python3
"""
Real-Time Inference Latency & Resource Profiling Benchmark
Part of API Sentinel ML Service

Benchmarks:
1. Feature extraction latency (Behavioral vs Payload vs Fused)
2. Model inference latency (Isolation Forest, Payload Classifier, Supervised, Hybrid Fusion)
3. End-to-end single-request pipeline latency distribution (P50, P90, P95, P99)
4. Throughput (Requests per second)
5. Memory footprint and artifact disk sizes
"""

import argparse
import json
import os
import platform
import sys
import time
import tracemalloc
from typing import Dict, List, Any

import numpy as np

try:
    import psutil
except ImportError:
    psutil = None

# Add parent directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.features.pipeline import UnifiedFeaturePipeline
from app.models.anomaly import BehavioralAnomalyDetector
from app.models.classifier import PayloadClassifier, SupervisedAttackClassifier
from app.models.hybrid import HybridRiskFusion
from app.models.explain import PredictionExplainer


def benchmark_pipeline(
    artifacts_dir: str = "models/artifacts",
    n_iterations: int = 1000,
    output_path: str = "docs/latency_benchmark.json",
) -> Dict[str, Any]:
    print(f"[*] Loading ML artifacts from {artifacts_dir}...")
    pipeline = UnifiedFeaturePipeline.load(os.path.join(artifacts_dir, "feature_pipeline.joblib"))
    anomaly_detector = BehavioralAnomalyDetector.load(os.path.join(artifacts_dir, "anomaly_detector.joblib"))
    payload_clf = PayloadClassifier.load(os.path.join(artifacts_dir, "payload_classifier.joblib"))
    supervised_clf = SupervisedAttackClassifier.load(os.path.join(artifacts_dir, "supervised_classifier.joblib"))
    hybrid_fusion = HybridRiskFusion.load(os.path.join(artifacts_dir, "hybrid_fusion.joblib"))

    # Sample requests representing varied workloads
    sample_requests = [
        {
            "timestamp": "2026-03-15T12:00:00",
            "source_ip": "192.168.1.45",
            "method": "GET",
            "endpoint": "/api/v1/products/42",
            "status_code": 200,
            "response_time": 24.5,
            "request_size": 120,
            "response_size": 850,
            "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0",
            "authentication_status": "AUTHENTICATED",
            "requests_per_minute": 12,
            "failed_requests": 0,
            "unique_endpoints": 3,
            "payload": "",
        },
        {
            "timestamp": "2026-03-15T12:00:01",
            "source_ip": "198.51.100.12",
            "method": "POST",
            "endpoint": "/api/v1/auth/login",
            "status_code": 401,
            "response_time": 45.0,
            "request_size": 280,
            "response_size": 150,
            "user_agent": "sqlmap/1.7.2#stable",
            "authentication_status": "FAILED",
            "requests_per_minute": 85,
            "failed_requests": 14,
            "unique_endpoints": 2,
            "payload": "' OR '1'='1 --",
        },
        {
            "timestamp": "2026-03-15T12:00:02",
            "source_ip": "198.51.100.25",
            "method": "POST",
            "endpoint": "/api/v1/system/ping",
            "status_code": 500,
            "response_time": 180.2,
            "request_size": 320,
            "response_size": 400,
            "user_agent": "curl/7.88.1",
            "authentication_status": "UNAUTHENTICATED",
            "requests_per_minute": 30,
            "failed_requests": 6,
            "unique_endpoints": 4,
            "payload": "127.0.0.1; cat /etc/passwd",
        },
    ]

    print(f"[*] Warming up pipeline with 50 iterations...")
    for _ in range(50):
        req = sample_requests[0]
        x_beh, x_pay, x_fused = pipeline.transform_single(dict(req))
        _ = anomaly_detector.predict_anomaly(x_beh)
        _ = payload_clf.predict_score(x_pay)
        _ = supervised_clf.predict_detailed(x_fused)

    print(f"[*] Benchmarking {n_iterations} end-to-end single-request inference cycles...")

    latencies_feature: List[float] = []
    latencies_anomaly: List[float] = []
    latencies_payload: List[float] = []
    latencies_supervised: List[float] = []
    latencies_fusion: List[float] = []
    latencies_explain: List[float] = []
    latencies_total: List[float] = []

    if psutil:
        process = psutil.Process()
        mem_before_mb = process.memory_info().rss / (1024 * 1024)
    else:
        tracemalloc.start()
        mem_before_mb = 0.0

    start_bench_time = time.perf_counter()

    for i in range(n_iterations):
        req = sample_requests[i % len(sample_requests)]

        t0 = time.perf_counter()

        # Step 1: Feature Extraction
        t_feat0 = time.perf_counter()
        x_beh, x_pay, x_fused = pipeline.transform_single(dict(req))
        t_feat1 = time.perf_counter()

        # Step 2: Anomaly Detection
        t_anom0 = time.perf_counter()
        is_anom, anom_score = anomaly_detector.score_single(x_beh)
        t_anom1 = time.perf_counter()

        # Step 3: Payload Classification
        t_pay0 = time.perf_counter()
        pay_score = payload_clf.score_single(x_pay)
        t_pay1 = time.perf_counter()

        # Step 4: Supervised Classification
        t_sup0 = time.perf_counter()
        pred_classes, confs, mal_probs = supervised_clf.predict_detailed(x_fused)
        t_sup1 = time.perf_counter()

        # Step 5: Hybrid Risk Fusion
        t_fuse0 = time.perf_counter()
        auth_score = 1.0 if str(req.get("authentication_status")).upper() == "FAILED" else 0.0
        rate_score = min(1.0, float(req.get("requests_per_minute", 1)) / 100.0)
        risk_score, prediction, severity = hybrid_fusion.score_single(
            anom_score, pay_score, auth_score, rate_score, mal_probs[0]
        )
        t_fuse1 = time.perf_counter()

        # Step 6: Explainability
        t_exp0 = time.perf_counter()
        reasons = PredictionExplainer.explain(
            req, risk_score, anom_score, pay_score, pred_classes[0]
        )
        t_exp1 = time.perf_counter()

        t_end = time.perf_counter()

        latencies_feature.append((t_feat1 - t_feat0) * 1000)
        latencies_anomaly.append((t_anom1 - t_anom0) * 1000)
        latencies_payload.append((t_pay1 - t_pay0) * 1000)
        latencies_supervised.append((t_sup1 - t_sup0) * 1000)
        latencies_fusion.append((t_fuse1 - t_fuse0) * 1000)
        latencies_explain.append((t_exp1 - t_exp0) * 1000)
        latencies_total.append((t_end - t0) * 1000)

    total_bench_duration = time.perf_counter() - start_bench_time
    if psutil:
        mem_after_mb = process.memory_info().rss / (1024 * 1024)
    else:
        current, peak = tracemalloc.get_traced_memory()
        tracemalloc.stop()
        mem_after_mb = peak / (1024 * 1024)
    rps = n_iterations / total_bench_duration

    # Compute percentiles
    def pstats(arr: List[float]) -> Dict[str, float]:
        a = np.array(arr)
        return {
            "mean": round(float(np.mean(a)), 3),
            "std": round(float(np.std(a)), 3),
            "p50": round(float(np.percentile(a, 50)), 3),
            "p90": round(float(np.percentile(a, 90)), 3),
            "p95": round(float(np.percentile(a, 95)), 3),
            "p99": round(float(np.percentile(a, 99)), 3),
            "min": round(float(np.min(a)), 3),
            "max": round(float(np.max(a)), 3),
        }

    # Artifact disk sizes
    artifact_sizes = {}
    for fname in os.listdir(artifacts_dir):
        fpath = os.path.join(artifacts_dir, fname)
        if os.path.isfile(fpath):
            artifact_sizes[fname] = f"{os.path.getsize(fpath) / (1024 * 1024):.2f} MB"

    results = {
        "benchmark_metadata": {
            "iterations": n_iterations,
            "os": platform.system(),
            "os_release": platform.release(),
            "cpu_architecture": platform.machine(),
            "python_version": platform.python_version(),
            "total_benchmark_time_seconds": round(total_bench_duration, 2),
            "throughput_rps": round(rps, 2),
            "memory_usage_mb": round(mem_after_mb, 2),
            "memory_delta_mb": round(mem_after_mb - mem_before_mb, 2),
        },
        "artifact_sizes": artifact_sizes,
        "latency_breakdown_ms": {
            "feature_extraction": pstats(latencies_feature),
            "isolation_forest": pstats(latencies_anomaly),
            "payload_classifier": pstats(latencies_payload),
            "supervised_classifier": pstats(latencies_supervised),
            "risk_fusion": pstats(latencies_fusion),
            "explainability": pstats(latencies_explain),
            "end_to_end_total": pstats(latencies_total),
        },
    }

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)

    print("\n==================================================")
    print("BENCHMARK REPORT SUMMARY")
    print("==================================================")
    print(f"Throughput:         {rps:.2f} requests/second")
    print(f"End-to-End P50:     {results['latency_breakdown_ms']['end_to_end_total']['p50']} ms")
    print(f"End-to-End P95:     {results['latency_breakdown_ms']['end_to_end_total']['p95']} ms")
    print(f"End-to-End P99:     {results['latency_breakdown_ms']['end_to_end_total']['p99']} ms")
    print(f"End-to-End Mean:    {results['latency_breakdown_ms']['end_to_end_total']['mean']} ms (± {results['latency_breakdown_ms']['end_to_end_total']['std']} ms)")
    print(f"Memory Footprint:   {mem_after_mb:.2f} MB")
    print(f"Artifact Disk Sizes: {artifact_sizes}")
    print(f"[+] Detailed JSON saved to {output_path}")

    return results


def main():
    parser = argparse.ArgumentParser(description="Benchmark ML Inference Pipeline")
    parser.add_argument("--artifacts", type=str, default="models/artifacts", help="Path to model artifacts")
    parser.add_argument("--iterations", type=int, default=1000, help="Number of test iterations")
    parser.add_argument("--output", type=str, default="docs/latency_benchmark.json", help="Output JSON path")
    args = parser.parse_args()

    benchmark_pipeline(args.artifacts, args.iterations, args.output)


if __name__ == "__main__":
    main()
