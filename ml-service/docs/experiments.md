# Experimental Methodology & Evaluation Protocol

## 1. Experimental Design & Partitioning Protocol
To ensure reproducible, scientifically rigorous research, the 50,000-sample API traffic dataset was partitioned using stratified sampling:

- **Training Partition ($D_{\text{train}}$):** 70% (35,000 records) — Used strictly to fit feature scalers, TF-IDF vectorizers, Isolation Forest baseline, and supervised candidate models.
- **Validation Partition ($D_{\text{val}}$):** 15% (7,500 records) — Used solely for SLSQP convex optimization of hybrid fusion weights and threshold calibration.
- **Held-Out Test Partition ($D_{\text{test}}$):** 15% (7,500 records) — Untouched until final model evaluation. Never used for fitting or hyperparameter decisions.

---

## 2. Data Leakage Prevention Audit

| Potential Leakage Vector | Mitigation Mechanism in API Sentinel |
| :--- | :--- |
| **Temporal Lookahead** | `TrafficStateTracker` only aggregates events from preceding timestamps. Sliding windows ($W_{1m}$, $W_{5m}$) are strictly bounded to $[t - \Delta t, t]$. |
| **Scaler / Normalizer Leakage** | `StandardScaler` compute $\mu$ and $\sigma$ strictly on $D_{\text{train}}$. $D_{\text{val}}$ and $D_{\text{test}}$ are transformed using fixed parameters. |
| **TF-IDF Vocabulary Leakage** | `TfidfVectorizer` dictionary is built exclusively on $D_{\text{train}}$ payloads. Out-of-vocabulary n-grams in test are ignored or handled via subwords. |
| **Label Encoding Leakage** | `LabelEncoder` maps classes defined in train; unobserved classes in holdout evaluations are handled gracefully. |
| **Optimization Overfitting** | Hybrid risk fusion weights are optimized on $D_{\text{val}}$, while reported test metrics are derived independently on $D_{\text{test}}$. |

---

## 3. Unseen / Zero-Day Attack Experiment Protocol
To answer the core research question:
> *"Can the hybrid behavioral and payload architecture detect attacks not represented during supervised training?"*

### Setup:
1. **Target Holdout:** `COMMAND_INJECTION` ($N=134$ in test partition) was completely removed from the training dataset.
2. **Retraining:** The supervised model was retrained on the remaining classes (`NORMAL`, `SQL_INJECTION`, `XSS`, `PATH_TRAVERSAL`, `BRUTE_FORCE`, `ENDPOINT_ENUMERATION`, `RATE_ABUSE`, `PARAMETER_TAMPERING`).
3. **Evaluation:** The held-out `COMMAND_INJECTION` test samples were processed through:
   - Supervised Attack Classifier (acting without an explicit class label for command injection)
   - Behavioral Anomaly Detector (Isolation Forest)
   - Payload Classifier (TF-IDF + Lexical)
   - Full Hybrid Risk Fusion System
4. **Hypothesis Verification:** We test whether the unsupervised anomaly detector and payload n-gram models detect the threat even when the supervised classifier has never seen the category.
