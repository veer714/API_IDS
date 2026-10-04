# API Sentinel — Multi-Service Team Handoff Guide

This document coordinates the integration between the **Machine Learning Service (`ml-service/`)**, the **Java Spring Boot Backend (`backend/`)**, the **Detection Engine (`detection-engine/`)**, and the **Frontend Dashboard (`frontend/`)**.

---

## 1. For Backend Developers (Spring Boot 3.3.4 / Java 21)

### How to Call the ML Service via Spring `RestClient` or `WebClient`

The ML service runs at `http://ml-service:8000` (Docker) or `http://localhost:8000` (local dev).

#### Example Spring Boot DTOs:
```java
package com.apisentinel.dto.ml;

import java.util.List;

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
    List<String> reasons,       // Human-readable explanations
    String model_version,       // "v1.0.0-hybrid"
    Double inference_time_ms
) {}
```

#### Example Spring Boot Client Service:
```java
package com.apisentinel.service;

import com.apisentinel.dto.ml.MlPredictRequest;
import com.apisentinel.dto.ml.MlPredictResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import java.time.Duration;

@Service
public class MlInferenceService {

    private final RestClient restClient;

    public MlInferenceService(@Value("${ml.service.url:http://localhost:8000}") String mlUrl) {
        this.restClient = RestClient.builder()
            .baseUrl(mlUrl)
            .build();
    }

    public MlPredictResponse inspectTraffic(MlPredictRequest request) {
        try {
            return restClient.post()
                .uri("/api/v1/predict")
                .body(request)
                .retrieve()
                .body(MlPredictResponse.class);
        } catch (Exception e) {
            // Log fallback to rule-based engine upon network failure
            return fallbackResponse();
        }
    }

    private MlPredictResponse fallbackResponse() {
        return new MlPredictResponse("NORMAL", "LOW", "UNKNOWN", 0.0, 0.0, 0.0, 0.0, 
            List.of("ML service unavailable - fallback triggered"), "fallback", 0.0);
    }
}
```

---

## 2. For Detection Engine Developers

### How to Combine Rule/Signature Detection with ML Output

The Detection Engine should enforce defense-in-depth:

```
Incoming Request
      │
      ├───► 1. Static Rule & Signature Check (e.g. Suricata/Snort/OWASP ModSecurity Core Rules)
      │        - Immediate deterministic block if hard signature triggers (e.g. known CVE exploit string).
      │        - Pass rule flag: `rule_match = true / false`
      │
      └───► 2. ML Inference (`POST /api/v1/predict`)
               - Obtains multi-modal scores (`risk_score`, `anomaly_score`, `payload_score`).
               - Detects zero-days, behavioral rate abuse, and token variations missed by static rules.
```

### Fusion Decision Matrix:
| Rule Match | ML Risk Score | ML Attack Type | Final Action | Action Taken |
| :---: | :---: | :---: | :---: | :---: |
| **YES** | Any ($\ge 0.0$) | Any | **BLOCK** | Immediate 403 Forbidden; log high-priority alert. |
| **NO** | $\ge 0.42$ | `MALICIOUS` | **BLOCK** | AI-driven block (Catches zero-day / signature bypass). |
| **NO** | $0.22 \le \text{Risk} < 0.42$ | `SUSPICIOUS` | **CHALLENGE / RATE-LIMIT** | Issue CAPTCHA or rate-limit IP; record telemetry. |
| **NO** | $< 0.22$ | `NORMAL` | **ALLOW** | Forward request to upstream target API. |

---

## 3. For Frontend Developers (Security Dashboard)

### Which Fields to Display on Dashboard

When building the security telemetry view, the following fields from `PredictionResponse` are ready for visual rendering:

1. **Threat Badge / Status Indicator:**
   - Display `prediction` (`NORMAL` in green, `SUSPICIOUS` in amber/yellow, `MALICIOUS` in red).
   - Display `severity` badge (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
2. **Radial Gauge / Threat Meter:**
   - Map `risk_score` ($0.0 \to 1.0$) to a percentage ($0\% \to 100\%$).
   - Color scale: Green ($0-22\%$), Amber ($22-42\%$), Orange ($42-57\%$), Red ($57-100\%$).
3. **Attack Classification Card:**
   - Display `attack_type` (e.g. `SQL_INJECTION`, `BRUTE_FORCE`, `COMMAND_INJECTION`).
   - Display `confidence` as a percentage (e.g. `99.8% confidence`).
4. **Sub-Modality Signal Breakdown (Bar or Sparkline):**
   - Behavioral Anomaly Score: `anomaly_score`
   - Payload Score: `payload_score`
5. **Explainability Reason List:**
   - Render `reasons` as an interactive bulleted list or security tags (e.g. `"Elevated request rate (65 req/min)"`, `"Detected SQL injection patterns"`).
6. **Telemetry & Version Metadata:**
   - Inference Latency: `inference_time_ms` (e.g. `136.2 ms`)
   - Model Version: `model_version` (e.g. `v1.0.0-hybrid`)
