# System Limitations & Threat Model Boundaries

Honest scientific reporting requires explicit documentation of model boundaries, edge cases, and performance trade-offs.

---

## 1. Dataset Scope & Synthetic Artifacts
- **Synthetic Simulation**: While the dataset was generated using realistic REST endpoints, real-world user agent distributions, and standard OWASP API attacks, it remains a controlled synthetic corpus. Real-world corporate networks experience unpredictable business logic flows, custom serialization protocols, and domain-specific APIs.
- **Label Granularity**: Multi-class attacks reflect common web/API vectors; highly sophisticated stateful attacks spanning weeks (Advanced Persistent Threats) are not captured in 5-minute sliding windows.

---

## 2. Real-Time Latency Trade-Offs
- **In-Line vs. Out-of-Band Deployment**:
  - The XGBoost supervised model runs in **1.54 ms**, making it exceptionally well-suited for synchronous in-line API blocking at the API Gateway.
  - The complete hybrid pipeline (including 150-tree Isolation Forest and Random Forest payload classifier) runs in **~136 ms** on single-threaded CPU.
  - **Architectural Recommendation**: For ultra-low latency gateway requirements (<20 ms), deploy the hybrid pipeline in an **asynchronous out-of-band tap** or execute XGBoost synchronously while streaming events to the anomaly detector asynchronously.

---

## 3. Adversarial Robustness & Evasion
- **Polymorphic Obfuscation**: Attackers employing multi-layer Base64, nested hex encoding, or custom cipher encodings may suppress character n-gram similarities.
- **Low-and-Slow Attacks**: Malicious actors executing requests at sub-threshold rates (e.g. 1 request per hour across diverse distributed botnets) can evade the 1-minute and 5-minute sliding rate windows unless long-term database-backed identity tracking is activated in the backend.

---

## 4. Cold-Start & Memory Constraints
- The serialized Isolation Forest artifact is approximately **60.7 MB** on disk. While RAM consumption during inference is minimal (less than 1 MB delta), container initialization requires ~1.5 to 2.0 seconds to deserialize tree estimators into memory before accepting HTTP requests on `/api/v1/predict`.
