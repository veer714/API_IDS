# Feature Engineering Architecture for API Intrusion Detection

## 1. Overview
The API Sentinel feature pipeline transforms raw, heterogeneous HTTP API telemetry into dense statistical and sparse natural-language feature representations across two primary orthogonal dimensions:
1. **Behavioral & Temporal Modality**: Client interaction patterns, request velocities, error ratios, and session dynamics.
2. **Payload & Lexical Modality**: Subword character n-gram frequencies and information-theoretic indicators (Shannon entropy, syntax dispersion) extracted from query strings and request bodies.

---

## 2. Behavioral Feature Pipeline (`app/features/behavioral.py`)

### A. Temporal Windows and Zero Data Leakage
In live API gateways, detection decisions must be reached synchronously upon request arrival without peeking into future traffic events. The `TrafficStateTracker` implements a strict causal sliding window:
- **1-Minute Window ($W_1$):** Measures instantaneous velocity $\text{RPM} = |\{t_i \in [t_{\text{now}} - 60s, t_{\text{now}}]\}|$.
- **5-Minute Window ($W_5$):** Measures cumulative error counts and distinct endpoint discovery across client sessions.

**Leakage Prevention Protocol:**
- No future traffic events are accessible to the feature extractor.
- `StandardScaler` is fitted strictly on the training partition ($D_{\text{train}}$) and applied without modification to validation and test sets.

### B. Behavioral Feature Specification
| Feature Name | Type | Mathematical Formulation / Definition | Rationale in API Intrusion Detection |
| :--- | :--- | :--- | :--- |
| `log_requests_per_min` | Float | $\ln(1 + \text{RPM})$ | Identifies high-velocity API floods, DoS, and automated fuzzers. |
| `log_failed_requests` | Float | $\ln(1 + \text{Fails}_{5m})$ | Captures failed attempts across auth and 404 routes. |
| `unique_endpoints` | Integer | $|\{ \text{endpoint}_i \in W_5 \}|$ | Sensitive to endpoint enumeration, directory scanning, and route fuzzing. |
| `log_response_time` | Float | $\ln(1 + \text{latency}_{\text{ms}})$ | Exposes resource exhaustion, backend SQL delays (e.g. `pg_sleep`). |
| `log_request_size` | Float | $\ln(1 + \text{bytes}_{\text{req}})$ | Detects payload stuffing, oversized JSON bodies. |
| `log_response_size` | Float | $\ln(1 + \text{bytes}_{\text{resp}})$ | Identifies data exfiltration or massive database dumps. |
| `failure_ratio` | Float | $\frac{\text{Fails}_{5m}}{\max(1, \text{RPM})}$ | Distinguishes routine browsing errors from targeted attack patterns. |
| `latency_per_kb` | Float | $\frac{\text{latency}_{\text{ms}}}{1 + \text{resp\_kb}}$ | Identifies backend execution bottlenecks not explained by large payload transfers. |
| `is_method_*` | Binary | One-hot for `GET`, `POST`, `WRITE` (PUT/PATCH/DELETE) | Distinguishes read vs state-changing API operations. |
| `is_status_*` | Binary | Categorical bins for `2xx`, `4xx`, `5xx` | Immediate signal for client-side or server-side failure. |
| `is_auth_*` | Binary | Flags for `AUTHENTICATED` vs `FAILED` | High-weight indicator for brute force and credential stuffing. |
| `is_sensitive_endpoint`| Binary | Presence of `/auth`, `/login`, `/admin`, `/actuator`, `/.env` | Prioritizes surveillance on high-value attack surfaces. |
| `is_automated_ua` | Binary | User-Agent signature matching headless tools or missing UA | Identifies non-browser programmatic clients (e.g. `sqlmap`, `nikto`, `curl`). |

---

## 3. Payload & Lexical Feature Pipeline (`app/features/payload.py`)

### A. Subword Character N-Gram TF-IDF
Unlike naive signature matchers that look for static regexes, our payload analyzer employs subword character n-grams ($n \in [3, 5]$) with Term Frequency-Inverse Document Frequency (TF-IDF):
$$\text{TF-IDF}(t, d, D) = \text{TF}(t, d) \times \ln\left(\frac{1 + |D|}{1 + |\{d' \in D : t \in d'\}|}\right) + 1$$
- **Boundary Preservation (`char_wb`):** Generates n-grams strictly within token boundaries, preventing false cross-token associations.
- **Normalization:** URL-decoding unmasks obfuscated characters (`%2e%2e` $\to$ `..`), and digit normalization replaces arbitrary IDs with `<NUM>`.

### B. Information-Theoretic & Syntax Features
| Feature Name | Definition | Detection Capability |
| :--- | :--- | :--- |
| `payload_length` | $\ln(1 + \text{len}(\text{payload}))$ | Anomaly flag for buffer overflow and lengthy script injections. |
| `shannon_entropy` | $H(X) = -\sum_{i} P(x_i) \log_2 P(x_i)$ | Detects Base64 blobs, encrypted shellcode, and packed commands. |
| `special_char_ratio` | $\frac{\text{count}(\text{special})}{\max(1, \text{len})}$ | Captures punctuation density typical of SQL syntax and HTML tags. |
| `has_sql_tokens` | Regex match on SQL keywords | Structural signal for SQL injection attempts. |
| `has_script_tokens`| Regex match on `<script>`, `onerror`, `javascript:` | Structural signal for Cross-Site Scripting. |
| `has_traversal_tokens`| Regex match on `../`, `..\`, `etc/passwd` | Structural signal for Path Traversal / LFI. |
| `has_command_tokens`| Regex match on shell operators `;`, `|`, `whoami` | Structural signal for OS Command Injection. |
