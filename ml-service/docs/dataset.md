# Dataset Strategy and Literature Review for API Intrusion Detection

## 1. Context & Research Direction
Modern application architectures rely heavily on REST APIs for microservice communication, mobile backends, and single-page web applications. Traditional Network Intrusion Detection Systems (NIDS) operating on L3/L4 packet captures (e.g., PCAP, TCP flags, NetFlow) fail to inspect encrypted TLS application payloads and miss API-specific attack patterns such as Broken Object Level Authorization (BOLA), parameter tampering, endpoint fuzzing, and application injection.

This document reviews established benchmark datasets for web/API intrusion detection, documents their trade-offs, and establishes the dataset strategy for API Sentinel.

---

## 2. Review of Public Intrusion Datasets

### A. CSIC 2010 HTTP Dataset
- **Source:** Information Security Institute of CSIC (Spanish Research National Council)
- **URL/Reference:** `http://www.isi.csic.es/dataset/`
- **License:** Academic/Research Open Access
- **Content:** ~36,000 normal HTTP requests and ~25,000 anomalous requests targeted at an e-commerce web application.
- **Attack Categories:** SQL Injection, Cross-Site Scripting (XSS), Buffer Overflow, Parameter Tampering, Information Disclosure.
- **Strengths:** Contains realistic HTTP parameter variations and legitimate vs. attack payloads.
- **Limitations:** Reflects older HTTP 1.1 web application paradigms; lacks modern JSON REST structures, JWT authentication flows, and microservice endpoint semantics.

### B. ECML/PKDD 2007 Discovery Challenge Dataset
- **Source:** European Conference on Machine Learning and Principles and Practice of Knowledge Discovery in Databases (2007)
- **Reference:** Paaß et al., "Web Security Challenge"
- **License:** Research Open Access
- **Content:** ~50,000 HTTP requests classified into valid traffic and web attacks.
- **Attack Categories:** SQLi, XSS, Path Traversal, LDAP injection.
- **Strengths:** Standardized text classification benchmark for web payloads.
- **Limitations:** Focuses almost exclusively on URI parameter strings; lacks client behavioral telemetry (rate, session state, IP history, response codes).

### C. Generic Network Datasets (CICIDS2017, UNSW-NB15, CSE-CIC-IDS2018)
- **Source:** Canadian Institute for Cybersecurity (UNB) / Australian Centre for Cyber Security (UNSW)
- **Reference:** Sharafaldin et al. (2018), Moustafa et al. (2015)
- **License:** Open Academic Use
- **Content:** Millions of bidirectional network flows extracted via tools like `CICFlowMeter` (e.g., forward inter-arrival time, packet length variance, TCP window sizes).
- **CRITICAL DISTINCTION & LIMITATION:**
  > **Note on Network vs. API Datasets:** Generic network datasets (CICIDS2017, UNSW-NB15) represent layer 3/4 packet flow statistics. They do **NOT** contain HTTP request methods, URI paths, HTTP request headers, JSON request bodies, or REST status codes. **They cannot be claimed as REST API datasets.** Their traffic patterns (e.g., SYN floods, PortScan) do not model REST API application layer attacks like BOLA, JWT abuse, or SQLi in JSON bodies.

### D. OWASP API Security Top 10 Benchmark Context
- Modern API attacks follow the **OWASP API Security Top 10 (2023)**:
  1. API1: Broken Object Level Authorization (BOLA)
  2. API2: Broken Authentication
  3. API3: Broken Object Property Level Authorization
  4. API4: Unrestricted Resource Consumption
  5. API5: Broken Function Level Authorization
  6. API6: Unrestricted Access to Sensitive Business Flows
  7. API7: Server Side Request Forgery (SSRF)
  8. API8: Security Misconfiguration
  9. API9: Improper Inventory Management
  10. API10: Unsafe Consumption of APIs

---

## 3. Dataset Strategy for API Sentinel

To ensure reproducible, high-fidelity research without fabricated external benchmarks:

1. **Controlled Reproducible Traffic Pipeline (`scripts/generate_demo_data.py`):**
   - Synthesizes real-world API traffic logs combining client metadata, temporal state, endpoints, and HTTP payloads.
   - Accurately models both normal user behavior (browsing, authenticating, purchasing, data queries) and targeted attack vectors:
     - **SQL Injection (SQLi)**
     - **Cross-Site Scripting (XSS)**
     - **Path Traversal / Local File Inclusion (LFI)**
     - **Command Injection (OS Command Injection)**
     - **Brute Force Authentication**
     - **Endpoint Enumeration / API Scanning**
     - **Rate Abuse / API Flooding**
     - **Parameter Tampering**
2. **Reproducibility Guarantee:**
   - Deterministic PRNG seeding (`seed=42`).
   - Monotonic timestamps to simulate real-time API arrival events.
   - Temporal window calculations strictly bounded by past events (zero future lookahead / zero data leakage).
3. **Transparent Scientific Attribution:**
   - Clearly annotated as synthetic API telemetry.
   - Serves as the standardized evaluation corpus for behavioral anomaly detection, payload classification, hybrid fusion, and zero-day unseen attack holdout experiments.
