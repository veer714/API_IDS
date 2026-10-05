import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, User as UserIcon, ArrowRight, AlertCircle, KeyRound } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login({ username, password });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid username or password. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillAdmin = () => {
    setUsername('admin');
    setPassword('SentinelAdmin2026!');
  };

  const fillDeveloper = () => {
    setUsername('developer');
    setPassword('SentinelDev2026!');
  };

  return (
    <div className="min-h-screen bg-sentinel-950 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_-10%,rgba(6,182,212,0.12),rgba(255,255,255,0))]" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white">API SENTINEL</span>
          </Link>
          <h2 className="text-2xl font-bold text-white tracking-tight">Security Console Sign In</h2>
          <p className="text-xs text-slate-400 mt-1">Authenticate to access the Security Operations Dashboard</p>
        </div>

        <div className="bg-sentinel-900 border border-sentinel-800 rounded-xl p-7 shadow-2xl">
          {error && (
            <div className="mb-5 p-3 rounded-lg bg-rose-950/40 border border-rose-800/60 flex items-center gap-2 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Username or Security Email
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin or dev@apisentinel.io"
                  className="w-full pl-9 pr-3 py-2.5 bg-sentinel-850 border border-sentinel-750 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2.5 bg-sentinel-850 border border-sentinel-750 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm transition-all shadow-md shadow-cyan-500/20 flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Credentials for evaluators */}
          <div className="mt-6 pt-5 border-t border-sentinel-800">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-2 text-center">
              Quick Fill Demo Credentials
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={fillAdmin}
                className="py-1.5 px-2 rounded bg-sentinel-850 hover:bg-sentinel-800 border border-sentinel-750 text-[11px] text-slate-300 font-medium transition-colors flex items-center justify-center gap-1.5"
              >
                <KeyRound className="w-3 h-3 text-cyan-400" />
                Admin (SOC)
              </button>
              <button
                type="button"
                onClick={fillDeveloper}
                className="py-1.5 px-2 rounded bg-sentinel-850 hover:bg-sentinel-800 border border-sentinel-750 text-[11px] text-slate-300 font-medium transition-colors flex items-center justify-center gap-1.5"
              >
                <KeyRound className="w-3 h-3 text-indigo-400" />
                Developer
              </button>
            </div>
          </div>
        </div>

        <div className="text-center mt-6 text-xs text-slate-500">
          Need a new workspace?{' '}
          <Link to="/register" className="text-cyan-400 hover:underline font-medium">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
};
