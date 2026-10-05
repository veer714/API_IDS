import React, { useState, useEffect } from 'react';
import { auditApi } from '../api/client';
import { AuditLog } from '../types';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import { FileText, Search, User, Globe, Clock, Shield } from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchLogs = async () => {
    try {
      const data = await auditApi.getRecent();
      setLogs(data);
    } catch (e) {
      console.error('Failed to load audit logs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filtered = logs.filter(
    (l) =>
      l.actor.toLowerCase().includes(search.toLowerCase()) ||
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.resource.toLowerCase().includes(search.toLowerCase()) ||
      (l.details && l.details.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-sentinel-800/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
              PLATFORM AUDIT
            </span>
            <span className="text-xs text-slate-500 font-mono">Immutable Compliance Trail</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Administrative Audit Logs</h1>
        </div>
      </div>

      {/* Search */}
      <div className="relative w-full sm:w-80">
        <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
        <input
          type="text"
          placeholder="Filter audit logs by actor, action, or resource..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-1.5 bg-sentinel-900 border border-sentinel-750 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
        />
      </div>

      {/* Table */}
      <div className="soc-card p-0 overflow-hidden">
        {loading ? (
          <div className="p-6">
            <LoadingSkeleton rows={6} />
          </div>
        ) : filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th className="soc-table-header">Timestamp</th>
                  <th className="soc-table-header">Actor</th>
                  <th className="soc-table-header">Action</th>
                  <th className="soc-table-header">Resource</th>
                  <th className="soc-table-header">IP Address</th>
                  <th className="soc-table-header">Result</th>
                  <th className="soc-table-header">Audit Details</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log) => (
                  <tr key={log.id} className="soc-table-row">
                    <td className="px-4 py-3 font-mono text-xs text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-200 text-xs">
                      {log.actor}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-cyan-400 font-medium">
                      {log.action}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-300">
                      {log.resource}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-[11px] text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40 font-semibold">
                        {log.result}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400 font-mono truncate max-w-[280px]">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No audit logs recorded"
            description="Platform administrative changes and security operations will appear here."
          />
        )}
      </div>
    </div>
  );
};
