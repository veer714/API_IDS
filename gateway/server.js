const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.GATEWAY_PORT || 8081;
const UPSTREAM_URL = process.env.UPSTREAM_URL || 'http://localhost:5000';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080';

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'api-sentinel-gateway',
    port: PORT,
    upstreamUrl: UPSTREAM_URL,
    backendEvaluationUrl: BACKEND_URL,
    timestamp: new Date().toISOString()
  });
});

// Security Interceptor Middleware
app.use(async (req, res) => {
  const startTime = Date.now();
  const sourceIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  const apiKey = req.headers['x-sentinel-api-key'] || 'sentinel_live_e8a93bf409c7429d8a113200ff921bb4';
  const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
  const endpoint = req.path;
  const method = req.method;

  let serializedPayload = '';
  if (req.method === 'GET' || req.method === 'DELETE') {
    serializedPayload = Object.keys(req.query).length ? new URLSearchParams(req.query).toString() : '';
  } else {
    serializedPayload = typeof req.body === 'object' ? JSON.stringify(req.body) : String(req.body || '');
  }

  // 1. Evaluate with API Sentinel Backend
  let evaluation = null;
  try {
    const evalRes = await axios.post(`${BACKEND_URL}/api/v1/security/evaluate`, {
      appId: 'app_ecommerce_prod',
      apiKey: apiKey,
      method: method,
      url: url,
      endpoint: endpoint,
      sourceIp: sourceIp,
      userAgent: req.headers['user-agent'] || '',
      headers: {
        'host': req.headers['host'] || '',
        'user-agent': req.headers['user-agent'] || '',
        'content-type': req.headers['content-type'] || 'application/json'
      },
      payload: serializedPayload,
      requestSize: Buffer.byteLength(serializedPayload, 'utf8') + 120,
      responseTimeMs: 15.0,
      statusCode: 200,
      authenticationStatus: req.headers['authorization'] ? 'AUTHENTICATED' : 'UNAUTHENTICATED'
    }, {
      headers: {
        'X-Sentinel-Api-Key': apiKey,
        'Content-Type': 'application/json'
      },
      timeout: 4000
    });

    evaluation = evalRes.data;
  } catch (err) {
    console.warn(`[Gateway] Security evaluation error: ${err.message}. Defaulting to fail-open with logging.`);
  }

  // 2. Enforce Security Decision
  if (evaluation) {
    res.setHeader('X-Sentinel-Decision', evaluation.decision);
    res.setHeader('X-Sentinel-Risk-Score', String(evaluation.riskScore));
    res.setHeader('X-Sentinel-Request-ID', evaluation.requestId);

    if (evaluation.decision === 'BLOCK') {
      return res.status(403).json({
        error: "Forbidden by API Sentinel Intrusion Detection",
        decision: "BLOCK",
        requestId: evaluation.requestId,
        threatDetected: evaluation.attackType,
        severity: evaluation.severity,
        riskScore: evaluation.riskScore,
        reasons: evaluation.reasons,
        rulesTriggered: evaluation.rulesTriggered,
        timestamp: new Date().toISOString()
      });
    }

    if (evaluation.decision === 'CHALLENGE') {
      return res.status(401).json({
        error: "Security Challenge Required",
        decision: "CHALLENGE",
        requestId: evaluation.requestId,
        threatDetected: evaluation.attackType,
        riskScore: evaluation.riskScore,
        reasons: evaluation.reasons,
        challengeUrl: `/security/challenge?req=${evaluation.requestId}`
      });
    }

    if (evaluation.decision === 'THROTTLE') {
      res.setHeader('Retry-After', '60');
      return res.status(429).json({
        error: "Rate Limit Exceeded — Request Throttled",
        decision: "THROTTLE",
        requestId: evaluation.requestId,
        reasons: evaluation.reasons
      });
    }
  }

  // 3. Forward Allowed Request to Upstream Target API
  try {
    const upstreamUrl = `${UPSTREAM_URL}${req.originalUrl}`;
    const upstreamRes = await axios({
      method: req.method,
      url: upstreamUrl,
      headers: {
        ...req.headers,
        host: new URL(UPSTREAM_URL).host,
        'x-sentinel-verified': 'true'
      },
      data: req.body,
      params: req.query,
      validateStatus: () => true // Forward all status codes
    });

    // Copy upstream headers
    Object.entries(upstreamRes.headers).forEach(([k, v]) => {
      if (!['transfer-encoding', 'connection'].includes(k.toLowerCase())) {
        res.setHeader(k, v);
      }
    });

    return res.status(upstreamRes.status).send(upstreamRes.data);
  } catch (upstreamErr) {
    console.error(`[Gateway] Error forwarding to upstream ${UPSTREAM_URL}: ${upstreamErr.message}`);
    return res.status(502).json({
      error: "Bad Gateway — Target upstream API unreachable",
      target: UPSTREAM_URL
    });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[API Sentinel Gateway] Listening on http://localhost:${PORT}`);
  console.log(`[API Sentinel Gateway] Upstream Target: ${UPSTREAM_URL}`);
  console.log(`[API Sentinel Gateway] Backend Security Evaluation: ${BACKEND_URL}`);
});
