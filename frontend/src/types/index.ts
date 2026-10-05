export type SecurityDecision = 'ALLOW' | 'CHALLENGE' | 'THROTTLE' | 'BLOCK';
export type SeverityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

export interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: 'OWNER' | 'ADMIN' | 'SECURITY_ANALYST' | 'DEVELOPER' | 'VIEWER';
  organization?: string;
}

export interface Application {
  id: number;
  appId: string;
  name: string;
  environment: string;
  status: string;
  description: string;
  rateLimitRpm: number;
  challengeThreshold: number;
  blockThreshold: number;
  ruleEngineEnabled: boolean;
  mlEnabled: boolean;
  protectedEndpointsCount: number;
  totalRequests: number;
  totalThreats: number;
  createdAt: string;
}

export interface ApiKey {
  id: number;
  name: string;
  keyPrefix: string;
  rawSecretKey?: string;
  applicationName: string;
  applicationId: string;
  environment: string;
  status: string;
  lastUsedAt?: string;
  createdAt: string;
  expiresAt?: string;
}

export interface ProtectedEndpoint {
  id: number;
  applicationId: number;
  applicationName: string;
  path: string;
  method: string;
  protectionEnabled: boolean;
  ruleEngineEnabled: boolean;
  mlEnabled: boolean;
  rateLimit: number;
  challengeThreshold: number;
  blockThreshold: number;
  authRequired: boolean;
  createdAt: string;
}

export interface RequestEvent {
  id: number;
  requestId: string;
  applicationId: string;
  timestamp: string;
  method: string;
  url: string;
  endpoint: string;
  sourceIp: string;
  userAgent: string;
  statusCode: number;
  responseTimeMs: number;
  requestSize: number;
  responseSize: number;
  authenticationStatus: string;
  userId?: string;
  decision: SecurityDecision;
  riskScore: number;
  anomalyScore: number;
  payloadScore: number;
  attackType: string;
  severity: SeverityLevel;
  confidence: number;
  modelPrediction: string;
  modelVersion: string;
  inferenceTimeMs: number;
  reasonsJson?: string;
  rulesTriggeredJson?: string;
  headersJson?: string;
  payloadSnippet?: string;
}

export interface ThreatEvent {
  id: number;
  threatId: string;
  applicationId: string;
  timestamp: string;
  attackType: string;
  severity: SeverityLevel;
  endpoint: string;
  sourceIp: string;
  riskScore: number;
  decision: string;
  status: string;
  summary: string;
  reasonsJson?: string;
}

export interface Incident {
  id: number;
  incidentId: string;
  title: string;
  severity: SeverityLevel;
  attackType: string;
  firstSeen: string;
  lastSeen: string;
  sourceIp: string;
  affectedApplication: string;
  affectedEndpoint: string;
  requestCount: number;
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'FALSE_POSITIVE';
  assignedTo?: string;
  resolutionNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SecurityRule {
  id: number;
  ruleId: string;
  name: string;
  category: string;
  description: string;
  severity: SeverityLevel;
  enabled: boolean;
  threshold: number;
  patternRegex?: string;
  action: 'BLOCK' | 'CHALLENGE' | 'THROTTLE' | 'ALERT';
}

export interface AuditLog {
  id: number;
  actor: string;
  action: string;
  resource: string;
  ipAddress: string;
  result: string;
  details: string;
  timestamp: string;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  severity: SeverityLevel;
  type: string;
  readStatus: boolean;
  link?: string;
  timestamp: string;
}

export interface DashboardStats {
  totalRequests: number;
  totalThreats: number;
  blockedRequests: number;
  challengedRequests: number;
  throttledRequests: number;
  allowedRequests: number;
  averageRisk: number;
  attackRate: number;
  activeApplications: number;
  openIncidents: number;
  topAttackedEndpoints: Array<{ endpoint: string; count: number; maxRisk: number }>;
  topSourceIps: Array<{ sourceIp: string; count: number; maxRisk: number }>;
  attackTypeDistribution: Array<{ attackType: string; count: number }>;
  severityDistribution: Array<{ severity: string; count: number }>;
  decisionDistribution: Array<{ decision: string; count: number }>;
}

export interface SystemHealth {
  overallStatus: 'HEALTHY' | 'DEGRADED' | 'OFFLINE';
  gateway: ServiceHealth;
  backend: ServiceHealth;
  database: ServiceHealth;
  detectionEngine: ServiceHealth;
  mlService: ServiceHealth;
}

export interface ServiceHealth {
  status: 'HEALTHY' | 'DEGRADED' | 'OFFLINE';
  latencyMs: number;
  version: string;
  message: string;
  details?: Record<string, any>;
}

export interface LoginShieldStatus {
  totalAttempts: number;
  failedAttempts: number;
  bruteForceBlocked: number;
  failureRate: number;
  maxAttemptsBeforeLockout: number;
  lockoutDurationMinutes: number;
  challengeRiskThreshold: number;
  recentAttempts: Array<{
    id: number;
    username: string;
    sourceIp: string;
    timestamp: string;
    success: boolean;
    failureReason?: string;
    riskScore: number;
    blocked: boolean;
  }>;
}
