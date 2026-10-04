# Model Selection & Theoretical Justification

## 1. Research Overview
The core hypothesis of API Sentinel is that modern REST API intrusion detection requires a **hybrid architecture** combining unsupervised behavioral anomaly detection with specialized payload representation and supervised attack classification. 

Traditional signature matching is vulnerable to novel evasion techniques, while purely supervised models fail when faced with unseen zero-day attacks or attacks with benign-looking payloads (e.g., endpoint enumeration and brute force).

---

## 2. Behavioral Anomaly Detection: Isolation Forest

### Why Isolation Forest?
API client traffic exhibits continuous multi-dimensional temporal variations (requests/minute, error counts, endpoint entropy). We chose **Isolation Forest** over Density-Based (LOF, DBSCAN) or Reconstruction-Based (Autoencoders) methods for three concrete reasons:
1. **Linear Time Complexity $O(n \log \psi)$**: Isolation Forest isolates anomalies by randomly selecting a feature and split value. Because anomalies require fewer recursive splits to isolate, path length $h(x)$ directly measures anomalousness without pairwise distance calculations.
2. **Subsampling Efficiency**: By using $\psi = 256$ or `max_samples=0.8`, the algorithm circumvents masking and swamping effects common in high-volume traffic bursts.
3. **Low Computational Footprint**: Unlike deep learning autoencoders, Isolation Forest requires no GPU acceleration, enabling lightweight edge deployment adjacent to API gateways.

### Hyperparameter Configuration:
- `n_estimators = 150`: Selected after empirical stability testing; variance of decision function plateaus beyond 120 trees.
- `contamination = 0.04`: Configured to model low-level background noise in training baselines.
- `max_samples = 0.8`: Prevents tree correlation while retaining sufficient variance.

---

## 3. Payload Analysis: Subword N-Gram TF-IDF

### Why Character N-Grams?
1. **Circumventing Exact-String Brittle Matching**: Attackers easily bypass exact string filters (e.g. `1=1` vs `2=2`, or URL encoding `%2e%2e`). Character n-grams ($n \in [3, 5]$) decompose tokens into structural morphemes (e.g., `[' OR '`, `NIO`, `ION`, `SEC`, `<sc`, `rip`).
2. **Language Agnosticism**: Handles SQL dialect variations, shell syntax, directory paths, and HTML DOM events without handcrafting parsers for each query language.
3. **Sublinear TF Scaling**: Dampens the influence of repeatedly occurring benign syntax tokens (`{"status": "ok"}`).

---

## 4. Supervised Multi-Class Benchmark

We evaluated three candidate algorithms across the fused behavioral and payload feature space:

| Model Candidate | Inductive Bias / Characteristics | Computational Trade-Off | Empirical Performance |
| :--- | :--- | :--- | :--- |
| **Logistic Regression (L2 / Balanced)** | Linear decision boundary; assumes features are linearly separable in log-odds. | Extremely fast training and sub-millisecond inference (~0.3 ms). | High accuracy (Macro F1: 0.9984), but struggles with non-linear feature interactions (e.g. rate vs endpoint combinations). |
| **Random Forest (150 trees, depth=16)** | Ensemble bagging of unconstrained decision trees; robust to outlier features and scale. | Moderate training time; inference ~15 ms. | Excellent robustness (Macro F1: 0.9928); naturally handles imbalanced multi-class splits. |
| **XGBoost (150 trees, depth=6, lr=0.1)** | Gradient-boosted decision trees optimizing multi-class log-loss with second-order gradient approximations. | Slightly longer training; highly optimized C++ inference (~1.6 ms). | **Best Overall** (Macro F1: 1.0000, Binary F1: 1.0000, FPR: 0.0000). Highly responsive to sparse TF-IDF interactions. |

**Final Selection:** **XGBoost** was selected as the primary supervised multi-class engine due to its superior gradient optimization over sparse n-gram features and rapid 1.6 ms inference latency.
