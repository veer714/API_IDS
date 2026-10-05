import React, { useState, useEffect } from 'react';
import { endpointsApi, applicationsApi } from '../api/client';
import { ProtectedEndpoint, Application } from '../types';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import {
  Sliders,
  Plus,
  Shield,
  Layers,
  Lock,
  Cpu,
  Trash2,
  X,
  CheckCircle,
  ExternalLink
} from 'lucide-react';

export const ProtectedEndpointsPage: React.FC = () => {
  const [endpoints, setEndpoints] = useState<ProtectedEndpoint[]>([]);
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Form state
  const [appId, setAppId] = useState<number>(0);
  const [path, setPath] = useState('');
  const [method, setMethod] = useState('ALL');
  const [rateLimit, setRateLimit] = useState(120);
  const [challengeThreshold, setChallengeThreshold] = useState(0.40);
  const [blockThreshold, setBlockThreshold] = useState(0.70);
  const [authRequired, setAuthRequired] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const [eps, appList] = await Promise.all([
        endpointsApi.getAll(),
        applicationsApi.getAll()
      ]);
      setEndpoints(eps);
      setApps(appList);
      if (appList.length > 0) setAppId(appList[0].id);
    } catch (e) {
      console.error('Failed to load protected endpoints:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appId || !path) return;
    setSubmitting(true);
    try {
      const created = await endpointsApi.create({
        applicationId: appId,
        path,
        method,
        rateLimit,
        challengeThreshold,
        blockThreshold,
        protectionEnabled: true,
        ruleEngineEnabled: true,
        mlEnabled: true,
        authRequired
      });
      setEndpoints([...endpoints, created]);
      setModalOpen(false);
      setPath('');
    } catch (err) {
      console.error('Failed to register protected endpoint:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await endpointsApi.delete(id);
      setEndpoints(endpoints.filter(e => e.id !== id));
    } catch (err) {
      console.error('Failed to delete endpoint:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Register Endpoint Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-sentinel-900 border border-sentinel-750 rounded-xl shadow-2xl w-full max-w-lg p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-sentinel-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-cyan-400" />
                Register Protected Endpoint Route
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded hover:bg-sentinel-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Target Application</label>
                <select
                  value={appId}
                  onChange={(e) => setAppId(Number(e.target.value))}
                  className="w-full bg-sentinel-850 border border-sentinel-750 text-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-cyan-500"
                >
                  {apps.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.appId})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-1">
                  <label className="block text-slate-300 font-medium mb-1">Method</label>
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                    className="w-full bg-sentinel-850 border border-sentinel-750 text-slate-200 rounded-lg p-2.5 text-xs font-mono focus:outline-none focus:border-cyan-500"
                  >
                    <option value="ALL">ALL</option>
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                  </select>
                </div>

                <div className="col-span-3">
                  <label className="block text-slate-300 font-medium mb-1">Endpoint Path</label>
                  <input
                    type="text"
                    required
                    value={path}
                    onChange={(e) => setPath(e.target.value)}
                    placeholder="e.g. /api/v1/auth/login, /api/v1/products"
                    className="w-full bg-sentinel-850 border border-sentinel-750 text-slate-200 rounded-lg p-2.5 text-xs font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Rate Limit (RPM)</label>
                  <input
                    type="number"
                    value={rateLimit}
                    onChange={(e) => setRateLimit(Number(e.target.value))}
                    className="w-full bg-sentinel-850 border border-sentinel-750 text-slate-200 rounded-lg p-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Challenge Thresh.</label>
                  <input
                    type="number"
                    step="0.05"
                    value={challengeThreshold}
                    onChange={(e) => setChallengeThreshold(Number(e.target.value))}
                    className="w-full bg-sentinel-850 border border-sentinel-750 text-slate-200 rounded-lg p-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Block Thresh.</label>
                  <input
                    type="number"
                    step="0.05"
                    value={blockThreshold}
                    onChange={(e) => setBlockThreshold(Number(e.target.value))}
                    className="w-full bg-sentinel-850 border border-sentinel-750 text-slate-200 rounded-lg p-2 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="authReq"
                  checked={authRequired}
                  onChange={(e) => setAuthRequired(e.target.checked)}
                  className="rounded border-sentinel-700 bg-sentinel-850 text-cyan-500"
                />
                <label htmlFor="authReq" className="text-slate-300 font-medium cursor-pointer">
                  Require valid Bearer token authentication for route
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-sentinel-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-sentinel-850 text-slate-300 hover:bg-sentinel-800 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold"
                >
                  {submitting ? 'Registering...' : 'Register Endpoint'}
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
            <span className="text-xs font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
              ROUTE POLICIES
            </span>
            <span className="text-xs text-slate-500 font-mono">{endpoints.length} Routes Monitored</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Protected APIs</h1>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-3.5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Protected Route
        </button>
      </div>

      {/* Endpoints Table */}
      <div className="soc-card p-0 overflow-hidden">
        {loading ? (
          <div className="p-6">
            <LoadingSkeleton rows={6} />
          </div>
        ) : endpoints.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th className="soc-table-header">Method</th>
                  <th className="soc-table-header">Route Path</th>
                  <th className="soc-table-header">Target Application</th>
                  <th className="soc-table-header">Rule Engine</th>
                  <th className="soc-table-header">ML Pipeline</th>
                  <th className="soc-table-header">Rate Limit</th>
                  <th className="soc-table-header">Block Threshold</th>
                  <th className="soc-table-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {endpoints.map((ep) => (
                  <tr key={ep.id} className="soc-table-row">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-sentinel-800 text-slate-300 font-semibold">
                        {ep.method}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-white font-medium">
                      {ep.path}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-300">
                      {ep.applicationName}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                        <CheckCircle className="w-3 h-3" /> ACTIVE
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
                        <Cpu className="w-3 h-3" /> HYBRID
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-300">
                      {ep.rateLimit} RPM
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-rose-400 font-semibold">
                      {ep.blockThreshold.toFixed(2)} Risk
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(ep.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 rounded hover:bg-sentinel-800 transition-colors"
                        title="Remove endpoint route"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No protected API routes configured"
            description="Add your first protected endpoint route to begin policy enforcement."
            actionText="Add Route"
            onAction={() => setModalOpen(true)}
          />
        )}
      </div>
    </div>
  );
};
