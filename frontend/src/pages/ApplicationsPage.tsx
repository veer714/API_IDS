import React, { useState, useEffect } from 'react';
import { applicationsApi } from '../api/client';
import { Application } from '../types';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import {
  FolderGit2,
  Plus,
  Shield,
  Layers,
  Activity,
  Sliders,
  X,
  CheckCircle,
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const ApplicationsPage: React.FC = () => {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [environment, setEnvironment] = useState('PRODUCTION');
  const [rateLimitRpm, setRateLimitRpm] = useState(1200);
  const [challengeThreshold, setChallengeThreshold] = useState(0.40);
  const [blockThreshold, setBlockThreshold] = useState(0.70);
  const [submitting, setSubmitting] = useState(false);

  const fetchApps = async () => {
    try {
      const data = await applicationsApi.getAll();
      setApps(data);
    } catch (e) {
      console.error('Failed to load applications:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const created = await applicationsApi.create({
        name,
        description,
        environment,
        rateLimitRpm,
        challengeThreshold,
        blockThreshold,
        ruleEngineEnabled: true,
        mlEnabled: true
      });
      setApps([created, ...apps]);
      setModalOpen(false);
      setName('');
      setDescription('');
    } catch (err) {
      console.error('Failed to create application:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Create Application Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-sentinel-900 border border-sentinel-750 rounded-xl shadow-2xl w-full max-w-lg p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-sentinel-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FolderGit2 className="w-5 h-5 text-cyan-400" />
                Register Protected Application
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
                <label className="block text-slate-300 font-medium mb-1">Application Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Payments Microservice, Customer Portal API"
                  className="w-full bg-sentinel-850 border border-sentinel-750 text-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Environment</label>
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

              <div>
                <label className="block text-slate-300 font-medium mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide scope, team owner, or architectural description..."
                  className="w-full bg-sentinel-850 border border-sentinel-750 text-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">RPM Limit</label>
                  <input
                    type="number"
                    value={rateLimitRpm}
                    onChange={(e) => setRateLimitRpm(Number(e.target.value))}
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
                  {submitting ? 'Creating...' : 'Register Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-sentinel-800/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
              SERVICE REGISTRY
            </span>
            <span className="text-xs text-slate-500 font-mono">{apps.length} Active Services</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Protected Applications</h1>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-3.5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          Register New Application
        </button>
      </div>

      {/* Applications Cards Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2">
            <LoadingSkeleton rows={4} />
          </div>
        ) : apps.length > 0 ? (
          apps.map((app) => (
            <div key={app.id} className="soc-card space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
                      {app.appId}
                    </span>
                    <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-sentinel-800 text-slate-300">
                      {app.environment}
                    </span>
                    <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-300 border border-emerald-800/40">
                      {app.status}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white">{app.name}</h3>
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                {app.description || 'No description provided for this protected application.'}
              </p>

              <div className="grid grid-cols-3 gap-2 p-3 rounded-lg bg-sentinel-850 border border-sentinel-800 text-xs font-mono">
                <div>
                  <span className="text-slate-500 block text-[10px]">Protected APIs</span>
                  <span className="text-slate-200 font-semibold">{app.protectedEndpointsCount} Endpoints</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">RPM Limit</span>
                  <span className="text-slate-200 font-semibold">{app.rateLimitRpm} RPM</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Block Threshold</span>
                  <span className="text-rose-400 font-semibold">{app.blockThreshold.toFixed(2)} Risk</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-sentinel-800 text-xs">
                <span className="text-slate-500 text-[11px]">
                  Registered {new Date(app.createdAt).toLocaleDateString()}
                </span>
                <Link
                  to="/endpoints"
                  className="text-cyan-400 hover:underline flex items-center gap-1 text-xs font-medium"
                >
                  Configure Endpoints <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-2">
            <EmptyState
              title="No applications registered"
              description="Register your first microservice or backend application to enable intrusion detection."
              actionText="Register Application"
              onAction={() => setModalOpen(true)}
            />
          </div>
        )}
      </div>
    </div>
  );
};
