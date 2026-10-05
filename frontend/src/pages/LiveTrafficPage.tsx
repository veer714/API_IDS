import React, { useState, useEffect } from 'react';
import { trafficApi } from '../api/client';
import { RequestEvent, SecurityDecision } from '../types';
import { DecisionBadge } from '../components/common/DecisionBadge';
import { SeverityBadge } from '../components/common/SeverityBadge';
import { RiskScoreBar } from '../components/common/RiskScoreBar';
import { RequestInspectorModal } from '../components/common/RequestInspectorModal';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import {
  Activity,
  Search,
  Filter,
  Play,
  Pause,
  RefreshCw,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

export const LiveTrafficPage: React.FC = () => {
  const [events, setEvents] = useState<RequestEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [decisionFilter, setDecisionFilter] = useState<string>('ALL');
  const [selectedEvent, setSelectedEvent] = useState<RequestEvent | null>(null);

  const fetchTraffic = async () => {
    try {
      const data = await trafficApi.getRecent();
      setEvents(data);
    } catch (e) {
      console.error('Failed to load traffic events:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTraffic();
  }, []);

  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(fetchTraffic, 2500);
    return () => clearInterval(interval);
  }, [isLive]);

  const filtered = events.filter((ev) => {
    const matchesSearch =
      ev.endpoint.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.sourceIp.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.requestId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.attackType.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDecision =
      decisionFilter === 'ALL' || ev.decision === decisionFilter;

    return matchesSearch && matchesDecision;
  });

  return (
    <div className="space-y-6">
      {/* Inspector Slide-over Modal */}
      <RequestInspectorModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-sentinel-800/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
              TELEMETRY STREAM
            </span>
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
              <span className={isLive ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>
                {isLive ? 'STREAMING ACTIVE' : 'PAUSED'}
              </span>
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Live API Traffic</h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsLive(!isLive)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
              isLive
                ? 'bg-sentinel-850 hover:bg-sentinel-800 border-sentinel-700 text-slate-300'
                : 'bg-cyan-500/20 hover:bg-cyan-500/30 border-cyan-500/40 text-cyan-300 font-semibold'
            }`}
          >
            {isLive ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-cyan-400" />}
            {isLive ? 'Pause Stream' : 'Resume Live Stream'}
          </button>

          <button
            onClick={fetchTraffic}
            className="p-1.5 rounded-lg bg-sentinel-850 hover:bg-sentinel-800 border border-sentinel-750 text-slate-400 hover:text-white"
            title="Refresh Now"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-sentinel-900 border border-sentinel-800 rounded-xl p-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Filter by endpoint, source IP, or attack..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-sentinel-850 border border-sentinel-750 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-400 font-medium">Decision:</span>
          <div className="flex bg-sentinel-850 border border-sentinel-750 rounded-lg p-0.5 text-xs font-medium">
            {['ALL', 'ALLOW', 'CHALLENGE', 'THROTTLE', 'BLOCK'].map((d) => (
              <button
                key={d}
                onClick={() => setDecisionFilter(d)}
                className={`px-2.5 py-1 rounded text-[11px] transition-colors ${
                  decisionFilter === d
                    ? 'bg-sentinel-750 text-cyan-300 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Traffic Stream Table */}
      <div className="soc-card p-0 overflow-hidden">
        {loading ? (
          <div className="p-6">
            <LoadingSkeleton rows={10} />
          </div>
        ) : filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th className="soc-table-header">Timestamp</th>
                  <th className="soc-table-header">Method</th>
                  <th className="soc-table-header">Endpoint</th>
                  <th className="soc-table-header">Source IP</th>
                  <th className="soc-table-header">Status</th>
                  <th className="soc-table-header">Risk Score</th>
                  <th className="soc-table-header">Decision</th>
                  <th className="soc-table-header">Attack Type</th>
                  <th className="soc-table-header">Latency</th>
                  <th className="soc-table-header text-right">Inspect</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((ev) => (
                  <tr
                    key={ev.id}
                    onClick={() => setSelectedEvent(ev)}
                    className="soc-table-row cursor-pointer group"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-slate-400 whitespace-nowrap">
                      {new Date(ev.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-sentinel-800 text-slate-300 font-medium">
                        {ev.method}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-200 max-w-[200px] truncate">
                      {ev.endpoint}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-400 whitespace-nowrap">
                      {ev.sourceIp}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-300">
                      <span className={ev.statusCode >= 400 ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                        {ev.statusCode}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <RiskScoreBar score={ev.riskScore} />
                    </td>
                    <td className="px-4 py-3">
                      <DecisionBadge decision={ev.decision} />
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {ev.attackType === 'NORMAL' ? (
                        <span className="text-slate-500 font-mono text-[11px]">Normal</span>
                      ) : (
                        <span className="font-semibold text-rose-400 font-mono text-[11px]">
                          {ev.attackType}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-400 whitespace-nowrap">
                      {ev.responseTimeMs} ms
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEvent(ev);
                        }}
                        className="p-1.5 text-slate-500 group-hover:text-cyan-400 rounded hover:bg-sentinel-800 transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No traffic matches filter"
            description="Adjust your search query or decision criteria to inspect API requests."
          />
        )}
      </div>
    </div>
  );
};
