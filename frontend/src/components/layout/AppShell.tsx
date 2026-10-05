import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { CommandPalette } from '../common/CommandPalette';
import { notificationsApi, systemHealthApi } from '../../api/client';
import { Notification, SystemHealth } from '../../types';
import {
  Shield,
  LayoutDashboard,
  Activity,
  AlertTriangle,
  FolderGit2,
  Lock,
  Sliders,
  BarChart3,
  Key,
  Puzzle,
  FileText,
  Settings,
  Terminal,
  Bell,
  Search,
  CheckCircle2,
  AlertCircle,
  Menu,
  X,
  LogOut,
  ChevronDown,
  ExternalLink
} from 'lucide-react';

export const AppShell: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [health, setHealth] = useState<SystemHealth | null>(null);

  const [selectedEnv, setSelectedEnv] = useState('Production');

  // Global Ctrl/Cmd + K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Poll notifications & system health
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const notifs = await notificationsApi.getAll();
        setNotifications(notifs);
        const count = await notificationsApi.getUnreadCount();
        setUnreadCount(count);
      } catch (e) {}

      try {
        const h = await systemHealthApi.getHealth();
        setHealth(h);
      } catch (e) {}
    };

    fetchMeta();
    const interval = setInterval(fetchMeta, 6000);
    return () => clearInterval(interval);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setNotificationsOpen(false);
  }, [location.pathname]);

  const handleMarkAllRead = async () => {
    await notificationsApi.markAllRead();
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, readStatus: true })));
  };

  const navLinks = [
    { title: 'Overview', path: '/dashboard', icon: LayoutDashboard },
    { title: 'Applications', path: '/applications', icon: FolderGit2 },
    { title: 'Live Traffic', path: '/traffic', icon: Activity },
    { title: 'Threats', path: '/threats', icon: AlertTriangle },
    { title: 'Incidents', path: '/incidents', icon: Shield },
    { title: 'Protected APIs', path: '/endpoints', icon: Sliders },
    { title: 'Login Shield', path: '/login-shield', icon: Lock },
    { title: 'Rules', path: '/rules', icon: Sliders },
    { title: 'Analytics', path: '/analytics', icon: BarChart3 },
    { title: 'API Keys', path: '/api-keys', icon: Key },
    { title: 'Audit Logs', path: '/audit', icon: FileText },
    { title: 'System Health', path: '/system', icon: CheckCircle2 },
    { title: 'Interactive Demo', path: '/demo', icon: Terminal, highlight: true },
    { title: 'Integrations', path: '/integrations', icon: Puzzle, comingSoon: true },
    { title: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-sentinel-950 flex text-slate-100">
      {/* Command Palette */}
      <CommandPalette isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-sentinel-800 bg-sentinel-900 shrink-0">
        {/* Brand */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-sentinel-800">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
              API SENTINEL
            </h1>
            <span className="text-[10px] font-mono text-cyan-400 font-medium">INTRUSION DEFENSE</span>
          </div>
        </div>

        {/* Navigation items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navLinks.map((item, idx) => {
            const Icon = item.icon;
            if (item.comingSoon) {
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between px-3 py-2 rounded-lg text-slate-500 text-xs font-medium cursor-not-allowed select-none"
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{item.title}</span>
                  </div>
                  <span className="text-[9px] font-mono uppercase bg-sentinel-800 px-1.5 py-0.5 rounded text-slate-400">
                    Soon
                  </span>
                </div>
              );
            }

            return (
              <NavLink
                key={idx}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-sentinel-850'
                  } ${item.highlight ? 'border border-cyan-500/20 text-cyan-300' : ''}`
                }
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.title}</span>
                </div>
                {item.highlight && (
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                )}
              </NavLink>
            );
          })}
        </div>

        {/* System Health Footer in Sidebar */}
        <div className="p-3 border-t border-sentinel-800 bg-sentinel-950/40">
          <div className="flex items-center justify-between px-2 py-1 text-xs">
            <span className="text-slate-400 text-[11px]">System Status</span>
            <div className="flex items-center gap-1.5 font-mono text-[11px]">
              <span className={`w-2 h-2 rounded-full ${
                health?.overallStatus === 'HEALTHY' ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-amber-400'
              }`} />
              <span className={health?.overallStatus === 'HEALTHY' ? 'text-emerald-400' : 'text-amber-400'}>
                {health?.overallStatus || 'HEALTHY'}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 border-b border-sentinel-800 bg-sentinel-900/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-4">
            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(prev => !prev)}
              className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-sentinel-800"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Org and Env Selectors */}
            <div className="hidden sm:flex items-center gap-2 text-xs">
              <span className="font-semibold text-white px-2.5 py-1 rounded bg-sentinel-850 border border-sentinel-750">
                CyberCorp Global
              </span>
              <span className="text-slate-600">/</span>
              <select
                value={selectedEnv}
                onChange={(e) => setSelectedEnv(e.target.value)}
                className="bg-sentinel-850 border border-sentinel-750 text-slate-300 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-cyan-500"
              >
                <option value="Production">Production</option>
                <option value="Staging">Staging</option>
                <option value="Development">Development</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search / Command Palette Trigger */}
            <button
              onClick={() => setIsCommandOpen(true)}
              className="flex items-center gap-3 bg-sentinel-850 hover:bg-sentinel-800 border border-sentinel-750 px-3 py-1.5 rounded-lg text-xs text-slate-400 transition-colors"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden md:inline font-normal">Search or jump to...</span>
              <kbd className="font-mono text-[10px] bg-sentinel-900 px-1.5 py-0.5 rounded border border-sentinel-700 text-slate-400">
                Ctrl+K
              </kbd>
            </button>

            {/* Notifications Popover */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(prev => !prev)}
                className="relative p-2 text-slate-400 hover:text-white rounded-lg hover:bg-sentinel-800 transition-colors"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cyan-400" />
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-sentinel-900 border border-sentinel-750 rounded-xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-sentinel-800 text-xs">
                    <span className="font-semibold text-slate-200">Security Notifications</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[11px] text-cyan-400 hover:underline"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {notifications.length > 0 ? (
                      notifications.slice(0, 5).map((n) => (
                        <div
                          key={n.id}
                          className={`p-2.5 rounded-lg border text-xs ${
                            n.severity === 'CRITICAL'
                              ? 'bg-rose-950/20 border-rose-800/40 text-rose-200'
                              : n.severity === 'HIGH'
                              ? 'bg-orange-950/20 border-orange-800/40 text-orange-200'
                              : 'bg-sentinel-850 border-sentinel-800 text-slate-300'
                          }`}
                        >
                          <div className="font-medium text-slate-200 mb-0.5">{n.title}</div>
                          <p className="text-[11px] text-slate-400 line-clamp-2">{n.message}</p>
                          <span className="text-[10px] text-slate-500 mt-1 block">
                            {new Date(n.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500 text-center py-4">No recent notifications</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-sentinel-800">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-inner">
                {user?.username ? user.username.substring(0, 2).toUpperCase() : 'CS'}
              </div>
              <div className="hidden md:block text-left text-xs">
                <span className="font-medium text-slate-200 block truncate max-w-[120px]">
                  {user?.fullName || user?.username || 'Security Officer'}
                </span>
                <span className="text-[10px] font-mono text-cyan-400 uppercase">
                  {user?.role || 'OWNER'}
                </span>
              </div>
              <button
                onClick={logout}
                title="Logout"
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-sentinel-800 rounded-lg transition-colors ml-1"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-sentinel-900 border-b border-sentinel-800 px-4 py-3 space-y-1">
            {navLinks.map((item, idx) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={idx}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium ${
                      isActive
                        ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                        : 'text-slate-400 hover:bg-sentinel-850'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.title}</span>
                </NavLink>
              );
            })}
          </div>
        )}

        {/* Page Outlet / Children */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
};
