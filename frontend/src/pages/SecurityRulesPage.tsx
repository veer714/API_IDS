import React, { useState, useEffect } from 'react';
import { rulesApi } from '../api/client';
import { SecurityRule } from '../types';
import { SeverityBadge } from '../components/common/SeverityBadge';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import {
  Sliders,
  Shield,
  CheckCircle,
  AlertTriangle,
  ToggleLeft,
  ToggleRight,
  Code,
  FileCheck
} from 'lucide-react';

export const SecurityRulesPage: React.FC = () => {
  const [rules, setRules] = useState<SecurityRule[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRules = async () => {
    try {
      const data = await rulesApi.getAll();
      setRules(data);
    } catch (e) {
      console.error('Failed to load rules:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleToggle = async (rule: SecurityRule) => {
    try {
      const updated = await rulesApi.update(rule.id, {
        enabled: !rule.enabled,
      });
      setRules(rules.map((r) => (r.id === rule.id ? updated : r)));
    } catch (err) {
      console.error('Failed to toggle rule:', err);
    }
  };

  const handleActionChange = async (rule: SecurityRule, action: string) => {
    try {
      const updated = await rulesApi.update(rule.id, {
        action,
      });
      setRules(rules.map((r) => (r.id === rule.id ? updated : r)));
    } catch (err) {
      console.error('Failed to update rule action:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-sentinel-800/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
              HEURISTIC ENGINE
            </span>
            <span className="text-xs text-slate-500 font-mono">{rules.filter(r => r.enabled).length} of {rules.length} Rules Armed</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Detection Rules & Heuristics</h1>
        </div>
      </div>

      {/* Rules Catalog Grid */}
      <div className="space-y-4">
        {loading ? (
          <LoadingSkeleton rows={6} />
        ) : rules.length > 0 ? (
          rules.map((rule) => (
            <div
              key={rule.id}
              className={`soc-card transition-all ${
                rule.enabled ? 'border-sentinel-800' : 'border-sentinel-850 opacity-60'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono text-xs text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
                      {rule.ruleId}
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-sentinel-800 text-slate-400">
                      {rule.category}
                    </span>
                    <SeverityBadge severity={rule.severity} />
                  </div>

                  <h3 className="text-sm font-bold text-white">{rule.name}</h3>

                  <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
                    {rule.description}
                  </p>

                  {rule.patternRegex && (
                    <div className="pt-2">
                      <span className="text-[11px] font-mono text-slate-500 block mb-0.5">Signature Regex Pattern:</span>
                      <pre className="text-[11px] font-mono text-slate-300 bg-sentinel-950 p-2 rounded border border-sentinel-800/80 overflow-x-auto">
                        {rule.patternRegex}
                      </pre>
                    </div>
                  )}
                </div>

                <div className="flex md:flex-col items-end justify-between gap-3 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-sentinel-800">
                  {/* Enable / Disable Switch */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-medium">Status:</span>
                    <button
                      onClick={() => handleToggle(rule)}
                      className={`text-xs font-mono font-semibold px-2.5 py-1 rounded transition-colors ${
                        rule.enabled
                          ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/40'
                          : 'bg-sentinel-800 text-slate-500'
                      }`}
                    >
                      {rule.enabled ? 'ACTIVE' : 'DISABLED'}
                    </button>
                  </div>

                  {/* Action Selection */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-medium">Enforce:</span>
                    <select
                      value={rule.action}
                      disabled={!rule.enabled}
                      onChange={(e) => handleActionChange(rule, e.target.value)}
                      className="bg-sentinel-850 border border-sentinel-750 text-slate-200 text-xs font-mono rounded px-2.5 py-1 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
                    >
                      <option value="BLOCK">BLOCK (403)</option>
                      <option value="CHALLENGE">CHALLENGE (401)</option>
                      <option value="THROTTLE">THROTTLE (429)</option>
                      <option value="ALERT">ALERT ONLY</option>
                    </select>
                  </div>

                  {/* Sensitivity Threshold */}
                  <div className="text-[11px] font-mono text-slate-400">
                    Threshold: <span className="text-cyan-400 font-semibold">{rule.threshold.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <EmptyState
            title="No rules found"
            description="The rule engine catalog has not been initialized."
          />
        )}
      </div>
    </div>
  );
};
