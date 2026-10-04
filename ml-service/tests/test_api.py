"""
Integration Tests for FastAPI ML Microservice & Edge Cases
"""

import pytest


def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["ok", "degraded"]
    assert data["service"] == "api-sentinel-ml-service"
    assert "version" in data


def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "/api/v1/predict" in data["predict_endpoint"]


def test_model_info_endpoint(client):
    response = client.get("/api/v1/model-info")
    assert response.status_code == 200
    data = response.json()
    assert "model_version" in data
    assert "classes" in data
    assert "fusion_weights" in data
    assert "calibrated_thresholds" in data


def test_predict_benign_request(client, sample_benign_request):
    response = client.post("/api/v1/predict", json=sample_benign_request)
    assert response.status_code == 200
    data = response.json()

    assert data["prediction"] == "NORMAL"
    assert data["severity"] == "LOW"
    assert data["attack_type"] == "NORMAL"
    assert data["risk_score"] < 0.35
    assert isinstance(data["reasons"], list)
    assert data["inference_time_ms"] > 0


def test_predict_sqli_request(client, sample_sqli_request):
    response = client.post("/api/v1/predict", json=sample_sqli_request)
    assert response.status_code == 200
    data = response.json()

    assert data["prediction"] == "MALICIOUS"
    assert data["attack_type"] == "SQL_INJECTION"
    assert data["risk_score"] >= 0.55
    assert data["payload_score"] >= 0.70
    assert any("SQL" in r or "tautology" in r for r in data["reasons"])


def test_predict_command_injection_request(client, sample_command_injection_request):
    response = client.post("/api/v1/predict", json=sample_command_injection_request)
    assert response.status_code == 200
    data = response.json()

    assert data["prediction"] == "MALICIOUS"
    assert data["risk_score"] >= 0.50
    assert data["payload_score"] >= 0.70


# Edge Cases
def test_edge_case_empty_payload(client, sample_benign_request):
    req = dict(sample_benign_request)
    req["payload"] = ""
    response = client.post("/api/v1/predict", json=req)
    assert response.status_code == 200
    assert response.json()["prediction"] == "NORMAL"


def test_edge_case_large_payload(client, sample_benign_request):
    req = dict(sample_benign_request)
    # 10,000 characters payload
    req["payload"] = "A" * 10000
    response = client.post("/api/v1/predict", json=req)
    assert response.status_code == 200
    assert "risk_score" in response.json()


def test_edge_case_missing_optional_fields(client):
    minimal_req = {
        "method": "GET",
        "endpoint": "/api/v1/health",
    }
    response = client.post("/api/v1/predict", json=minimal_req)
    assert response.status_code == 200
    data = response.json()
    assert "prediction" in data
    assert "risk_score" in data


def test_edge_case_unknown_endpoint(client, sample_benign_request):
    req = dict(sample_benign_request)
    req["endpoint"] = "/unknown/unregistered/random/path/test"
    response = client.post("/api/v1/predict", json=req)
    assert response.status_code == 200
    assert "prediction" in response.json()


def test_edge_case_zero_rate_values(client, sample_benign_request):
    req = dict(sample_benign_request)
    req["requests_per_minute"] = 0
    req["failed_requests"] = 0
    req["unique_endpoints"] = 0
    response = client.post("/api/v1/predict", json=req)
    assert response.status_code == 200
    assert response.json()["prediction"] == "NORMAL"


def test_validation_error_invalid_status_code(client, sample_benign_request):
    req = dict(sample_benign_request)
    req["status_code"] = 999  # Invalid HTTP status code
    response = client.post("/api/v1/predict", json=req)
    assert response.status_code == 422
    assert "error" in response.json()
    assert "Validation Error" in response.json()["error"]


def test_validation_error_negative_response_time(client, sample_benign_request):
    req = dict(sample_benign_request)
    req["response_time"] = -10.0
    response = client.post("/api/v1/predict", json=req)
    assert response.status_code == 422


def test_batch_prediction(client, sample_benign_request, sample_sqli_request):
    batch = {
        "requests": [sample_benign_request, sample_sqli_request]
    }
    response = client.post("/api/v1/predict/batch", json=batch)
    assert response.status_code == 200
    data = response.json()
    assert data["total_requests"] == 2
    assert len(data["predictions"]) == 2
    assert data["predictions"][0]["prediction"] == "NORMAL"
    assert data["predictions"][1]["prediction"] == "MALICIOUS"
    assert data["total_time_ms"] > 0
