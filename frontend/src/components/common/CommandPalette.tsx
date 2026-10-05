import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  LayoutDashboard,
  Shield,
  Activity,
  AlertTriangle,
  FolderGit2,
  Lock,
  Sliders,
  BarChart3,
  Key,
  FileText,
  Server,
  Settings,
  Terminal,
  X
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<Props> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const commands = [
    { title: 'Dashboard & Overview', path: '/dashboard', icon: LayoutDashboard, category: 'Navigation' },
    { title: 'Live API Traffic & Telemetry', path: '/traffic', icon: Activity, category: 'Telemetry' },
    { title: 'Threat Center & Investigations', path: '/threats', icon: AlertTriangle, category: 'Security' },
    { title: 'Security Incidents Management', path: '/incidents', icon: Shield, category: 'Security' },
    { title: 'Protected Applications', path: '/applications', icon: FolderGit2, category: 'Configuration' },
    { title: 'Protected API Endpoints', path: '/endpoints', icon: Sliders, category: 'Configuration' },
    { title: 'Login Shield & Brute-Force Defense', path: '/login-shield', icon: Lock, category: 'Security' },
    { title: 'Detection Rules & Signatures', path: '/rules', icon: Sliders, category: 'Security' },
    { title: 'SOC Analytics & Heatmaps', path: '/analytics', icon: BarChart3, category: 'Analytics' },
    { title: 'API Keys & Developer SDK Quickstart', path: '/api-keys', icon: Key, category: 'Developer' },
    { title: 'Administrative Audit Logs', path: '/audit', icon: FileText, category: 'System' },
    { title: 'Multi-Service System Health', path: '/system', icon: Server, category: 'System' },
    { title: 'Interactive Demo & Attack Bench', path: '/demo', icon: Terminal, category: 'Demo' },
    { title: 'Platform Settings', path: '/settings', icon: Settings, category: 'System' },
  ];

  const filtered = commands.filter(c =>
    c.title.toLowerCase().includes(query.toLowerCase()) ||
    c.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-sentinel-900 border border-sentinel-700/80 rounded-xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center px-4 py-3 border-b border-sentinel-800 gap-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Type a command, route, or security view..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-transparent border-none text-white text-sm focus:outline-none placeholder-slate-500 font-medium"
          />
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-sentinel-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length > 0 ? (
            filtered.map((item, idx) => {
              const Icon = item.icon;
              return (
                <button
                  key={idx}
                  onClick={() => {
                    navigate(item.path);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-sentinel-800/80 text-left text-sm text-slate-200 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-md bg-sentinel-850 border border-sentinel-750 group-hover:border-cyan-500/40 text-slate-400 group-hover:text-cyan-400 transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="font-medium">{item.title}</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500 group-hover:text-slate-400 uppercase tracking-wider">
                    {item.category}
                  </span>
                </button>
              );
            })
          ) : (
            <div className="p-6 text-center text-sm text-slate-500">
              No matching views or commands found for "{query}"
            </div>
          )}
        </div>

        <div className="px-4 py-2.5 bg-sentinel-950/60 border-t border-sentinel-800/80 text-xs text-slate-500 flex justify-between items-center">
          <span>Navigate with click or arrow keys</span>
          <kbd className="px-1.5 py-0.5 rounded bg-sentinel-800 text-[10px] font-mono text-slate-400 border border-sentinel-700">ESC to close</kbd>
        </div>
      </div>
    </div>
  );
};
