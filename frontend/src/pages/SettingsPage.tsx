import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Settings,
  Shield,
  Building,
  Sliders,
  Bell,
  Check,
  Save,
  Lock,
  ExternalLink
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [orgName, setOrgName] = useState(user?.organization || 'CyberCorp Global');
  const [tier, setTier] = useState('ENTERPRISE');
  const [globalRpm, setGlobalRpm] = useState(1200);
  const [challengeThreshold, setChallengeThreshold] = useState(0.40);
  const [blockThreshold, setBlockThreshold] = useState(0.70);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-sentinel-800/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
              CONFIGURATION
            </span>
            <span className="text-xs text-slate-500 font-mono">Workspace Security Policies</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Platform Settings</h1>
        </div>

        {saved && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/40 px-3 py-1.5 rounded-lg border border-emerald-800/40 font-semibold">
            <Check className="w-4 h-4" /> Changes Applied
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Organization Information */}
        <div className="soc-card space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-sentinel-800">
            <Building className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">Organization Profile</h3>
          </div>

          <div className="grid md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Organization Name</label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full bg-sentinel-850 border border-sentinel-750 text-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Subscription License Tier</label>
              <select
                value={tier}
                onChange={(e) => setTier(e.target.value)}
                className="w-full bg-sentinel-850 border border-sentinel-750 text-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-cyan-500"
              >
                <option value="COMMUNITY">Community Open-Source</option>
                <option value="ENTERPRISE">Enterprise SOC Production</option>
              </select>
            </div>
          </div>
        </div>

        {/* Global Security Policy Thresholds */}
        <div className="soc-card space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-sentinel-800">
            <Sliders className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">Default Inspection & Threshold Policies</h3>
          </div>

          <p className="text-xs text-slate-400">
            These thresholds determine default risk scoring behavior when individual endpoint rules are omitted.
          </p>

          <div className="grid md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Default RPM Rate Limit</label>
              <input
                type="number"
                value={globalRpm}
                onChange={(e) => setGlobalRpm(Number(e.target.value))}
                className="w-full bg-sentinel-850 border border-sentinel-750 text-slate-200 rounded-lg p-2.5 text-xs font-mono"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Requests per IP/minute</span>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Challenge Risk Threshold</label>
              <input
                type="number"
                step="0.05"
                value={challengeThreshold}
                onChange={(e) => setChallengeThreshold(Number(e.target.value))}
                className="w-full bg-sentinel-850 border border-sentinel-750 text-slate-200 rounded-lg p-2.5 text-xs font-mono"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Fires HTTP 401 challenge</span>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Block Risk Threshold</label>
              <input
                type="number"
                step="0.05"
                value={blockThreshold}
                onChange={(e) => setBlockThreshold(Number(e.target.value))}
                className="w-full bg-sentinel-850 border border-sentinel-750 text-slate-200 rounded-lg p-2.5 text-xs font-mono"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Fires HTTP 403 block</span>
            </div>
          </div>
        </div>

        {/* Security Webhooks & Integrations */}
        <div className="soc-card space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-sentinel-800">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">External SOC Webhooks</h3>
            </div>
            <span className="text-[10px] font-mono uppercase bg-sentinel-800 px-2 py-0.5 rounded text-amber-400">
              Coming Soon
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Dispatch critical security notifications to Slack, Microsoft Teams, PagerDuty, or Splunk SIEM endpoints.
          </p>
          <div className="p-3 rounded-lg bg-sentinel-850 border border-dashed border-sentinel-750 text-xs text-slate-500 font-mono">
            Webhook destination dispatcher will be configurable in API Sentinel v1.1.
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs flex items-center gap-2 transition-all shadow-md shadow-cyan-500/20"
          >
            <Save className="w-4 h-4" />
            Save Configuration
          </button>
        </div>
      </form>
    </div>
  );
};
