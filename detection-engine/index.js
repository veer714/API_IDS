const axios = require('axios');

class DetectionEngine {
  constructor(options = {}) {
    this.mlServiceUrl = options.mlServiceUrl || process.env.ML_SERVICE_URL || 'http://localhost:8000';
    this.timeoutMs = options.timeoutMs || 3000;
    this.ipHistory = new Map();

    this.rules = [
      {
        id: 'RULE_SQLI_HEURISTIC',
        category: 'INJECTION',
        name: 'SQL Injection Signature Guard',
        severity: 'HIGH',
        regex: /(?:\bunion\s+select\b|'\s+or\s+'?1'?'?\s*=\s*'?1|--|#|\/\*|;\s*drop\s+table|information_schema|exec\s*\()/i,
        attackType: 'SQL_INJECTION'
      },
      {
        id: 'RULE_XSS_DETECT',
        category: 'XSS',
        name: 'Cross-Site Scripting Guard',
        severity: 'HIGH',
        regex: /(?:<script[^>]*>|javascript:|alert\s*\(|document\.cookie|onerror\s*=|onload\s*=|eval\s*\()/i,
        attackType: 'XSS'
      },
      {
        id: 'RULE_PATH_TRAVERSAL',
        category: 'PATH_TRAVERSAL',
        name: 'Directory Climbing Guard',
        severity: 'HIGH',
        regex: /(?:\.\.\/|\.\.\\|%2e%2e%2f|\/etc\/passwd|\/windows\/system32)/i,
        attackType: 'PATH_TRAVERSAL'
      },
      {
        id: 'RULE_COMMAND_INJECTION',
        category: 'INJECTION',
        name: 'OS Command Injection Guard',
        severity: 'CRITICAL',
        regex: /(?:;\s*(?:cat|ls|whoami|id|bash|sh|curl|wget|nc)\b|\|\s*(?:cat|ls|whoami|id|bash|sh)|`[^`]+`|\$\([^)]+\))/i,
        attackType: 'COMMAND_INJECTION'
      }
    ];
  }

  trackIpTelemetry(ip, endpoint, statusCode) {
    if (!ip) return { rpm: 1.0, failedRequests: 0.0, uniqueEndpoints: 1.0 };

    const now = Date.now();
    let record = this.ipHistory.get(ip);
    if (!record) {
      record = { requests: [], failures: [], endpoints: new Set() };
      this.ipHistory.set(ip, record);
    }

    record.requests.push(now);
    if (endpoint) record.endpoints.add(endpoint);
    if (statusCode >= 400) record.failures.push(now);

    // Prune older than 60s
    record.requests = record.requests.filter(t => now - t < 60000);
    // Prune failures older than 300s
    record.failures = record.failures.filter(t => now - t < 300000);

    return {
      rpm: record.requests.length,
      failedRequests: record.failures.length,
      uniqueEndpoints: record.endpoints.size
    };
  }

  matchRules(endpoint, payload) {
    const text = `${endpoint || ''} ${payload || ''}`;
    const triggered = [];
    let detectedAttack = null;
    let maxSeverity = 'LOW';

    for (const rule of this.rules) {
      if (rule.regex.test(text)) {
        triggered.push(rule.id);
        detectedAttack = rule.attackType;
        maxSeverity = rule.severity;
      }
    }

    return { triggered, detectedAttack, maxSeverity };
  }

  async queryMlService(telemetry) {
    const t0 = Date.now();
    try {
      const response = await axios.post(`${this.mlServiceUrl}/api/v1/predict`, {
        source_ip: telemetry.sourceIp || '127.0.0.1',
        method: telemetry.method || 'GET',
        endpoint: telemetry.endpoint || '/',
        status_code: telemetry.statusCode || 200,
        response_time: telemetry.responseTimeMs || 20.0,
        request_size: telemetry.requestSize || 100,
        response_size: telemetry.responseSize || 500,
        user_agent: telemetry.userAgent || '',
        authentication_status: telemetry.authStatus || 'UNAUTHENTICATED',
        user_id: telemetry.userId || null,
        requests_per_minute: telemetry.rpm,
        failed_requests: telemetry.failedRequests,
        unique_endpoints: telemetry.uniqueEndpoints,
        payload: telemetry.payload || ''
      }, { timeout: this.timeoutMs });

      const data = response.data;
      return {
        prediction: data.prediction,
        severity: data.severity,
        attackType: data.attack_type,
        riskScore: data.risk_score,
        anomalyScore: data.anomaly_score,
        payloadScore: data.payload_score,
        confidence: data.confidence,
        reasons: data.reasons || [],
        modelVersion: data.model_version || 'v1.0.0-hybrid',
        inferenceTimeMs: data.inference_time_ms || (Date.now() - t0),
        isFallback: false
      };
    } catch (err) {
      // Heuristic fallback if ML service unreachable
      return this.heuristicFallback(telemetry.payload, telemetry.endpoint, Date.now() - t0);
    }
  }

  heuristicFallback(payload, endpoint, latencyMs) {
    const text = `${payload || ''} ${endpoint || ''}`.toLowerCase();
    const reasons = [];

    if (text.includes("' or ") || text.includes("union select") || text.includes("--")) {
      reasons.push("Heuristic: SQL injection signature pattern");
      return {
        prediction: 'MALICIOUS',
        severity: 'HIGH',
        attackType: 'SQL_INJECTION',
        riskScore: 0.90,
        anomalyScore: 0.80,
        payloadScore: 0.95,
        confidence: 0.92,
        reasons,
        modelVersion: 'v1.0.0-fallback',
        inferenceTimeMs: latencyMs,
        isFallback: true
      };
    }

    if (text.includes("<script") || text.includes("javascript:") || text.includes("alert(")) {
      reasons.push("Heuristic: Cross-site scripting (XSS) payload");
      return {
        prediction: 'MALICIOUS',
        severity: 'HIGH',
        attackType: 'XSS',
        riskScore: 0.88,
        anomalyScore: 0.75,
        payloadScore: 0.92,
        confidence: 0.90,
        reasons,
        modelVersion: 'v1.0.0-fallback',
        inferenceTimeMs: latencyMs,
        isFallback: true
      };
    }

    if (text.includes("../") || text.includes("..\\") || text.includes("/etc/passwd")) {
      reasons.push("Heuristic: Directory path traversal pattern");
      return {
        prediction: 'MALICIOUS',
        severity: 'HIGH',
        attackType: 'PATH_TRAVERSAL',
        riskScore: 0.91,
        anomalyScore: 0.82,
        payloadScore: 0.94,
        confidence: 0.93,
        reasons,
        modelVersion: 'v1.0.0-fallback',
        inferenceTimeMs: latencyMs,
        isFallback: true
      };
    }

    reasons.push("Baseline request parameters normal");
    return {
      prediction: 'NORMAL',
      severity: 'LOW',
      attackType: 'NORMAL',
      riskScore: 0.05,
      anomalyScore: 0.02,
      payloadScore: 0.01,
      confidence: 0.99,
      reasons,
      modelVersion: 'v1.0.0-fallback',
      inferenceTimeMs: latencyMs,
      isFallback: true
    };
  }

  async evaluate(requestData) {
    const sourceIp = requestData.sourceIp || '127.0.0.1';
    const endpoint = requestData.endpoint || '/';
    const payload = requestData.payload || '';

    // 1. Sliding window rate tracking
    const { rpm, failedRequests, uniqueEndpoints } = this.trackIpTelemetry(
      sourceIp,
      endpoint,
      requestData.statusCode || 200
    );

    // 2. Signature match
    const ruleMatch = this.matchRules(endpoint, payload);

    // 3. ML Inference
    const mlResult = await this.queryMlService({
      ...requestData,
      rpm,
      failedRequests,
      uniqueEndpoints
    });

    // 4. Hybrid Risk Fusion
    let fusedRisk = mlResult.riskScore;
    let attackType = mlResult.attackType;
    let severity = mlResult.severity;
    const reasons = [...mlResult.reasons];
    const rulesTriggered = [...ruleMatch.triggered];

    const rateExceeded = rpm > 120;
    if (rateExceeded) {
      fusedRisk = Math.max(fusedRisk, 0.65);
      attackType = 'RATE_ABUSE';
      severity = 'MEDIUM';
      rulesTriggered.push('RULE_RATE_ABUSE');
      reasons.push(`Rate limit threshold exceeded (${rpm} req/min)`);
    }

    if (ruleMatch.triggered.length > 0) {
      fusedRisk = Math.max(fusedRisk, 0.85);
      attackType = ruleMatch.detectedAttack || attackType;
      severity = ruleMatch.maxSeverity || severity;
      for (const r of ruleMatch.triggered) {
        reasons.push(`Signature match: ${r}`);
      }
    }

    // 5. Decision
    let decision = 'ALLOW';
    if (fusedRisk >= 0.65) {
      decision = 'BLOCK';
    } else if (fusedRisk >= 0.40) {
      decision = 'CHALLENGE';
    } else if (rateExceeded) {
      decision = 'THROTTLE';
    }

    return {
      decision,
      riskScore: Math.round(fusedRisk * 100) / 100,
      anomalyScore: Math.round(mlResult.anomalyScore * 100) / 100,
      payloadScore: Math.round(mlResult.payloadScore * 100) / 100,
      confidence: Math.round(mlResult.confidence * 100) / 100,
      attackType,
      severity,
      reasons,
      rulesTriggered,
      inferenceTimeMs: mlResult.inferenceTimeMs,
      modelVersion: mlResult.modelVersion,
      isFallback: mlResult.isFallback
    };
  }
}

module.exports = DetectionEngine;
