import React from 'react';
import { RequestEvent } from '../../types';
import { DecisionBadge } from './DecisionBadge';
import { SeverityBadge } from './SeverityBadge';
import { RiskScoreBar } from './RiskScoreBar';
import {
  X,
  Clock,
  Globe,
  Cpu,
  Shield,
  Layers,
  Activity,
  Code,
  AlertOctagon,
  CheckCircle,
  FileText
} from 'lucide-react';

interface Props {
  event: RequestEvent | null;
  onClose: () => void;
}

export const RequestInspectorModal: React.FC<Props> = ({ event, onClose }) => {
  if (!event) return null;

  let reasons: string[] = [];
  try {
    if (event.reasonsJson) reasons = JSON.parse(event.reasonsJson);
  } catch (e) {}

  let rules: string[] = [];
  try {
    if (event.rulesTriggeredJson) rules = JSON.parse(event.rulesTriggeredJson);
  } catch (e) {}

  let headers: Record<string, string> = {};
  try {
    if (event.headersJson) headers = JSON.parse(event.headersJson);
  } catch (e) {}

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex justify-end">
      <div className="bg-sentinel-900 w-full max-w-2xl min-h-screen border-l border-sentinel-800 shadow-2xl flex flex-col p-6 overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-sentinel-800">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
                {event.requestId}
              </span>
              <DecisionBadge decision={event.decision} />
              <SeverityBadge severity={event.severity} />
            </div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-sentinel-800 text-slate-300">
                {event.method}
              </span>
              <span className="font-mono text-sm">{event.endpoint}</span>
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-sentinel-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6 pt-5">
          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-sentinel-850 p-3.5 rounded-lg border border-sentinel-800">
              <span className="text-xs text-slate-400 block mb-1">Fused Risk Score</span>
              <RiskScoreBar score={event.riskScore} />
            </div>
            <div className="bg-sentinel-850 p-3.5 rounded-lg border border-sentinel-800">
              <span className="text-xs text-slate-400 block mb-1">Attack Category</span>
              <span className="text-sm font-semibold text-slate-200">
                {event.attackType || 'NORMAL'}
              </span>
            </div>
            <div className="bg-sentinel-850 p-3.5 rounded-lg border border-sentinel-800">
              <span className="text-xs text-slate-400 block mb-1">Latency / Pipeline</span>
              <span className="text-sm font-mono text-slate-200">
                {event.responseTimeMs}ms / {event.inferenceTimeMs || 2.4}ms
              </span>
            </div>
          </div>

          {/* Explainable Decision Rationale */}
          <div className="bg-sentinel-850 rounded-lg p-4 border border-sentinel-800">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-cyan-400" />
              Explainable Decision & Security Reasons
            </h4>
            {reasons.length > 0 ? (
              <ul className="space-y-1.5">
                {reasons.map((r, i) => (
                  <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-500">Normal request parameters and baseline behavioral telemetry.</p>
            )}

            {rules.length > 0 && (
              <div className="mt-3 pt-3 border-t border-sentinel-800">
                <span className="text-xs text-slate-400 font-medium block mb-1.5">Triggered Detection Rules:</span>
                <div className="flex flex-wrap gap-1.5">
                  {rules.map((rule, idx) => (
                    <span key={idx} className="text-xs font-mono px-2 py-0.5 rounded bg-rose-950/40 text-rose-300 border border-rose-800/40">
                      {rule}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Machine Learning Telemetry Breakdown */}
          <div className="bg-sentinel-850 rounded-lg p-4 border border-sentinel-800">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-indigo-400" />
              ML Intelligence & Model Telemetry
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400">Pipeline Model:</span>
                <p className="font-mono text-slate-200 mt-0.5">{event.modelVersion || 'v1.0.0-hybrid'}</p>
              </div>
              <div>
                <span className="text-slate-400">Model Prediction:</span>
                <p className="font-semibold text-slate-200 mt-0.5">{event.modelPrediction || 'NORMAL'}</p>
              </div>
              <div>
                <span className="text-slate-400">Behavioral Anomaly Score:</span>
                <p className="font-mono text-slate-200 mt-0.5">{(event.anomalyScore || 0).toFixed(2)}</p>
              </div>
              <div>
                <span className="text-slate-400">Payload Threat Score:</span>
                <p className="font-mono text-slate-200 mt-0.5">{(event.payloadScore || 0).toFixed(2)}</p>
              </div>
              <div>
                <span className="text-slate-400">Supervised Classifier Confidence:</span>
                <p className="font-mono text-slate-200 mt-0.5">{((event.confidence || 0.95) * 100).toFixed(1)}%</p>
              </div>
              <div>
                <span className="text-slate-400">Inference Latency:</span>
                <p className="font-mono text-slate-200 mt-0.5">{event.inferenceTimeMs || 2.4} ms</p>
              </div>
            </div>
          </div>

          {/* Network & Client Telemetry */}
          <div className="bg-sentinel-850 rounded-lg p-4 border border-sentinel-800">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-emerald-400" />
              Network & Client Telemetry
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400">Source IP:</span>
                <p className="font-mono text-slate-200 mt-0.5">{event.sourceIp}</p>
              </div>
              <div>
                <span className="text-slate-400">Timestamp:</span>
                <p className="font-mono text-slate-200 mt-0.5">{new Date(event.timestamp).toLocaleString()}</p>
              </div>
              <div>
                <span className="text-slate-400">HTTP Status:</span>
                <p className="font-mono text-slate-200 mt-0.5">{event.statusCode}</p>
              </div>
              <div>
                <span className="text-slate-400">Auth Status:</span>
                <p className="font-mono text-slate-200 mt-0.5">{event.authenticationStatus}</p>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400">User Agent:</span>
                <p className="font-mono text-slate-300 mt-0.5 truncate">{event.userAgent || 'Not specified'}</p>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400">Full Request URL:</span>
                <p className="font-mono text-slate-300 mt-0.5 break-all bg-sentinel-900 p-2 rounded border border-sentinel-800">
                  {event.url}
                </p>
              </div>
            </div>
          </div>

          {/* Payload Snippet */}
          {event.payloadSnippet && (
            <div className="bg-sentinel-850 rounded-lg p-4 border border-sentinel-800">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <Code className="w-4 h-4 text-amber-400" />
                Raw Payload Snippet / Parameters
              </h4>
              <pre className="text-xs font-mono text-slate-200 bg-sentinel-900 p-3 rounded-lg border border-sentinel-800 overflow-x-auto whitespace-pre-wrap break-all">
                {event.payloadSnippet}
              </pre>
            </div>
          )}

          {/* Headers where safe */}
          {Object.keys(headers).length > 0 && (
            <div className="bg-sentinel-850 rounded-lg p-4 border border-sentinel-800">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-slate-400" />
                Captured Safe Request Headers
              </h4>
              <div className="space-y-1 font-mono text-xs">
                {Object.entries(headers).map(([k, v]) => (
                  <div key={k} className="flex gap-2">
                    <span className="text-slate-400 shrink-0">{k}:</span>
                    <span className="text-slate-200 truncate">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Execution Timeline */}
          <div className="bg-sentinel-850 rounded-lg p-4 border border-sentinel-800">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-cyan-400" />
              Security Execution Timeline
            </h4>
            <div className="space-y-3 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-sentinel-700 text-xs">
              <div className="flex items-center gap-3 relative pl-6">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 absolute left-1" />
                <div>
                  <span className="font-semibold text-slate-200">Gateway Ingestion & Header Verification</span>
                  <span className="text-slate-400 block text-[11px]">Telemetry captured and sliding window state initialized</span>
                </div>
              </div>
              <div className="flex items-center gap-3 relative pl-6">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 absolute left-1" />
                <div>
                  <span className="font-semibold text-slate-200">Hybrid Detection Pipeline Execution</span>
                  <span className="text-slate-400 block text-[11px]">Signatures evaluated + Multi-modal ML inference in {event.inferenceTimeMs || 2.4}ms</span>
                </div>
              </div>
              <div className="flex items-center gap-3 relative pl-6">
                <span className={`w-2.5 h-2.5 rounded-full absolute left-1 ${event.decision === 'BLOCK' ? 'bg-rose-400' : 'bg-emerald-400'}`} />
                <div>
                  <span className="font-semibold text-slate-200">Decision Enforcement: {event.decision}</span>
                  <span className="text-slate-400 block text-[11px]">
                    {event.decision === 'BLOCK'
                      ? 'Request neutralized with HTTP 403 Forbidden'
                      : 'Request verified and dispatched to upstream API service'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
