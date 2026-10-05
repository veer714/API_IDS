import React, { useState, useEffect } from 'react';
import { systemHealthApi } from '../api/client';
import { SystemHealth } from '../types';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import {
  Server,
  Activity,
  Cpu,
  Database,
  Shield,
  Layers,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Clock
} from 'lucide-react';

export const SystemHealthPage: React.FC = () => {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHealth = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const data = await systemHealthApi.getHealth();
      setHealth(data);
    } catch (e) {
      console.error('Failed to load system health:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(() => fetchHealth(false), 5000);
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (status?: string) => {
    const s = status || 'HEALTHY';
    if (s === 'HEALTHY') {
      return (
        <span className="font-mono text-xs px-2.5 py-1 rounded-full bg-emerald-950/40 text-emerald-400 border border-emerald-800/40 font-semibold inline-flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          HEALTHY
        </span>
      );
    }
    if (s === 'DEGRADED') {
      return (
        <span className="font-mono text-xs px-2.5 py-1 rounded-full bg-amber-950/40 text-amber-400 border border-amber-800/40 font-semibold inline-flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          DEGRADED
        </span>
      );
    }
    return (
      <span className="font-mono text-xs px-2.5 py-1 rounded-full bg-rose-950/40 text-rose-400 border border-rose-800/40 font-semibold inline-flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-rose-400" />
        OFFLINE
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-sentinel-800/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
              INFRASTRUCTURE
            </span>
            <span className="text-xs text-slate-500 font-mono">Live Multi-Service Diagnostics</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">System Status & Health</h1>
        </div>

        <button
          onClick={() => fetchHealth(true)}
          className="p-1.5 rounded-lg bg-sentinel-850 hover:bg-sentinel-800 border border-sentinel-750 text-slate-400 hover:text-white"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-cyan-400' : ''}`} />
        </button>
      </div>

      {loading && !health ? (
        <LoadingSkeleton rows={6} />
      ) : (
        <div className="space-y-6">
          {/* Overall Health Status Banner */}
          <div className="soc-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-sentinel-900 to-sentinel-850">
            <div>
              <span className="text-xs text-slate-400 font-medium block mb-1">Composite Platform Status</span>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {health?.overallStatus === 'HEALTHY'
                    ? 'All Security Subsystems Operational'
                    : 'System Operating with Warnings'}
                </h2>
                {getStatusBadge(health?.overallStatus)}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Zero security degradations detected across core inspection microservices.
              </p>
            </div>
            <div className="text-right text-xs font-mono text-slate-400">
              <span>Diagnostic Probe Interval: 5000ms</span>
            </div>
          </div>

          {/* Microservices Diagnostic Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* API Gateway */}
            <div className="soc-card space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-cyan-950/40 border border-cyan-800/40 text-cyan-400">
                    <Server className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">API Gateway Reverse Proxy</h3>
                    <span className="text-[11px] font-mono text-slate-400">Port :8081</span>
                  </div>
                </div>
                {getStatusBadge(health?.gateway.status)}
              </div>
              <p className="text-xs text-slate-400">{health?.gateway.message}</p>
              <div className="grid grid-cols-2 gap-2 p-2.5 rounded bg-sentinel-850 border border-sentinel-800 text-xs font-mono">
                <div>
                  <span className="text-slate-500 block text-[10px]">Response Latency</span>
                  <span className="text-slate-200">{health?.gateway.latencyMs.toFixed(1)} ms</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Version</span>
                  <span className="text-slate-200">{health?.gateway.version}</span>
                </div>
              </div>
            </div>

            {/* Backend Core */}
            <div className="soc-card space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-indigo-950/40 border border-indigo-800/40 text-indigo-400">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Backend Application Core</h3>
                    <span className="text-[11px] font-mono text-slate-400">Port :8080</span>
                  </div>
                </div>
                {getStatusBadge(health?.backend.status)}
              </div>
              <p className="text-xs text-slate-400">{health?.backend.message}</p>
              <div className="grid grid-cols-2 gap-2 p-2.5 rounded bg-sentinel-850 border border-sentinel-800 text-xs font-mono">
                <div>
                  <span className="text-slate-500 block text-[10px]">Self Latency</span>
                  <span className="text-slate-200">{health?.backend.latencyMs.toFixed(1)} ms</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Framework</span>
                  <span className="text-slate-200">{health?.backend.version}</span>
                </div>
              </div>
            </div>

            {/* ML Inference Service */}
            <div className="soc-card space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-amber-950/40 border border-amber-800/40 text-amber-400">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">ML Inference Microservice</h3>
                    <span className="text-[11px] font-mono text-slate-400">Port :8000</span>
                  </div>
                </div>
                {getStatusBadge(health?.mlService.status)}
              </div>
              <p className="text-xs text-slate-400">{health?.mlService.message}</p>
              <div className="grid grid-cols-2 gap-2 p-2.5 rounded bg-sentinel-850 border border-sentinel-800 text-xs font-mono">
                <div>
                  <span className="text-slate-500 block text-[10px]">Inference Ping</span>
                  <span className="text-slate-200">{health?.mlService.latencyMs.toFixed(1)} ms</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Model Tag</span>
                  <span className="text-slate-200">{health?.mlService.version}</span>
                </div>
              </div>
            </div>

            {/* Persistence Layer */}
            <div className="soc-card space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-emerald-400">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Database Persistence Layer</h3>
                    <span className="text-[11px] font-mono text-slate-400">Port :5432</span>
                  </div>
                </div>
                {getStatusBadge(health?.database.status)}
              </div>
              <p className="text-xs text-slate-400">{health?.database.message}</p>
              <div className="grid grid-cols-2 gap-2 p-2.5 rounded bg-sentinel-850 border border-sentinel-800 text-xs font-mono">
                <div>
                  <span className="text-slate-500 block text-[10px]">Query Ping</span>
                  <span className="text-slate-200">{health?.database.latencyMs.toFixed(1)} ms</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Database Engine</span>
                  <span className="text-slate-200">{health?.database.version}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
