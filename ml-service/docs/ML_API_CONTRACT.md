# ML Service Integration Contract (API Sentinel)

This document provides the definitive REST API specification for integrating the **API Sentinel Machine Learning Microservice** with the Java / Spring Boot Backend, Gateway, and Detection Engine.

**The backend / detection-engine developer does NOT need to read Python source code.** All communication is standard JSON over HTTP REST.

---

## 1. Service Coordinates

- **Local Host URL:** `http://localhost:8000`
- **Docker Compose Network URL:** `http://ml-service:8000`
- **Interactive OpenAPI Documentation:** `http://localhost:8000/docs`
- **OpenAPI Schema (JSON):** `http://localhost:8000/openapi.json`
- **Protocol:** HTTP/1.1 REST (JSON)

---

## 2. Endpoints Summary

| Method | Endpoint | Description | Expected Latency |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Health check & model status | < 2 ms |
| `GET` | `/api/v1/model-info` | Active model version & thresholds | < 2 ms |
| `POST` | `/api/v1/predict` | Synchronous threat scoring for 1 request | ~130–140 ms |
| `POST` | `/api/v1/predict/batch` | Batch threat scoring (up to 500 requests) | Varies by batch |

---

## 3. Threat Prediction: `POST /api/v1/predict`

### A. Request Specification
**Content-Type:** `application/json`

| Field | Type | Required? | Default | Description | Example |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `method` | `string` | **Yes** | — | HTTP method (`GET`, `POST`, `PUT`, `DELETE`, `PATCH`) | `"POST"` |
| `endpoint` | `string` | **Yes** | — | Target API endpoint URI path | `"/api/v1/auth/login"` |
| `source_ip` | `string` | No | `"127.0.0.1"` | Client source IP address | `"198.51.100.14"` |
| `status_code` | `integer` | No | `200` | HTTP response status code ($100 \le \text{code} \le 599$) | `401` |
| `response_time` | `float` | No | `25.0` | Upstream API response latency in milliseconds | `45.2` |
| `request_size` | `integer` | No | `100` | Size of request payload in bytes | `240` |
| `response_size` | `integer` | No | `500` | Size of response body in bytes | `150` |
| `user_agent` | `string` | No | `""` | User-Agent header string | `"sqlmap/1.7.2#stable"` |
| `authentication_status` | `string` | No | `"UNAUTHENTICATED"` | `"AUTHENTICATED"`, `"UNAUTHENTICATED"`, or `"FAILED"` | `"FAILED"` |
| `user_id` | `string` | No | `null` | Optional authenticated user ID | `"usr_102"` |
| `payload` | `string` | No | `""` | Serialized JSON body, query string, or header params | `"' OR '1'='1 --"` |
| `requests_per_minute` | `float` | No | `null` (auto) | Requests from this IP in past 60s. If omitted, calculated dynamically. | `65.0` |
| `failed_requests` | `float` | No | `null` (auto) | 4xx/5xx failures from this IP in past 5m. If omitted, calculated dynamically. | `14.0` |
| `unique_endpoints` | `float` | No | `null` (auto) | Unique endpoints accessed in past 5m. If omitted, calculated dynamically. | `3.0` |
| `timestamp` | `string` | No | `null` | ISO-8601 timestamp string | `"2026-03-15T12:00:00Z"` |

### B. Example Request Body
```json
{
  "timestamp": "2026-03-15T12:00:00Z",
  "source_ip": "198.51.100.14",
  "method": "POST",
  "endpoint": "/api/v1/auth/login",
  "status_code": 401,
  "response_time": 45.2,
  "request_size": 240,
  "response_size": 150,
  "user_agent": "sqlmap/1.7.2#stable",
  "authentication_status": "FAILED",
  "requests_per_minute": 65.0,
  "failed_requests": 14.0,
  "unique_endpoints": 3.0,
  "payload": "{\"username\": \"admin' OR '1'='1\", \"password\": \"test\"}"
}
```

### C. Response Specification
**Status Code:** `200 OK`

```json
{
  "prediction": "MALICIOUS",
  "severity": "HIGH",
  "attack_type": "SQL_INJECTION",
  "risk_score": 0.8924,
  "anomaly_score": 0.8415,
  "payload_score": 0.9850,
  "confidence": 0.9980,
  "reasons": [
    "Payload contains SQL dialect structure (tautology or UNION injection tokens)",
    "Elevated request rate velocity (65 req/min exceeds standard baseline)",
    "Elevated error frequency (14 4xx/5xx responses in sliding window)",
    "Authentication failure or unauthorized access violation",
    "Behavioral telemetry significantly deviates from normal client baseline (anomaly score: 0.84)"
  ],
  "model_version": "v1.0.0-hybrid",
  "inference_time_ms": 136.25
}
```

---

## 4. Interpretation Guide for Backend Developers

### Threat Decisions (`prediction` & `severity`)
- `NORMAL` (Severity: `LOW`): Safe traffic. Risk score $< 0.22$. Allow request.
- `SUSPICIOUS` (Severity: `MEDIUM`): $0.22 \le \text{Risk} < 0.42$. Log security telemetry, trigger rate-limiting challenge (e.g. CAPTCHA) or MFA prompt.
- `MALICIOUS` (Severity: `HIGH`): $0.42 \le \text{Risk} < 0.57$. Block request, record security alert in database.
- `MALICIOUS` (Severity: `CRITICAL`): $\text{Risk} \ge 0.57$. Immediately drop connection, blacklist client IP temporarily, dispatch high-priority alert.

### Attack Categories (`attack_type`)
`NORMAL`, `SQL_INJECTION`, `XSS`, `PATH_TRAVERSAL`, `COMMAND_INJECTION`, `BRUTE_FORCE`, `ENDPOINT_ENUMERATION`, `RATE_ABUSE`, `PARAMETER_TAMPERING`, `ANOMALOUS_BEHAVIOR`.

---

## 5. Error Handling & Timeouts

| HTTP Status | Meaning | Recovery Strategy |
| :--- | :--- | :--- |
| `422 Unprocessable Entity` | Malformed JSON or invalid schema (e.g. `status_code: 999` or negative latency). | Inspect request fields; fix payload formatting. |
| `500 Internal Server Error` | Model loading or internal execution exception. | Retry request; fallback to detection-engine rule matching. |
| **Timeout Guideline** | Network timeout threshold. | **Recommended Client Timeout:** `500 ms`. If timeout occurs, fallback to rule-based detection engine and flag for asynchronous ML audit. |
