# API Sentinel — End-to-End Live Demonstration Walkthrough

This guide walks an evaluator, judge, or security engineer through a live, end-to-end verification of API Sentinel's intrusion detection and mitigation capabilities.

---

## 1. Demo Credentials & Access Points

| Component | URL | Credentials / Notes |
| :--- | :--- | :--- |
| **SOC Dashboard** | `http://localhost:3000` | User: `admin` \| Password: `SentinelAdmin2026!` |
| **API Gateway** | `http://localhost:8081` | Reverse proxy edge protecting the upstream target |
| **Target Demo API** | `http://localhost:5000` | Upstream E-Commerce demo application |
| **Interactive Simulator** | `http://localhost:3000/demo` | Built-in live attack laboratory |

---

## 2. Step-by-Step Demonstration Script

### Step 1: Login & Access the SOC Dashboard
1. Open `http://localhost:3000` in your web browser.
2. Click **Access SOC Console** or navigate to `/login`.
3. Enter `admin` / `SentinelAdmin2026!`.
4. Observe the **Executive SOC Overview**:
   - Total requests, threat counts, blocked requests, and average risk score.
   - Attack distribution breakdown and system health indicators.

---

### Step 2: Test a Benign Request (ALLOW Decision)
1. In the sidebar, navigate to **Attack Simulator** (`/demo`).
2. Select the preset **"Benign Product Search"**:
   - Method: `GET`
   - Endpoint: `/api/products?category=electronics&limit=10`
3. Click **Execute Through Gateway**.
4. **Observed Results**:
   - Decision badge shows green **`ALLOW`**.
   - Risk score is low (`< 20`).
   - The upstream API responds with HTTP 200 and product list data.
   - Telemetry event is immediately recorded in the Live Traffic view.

---

### Step 3: Simulate SQL Injection Attack (BLOCK Decision)
1. On `/demo`, select preset **"SQL Injection (Auth Bypass)"**:
   - Method: `POST`
   - Endpoint: `/api/products`
   - Payload: `{"category": "' UNION SELECT username, password_hash, email FROM users WHERE '1'='1"}`
2. Click **Execute Through Gateway**.
3. **Observed Results**:
   - Decision badge immediately flashes crimson **`BLOCK`**.
   - Risk Score: **`90 - 95`** (Critical).
   - Attack Classification: **`SQL_INJECTION`**.
   - Triggered Rules: `RULE-SQLI-001`.
   - Gateway returns HTTP 403 Forbidden with security report. The upstream server is never touched.

---

### Step 4: Inspect the Threat in Request Deep-Inspector
1. Navigate to **Live Traffic** (`/traffic`) or **Threat Center** (`/threats`).
2. Click on the newly recorded SQL Injection request row.
3. The **Request Deep-Inspector** slide-over panel opens:
   - Full Forensic Request ID, Timestamp, and Client IP.
   - Decoded HTTP Headers and raw JSON payload.
   - Supervised ML confidence, anomaly divergence score, and payload score.
   - Full execution timeline and triggered rule explanations.

---

### Step 5: Incident Triaging & Resolution
1. Navigate to **Incidents** (`/incidents`).
2. Locate the incident automatically correlated from the attack.
3. Click **Investigate**.
4. Change the status from `OPEN` to `RESOLVED` and add note: *"Attack mitigated at perimeter gateway. Firewall rule applied."*
5. Confirm that the status updates and an immutable audit log entry is created under **Audit Logs** (`/audit`).
