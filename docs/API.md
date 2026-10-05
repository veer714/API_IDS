# API Sentinel — REST API Reference Specification

Base URL: `http://localhost:8080/api/v1`  
Authentication: Bearer JWT (`Authorization: Bearer <token>`) or API Key Header (`X-API-Key: <key>`)

---

## 1. Authentication (`/auth`)

### `POST /auth/login`
Authenticates a user and returns a signed JWT token.
- **Request Body**:
  ```json
  {
    "username": "admin",
    "password": "SentinelAdmin2026!"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "token": "eyJhbGciOiJIUzUxMiJ9...",
    "type": "Bearer",
    "username": "admin",
    "email": "admin@apisentinel.io",
    "role": "ROLE_ADMIN",
    "organization": "cybercorp-soc"
  }
  ```

### `POST /auth/register`
Creates a new tenant user account.
- **Request Body**:
  ```json
  {
    "username": "johndoe",
    "email": "john@company.com",
    "password": "SecurePassword123!",
    "organizationName": "Acme Corp"
  }
  ```
- **Response `201 Created`**: Returns AuthResponse.

### `GET /auth/me`
Retrieves authenticated user profile.
- **Response `200 OK`**: Returns user profile and role details.

---

## 2. Core Security Evaluation (`/security`)

### `POST /security/evaluate`
**Crucial SDK / Gateway Endpoint.** Performs synchronous inline threat inspection and returns an actionable security verdict.
- **Request Body**:
  ```json
  {
    "applicationId": "app_ecommerce_prod",
    "method": "POST",
    "endpoint": "/api/products",
    "clientIp": "198.51.100.44",
    "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    "headers": {
      "content-type": "application/json"
    },
    "payload": "{\"query\": \"' UNION SELECT * FROM users--\"}"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "requestId": "req_8f1b2c4d9e0a",
    "decision": "BLOCK",
    "riskScore": 92.5,
    "attackType": "SQL_INJECTION",
    "anomalyScore": 0.88,
    "payloadScore": 0.94,
    "confidence": 0.96,
    "triggeredRules": ["RULE-SQLI-001"],
    "reasons": ["SQL UNION SELECT signature matched", "High anomaly divergence"],
    "modelVersion": "1.0.0-xgb-iso",
    "inferenceLatencyMs": 14
  }
  ```

---

## 3. Application Management (`/applications`)

### `GET /applications`
List all registered applications for tenant.
- **Response `200 OK`**: Array of `ApplicationDto`.

### `POST /applications`
Register a new application.
- **Request Body**:
  ```json
  {
    "name": "Payments API Gateway",
    "environment": "Production",
    "description": "PCI-compliant payment transaction gateway"
  }
  ```

---

## 4. Protected Endpoints (`/endpoints`)

### `GET /endpoints?applicationId={id}`
Returns all protected endpoints with security policy toggles.

### `POST /endpoints`
Registers a new route under protection.
- **Request Body**:
  ```json
  {
    "applicationId": "app_ecommerce_prod",
    "path": "/api/checkout",
    "method": "POST",
    "protectionEnabled": true,
    "ruleEngineEnabled": true,
    "mlEnabled": true,
    "rateLimit": 30,
    "challengeThreshold": 50,
    "blockThreshold": 80,
    "authRequired": true
  }
  ```

---

## 5. Threat Center & Live Traffic (`/threats`, `/traffic`)

### `GET /traffic?page=0&size=50`
Paginated live request event log.

### `GET /threats?severity=CRITICAL&status=OPEN`
Filter threats by severity, attack type, or resolution status.

### `GET /threats/{id}`
Returns deep forensic inspection record for specific threat.

---

## 6. Incident Management (`/incidents`)

### `GET /incidents`
Lists grouped threat incidents.

### `PUT /incidents/{id}/status`
Update incident resolution state.
- **Request Body**:
  ```json
  {
    "status": "RESOLVED",
    "note": "IP blocked at edge firewall. Attack neutralized."
  }
  ```

---

## 7. Analytics (`/analytics`)

### `GET /analytics/stats`
Returns top-level SOC KPIs: total requests, threat rate, block rate, challenge rate, active apps.

### `GET /analytics/attack-distribution`
Aggregated counts grouped by attack classification (`SQLI`, `XSS`, `BRUTE_FORCE`, `BENIGN`).

---

## 8. System Health (`/system/health`)

### `GET /system/health`
Health probes for all cluster nodes:
- `backend`: Spring Boot runtime status
- `database`: PostgreSQL / H2 connection pool latency
- `mlService`: Python FastAPI model availability
- `gateway`: Reverse proxy connectivity
