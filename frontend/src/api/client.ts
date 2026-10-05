import axios from 'axios';
import {
  Application,
  ApiKey,
  ProtectedEndpoint,
  RequestEvent,
  ThreatEvent,
  Incident,
  SecurityRule,
  AuditLog,
  Notification,
  DashboardStats,
  SystemHealth,
  LoginShieldStatus,
  User
} from '../types';

const api = axios.create({
  baseURL: '',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sentinel_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response && err.response.status === 401) {
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register' && window.location.pathname !== '/') {
        localStorage.removeItem('sentinel_token');
        localStorage.removeItem('sentinel_user');
      }
    }
    return Promise.reject(err);
  }
);

export const authApi = {
  login: async (credentials: any) => (await api.post('/api/v1/auth/login', credentials)).data,
  register: async (data: any) => (await api.post('/api/v1/auth/register', data)).data,
  getCurrentUser: async (): Promise<User> => (await api.get('/api/v1/auth/me')).data,
};

export const applicationsApi = {
  getAll: async (): Promise<Application[]> => (await api.get('/api/v1/applications')).data,
  getById: async (id: number): Promise<Application> => (await api.get(`/api/v1/applications/${id}`)).data,
  create: async (data: any): Promise<Application> => (await api.post('/api/v1/applications', data)).data,
  update: async (id: number, data: any): Promise<Application> => (await api.put(`/api/v1/applications/${id}`, data)).data,
};

export const apiKeysApi = {
  getAll: async (): Promise<ApiKey[]> => (await api.get('/api/v1/api-keys')).data,
  create: async (data: any): Promise<ApiKey> => (await api.post('/api/v1/api-keys', data)).data,
  revoke: async (id: number): Promise<ApiKey> => (await api.delete(`/api/v1/api-keys/${id}`)).data,
};

export const endpointsApi = {
  getAll: async (): Promise<ProtectedEndpoint[]> => (await api.get('/api/v1/endpoints')).data,
  getByApp: async (appId: number): Promise<ProtectedEndpoint[]> => (await api.get(`/api/v1/endpoints/app/${appId}`)).data,
  create: async (data: any): Promise<ProtectedEndpoint> => (await api.post('/api/v1/endpoints', data)).data,
  update: async (id: number, data: any): Promise<ProtectedEndpoint> => (await api.put(`/api/v1/endpoints/${id}`, data)).data,
  delete: async (id: number): Promise<void> => (await api.delete(`/api/v1/endpoints/${id}`)).data,
};

export const trafficApi = {
  getRecent: async (): Promise<RequestEvent[]> => (await api.get('/api/v1/traffic')).data,
  getPaged: async (page = 0, size = 20) => (await api.get(`/api/v1/traffic/paged?page=${page}&size=${size}`)).data,
  getDetails: async (requestId: string): Promise<RequestEvent> => (await api.get(`/api/v1/traffic/${requestId}`)).data,
};

export const threatsApi = {
  getRecent: async (): Promise<ThreatEvent[]> => (await api.get('/api/v1/threats')).data,
  getPaged: async (page = 0, size = 20) => (await api.get(`/api/v1/threats/paged?page=${page}&size=${size}`)).data,
  getDetails: async (threatId: string): Promise<ThreatEvent> => (await api.get(`/api/v1/threats/${threatId}`)).data,
};

export const incidentsApi = {
  getRecent: async (): Promise<Incident[]> => (await api.get('/api/v1/incidents')).data,
  getPaged: async (page = 0, size = 20) => (await api.get(`/api/v1/incidents/paged?page=${page}&size=${size}`)).data,
  getDetails: async (incidentId: string): Promise<Incident> => (await api.get(`/api/v1/incidents/${incidentId}`)).data,
  update: async (incidentId: string, data: any): Promise<Incident> => (await api.patch(`/api/v1/incidents/${incidentId}`, data)).data,
};

export const rulesApi = {
  getAll: async (): Promise<SecurityRule[]> => (await api.get('/api/v1/rules')).data,
  update: async (id: number, data: any): Promise<SecurityRule> => (await api.put(`/api/v1/rules/${id}`, data)).data,
};

export const auditApi = {
  getRecent: async (): Promise<AuditLog[]> => (await api.get('/api/v1/audit')).data,
  getPaged: async (page = 0, size = 20) => (await api.get(`/api/v1/audit/paged?page=${page}&size=${size}`)).data,
};

export const notificationsApi = {
  getAll: async (): Promise<Notification[]> => (await api.get('/api/v1/notifications')).data,
  getUnreadCount: async (): Promise<number> => (await api.get('/api/v1/notifications/unread-count')).data.unreadCount,
  markAllRead: async () => (await api.post('/api/v1/notifications/mark-all-read')).data,
};

export const loginShieldApi = {
  getStatus: async (): Promise<LoginShieldStatus> => (await api.get('/api/v1/login-shield')).data,
};

export const analyticsApi = {
  getDashboard: async (timeRange = '24H'): Promise<DashboardStats> =>
    (await api.get(`/api/v1/analytics/dashboard?timeRange=${timeRange}`)).data,
};

export const systemHealthApi = {
  getHealth: async (): Promise<SystemHealth> => (await api.get('/api/v1/system/health')).data,
};

export const securityEvaluationApi = {
  evaluate: async (data: any) => (await api.post('/api/v1/security/evaluate', data)).data,
};

export default api;
