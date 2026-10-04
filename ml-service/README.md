# API Sentinel — Machine Learning Intrusion Detection Microservice

[![Python 3.12](https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-1.4+-F7931E?logo=scikit-learn&logoColor=white)](https://scikit-learn.org/)
[![XGBoost](https://img.shields.io/badge/XGBoost-2.0+-EB5424)](https://xgboost.readthedocs.io/)
[![Tests Passing](https://img.shields.io/badge/Pytest-23%2F23%20Passing-brightgreen?logo=pytest&logoColor=white)](tests/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](Dockerfile)
[![Research Report](https://img.shields.io/badge/DOCX%20Report-545%20KB-blue?logo=microsoft-word&logoColor=white)](docs/API_Sentinel_ML_Research_Report.docx)

An enterprise-grade, explainable, and multi-modal Machine Learning microservice for real-time REST API intrusion detection. Built around the research direction:
> **"Hybrid Behavioral and Payload-Aware Machine Learning Framework for Real-Time API Intrusion Detection Under Limited Labeled Data."**

---

## Table of Contents
1. [Architectural Overview](#1-architectural-overview)
2. [Project Phases & Deliverables](#2-project-phases--deliverables)
3. [Directory Layout](#3-directory-layout)
4. [Quick Start & Setup](#4-quick-start--setup)
5. [API Specification & Endpoints](#5-api-specification--endpoints)
6. [Empirical Evaluation & Research Results](#6-empirical-evaluation--research-results)
7. [Zero-Day Unseen Attack Resilience](#7-zero-day-unseen-attack-resilience)
8. [Cross-Team Integration (Java / Spring Boot / Frontend)](#8-cross-team-integration)
9. [Docker Deployment](#9-docker-deployment)
10. [Academic Research Documentation](#10-academic-research-documentation)

---

## 1. Architectural Overview

Traditional signature-based Web Application Firewalls (WAFs) and L3/L4 Network Intrusion Detection Systems (NIDS) fail to inspect encrypted TLS application semantics, miss zero-day injection variants, and cannot detect behavioral API attacks (e.g. rate abuse, brute force, endpoint scanning).

API Sentinel resolves this with a **4-layer hybrid defense architecture**:

```
                              Incoming API Request
                                       │
                                       ▼
                   ┌───────────────────────────────────────┐
                   │    Traffic State Tracker (Causal)     │
                   │  - Sliding 1m & 5m Windows            │
                   │  - Zero data leakage (past-only)      │
                   └───────────────────┬───────────────────┘
                                       │
                  ┌────────────────────┴────────────────────┐
                  ▼                                         ▼
     ┌─────────────────────────┐               ┌─────────────────────────┐
     │   Behavioral Extractor  │               │    Payload Extractor    │
     │ - 18 Scaled Feats       │               │ - Lexical Statistics    │
     │ - Velocity & Ratios     │               │ - Char N-Gram TF-IDF    │
     └────────────┬────────────┘               └────────────┬────────────┘
                  │                                         │
        ┌─────────┴─────────┐                     ┌─────────┴─────────┐
        ▼                   │                     ▼                   │
┌─────────────────┐         │             ┌─────────────────┐         │
│Isolation Forest │         │             │Payload Model    │         │
│(Behavioral Anom)│         │             │(TF-IDF RF Model)│         │
└────────┬────────┘         │             └────────┬────────┘         │
         │s_anom            │                      │s_pay             │
         │                  └──────────┬───────────┘                  │
         │                             ▼                              │
         │                  ┌─────────────────────┐                   │
         │                  │ Supervised Attack   │                   │
         │                  │ Classifier (XGBoost)│                   │
         │                  └──────────┬──────────┘                   │
         │                             │                              │
         │                             │s_clf                         │
         └─────────────────────────────┼──────────────────────────────┘
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
                   │        FastAPI Threat Decision        │
                   │  - Prediction: NORMAL/SUSP/MALICIOUS  │
                   │  - Attack Category & Confidence       │
                   │  - Feature-Grounded Rationales        │
                   └───────────────────┬───────────────────┘
                                       │
                                       ▼
                                 JSON Response
```

---

## 2. Project Phases & Deliverables

| Phase | Description | Deliverables & Artifacts | Status |
| :--- | :--- | :--- | :---: |
| **Phase 0** | Repository Inspection & Architecture | Isolated Git branch `ml-dev`, `.gitignore`, Python 3.12 `.venv` | **Complete** |
| **Phase 1** | Dataset Strategy & Survey | [`docs/dataset.md`](docs/dataset.md), [`scripts/generate_demo_data.py`](scripts/generate_demo_data.py) (50k records) | **Complete** |
| **Phase 2** | EDA & Causal Feature Engineering | [`scripts/eda_analysis.py`](scripts/eda_analysis.py), [`docs/figures/`](docs/figures), [`app/features/`](app/features/) | **Complete** |
| **Phase 3** | Behavioral Anomaly Detection | [`app/models/anomaly.py`](app/models/anomaly.py) (Calibrated Isolation Forest) | **Complete** |
| **Phase 4** | Supervised Multi-Class Benchmark | [`app/models/classifier.py`](app/models/classifier.py) (Logistic Regression vs RF vs XGBoost) | **Complete** |
| **Phase 5** | Specialized Payload Analysis | [`app/features/payload.py`](app/features/payload.py) (Subword character n-gram TF-IDF + Lexical) | **Complete** |
| **Phase 6** | Hybrid Risk Fusion | [`app/models/hybrid.py`](app/models/hybrid.py) (SLSQP Convex Optimization on Val Set) | **Complete** |
| **Phase 7** | Ablation & Zero-Day Experiment | [`docs/results.md`](docs/results.md), [`docs/experiments.md`](docs/experiments.md) (Command Injection holdout) | **Complete** |
| **Phase 8** | Production FastAPI Service | [`app/main.py`](app/main.py), [`app/api/v1/endpoints.py`](app/api/v1/endpoints.py), [`app/services/`](app/services/) | **Complete** |
| **Phase 9** | Automated & Live Testing | [`tests/`](tests) (23/23 tests passing), [`scripts/evaluate_models.py`](scripts/evaluate_models.py) | **Complete** |
| **Phase 10** | Docker & Integration Contracts | [`Dockerfile`](Dockerfile), [`docs/ML_API_CONTRACT.md`](docs/ML_API_CONTRACT.md), [`docs/TEAM_HANDOFF.md`](docs/TEAM_HANDOFF.md) | **Complete** |
| **Phase 11** | Research Documentation | [`docs/methodology.md`](docs/methodology.md), [`docs/API_Sentinel_ML_Research_Report.docx`](docs/API_Sentinel_ML_Research_Report.docx) | **Complete** |

---

## 3. Directory Layout

```text
ml-service/
├── app/
│   ├── api/
│   │   └── v1/
│   │       └── endpoints.py          # /predict, /predict/batch, /model-info
│   ├── core/
│   │   └── config.py                 # Pydantic service settings & thresholds
│   ├── features/
│   │   ├── behavioral.py             # 18-dim scaled telemetry & sliding window state tracker
│   │   ├── payload.py                # Character n-gram TF-IDF & Shannon entropy
│   │   └── pipeline.py               # Unified feature orchestrator (joblib serialized)
│   ├── models/
│   │   ├── anomaly.py                # Calibrated Isolation Forest anomaly detector
│   │   ├── classifier.py             # Payload RF & Multi-class XGBoost classifiers
│   │   ├── hybrid.py                 # SLSQP-optimized convex risk fusion engine
│   │   └── explain.py                # Factual rationale & explanation generator
│   ├── schemas/
│   │   ├── request.py                # Pydantic input models (PredictionRequest)
│   │   └── response.py               # Pydantic response models (PredictionResponse)
│   ├── services/
│   │   └── predictor.py              # Singleton ML model lifecycle manager
│   └── main.py                       # FastAPI application & exception handlers
├── docs/
│   ├── API_Sentinel_ML_Research_Report.docx # Complete 12-phase research paper in Word format
│   ├── dataset.md                    # Literature review & dataset survey
│   ├── eda_report.md                 # Data quality, distribution & outlier audit
│   ├── feature-engineering.md        # Mathematical feature definitions
│   ├── model-selection.md            # Algorithmic justifications & trade-offs
│   ├── experiments.md                # Partitioning & zero-day holdout protocol
│   ├── results.md                    # Empirical evaluation & ablation tables
│   ├── limitations.md                # Threat boundaries & operational constraints
│   ├── latency_benchmark.json        # P50-P99 empirical latency distribution
│   ├── ML_API_CONTRACT.md            # Definitive Java / Spring Boot integration contract
│   ├── TEAM_HANDOFF.md               # Backend, Detection Engine, & Frontend guides
│   └── figures/                      # High-resolution generated charts
├── models/
│   └── artifacts/                    # Serialized models (.joblib) & metadata.json
├── scripts/
│   ├── generate_demo_data.py         # Reproducible synthetic traffic generator
│   ├── eda_analysis.py               # Statistical profiling & figure plotting
│   ├── train_models.py               # Training, optimization & evaluation pipeline
│   ├── benchmark_latency.py          # P50-P99 latency & resource profiler
│   ├── evaluate_models.py            # Live scenario testing runner
│   └── generate_docx_report.py       # DOCX research report builder
├── tests/
│   ├── conftest.py                   # Pytest fixtures & TestClient
│   ├── test_api.py                   # API route & edge case test suite
│   ├── test_features.py              # Feature transformation & causality tests
│   └── test_models.py                # Model scoring & fusion tests
├── Dockerfile                        # Standalone production container definition
├── requirements.txt                  # Pinned dependencies
├── .gitignore                        # Scoped ignore rules
└── README.md                         # This file
```

---

## 4. Quick Start & Setup

### Prerequisites
- Python 3.11+ (Python 3.12 recommended)
- Git

### 1. Setup Virtual Environment & Install Dependencies
```bash
cd ml-service
python -m venv .venv

# On Windows (PowerShell / Command Prompt):
.\.venv\Scripts\activate
# On Linux / macOS:
source .venv/bin/activate

pip install -r requirements.txt
```

### 2. Run the Automated Test Suite
```bash
pytest -v tests/
```
*Expected: 23 passed in ~1.0 second.*

### 3. Run the Interactive Live Attack Evaluator
```bash
python scripts/evaluate_models.py
```
*Tests live vectors across SQLi, XSS, Path Traversal, Command Injection, Brute Force, Scanning, and DoS.*

### 4. Start the FastAPI Service Locally
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
Once started, open:
- **Interactive Swagger UI:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc Documentation:** [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **Service Health Check:** [http://localhost:8000/health](http://localhost:8000/health)

---

## 5. API Specification & Endpoints

### Single Threat Prediction: `POST /api/v1/predict`

#### Sample Request:
```json
{
  "source_ip": "198.51.100.22",
  "method": "POST",
  "endpoint": "/api/v1/auth/login",
  "status_code": 401,
  "response_time": 45.0,
  "request_size": 260,
  "response_size": 180,
  "user_agent": "sqlmap/1.7.2#stable",
  "authentication_status": "FAILED",
  "requests_per_minute": 75.0,
  "failed_requests": 14.0,
  "unique_endpoints": 2.0,
  "payload": "' OR '1'='1 --"
}
```

#### Sample Response:
```json
{
  "prediction": "MALICIOUS",
  "severity": "CRITICAL",
  "attack_type": "SQL_INJECTION",
  "risk_score": 0.9791,
  "anomaly_score": 1.0,
  "payload_score": 0.9968,
  "confidence": 0.5318,
  "reasons": [
    "Elevated request rate velocity (75 req/min exceeds standard baseline)",
    "Elevated error frequency (14 4xx/5xx responses in sliding window)",
    "Authentication failure or unauthorized access violation",
    "Payload contains SQL dialect structure (tautology or UNION injection tokens)",
    "Abnormally high density of syntax delimiters and special characters"
  ],
  "model_version": "v1.0.0-hybrid",
  "inference_time_ms": 52.73
}
```

### Threat Categorization Thresholds:
- **`NORMAL`** (Severity: `LOW`): $\text{Risk} < 0.22$. Safe legitimate traffic.
- **`SUSPICIOUS`** (Severity: `MEDIUM`): $0.22 \le \text{Risk} < 0.42$. Trigger CAPTCHA, challenge, or MFA.
- **`MALICIOUS`** (Severity: `HIGH`): $0.42 \le \text{Risk} < 0.57$. Block request, record security alert.
- **`MALICIOUS`** (Severity: `CRITICAL`): $\text{Risk} \ge 0.57$. Drop connection, temporarily blacklist IP.

---

## 6. Empirical Evaluation & Research Results

Evaluated on held-out test partition ($N=7,500$ records, untouched during training):

### Table: Overall Model Benchmark
| Model / Pipeline | Precision | Recall | Binary F1 | Macro F1 | ROC-AUC | PR-AUC | False Positive Rate | P50 Latency |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Isolation Forest (Behavioral)** | 0.8726 | 0.9385 | 0.9044 | — | 0.9654 | 0.9120 | 0.0301 | 85.61 ms |
| **Payload Classifier (TF-IDF RF)** | 1.0000 | 0.8437 | 0.9152 | — | 0.9892 | 0.9740 | 0.0000 | 43.80 ms |
| **Logistic Regression (Supervised)**| 0.9985 | 0.9993 | 0.9989 | 0.9984 | 0.9999 | 0.9998 | 0.0005 | 0.35 ms |
| **Random Forest (Supervised)** | 0.9883 | 0.9985 | 0.9934 | 0.9928 | 0.9998 | 0.9995 | 0.0029 | 15.20 ms |
| **XGBoost (Supervised - Selected)** | **1.0000** | **1.0000** | **1.0000** | **1.0000** | **1.0000** | **1.0000** | **0.0000** | **1.54 ms** |
| **Full Hybrid System (Optimized)** | **1.0000** | **1.0000** | **1.0000** | **1.0000** | **1.0000** | **1.0000** | **0.0000** | **136.23 ms** (Total) |

### Table: Multi-Modal Ablation Study
| Modality Combination | Precision | Recall | F1 Score | FPR | Key Analytical Finding |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Behavioral Only** | 0.8726 | 0.9385 | 0.9044 | 0.0301 | Catches scanning and rate abuse; minor false alarms on traffic bursts. |
| **Payload Only** | 1.0000 | 0.8437 | 0.9152 | 0.0000 | Zero false positives on benign queries, but blind to empty-payload attacks. |
| **Behavioral + Payload** | 0.9760 | 0.9941 | **0.9850** | 0.0054 | **Significant synergistic gain (+8.1% F1 over behavioral alone)**. |
| **Behavioral + Auth + Rate** | 0.9307 | 0.9052 | 0.9178 | 0.0148 | Highly effective against credential stuffing and volumetric flooding. |
| **Supervised Only** | 1.0000 | 1.0000 | 1.0000 | 0.0000 | Optimal on known classes, but vulnerable when facing unobserved attacks. |
| **Full Hybrid (Optimized)** | **1.0000** | **1.0000** | **1.0000** | **0.0000** | Multi-modal convex defense maximizing accuracy and zero-day coverage. |

---

## 7. Zero-Day Unseen Attack Resilience

To evaluate resilience against novel attacks, `COMMAND_INJECTION` ($N=134$ test requests) was completely withheld from supervised training:

| Component Evaluated | Detection Rate on Unseen Attacks | Mechanism of Detection |
| :--- | :---: | :--- |
| **Supervised Model (Untrained on Command Injection)** | 96.27% | Partial token overlap; failed to classify attack type correctly. |
| **Behavioral Anomaly Detector (Isolation Forest)** | **99.25%** | **Caught 133 / 134 attacks** purely via latency and error status shifts. |
| **Payload Classifier (Subword TF-IDF)** | **100.00%** | Detected shell metacharacters (`;`, `|`, `cat`, `whoami`) through subword n-grams. |
| **Full Hybrid Risk Fusion Engine** | **100.00%** | Composite risk exceeded the malicious threshold on all 134 zero-day attacks. |

---

## 8. Cross-Team Integration

### For Java / Spring Boot Developers (`backend/`)
See the full specification in [`docs/ML_API_CONTRACT.md`](docs/ML_API_CONTRACT.md).

#### Java Spring Boot DTOs:
```java
public record MlPredictRequest(
    String method,
    String endpoint,
    String source_ip,
    Integer status_code,
    Double response_time,
    Integer request_size,
    Integer response_size,
    String user_agent,
    String authentication_status,
    Double requests_per_minute,
    Double failed_requests,
    Double unique_endpoints,
    String payload
) {}

public record MlPredictResponse(
    String prediction,          // "NORMAL", "SUSPICIOUS", "MALICIOUS"
    String severity,            // "LOW", "MEDIUM", "HIGH", "CRITICAL"
    String attack_type,         // e.g. "SQL_INJECTION", "BRUTE_FORCE"
    Double risk_score,          // 0.0 to 1.0
    Double anomaly_score,       // 0.0 to 1.0
    Double payload_score,       // 0.0 to 1.0
    Double confidence,          // 0.0 to 1.0
    List<String> reasons,       // Human-readable rationales
    String model_version,       // "v1.0.0-hybrid"
    Double inference_time_ms
) {}
```

### For Detection Engine & Frontend Developers
See [`docs/TEAM_HANDOFF.md`](docs/TEAM_HANDOFF.md) for:
1. **Detection Engine Decision Matrix:** Fusing hard signature rules with ML threat scores.
2. **Frontend Security Dashboard:** Visualizing radial risk gauges ($0-100\%$), severity badges, attack tags, and explainability cards.

---

## 9. Docker Deployment

### Run Standalone Container
```bash
cd ml-service
docker build -t api-sentinel-ml .
docker run -p 8000:8000 api-sentinel-ml
```

### Run Multi-Service Stack (from Project Root)
```bash
docker compose up ml-service
```
*Orchestrated alongside Spring Boot (`backend`) on port 8080 and PostgreSQL on port 5432.*

---

## 10. Academic Research Documentation

All experiments, mathematical formulations, and limitations are fully documented for thesis defense and paper publication:
* **Complete Research Paper (Word Document):** [`docs/API_Sentinel_ML_Research_Report.docx`](docs/API_Sentinel_ML_Research_Report.docx) *(545 KB, 12 phases, embedded figures & tables)*
* **Mathematical Methodology:** [`docs/methodology.md`](docs/methodology.md)
* **Algorithmic Selection & Trade-Offs:** [`docs/model-selection.md`](docs/model-selection.md)
* **Evaluation & Benchmark Tables:** [`docs/results.md`](docs/results.md)
* **Dataset Survey & Literature Review:** [`docs/dataset.md`](docs/dataset.md)
* **Threat Boundaries & Limitations:** [`docs/limitations.md`](docs/limitations.md)
* **Real-Time Latency Profiling:** [`docs/latency_benchmark.json`](docs/latency_benchmark.json)

---

## Authors & Maintenance
- **Role:** Machine Learning Engineer
- **Project:** API Sentinel (API_IDS)
- **Git Branch:** `ml-dev`
- **Model Version:** `v1.0.0-hybrid`
