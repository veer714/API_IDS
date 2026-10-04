"""
Pytest Configuration and Fixtures
"""

import sys
import os
import pytest
from fastapi.testclient import TestClient

# Ensure ml-service root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app
from app.services.predictor import predictor


@pytest.fixture(scope="session")
def client():
    # Ensure models are loaded for testing
    if not predictor.is_loaded:
        predictor.load_artifacts()
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def sample_benign_request():
    return {
        "timestamp": "2026-03-15T12:00:00",
        "source_ip": "192.168.1.50",
        "method": "GET",
        "endpoint": "/api/v1/products/12",
        "status_code": 200,
        "response_time": 22.0,
        "request_size": 80,
        "response_size": 650,
        "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "authentication_status": "AUTHENTICATED",
        "requests_per_minute": 8,
        "failed_requests": 0,
        "unique_endpoints": 2,
        "payload": "",
    }


@pytest.fixture
def sample_sqli_request():
    return {
        "timestamp": "2026-03-15T12:00:01",
        "source_ip": "198.51.100.4",
        "method": "POST",
        "endpoint": "/api/v1/auth/login",
        "status_code": 401,
        "response_time": 45.0,
        "request_size": 250,
        "response_size": 180,
        "user_agent": "sqlmap/1.7.2#stable",
        "authentication_status": "FAILED",
        "requests_per_minute": 75,
        "failed_requests": 12,
        "unique_endpoints": 1,
        "payload": "' OR '1'='1 --",
    }


@pytest.fixture
def sample_command_injection_request():
    return {
        "timestamp": "2026-03-15T12:00:02",
        "source_ip": "198.51.100.99",
        "method": "POST",
        "endpoint": "/api/v1/system/ping",
        "status_code": 500,
        "response_time": 180.0,
        "request_size": 320,
        "response_size": 420,
        "user_agent": "curl/7.88.1",
        "authentication_status": "UNAUTHENTICATED",
        "requests_per_minute": 25,
        "failed_requests": 5,
        "unique_endpoints": 3,
        "payload": "127.0.0.1; cat /etc/passwd",
    }
