import React, { useState, useEffect } from 'react';
import { threatsApi } from '../api/client';
import { ThreatEvent } from '../types';
import { DecisionBadge } from '../components/common/DecisionBadge';
import { SeverityBadge } from '../components/common/SeverityBadge';
import { RiskScoreBar } from '../components/common/RiskScoreBar';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import {
  AlertTriangle,
  Search,
  Filter,
  Shield,
  Clock,
  Globe,
  ChevronRight,
  X,
  FileCheck
} from 'lucide-react';

export const ThreatCenterPage: React.FC = () => {
  const [threats, setThreats] = useState<ThreatEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [selectedThreat, setSelectedThreat] = useState<ThreatEvent | null>(null);

  const fetchThreats = async () => {
    try {
      const data = await threatsApi.getRecent();
      setThreats(data);
    } catch (e) {
      console.error('Failed to load threats:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThreats();
  }, []);

  const filtered = threats.filter((t) => {
    const matchesSearch =
      t.threatId.toLowerCase().includes(search.toLowerCase()) ||
      t.attackType.toLowerCase().includes(search.toLowerCase()) ||
      t.endpoint.toLowerCase().includes(search.toLowerCase()) ||
      t.sourceIp.toLowerCase().includes(search.toLowerCase());

    const matchesSeverity =
      severityFilter === 'ALL' || t.severity === severityFilter;

    return matchesSearch && matchesSeverity;
  });

  return (
    <div className="space-y-6">
      {/* Investigation Details Modal */}
      {selectedThreat && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex justify-end">
          <div className="bg-sentinel-900 w-full max-w-xl min-h-screen border-l border-sentinel-800 shadow-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between pb-4 border-b border-sentinel-800">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-mono text-rose-400 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-800/40">
                      {selectedThreat.threatId}
                    </span>
                    <SeverityBadge severity={selectedThreat.severity} />
                    <DecisionBadge decision={selectedThreat.decision} />
                  </div>
                  <h2 className="text-lg font-bold text-white">{selectedThreat.attackType} Attack</h2>
                </div>
                <button
                  onClick={() => setSelectedThreat(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-sentinel-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-5 pt-5 text-xs">
                <div className="soc-card p-4">
                  <span className="text-slate-400 block mb-1">Threat Summary:</span>
                  <p className="text-sm font-medium text-slate-200">{selectedThreat.summary}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-sentinel-850 border border-sentinel-800">
                    <span className="text-slate-400 block mb-1">Target Endpoint:</span>
                    <span className="font-mono text-slate-200">{selectedThreat.endpoint}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-sentinel-850 border border-sentinel-800">
                    <span className="text-slate-400 block mb-1">Attacker Source IP:</span>
                    <span className="font-mono text-rose-300 font-semibold">{selectedThreat.sourceIp}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-sentinel-850 border border-sentinel-800">
                    <span className="text-slate-400 block mb-1">Calculated Risk Score:</span>
                    <RiskScoreBar score={selectedThreat.riskScore} />
                  </div>
                  <div className="p-3 rounded-lg bg-sentinel-850 border border-sentinel-800">
                    <span className="text-slate-400 block mb-1">Detected At:</span>
                    <span className="font-mono text-slate-200">{new Date(selectedThreat.timestamp).toLocaleString()}</span>
                  </div>
                </div>

                <div className="soc-card p-4">
                  <span className="text-slate-400 block mb-2 font-semibold">Triage Recommendations:</span>
                  <ul className="space-y-1.5 text-slate-300">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      Verify if IP {selectedThreat.sourceIp} is an authorized penetration test.
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      Add permanent firewall rule or challenge threshold in Protected APIs.
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      Correlate with active Incidents in Incident Management.
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-sentinel-800 flex justify-end gap-3">
              <button
                onClick={() => setSelectedThreat(null)}
                className="px-4 py-2 rounded-lg bg-sentinel-850 hover:bg-sentinel-800 text-xs font-medium text-slate-300"
              >
                Close Investigation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-sentinel-800/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-rose-400 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-800/40">
              INTRUSION TRIAGE
            </span>
            <span className="text-xs text-slate-500 font-mono">{threats.length} Events Cataloged</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Threat Center</h1>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-sentinel-900 border border-sentinel-800 rounded-xl p-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search threats by ID, attack type, IP, or route..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-sentinel-850 border border-sentinel-750 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-400 font-medium">Severity:</span>
          <div className="flex bg-sentinel-850 border border-sentinel-750 rounded-lg p-0.5 text-xs font-medium">
            {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((s) => (
              <button
                key={s}
                onClick={() => setSeverityFilter(s)}
                className={`px-2.5 py-1 rounded text-[11px] transition-colors ${
                  severityFilter === s
                    ? 'bg-sentinel-750 text-cyan-300 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Threats Table */}
      <div className="soc-card p-0 overflow-hidden">
        {loading ? (
          <div className="p-6">
            <LoadingSkeleton rows={8} />
          </div>
        ) : filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th className="soc-table-header">Threat ID</th>
                  <th className="soc-table-header">Timestamp</th>
                  <th className="soc-table-header">Attack Type</th>
                  <th className="soc-table-header">Severity</th>
                  <th className="soc-table-header">Target Endpoint</th>
                  <th className="soc-table-header">Source IP</th>
                  <th className="soc-table-header">Risk Score</th>
                  <th className="soc-table-header">Enforcement</th>
                  <th className="soc-table-header text-right">Investigate</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => setSelectedThreat(t)}
                    className="soc-table-row cursor-pointer group"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-cyan-400 whitespace-nowrap">
                      {t.threatId}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-400 whitespace-nowrap">
                      {new Date(t.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-200 text-xs">
                      {t.attackType}
                    </td>
                    <td className="px-4 py-3">
                      <SeverityBadge severity={t.severity} />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-300 max-w-[180px] truncate">
                      {t.endpoint}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-rose-300">
                      {t.sourceIp}
                    </td>
                    <td className="px-4 py-3">
                      <RiskScoreBar score={t.riskScore} />
                    </td>
                    <td className="px-4 py-3">
                      <DecisionBadge decision={t.decision} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedThreat(t);
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
            title="No threat events found"
            description="Your security policies are active. No intrusion threats match the current search criteria."
          />
        )}
      </div>
    </div>
  );
};
