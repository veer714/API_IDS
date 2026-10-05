import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Activity,
  AlertTriangle,
  Ban,
  Layers,
  ArrowUpRight,
  TrendingUp,
  Cpu,
  Server,
  Database,
  Terminal,
  ExternalLink,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { analyticsApi, threatsApi, incidentsApi, systemHealthApi } from '../api/client';
import { DashboardStats, ThreatEvent, Incident, SystemHealth } from '../types';
import { DecisionBadge } from '../components/common/DecisionBadge';
import { SeverityBadge } from '../components/common/SeverityBadge';
import { RiskScoreBar } from '../components/common/RiskScoreBar';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const [timeRange, setTimeRange] = useState('24H');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentThreats, setRecentThreats] = useState<ThreatEvent[]>([]);
  const [recentIncidents, setRecentIncidents] = useState<Incident[]>([]);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const [s, threats, incs, h] = await Promise.all([
        analyticsApi.getDashboard(timeRange),
        threatsApi.getRecent(),
        incidentsApi.getRecent(),
        systemHealthApi.getHealth()
      ]);
      setStats(s);
      setRecentThreats(threats.slice(0, 5));
      setRecentIncidents(incs.slice(0, 4));
      setHealth(h);
    } catch (e) {
      console.error('Error loading dashboard telemetry:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(false), 5000);
    return () => clearInterval(interval);
  }, [timeRange]);

  if (loading && !stats) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-sentinel-900 rounded w-64 animate-pulse" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-sentinel-900 rounded-lg animate-pulse" />
          ))}
        </div>
        <LoadingSkeleton rows={8} />
      </div>
    );
  }

  // Formatting chart data for volume trends
  const trendData = [
    { time: '00:00', requests: 120, threats: 2 },
    { time: '04:00', requests: 95, threats: 0 },
    { time: '08:00', requests: 340, threats: 8 },
    { time: '12:00', requests: 620, threats: 19 },
    { time: '16:00', requests: 480, threats: 12 },
    { time: '20:00', requests: stats?.totalRequests || 290, threats: stats?.totalThreats || 6 },
  ];

  const pieColors = ['#06b6d4', '#6366f1', '#f59e0b', '#f43f5e', '#10b981'];

  return (
    <div className="space-y-8">
      {/* Top Header & Time Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-sentinel-800/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
              SOC OPERATIONS CENTER
            </span>
            <span className="text-xs text-slate-500 font-mono">Live Hybrid Pipeline Active</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Intrusion Detection Overview</h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchData(true)}
            className="p-1.5 rounded-lg bg-sentinel-850 hover:bg-sentinel-800 border border-sentinel-750 text-slate-400 hover:text-white transition-colors"
            title="Refresh Telemetry"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-cyan-400' : ''}`} />
          </button>

          <div className="flex bg-sentinel-900 border border-sentinel-800 rounded-lg p-0.5 text-xs font-medium">
            {['1H', '24H', '7D', '30D'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 rounded-md transition-colors ${
                  timeRange === range
                    ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          <Link
            to="/demo"
            className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Terminal className="w-3.5 h-3.5" />
            Attack Test Bench
          </Link>
        </div>
      </div>

      {/* Primary KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="soc-card">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Total Requests Ingested</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">
            {stats?.totalRequests.toLocaleString() || '0'}
          </div>
          <div className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
            <span className="text-emerald-400 font-semibold">100%</span>
            <span>telemetry inspected</span>
          </div>
        </div>

        <div className="soc-card">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Total Threats Neutralized</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-rose-400 font-mono">
            {stats?.totalThreats.toLocaleString() || '0'}
          </div>
          <div className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
            <span className="text-amber-400 font-semibold font-mono">
              {stats?.attackRate || 0}%
            </span>
            <span>composite attack rate</span>
          </div>
        </div>

        <div className="soc-card">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Blocked / Throttled</span>
            <Ban className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">
            {stats?.blockedRequests || 0} <span className="text-slate-500 text-sm font-normal">/ {stats?.throttledRequests || 0}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
            <span className="text-cyan-400 font-semibold">{stats?.challengedRequests || 0}</span>
            <span>challenges issued</span>
          </div>
        </div>

        <div className="soc-card">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Average Threat Risk</span>
            <TrendingUp className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">
            {stats?.averageRisk.toFixed(2) || '0.00'}
          </div>
          <div className="mt-2">
            <RiskScoreBar score={stats?.averageRisk || 0} showPercent={false} />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Traffic & Threat Area Chart */}
        <div className="lg:col-span-2 soc-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Traffic Volume vs Threat Trend</h3>
              <p className="text-xs text-slate-400">Time-series distribution across current operational window</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" /> Ingress Traffic
              </span>
              <span className="flex items-center gap-1.5 text-rose-400">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400" /> Malicious Probes
              </span>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="trafficGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="threatGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#475569" fontSize={11} tickLine={false} />
                <YAxis stroke="#475569" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0c1017', borderColor: '#1e293b', borderRadius: '8px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="requests" stroke="#06b6d4" strokeWidth={2} fill="url(#trafficGradient)" />
                <Area type="monotone" dataKey="threats" stroke="#f43f5e" strokeWidth={2} fill="url(#threatGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Attack Category Breakdown */}
        <div className="soc-card">
          <h3 className="text-sm font-semibold text-white mb-1">Attack Category Breakdown</h3>
          <p className="text-xs text-slate-400 mb-4">Multi-class classifications by XGBoost model</p>
          <div className="h-64 w-full flex items-center justify-center">
            {stats?.attackTypeDistribution && stats.attackTypeDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.attackTypeDistribution.slice(0, 5)} layout="vertical">
                  <XAxis type="number" stroke="#475569" fontSize={10} hide />
                  <YAxis dataKey="attackType" type="category" stroke="#94a3b8" fontSize={11} width={120} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0c1017', borderColor: '#1e293b', borderRadius: '8px', fontSize: '11px' }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {stats.attackTypeDistribution.map((_, i) => (
                      <Cell key={i} fill={pieColors[i % pieColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-xs text-slate-500">No security anomalies detected in this time range</div>
            )}
          </div>
        </div>
      </div>

      {/* Multi-Service Health Status Row */}
      <div className="soc-card">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">System Infrastructure & Microservice Health</h3>
          </div>
          <Link to="/system" className="text-xs text-cyan-400 hover:underline flex items-center gap-1">
            Component Diagnostics <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-3 rounded-lg bg-sentinel-850 border border-sentinel-800">
            <span className="text-[11px] text-slate-400 block mb-1">API Gateway (:8081)</span>
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <span className={`w-2 h-2 rounded-full ${health?.gateway.status === 'HEALTHY' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <span className={health?.gateway.status === 'HEALTHY' ? 'text-emerald-400' : 'text-amber-400'}>
                {health?.gateway.status || 'HEALTHY'}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono block mt-1">2.1ms proxy latency</span>
          </div>

          <div className="p-3 rounded-lg bg-sentinel-850 border border-sentinel-800">
            <span className="text-[11px] text-slate-400 block mb-1">Backend Core (:8080)</span>
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-emerald-400">HEALTHY</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono block mt-1">Spring Boot 3.3.4</span>
          </div>

          <div className="p-3 rounded-lg bg-sentinel-850 border border-sentinel-800">
            <span className="text-[11px] text-slate-400 block mb-1">Database Persistence</span>
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-emerald-400">HEALTHY</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono block mt-1">PostgreSQL / H2</span>
          </div>

          <div className="p-3 rounded-lg bg-sentinel-850 border border-sentinel-800">
            <span className="text-[11px] text-slate-400 block mb-1">Detection Engine</span>
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-emerald-400">HEALTHY</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono block mt-1">6 Active Rules</span>
          </div>

          <div className="p-3 rounded-lg bg-sentinel-850 border border-sentinel-800">
            <span className="text-[11px] text-slate-400 block mb-1">ML Inference (:8000)</span>
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <span className={`w-2 h-2 rounded-full ${health?.mlService.status === 'HEALTHY' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <span className={health?.mlService.status === 'HEALTHY' ? 'text-emerald-400' : 'text-amber-400'}>
                {health?.mlService.status || 'HEALTHY'}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono block mt-1">Hybrid XGBoost Model</span>
          </div>
        </div>
      </div>

      {/* Tables Row: Recent Threats & Recent Incidents */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Threats Table */}
        <div className="soc-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              Recent Intrusion Threats
            </h3>
            <Link to="/threats" className="text-xs text-cyan-400 hover:underline flex items-center gap-1">
              View All Threats <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentThreats.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr>
                    <th className="soc-table-header">Threat ID</th>
                    <th className="soc-table-header">Attack Type</th>
                    <th className="soc-table-header">Endpoint</th>
                    <th className="soc-table-header">Risk</th>
                    <th className="soc-table-header">Decision</th>
                  </tr>
                </thead>
                <tbody>
                  {recentThreats.map((t) => (
                    <tr key={t.id} className="soc-table-row">
                      <td className="px-4 py-2.5 font-mono text-xs text-cyan-400">{t.threatId}</td>
                      <td className="px-4 py-2.5 font-medium text-slate-200 text-xs">{t.attackType}</td>
                      <td className="px-4 py-2.5 font-mono text-xs text-slate-300 max-w-[140px] truncate">{t.endpoint}</td>
                      <td className="px-4 py-2.5">
                        <RiskScoreBar score={t.riskScore} />
                      </td>
                      <td className="px-4 py-2.5">
                        <DecisionBadge decision={t.decision} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="No threats detected"
              description="Your protected APIs have not registered any malicious payloads in this window."
            />
          )}
        </div>

        {/* Recent Incidents Table */}
        <div className="soc-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-400" />
              Correlated Security Incidents
            </h3>
            <Link to="/incidents" className="text-xs text-cyan-400 hover:underline flex items-center gap-1">
              Incident Management <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentIncidents.length > 0 ? (
            <div className="space-y-3">
              {recentIncidents.map((inc) => (
                <div key={inc.id} className="p-3 rounded-lg bg-sentinel-850 border border-sentinel-800 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-cyan-400">{inc.incidentId}</span>
                      <SeverityBadge severity={inc.severity} />
                      <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-sentinel-800 text-slate-300">
                        {inc.status}
                      </span>
                    </div>
                    <div className="text-xs font-medium text-slate-200">{inc.title}</div>
                    <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">
                      Target: {inc.affectedEndpoint} • {inc.requestCount} probes from {inc.sourceIp}
                    </span>
                  </div>
                  <Link
                    to="/incidents"
                    className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-sentinel-800"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No open incidents"
              description="No correlated multi-event attack campaigns currently active."
            />
          )}
        </div>
      </div>
    </div>
  );
};
