# Research Methodology: Hybrid Behavioral and Payload-Aware ML for Real-Time API IDS

## Abstract
Modern microservice architectures rely almost entirely on RESTful APIs for inter-service and client communications. Traditional signature-based Web Application Firewalls (WAFs) and L3/L4 Network Intrusion Detection Systems (NIDS) exhibit severe limitations: static signatures fail to recognize zero-day injection variants, while network flow metrics lack visibility into decrypted HTTP/JSON bodies, authentication contexts, and application-layer velocity. 

This work presents a **Hybrid Behavioral and Payload-Aware Machine Learning Framework for Real-Time API Intrusion Detection Under Limited Labeled Data**. The framework fuses unsupervised behavioral anomaly detection with specialized subword character n-gram payload representation and supervised attack classification, yielding state-of-the-art detection accuracy, zero-day resilience, and explainable inference.

---

## 1. End-to-End Architectural Pipeline

```
                                 Incoming API Request
                                          │
                                          ▼
                      ┌───────────────────────────────────────┐
                      │    Traffic State Tracker (Causal)     │
                      │  - Sliding 1m & 5m Windows            │
                      │  - Requests/min, Failures, Endpoints  │
                      └───────────────────┬───────────────────┘
                                          │
                     ┌────────────────────┴────────────────────┐
                     ▼                                         ▼
        ┌─────────────────────────┐               ┌─────────────────────────┐
        │   Behavioral Extractor  │               │    Payload Extractor    │
        │ - 18 Dense Scaled Feats │               │ - Lexical Statistics    │
        │ - Velocity & Ratios     │               │ - Char N-Gram TF-IDF    │
        └────────────┬────────────┘               └────────────┬────────────┘
                     │                                         │
           ┌─────────┴─────────┐                     ┌─────────┴─────────┐
           ▼                   │                     ▼                   │
┌─────────────────────┐        │          ┌─────────────────────┐        │
│  Isolation Forest   │        │          │  Payload Classifier │        │
│ (Behavioral Anomaly)│        │          │  (TF-IDF RF Model)  │        │
└──────────┬──────────┘        │          └──────────┬──────────┘        │
           │                   │                     │                   │
           │ s_anom            │                     │ s_pay             │
           │                   └──────────┬──────────┘                   │
           │                              ▼                              │
           │                   ┌─────────────────────┐                   │
           │                   │ Supervised Attack   │                   │
           │                   │ Classifier (XGBoost)│                   │
           │                   └──────────┬──────────┘                   │
           │                              │                              │
           │                              │ s_clf                        │
           └──────────────────────────────┼──────────────────────────────┘
                                          │
                                          ▼
                      ┌───────────────────────────────────────┐
                      │       Hybrid Risk Fusion Engine       │
                      │  Convex Combination (SLSQP Optimized) │
                      │   w1*Anom + w2*Pay + w3*Auth + ...    │
                      └───────────────────┬───────────────────┘
                                          │
                                          ▼
                      ┌───────────────────────────────────────┐
                      │         Decision & Explanation        │
                      │  - Threat Level (NORMAL/SUSP/MAL)     │
                      │  - Feature-Grounded Rationales        │
                      └───────────────────┬───────────────────┘
                                          │
                                          ▼
                                   FastAPI Response
```

---

## 2. Mathematical Formulation

### A. Behavioral Anomaly Metric
Let an incoming request be represented in behavioral feature space as $x_b \in \mathbb{R}^{18}$. An Isolation Forest composed of $T$ isolation trees scores the sample based on the average path depth $E(h(x_b))$ required to isolate it:
$$s_{\text{raw}}(x_b) = 2^{-\frac{E(h(x_b))}{c(\psi)}}$$
where $c(\psi) = 2 \ln(\psi - 1) + 0.5772156649 - \frac{2(\psi - 1)}{\psi}$ is the average path length of an unsuccessful search in a Binary Search Tree constructed over $\psi$ samples.

To map this score to a calibrated probability $s_{\text{anom}} \in [0, 1]$ where higher values strictly indicate anomalousness:
$$s_{\text{anom}}(x_b) = \text{clip}\left(\frac{s_{\max} - s_{\text{raw}}(x_b)}{s_{\max} - s_{\min}}, 0, 1\right)$$

### B. Subword N-Gram Payload Representation
API query strings and JSON bodies are converted to character n-grams $g \in [3, 5]$ with sublinear term frequency:
$$\text{TF-IDF}(g, p) = \left(1 + \ln(\text{count}(g, p))\right) \times \ln\left(\frac{1 + |P|}{1 + |\{p' \in P : g \in p'\}|}\right) + 1$$
This avoids overfitting to exact alphanumeric IDs while robustly matching syntactic fragments (e.g. `1' OR '`, `UNION SELECT`, `<script`, `..%2f`).

### C. Convex Risk Fusion Optimization
Rather than assigning arbitrary heuristics, the composite risk score $R(x)$ is formulated as a linear convex combination of 5 orthogonal signals:
$$R(x) = \sum_{i=1}^5 w_i s_i(x)$$
$$\text{subject to } \sum_{i=1}^5 w_i = 1, \quad w_i \ge w_{\min} = 0.08$$

The optimal weight vector $w^*$ is learned on the validation partition $D_{\text{val}}$ by minimizing the Brier score with regularization toward balanced participation:
$$w^* = \arg\min_{w} \frac{1}{|D_{\text{val}}|} \sum_{j=1}^{|D_{\text{val}}|} \left( \sum_{i=1}^5 w_i s_i(x_j) - y_j \right)^2 + \lambda \sum_{i=1}^5 \left(w_i - \frac{1}{5}\right)^2$$

### D. Zero-Day Defense Mechanics
Because $w_1 \ge 0.08$ and $w_2 \ge 0.08$ are guaranteed by the constrained formulation, an attack vector that is completely unobserved during supervised training (e.g., Command Injection) is still captured via its structural behavioral shift ($s_{\text{anom}} \to 1.0$) and syntax anomaly ($s_{\text{pay}} \to 1.0$).
