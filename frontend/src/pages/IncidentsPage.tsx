import React, { useState, useEffect } from 'react';
import { incidentsApi } from '../api/client';
import { Incident } from '../types';
import { SeverityBadge } from '../components/common/SeverityBadge';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import {
  Shield,
  Search,
  CheckCircle,
  AlertCircle,
  Clock,
  User,
  FileEdit,
  X,
  ExternalLink
} from 'lucide-react';

export const IncidentsPage: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // Edit form state
  const [newStatus, setNewStatus] = useState<string>('OPEN');
  const [newAssignee, setNewAssignee] = useState<string>('');
  const [newNotes, setNewNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const fetchIncidents = async () => {
    try {
      const data = await incidentsApi.getRecent();
      setIncidents(data);
    } catch (e) {
      console.error('Failed to load incidents:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const openEditModal = (inc: Incident) => {
    setSelectedIncident(inc);
    setNewStatus(inc.status);
    setNewAssignee(inc.assignedTo || '');
    setNewNotes(inc.resolutionNotes || '');
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncident) return;
    setSubmitting(true);
    try {
      const updated = await incidentsApi.update(selectedIncident.incidentId, {
        status: newStatus,
        assignedTo: newAssignee,
        resolutionNotes: newNotes,
      });
      setIncidents(prev => prev.map(i => i.incidentId === updated.incidentId ? updated : i));
      setSelectedIncident(null);
    } catch (err) {
      console.error('Failed to update incident:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = incidents.filter((inc) => {
    const matchesSearch =
      inc.title.toLowerCase().includes(search.toLowerCase()) ||
      inc.incidentId.toLowerCase().includes(search.toLowerCase()) ||
      inc.sourceIp.toLowerCase().includes(search.toLowerCase()) ||
      inc.attackType.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || inc.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Incident Edit / Resolution Modal */}
      {selectedIncident && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-sentinel-900 border border-sentinel-750 rounded-xl shadow-2xl w-full max-w-lg p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between pb-4 border-b border-sentinel-800">
              <div>
                <span className="text-xs font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40 mb-1 inline-block">
                  {selectedIncident.incidentId}
                </span>
                <h3 className="text-base font-bold text-white">{selectedIncident.title}</h3>
              </div>
              <button
                onClick={() => setSelectedIncident(null)}
                className="p-1 text-slate-400 hover:text-white rounded hover:bg-sentinel-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Incident Triage Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full bg-sentinel-850 border border-sentinel-750 text-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-cyan-500"
                >
                  <option value="OPEN">OPEN (Under Active Triage)</option>
                  <option value="INVESTIGATING">INVESTIGATING (Analyst In Progress)</option>
                  <option value="RESOLVED">RESOLVED (Mitigated & Closed)</option>
                  <option value="FALSE_POSITIVE">FALSE_POSITIVE (Dismissed)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Assigned SecOps Analyst</label>
                <input
                  type="text"
                  value={newAssignee}
                  onChange={(e) => setNewAssignee(e.target.value)}
                  placeholder="e.g. Sarah Connor / Incident Team"
                  className="w-full bg-sentinel-850 border border-sentinel-750 text-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Resolution & Investigation Notes</label>
                <textarea
                  rows={4}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Record root cause analysis, mitigation actions, or IP block rules applied..."
                  className="w-full bg-sentinel-850 border border-sentinel-750 text-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-sentinel-800">
                <button
                  type="button"
                  onClick={() => setSelectedIncident(null)}
                  className="px-4 py-2 rounded-lg bg-sentinel-850 text-slate-300 hover:bg-sentinel-800 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold"
                >
                  {submitting ? 'Saving...' : 'Save Triage Updates'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-sentinel-800/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-indigo-400 bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-800/40">
              INCIDENT RESPONSE
            </span>
            <span className="text-xs text-slate-500 font-mono">Correlated Attack Campaigns</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Security Incidents</h1>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-sentinel-900 border border-sentinel-800 rounded-xl p-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search incidents by title, ID, IP, or attack..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-sentinel-850 border border-sentinel-750 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-400 font-medium">Status:</span>
          <div className="flex bg-sentinel-850 border border-sentinel-750 rounded-lg p-0.5 text-xs font-medium">
            {['ALL', 'OPEN', 'INVESTIGATING', 'RESOLVED', 'FALSE_POSITIVE'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded text-[11px] transition-colors ${
                  statusFilter === st
                    ? 'bg-sentinel-750 text-cyan-300 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Incidents List */}
      <div className="space-y-3">
        {loading ? (
          <LoadingSkeleton rows={5} />
        ) : filtered.length > 0 ? (
          filtered.map((inc) => (
            <div
              key={inc.id}
              className="soc-card p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
                    {inc.incidentId}
                  </span>
                  <SeverityBadge severity={inc.severity} />
                  <span
                    className={`font-mono text-xs px-2 py-0.5 rounded font-medium ${
                      inc.status === 'OPEN'
                        ? 'bg-rose-950/40 text-rose-300 border border-rose-800/40'
                        : inc.status === 'INVESTIGATING'
                        ? 'bg-amber-950/40 text-amber-300 border border-amber-800/40'
                        : 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/40'
                    }`}
                  >
                    {inc.status}
                  </span>
                  <span className="text-xs font-semibold text-slate-300">
                    {inc.attackType}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white">{inc.title}</h3>

                <p className="text-xs text-slate-400 font-mono">
                  Target: {inc.affectedEndpoint} • Attacker IP: {inc.sourceIp} • Ingress Count: {inc.requestCount} probes
                </p>

                {inc.resolutionNotes && (
                  <p className="text-xs text-slate-400 bg-sentinel-850 p-2.5 rounded-lg border border-sentinel-800 mt-2 font-mono">
                    Notes: {inc.resolutionNotes}
                  </p>
                )}
              </div>

              <div className="flex md:flex-col items-end justify-between gap-2 shrink-0 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-sentinel-800">
                <span className="text-[11px] font-mono text-slate-500">
                  Last seen: {new Date(inc.lastSeen).toLocaleTimeString()}
                </span>
                <button
                  onClick={() => openEditModal(inc)}
                  className="px-3.5 py-1.5 rounded-lg bg-sentinel-850 hover:bg-sentinel-800 text-cyan-400 hover:text-cyan-300 text-xs font-semibold border border-sentinel-750 flex items-center gap-1.5 transition-colors"
                >
                  <FileEdit className="w-3.5 h-3.5" />
                  Triage / Assign
                </button>
              </div>
            </div>
          ))
        ) : (
          <EmptyState
            title="No incidents match filter"
            description="All correlated attack campaigns have been resolved or triaged."
          />
        )}
      </div>
    </div>
  );
};
