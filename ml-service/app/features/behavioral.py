"""
Behavioral & Temporal Feature Extraction Pipeline
Part of API Sentinel ML Service

Extracts statistical, temporal, and rate-based behavioral signals from API request telemetry.
Guarantees zero future lookahead (strictly causal/past-only windows).
"""

import math
from collections import defaultdict, deque
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional, Tuple, Any

import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler


class TrafficStateTracker:
    """
    Sliding window in-memory state tracker for live API traffic.
    Maintains per-IP event history to compute causal temporal features
    (requests/min, failed requests/5min, unique endpoints/5min) in real time
    without data leakage.
    """

    def __init__(self, window_1m_seconds: int = 60, window_5m_seconds: int = 300):
        self.window_1m = timedelta(seconds=window_1m_seconds)
        self.window_5m = timedelta(seconds=window_5m_seconds)
        self._ip_requests: Dict[str, deque] = defaultdict(deque)
        self._ip_failures: Dict[str, deque] = defaultdict(deque)
        self._ip_endpoints: Dict[str, deque] = defaultdict(deque)

    def record_and_compute(
        self,
        ip: str,
        endpoint: str,
        status_code: int,
        timestamp: Optional[datetime] = None,
    ) -> Tuple[int, int, int]:
        """
        Records the current event and returns (requests_per_minute, failed_requests, unique_endpoints)
        strictly using past events.
        """
        now = timestamp or datetime.now(timezone.utc)

        # Prune expired timestamps
        cutoff_1m = now - self.window_1m
        cutoff_5m = now - self.window_5m

        req_dq = self._ip_requests[ip]
        while req_dq and req_dq[0] < cutoff_1m:
            req_dq.popleft()

        fail_dq = self._ip_failures[ip]
        while fail_dq and fail_dq[0] < cutoff_5m:
            fail_dq.popleft()

        ep_dq = self._ip_endpoints[ip]
        while ep_dq and ep_dq[0][0] < cutoff_5m:
            ep_dq.popleft()

        # Compute counts based on past window + this request
        requests_per_minute = len(req_dq) + 1
        failed_requests = len(fail_dq) + (1 if status_code >= 400 else 0)

        ep_set = {item[1] for item in ep_dq}
        ep_set.add(endpoint)
        unique_endpoints = len(ep_set)

        # Append current event to queues
        req_dq.append(now)
        if status_code >= 400:
            fail_dq.append(now)
        ep_dq.append((now, endpoint))

        return requests_per_minute, failed_requests, unique_endpoints


class BehavioralFeatureExtractor:
    """
    Extracts dense numerical and categorical behavioral features from raw records.
    Fits a StandardScaler strictly on the training partition.
    """

    FEATURE_NAMES = [
        "log_requests_per_min",
        "log_failed_requests",
        "unique_endpoints",
        "log_response_time",
        "log_request_size",
        "log_response_size",
        "failure_ratio",
        "latency_per_kb",
        "is_method_get",
        "is_method_post",
        "is_method_write",
        "is_status_2xx",
        "is_status_4xx",
        "is_status_5xx",
        "is_auth_authenticated",
        "is_auth_failed",
        "is_sensitive_endpoint",
        "is_automated_ua",
    ]

    SENSITIVE_KEYWORDS = ["/auth", "/login", "/admin", "/actuator", "/.env", "/secret", "/debug", "/backup"]
    AUTOMATED_UA_KEYWORDS = ["sqlmap", "nikto", "nmap", "curl", "python", "wfuzz", "go-http", "postman"]

    def __init__(self):
        self.scaler = StandardScaler()
        self.is_fitted = False

    def _extract_single_vector(self, row: Dict[str, Any]) -> List[float]:
        rpm = float(row.get("requests_per_minute", 1) or 1)
        fails = float(row.get("failed_requests", 0) or 0)
        unique_eps = float(row.get("unique_endpoints", 1) or 1)
        resp_time = float(row.get("response_time", 25.0) or 25.0)
        req_size = float(row.get("request_size", 100.0) or 100.0)
        resp_size = float(row.get("response_size", 500.0) or 500.0)

        method = str(row.get("method", "GET")).upper()
        status_code = int(row.get("status_code", 200) or 200)
        auth_status = str(row.get("authentication_status", "UNAUTHENTICATED")).upper()
        endpoint = str(row.get("endpoint", "")).lower()
        ua = str(row.get("user_agent", "")).lower()

        # Log transformations for heavily skewed positive quantities
        log_rpm = math.log1p(max(0.0, rpm))
        log_fails = math.log1p(max(0.0, fails))
        log_resp_time = math.log1p(max(0.0, resp_time))
        log_req_size = math.log1p(max(0.0, req_size))
        log_resp_size = math.log1p(max(0.0, resp_size))

        failure_ratio = fails / max(1.0, rpm)
        latency_per_kb = resp_time / max(0.1, resp_size / 1024.0)

        is_get = 1.0 if method == "GET" else 0.0
        is_post = 1.0 if method == "POST" else 0.0
        is_write = 1.0 if method in ["PUT", "PATCH", "DELETE"] else 0.0

        is_2xx = 1.0 if 200 <= status_code < 300 else 0.0
        is_4xx = 1.0 if 400 <= status_code < 500 else 0.0
        is_5xx = 1.0 if status_code >= 500 else 0.0

        is_auth_ok = 1.0 if auth_status == "AUTHENTICATED" else 0.0
        is_auth_fail = 1.0 if auth_status == "FAILED" else 0.0

        is_sensitive = 1.0 if any(kw in endpoint for kw in self.SENSITIVE_KEYWORDS) else 0.0
        is_automated = 1.0 if (not ua or any(kw in ua for kw in self.AUTOMATED_UA_KEYWORDS)) else 0.0

        return [
            log_rpm,
            log_fails,
            unique_eps,
            log_resp_time,
            log_req_size,
            log_resp_size,
            failure_ratio,
            latency_per_kb,
            is_get,
            is_post,
            is_write,
            is_2xx,
            is_4xx,
            is_5xx,
            is_auth_ok,
            is_auth_fail,
            is_sensitive,
            is_automated,
        ]

    def fit(self, records: List[Dict[str, Any]]) -> "BehavioralFeatureExtractor":
        matrix = np.array([self._extract_single_vector(r) for r in records], dtype=np.float32)
        self.scaler.fit(matrix)
        self.is_fitted = True
        return self

    def transform(self, records: List[Dict[str, Any]]) -> np.ndarray:
        if not self.is_fitted:
            raise RuntimeError("BehavioralFeatureExtractor must be fitted before transform().")
        matrix = np.array([self._extract_single_vector(r) for r in records], dtype=np.float32)
        return self.scaler.transform(matrix)

    def fit_transform(self, records: List[Dict[str, Any]]) -> np.ndarray:
        return self.fit(records).transform(records)
