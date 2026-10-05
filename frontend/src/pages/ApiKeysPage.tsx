import React, { useState, useEffect } from 'react';
import { apiKeysApi, applicationsApi } from '../api/client';
import { ApiKey, Application } from '../types';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import {
  Key,
  Plus,
  Trash2,
  Copy,
  Check,
  AlertTriangle,
  Code2,
  Terminal,
  X,
  ExternalLink,
  Shield
} from 'lucide-react';

export const ApiKeysPage: React.FC = () => {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Form state
  const [keyName, setKeyName] = useState('');
  const [selectedAppId, setSelectedAppId] = useState<number>(0);
  const [environment, setEnvironment] = useState('PRODUCTION');
  const [submitting, setSubmitting] = useState(false);

  // Newly generated key banner
  const [newKeySecret, setNewKeySecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchData = async () => {
    try {
      const [kList, aList] = await Promise.all([
        apiKeysApi.getAll(),
        applicationsApi.getAll()
      ]);
      setKeys(kList);
      setApps(aList);
      if (aList.length > 0) setSelectedAppId(aList[0].id);
    } catch (e) {
      console.error('Failed to load API keys:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName || !selectedAppId) return;
    setSubmitting(true);
    try {
      const res = await apiKeysApi.create({
        name: keyName,
        applicationId: selectedAppId,
        environment
      });
      setKeys([res, ...keys]);
      setNewKeySecret(res.rawSecretKey || null);
      setModalOpen(false);
      setKeyName('');
    } catch (err) {
      console.error('Failed to create API key:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = async (id: number) => {
    try {
      const updated = await apiKeysApi.revoke(id);
      setKeys(keys.map(k => k.id === id ? updated : k));
    } catch (err) {
      console.error('Failed to revoke API key:', err);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Create Key Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-sentinel-900 border border-sentinel-750 rounded-xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-sentinel-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Key className="w-5 h-5 text-cyan-400" />
                Generate Developer API Key
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded hover:bg-sentinel-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateKey} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Key Description / Name</label>
                <input
                  type="text"
                  required
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  placeholder="e.g. Staging Gateway Key, CI/CD Pipeline Key"
                  className="w-full bg-sentinel-850 border border-sentinel-750 text-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Target Application</label>
                <select
                  value={selectedAppId}
                  onChange={(e) => setSelectedAppId(Number(e.target.value))}
                  className="w-full bg-sentinel-850 border border-sentinel-750 text-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-cyan-500"
                >
                  {apps.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.appId})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Environment Scope</label>
                <select
                  value={environment}
                  onChange={(e) => setEnvironment(e.target.value)}
                  className="w-full bg-sentinel-850 border border-sentinel-750 text-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-cyan-500"
                >
                  <option value="PRODUCTION">PRODUCTION</option>
                  <option value="STAGING">STAGING</option>
                  <option value="DEVELOPMENT">DEVELOPMENT</option>
                </select>
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
                  {submitting ? 'Generating...' : 'Create Secret Key'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Key Revealed Banner */}
      {newKeySecret && (
        <div className="p-5 rounded-xl bg-cyan-950/40 border border-cyan-500/50 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-cyan-300 font-semibold text-sm">
              <Check className="w-5 h-5 text-cyan-400" />
              API Key Successfully Generated
            </div>
            <button
              onClick={() => setNewKeySecret(null)}
              className="p-1 text-slate-400 hover:text-white rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-slate-300">
            Copy this secret key immediately. For security, <span className="font-bold text-amber-300">you will never be able to view this full secret key again</span>.
          </p>

          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={newKeySecret}
              className="w-full bg-sentinel-950 border border-cyan-800 text-cyan-300 font-mono text-xs px-3 py-2.5 rounded-lg select-all"
            />
            <button
              onClick={() => copyToClipboard(newKeySecret)}
              className="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs rounded-lg flex items-center gap-1.5 transition-colors shrink-0"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy Key'}
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-sentinel-800/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
              DEVELOPER ACCESS
            </span>
            <span className="text-xs text-slate-500 font-mono">{keys.length} Keys Configured</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">API Key Management</h1>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-3.5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          Generate New API Key
        </button>
      </div>

      {/* API Keys Table */}
      <div className="soc-card p-0 overflow-hidden">
        {loading ? (
          <div className="p-6">
            <LoadingSkeleton rows={4} />
          </div>
        ) : keys.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th className="soc-table-header">Key Name</th>
                  <th className="soc-table-header">Prefix / Masked Token</th>
                  <th className="soc-table-header">Application</th>
                  <th className="soc-table-header">Environment</th>
                  <th className="soc-table-header">Status</th>
                  <th className="soc-table-header">Last Used</th>
                  <th className="soc-table-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {keys.map((k) => (
                  <tr key={k.id} className="soc-table-row">
                    <td className="px-4 py-3 font-medium text-slate-200 text-xs">
                      {k.name}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-cyan-400">
                      {k.keyPrefix}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-300">
                      {k.applicationName}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-sentinel-800 text-slate-300">
                        {k.environment}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`font-mono text-[11px] px-2 py-0.5 rounded font-medium ${
                          k.status === 'ACTIVE'
                            ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/40'
                            : 'bg-rose-950/40 text-rose-400 border border-rose-800/40'
                        }`}
                      >
                        {k.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-400 whitespace-nowrap">
                      {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString() : 'Never used'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {k.status === 'ACTIVE' && (
                        <button
                          onClick={() => handleRevoke(k.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 rounded hover:bg-sentinel-800 transition-colors"
                          title="Revoke key immediately"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No API keys found"
            description="Generate a developer API key to authenticate requests with the Sentinel Gateway or future SDKs."
            actionText="Generate Key"
            onAction={() => setModalOpen(true)}
          />
        )}
      </div>

      {/* Developer Onboarding Quick Start Guide */}
      <div className="soc-card p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Terminal className="w-5 h-5 text-cyan-400" />
          <h3 className="text-base font-bold text-white">Developer Onboarding & SDK Integration Flow</h3>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
          Follow the seven-step deployment cycle to protect your microservices with API Sentinel:
        </p>

        <div className="grid sm:grid-cols-4 gap-3 text-xs pt-2">
          <div className="p-3 rounded-lg bg-sentinel-850 border border-sentinel-800">
            <span className="font-mono text-cyan-400 font-bold block mb-1">01. Create App</span>
            <p className="text-slate-400 text-[11px]">Register your service and environment profile.</p>
          </div>
          <div className="p-3 rounded-lg bg-sentinel-850 border border-sentinel-800">
            <span className="font-mono text-cyan-400 font-bold block mb-1">02. Add Endpoints</span>
            <p className="text-slate-400 text-[11px]">Define sensitive routes and rate thresholds.</p>
          </div>
          <div className="p-3 rounded-lg bg-sentinel-850 border border-sentinel-800">
            <span className="font-mono text-cyan-400 font-bold block mb-1">03. Generate Key</span>
            <p className="text-slate-400 text-[11px]">Create an API secret key for evaluation.</p>
          </div>
          <div className="p-3 rounded-lg bg-sentinel-850 border border-sentinel-800">
            <span className="font-mono text-cyan-400 font-bold block mb-1">04. Route Traffic</span>
            <p className="text-slate-400 text-[11px]">Point incoming client traffic to the Gateway.</p>
          </div>
        </div>

        {/* Future SDK Examples */}
        <div className="pt-4 border-t border-sentinel-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-300">
              Client & Gateway Request Headers
            </span>
            <span className="text-xs font-mono text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40">
              Future SDKs: Coming Soon
            </span>
          </div>
          <pre className="text-xs font-mono text-slate-300 bg-sentinel-950 p-4 rounded-lg border border-sentinel-800 overflow-x-auto">
{`# Authenticate client requests to Gateway or Evaluate endpoint:
curl -X POST http://localhost:8081/api/products \\
  -H "X-Sentinel-Api-Key: sentinel_live_your_key_here" \\
  -H "Content-Type: application/json"`}
          </pre>
        </div>
      </div>
    </div>
  );
};
