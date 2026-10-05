import React, { useState, useEffect } from 'react';
import { loginShieldApi } from '../api/client';
import { LoginShieldStatus } from '../types';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import { RiskScoreBar } from '../components/common/RiskScoreBar';
import {
  Lock,
  ShieldAlert,
  AlertTriangle,
  UserX,
  CheckCircle2,
  Clock,
  Globe,
  Sliders,
  RefreshCw
} from 'lucide-react';

export const LoginShieldPage: React.FC = () => {
  const [status, setStatus] = useState<LoginShieldStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      const data = await loginShieldApi.getStatus();
      setStatus(data);
    } catch (e) {
      console.error('Failed to load login shield status:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-sentinel-800/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
              IDENTITY DEFENSE
            </span>
            <span className="text-xs text-slate-500 font-mono">Brute-Force & Credential Abuse Guard</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Login Shield</h1>
        </div>

        <button
          onClick={fetchStatus}
          className="p-1.5 rounded-lg bg-sentinel-850 hover:bg-sentinel-800 border border-sentinel-750 text-slate-400 hover:text-white"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="soc-card">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Total Auth Attempts (24h)</span>
            <Lock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">
            {status?.totalAttempts || 0}
          </div>
          <span className="text-[11px] text-slate-500 block mt-2">Monitored authentication routes</span>
        </div>

        <div className="soc-card">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Failed Attempts</span>
            <UserX className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-amber-400 font-mono">
            {status?.failedAttempts || 0}
          </div>
          <span className="text-[11px] text-slate-500 block mt-2">
            {status ? ((status.failureRate || 0) * 100).toFixed(1) : 0}% failure ratio
          </span>
        </div>

        <div className="soc-card">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Brute-Force Lockouts</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-extrabold text-rose-400 font-mono">
            {status?.bruteForceBlocked || 0}
          </div>
          <span className="text-[11px] text-slate-500 block mt-2">Malicious IPs neutralized</span>
        </div>

        <div className="soc-card">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Lockout Threshold</span>
            <Sliders className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">
            {status?.maxAttemptsBeforeLockout || 5} <span className="text-xs text-slate-500 font-normal">fails / 5m</span>
          </div>
          <span className="text-[11px] text-slate-500 block mt-2">Server-enforced defense policy</span>
        </div>
      </div>

      {/* Policy Configuration Box */}
      <div className="soc-card">
        <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
          <Lock className="w-4 h-4 text-cyan-400" />
          Active Login Shield Protection Rules
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Enforced across all authentication endpoints (<code>/api/auth/login</code>, <code>/api/auth/register</code>, <code>/api/v1/auth/*</code>):
        </p>
        <div className="grid md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-sentinel-850 border border-sentinel-800">
            <span className="text-slate-400 block mb-1">Max Failures Before IP Lockout</span>
            <span className="font-mono text-cyan-400 font-bold">5 Attempts</span>
          </div>
          <div className="p-3 rounded-lg bg-sentinel-850 border border-sentinel-800">
            <span className="text-slate-400 block mb-1">Lockout Duration Window</span>
            <span className="font-mono text-slate-200 font-bold">5 Minutes Cooling Period</span>
          </div>
          <div className="p-3 rounded-lg bg-sentinel-850 border border-sentinel-800">
            <span className="text-slate-400 block mb-1">MFA / Challenge Risk Threshold</span>
            <span className="font-mono text-amber-400 font-bold">0.40 Risk Score</span>
          </div>
        </div>
      </div>

      {/* Recent Login Telemetry Stream */}
      <div className="soc-card p-0 overflow-hidden">
        <div className="p-4 border-b border-sentinel-800">
          <h3 className="text-sm font-semibold text-white">Recent Authentication Events</h3>
          <p className="text-xs text-slate-400">Real-time login telemetry captured from client applications</p>
        </div>

        {loading ? (
          <div className="p-6">
            <LoadingSkeleton rows={5} />
          </div>
        ) : status?.recentAttempts && status.recentAttempts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th className="soc-table-header">Timestamp</th>
                  <th className="soc-table-header">Target Identity</th>
                  <th className="soc-table-header">Source IP</th>
                  <th className="soc-table-header">Result</th>
                  <th className="soc-table-header">Failure Reason</th>
                  <th className="soc-table-header">Calculated Risk</th>
                  <th className="soc-table-header text-right">Lockout Status</th>
                </tr>
              </thead>
              <tbody>
                {status.recentAttempts.map((attempt) => (
                  <tr key={attempt.id} className="soc-table-row">
                    <td className="px-4 py-3 font-mono text-xs text-slate-400 whitespace-nowrap">
                      {new Date(attempt.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-200">
                      {attempt.username}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">
                      {attempt.sourceIp}
                    </td>
                    <td className="px-4 py-3">
                      {attempt.success ? (
                        <span className="inline-flex items-center gap-1 font-mono text-xs text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40 font-medium">
                          SUCCESS
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-mono text-xs text-rose-400 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-800/40 font-medium">
                          FAILED
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400 font-mono">
                      {attempt.failureReason || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <RiskScoreBar score={attempt.riskScore} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      {attempt.blocked ? (
                        <span className="inline-flex items-center gap-1 font-mono text-xs text-rose-400 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-800/40 font-bold">
                          LOCKED OUT
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-mono text-xs text-slate-400 bg-sentinel-800 px-2 py-0.5 rounded">
                          NORMAL
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No login events registered yet"
            description="Trigger authentication attempts in the demo or client application to observe real-time identity defense."
          />
        )}
      </div>
    </div>
  );
};
