# API Sentinel — Security Architecture & Hardening Guide

## 1. Threat Model & Security Posture

API Sentinel is designed under the **Zero Trust** security paradigm for API ecosystems. It operates as both an inline enforcement shield (reverse proxy or middleware) and an out-of-band behavioral detection platform.

### Protected Attack Vectors
1. **Injection Attacks**: SQL Injection, Command Injection, LDAP Injection, NoSQL Injection.
2. **Broken Object Level Authorization (BOLA / IDOR)**: Anomaly detection on resource identifier access patterns.
3. **Broken Authentication & Credential Stuffing**: Dedicated **Login Shield** engine with IP-based sliding window rate tracking and threshold locks.
4. **Unrestricted Resource Consumption / DoS**: Dynamic rate limits and adaptive throttling (`THROTTLE` / HTTP 429).
5. **Path Traversal & LFI**: Strict regex signatures identifying directory escape sequences (`../`, `%2e%2e%2f`).
6. **API Scraping & Enumeration**: Supervised payload vectorization combined with Isolation Forest behavioral anomaly detection.

---

## 2. Authentication & Authorization Architecture

- **Stateless JWT**: Backend generates HMAC-SHA512 signed JSON Web Tokens (`HS512`) with 24-hour expiration.
- **Password Protection**: Passwords hashed using Spring Security `BCryptPasswordEncoder` with strength factor 12. Plaintext passwords are never logged, stored, or echoed.
- **Role-Based Access Control (RBAC)**:
  - `ROLE_ADMIN`: Full administrative control across organizations, rules, applications, and system config.
  - `ROLE_DEVELOPER`: Application and endpoint onboarding, API key generation, telemetry inspection.
  - `ROLE_SECURITY_ANALYST`: Incident triaging, threat investigation, rule inspection, audit review.
  - `ROLE_VIEWER`: Read-only access to dashboards and analytics.

---

## 3. API Key Cryptographic Storage

API keys follow standard high-security token conventions:
- **Prefix**: `sentinel_live_` or `sentinel_test_`
- **Entropy**: 32 cryptographically secure hex bytes (128-bit minimum entropy).
- **One-Time Display**: Key plaintext is shown to the user exactly once upon generation.
- **Storage Hash**: Keys are irreversibly hashed using **SHA-256** prior to database persistence (`ApiKey.keyHash`).
- **Revocation**: Instant revocation flips `isActive = false`, invalidating cached gateway credentials immediately.

---

## 4. Input Sanitization & Error Handling

- **RFC 7807 Error Sanitization**: Centralized `GlobalExceptionHandler` ensures stack traces, database schemas, internal hostnames, and JDBC error codes are never leaked to external clients.
- **Content Security**: All incoming payloads undergo bounded length verification to prevent buffer-exhaustion attacks.
- **CORS Configuration**: Restricts cross-origin requests strictly to authorized origins (`http://localhost:3000`, `http://localhost:5173`).
- **Audit Logging**: All sensitive mutations (key generation, rule disabling, incident status alteration, role changes) are persistently recorded in the `audit_logs` table with actor username and client IP.
