import React, { useState, useEffect } from 'react';
import { analyticsApi } from '../api/client';
import { DashboardStats } from '../types';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { RiskScoreBar } from '../components/common/RiskScoreBar';
import {
  BarChart3,
  TrendingUp,
  PieChart as PieIcon,
  Shield,
  Layers,
  Activity,
  Globe,
  RefreshCw
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie
} from 'recharts';

export const AnalyticsPage: React.FC = () => {
  const [timeRange, setTimeRange] = useState('24H');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      const data = await analyticsApi.getDashboard(timeRange);
      setStats(data);
    } catch (e) {
      console.error('Failed to load analytics:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const colors = ['#06b6d4', '#6366f1', '#f59e0b', '#f43f5e', '#10b981', '#a855f7'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-sentinel-800/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
              SOC METRICS
            </span>
            <span className="text-xs text-slate-500 font-mono">Aggregated Attack Telemetry</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Security Analytics</h1>
        </div>

        <div className="flex items-center gap-2">
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
          <button
            onClick={fetchAnalytics}
            className="p-1.5 rounded-lg bg-sentinel-850 hover:bg-sentinel-800 border border-sentinel-750 text-slate-400 hover:text-white"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading && !stats ? (
        <LoadingSkeleton rows={8} />
      ) : (
        <div className="space-y-6">
          {/* Top Aggregated Charts Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Decision Distribution Bar Chart */}
            <div className="soc-card">
              <h3 className="text-sm font-semibold text-white mb-1">Enforcement Decision Breakdown</h3>
              <p className="text-xs text-slate-400 mb-4">Requests categorized by security disposition</p>
              <div className="h-64 w-full">
                {stats?.decisionDistribution && stats.decisionDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.decisionDistribution}>
                      <XAxis dataKey="decision" stroke="#64748b" fontSize={11} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0c1017', borderColor: '#1e293b', borderRadius: '8px', fontSize: '11px' }}
                      />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {stats.decisionDistribution.map((entry, index) => {
                          let fill = '#10b981';
                          if (entry.decision === 'BLOCK') fill = '#f43f5e';
                          else if (entry.decision === 'CHALLENGE') fill = '#f59e0b';
                          else if (entry.decision === 'THROTTLE') fill = '#f97316';
                          return <Cell key={index} fill={fill} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-500">
                    No decision telemetry in this time window
                  </div>
                )}
              </div>
            </div>

            {/* Severity Distribution Pie Chart */}
            <div className="soc-card">
              <h3 className="text-sm font-semibold text-white mb-1">Threat Severity Distribution</h3>
              <p className="text-xs text-slate-400 mb-4">Risk tiers assessed across detected attacks</p>
              <div className="h-64 w-full flex items-center justify-center">
                {stats?.severityDistribution && stats.severityDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.severityDistribution}
                        dataKey="count"
                        nameKey="severity"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {stats.severityDistribution.map((_, index) => (
                          <Cell key={index} fill={colors[index % colors.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0c1017', borderColor: '#1e293b', borderRadius: '8px', fontSize: '11px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-xs text-slate-500">No threat events in this time window</div>
                )}
              </div>
            </div>
          </div>

          {/* Top Attacked Targets & Source IPs */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Top Attacked Endpoints */}
            <div className="soc-card">
              <h3 className="text-sm font-semibold text-white mb-1">Top Attacked Endpoints</h3>
              <p className="text-xs text-slate-400 mb-4">URI routes experiencing the highest intrusion volume</p>
              {stats?.topAttackedEndpoints && stats.topAttackedEndpoints.length > 0 ? (
                <div className="space-y-3">
                  {stats.topAttackedEndpoints.map((ep, i) => (
                    <div key={i} className="p-3 rounded-lg bg-sentinel-850 border border-sentinel-800 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-mono text-slate-200 font-semibold">{ep.endpoint}</span>
                        <span className="text-[11px] text-slate-500 block font-mono">Max Risk: {((ep.maxRisk || 0) * 100).toFixed(0)}%</span>
                      </div>
                      <span className="font-mono text-cyan-400 font-bold bg-sentinel-800 px-2 py-1 rounded">
                        {ep.count} hits
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-500 py-6 text-center">No targeted endpoints recorded</div>
              )}
            </div>

            {/* Top Source IPs */}
            <div className="soc-card">
              <h3 className="text-sm font-semibold text-white mb-1">Top Threat Source IPs</h3>
              <p className="text-xs text-slate-400 mb-4">IP addresses generating the highest malicious traffic</p>
              {stats?.topSourceIps && stats.topSourceIps.length > 0 ? (
                <div className="space-y-3">
                  {stats.topSourceIps.map((ip, i) => (
                    <div key={i} className="p-3 rounded-lg bg-sentinel-850 border border-sentinel-800 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-mono text-rose-300 font-semibold">{ip.sourceIp}</span>
                        <span className="text-[11px] text-slate-500 block font-mono">Max Threat Score: {((ip.maxRisk || 0) * 100).toFixed(0)}%</span>
                      </div>
                      <span className="font-mono text-rose-400 font-bold bg-rose-950/40 px-2 py-1 rounded border border-rose-800/40">
                        {ip.count} probes
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-500 py-6 text-center">No malicious IP activity recorded</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
