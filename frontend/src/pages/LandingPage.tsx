import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  ArrowRight,
  Lock,
  Cpu,
  Activity,
  Layers,
  CheckCircle2,
  Terminal,
  Zap,
  Globe,
  Sliders,
  ExternalLink,
  ChevronRight,
  AlertTriangle,
  Code2
} from 'lucide-react';
import { DecisionBadge } from '../components/common/DecisionBadge';

export const LandingPage: React.FC = () => {
  const [selectedSnippet, setSelectedSnippet] = useState<'node' | 'python' | 'java'>('node');

  const snippets = {
    node: `// Coming Soon: @api-sentinel/node
import express from 'express';
import { apiSentinel } from '@api-sentinel/node';

const app = express();

app.use(apiSentinel({
  apiKey: process.env.SENTINEL_API_KEY,
  applicationId: 'app_ecommerce_prod',
  mode: 'enforce' // or 'monitor'
}));

app.get('/api/products', (req, res) => {
  res.json({ status: 'protected' });
});`,
    python: `# Coming Soon: api-sentinel
from fastapi import FastAPI
from api_sentinel import SentinelMiddleware

app = FastAPI()

app.add_middleware(
    SentinelMiddleware,
    api_key="sentinel_live_your_key_here",
    app_id="app_ecommerce_prod",
    block_threshold=0.70
)`,
    java: `// Coming Soon: api-sentinel-spring
@Configuration
@EnableApiSentinel
public class SecurityPipelineConfig {

    @Bean
    public SentinelSecurityFilter sentinelFilter() {
        return new SentinelSecurityFilter(
            "sentinel_live_your_key_here",
            "app_ecommerce_prod"
        );
    }
}`
  };

  return (
    <div className="min-h-screen bg-sentinel-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/20 selection:text-cyan-200">
      {/* Navigation */}
      <nav className="border-b border-sentinel-800/80 bg-sentinel-900/60 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-base tracking-tight text-white">API SENTINEL</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-xs font-medium text-slate-300">
            <a href="#how-it-works" className="hover:text-cyan-400 transition-colors">How It Works</a>
            <a href="#intelligence" className="hover:text-cyan-400 transition-colors">Intelligence</a>
            <a href="#login-shield" className="hover:text-cyan-400 transition-colors">Login Shield</a>
            <a href="#developer" className="hover:text-cyan-400 transition-colors">Developers</a>
            <a href="#architecture" className="hover:text-cyan-400 transition-colors">Architecture</a>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-xs font-medium text-slate-300 hover:text-white px-3 py-2 transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/demo"
              className="text-xs font-medium bg-sentinel-800 hover:bg-sentinel-750 text-cyan-300 px-3.5 py-2 rounded-lg border border-cyan-500/30 transition-all flex items-center gap-1.5"
            >
              <Terminal className="w-3.5 h-3.5" />
              Live Demo
            </Link>
            <Link
              to="/register"
              className="text-xs font-medium bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-4 py-2 rounded-lg shadow-md shadow-cyan-500/20 transition-all"
            >
              Protect an API
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(6,182,212,0.15),rgba(255,255,255,0))]" />
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-950/40 text-cyan-300 text-xs font-mono mb-8">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            HYBRID AI + HEURISTIC INTRUSION DETECTION PLATFORM
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
            Intelligent protection for <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">every API</span>.
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto mb-10 leading-relaxed font-normal">
            Detect malicious behavior, API abuse, authentication attacks and suspicious traffic before they reach your application.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto px-7 py-3.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm transition-all shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2"
            >
              Protect an API
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/demo"
              className="w-full sm:w-auto px-7 py-3.5 rounded-lg bg-sentinel-850 hover:bg-sentinel-800 text-slate-200 font-semibold text-sm border border-sentinel-700 transition-all flex items-center justify-center gap-2"
            >
              <Terminal className="w-4 h-4 text-cyan-400" />
              View Interactive Demo
            </Link>
          </div>

          {/* Interactive Hero Pipeline Badge */}
          <div className="mt-14 p-5 rounded-xl bg-sentinel-900/90 border border-sentinel-800 max-w-3xl mx-auto shadow-2xl text-left">
            <div className="flex items-center justify-between pb-3 border-b border-sentinel-800 mb-4 text-xs text-slate-400">
              <span className="font-mono text-cyan-400">Real-Time Threat Interception Stream</span>
              <span className="font-mono">Inference: 3.4ms</span>
            </div>
            <div className="space-y-2.5 font-mono text-xs">
              <div className="flex items-center justify-between p-2 rounded bg-sentinel-850 border border-sentinel-800">
                <div className="flex items-center gap-3">
                  <span className="text-emerald-400 font-semibold">GET</span>
                  <span className="text-slate-300">/api/v1/products?category=hardware</span>
                  <span className="text-slate-500 text-[11px]">198.51.100.14</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-400 text-[11px]">Risk: 0.04</span>
                  <DecisionBadge decision="ALLOW" />
                </div>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-rose-950/20 border border-rose-800/40">
                <div className="flex items-center gap-3">
                  <span className="text-rose-400 font-semibold">GET</span>
                  <span className="text-slate-300">/api/v1/products?search=' UNION SELECT username, password FROM users--</span>
                  <span className="text-slate-500 text-[11px]">203.0.113.45</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-rose-400 font-semibold text-[11px]">Risk: 0.96</span>
                  <DecisionBadge decision="BLOCK" />
                </div>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-amber-950/20 border border-amber-800/40">
                <div className="flex items-center gap-3">
                  <span className="text-amber-400 font-semibold">POST</span>
                  <span className="text-slate-300">/api/v1/auth/login</span>
                  <span className="text-slate-500 text-[11px]">45.33.32.156</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-amber-400 font-semibold text-[11px]">Risk: 0.88</span>
                  <DecisionBadge decision="CHALLENGE" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security Problem Section */}
      <section className="py-20 px-6 border-t border-sentinel-800 bg-sentinel-900/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest font-semibold block mb-2">
              The API Threat Landscape
            </span>
            <h2 className="text-3xl font-bold text-white mb-4">
              Traditional Web Application Firewalls Fail on API Attacks
            </h2>
            <p className="text-sm text-slate-400">
              Modern attacks exploit API business logic, abnormal query parameters, brute-force identity flows, and microservice blindspots without triggering legacy signatures.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="soc-card">
              <div className="w-10 h-10 rounded-lg bg-rose-950/50 border border-rose-800/50 flex items-center justify-center text-rose-400 mb-4">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">Automated Credential Abuse</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Distributed botnets cycle thousands of leaked credentials across authentication endpoints at low frequencies to evade standard rate limits.
              </p>
            </div>

            <div className="soc-card">
              <div className="w-10 h-10 rounded-lg bg-amber-950/50 border border-amber-800/50 flex items-center justify-center text-amber-400 mb-4">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">Polymorphic Injection Payloads</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Obfuscated SQLi, XSS, and command injection bypass static regex patterns through UTF-8 encoding, parameter tampering, and nested JSON structures.
              </p>
            </div>

            <div className="soc-card">
              <div className="w-10 h-10 rounded-lg bg-indigo-950/50 border border-indigo-800/50 flex items-center justify-center text-indigo-400 mb-4">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">Unsupervised Behavioral Anomalies</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                API scrapers and endpoint enumerators probe internal microservices, mapping backend schemas without generating traditional HTTP error codes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How API Sentinel Works */}
      <section id="how-it-works" className="py-20 px-6 border-t border-sentinel-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest font-semibold block mb-2">
              Three-Stage Defense
            </span>
            <h2 className="text-3xl font-bold text-white mb-4">How API Sentinel Works</h2>
            <p className="text-sm text-slate-400">
              Every request is intercepted, evaluated across multi-modal intelligence dimensions, and enforced in real time before touching your application backend.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="bg-sentinel-900 p-6 rounded-xl border border-sentinel-800">
              <div className="text-2xl font-mono font-bold text-cyan-400 mb-3">01</div>
              <h3 className="text-base font-semibold text-white mb-2">Telemetry Interception</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                The Sentinel Gateway extracts request headers, URI endpoints, payload byte streams, client source IP, and sliding-window rate telemetry.
              </p>
            </div>

            <div className="bg-sentinel-900 p-6 rounded-xl border border-sentinel-800">
              <div className="text-2xl font-mono font-bold text-indigo-400 mb-3">02</div>
              <h3 className="text-base font-semibold text-white mb-2">Hybrid Intelligence Fusion</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Simultaneously matches deterministic security rules, behavioral anomaly baselines with Isolation Forest, and 9-class XGBoost payload classifiers.
              </p>
            </div>

            <div className="bg-sentinel-900 p-6 rounded-xl border border-sentinel-800">
              <div className="text-2xl font-mono font-bold text-emerald-400 mb-3">03</div>
              <h3 className="text-base font-semibold text-white mb-2">Adaptive Decision Enforcement</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Executes ALLOW, CHALLENGE, THROTTLE, or BLOCK in under 5ms, streaming rich audit telemetry directly to your SOC dashboard and incident queue.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Intelligence & ML Section */}
      <section id="intelligence" className="py-20 px-6 border-t border-sentinel-800 bg-sentinel-900/30">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest font-semibold block mb-2">
                Multi-Modal Machine Learning
              </span>
              <h2 className="text-3xl font-bold text-white mb-5">
                Behavioral Anomaly & Payload-Aware Detection
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed mb-6">
                API Sentinel integrates an advanced hybrid machine learning pipeline combining unsupervised behavioral modeling with high-precision supervised classification:
              </p>

              <div className="space-y-4">
                <div className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-slate-200">Isolation Forest Behavioral Baseline</h4>
                    <p className="text-xs text-slate-400">Evaluates client request frequency, failure rate ratios, and endpoint diversity to detect unseen zero-day scanners.</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-slate-200">9-Class XGBoost Payload Classifier</h4>
                    <p className="text-xs text-slate-400">Classifies SQLi, XSS, Command Injection, Path Traversal, Brute Force, Rate Abuse, and Parameter Tampering with sub-5ms latency.</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-slate-200">Explainable Decision Reasons</h4>
                    <p className="text-xs text-slate-400">Every decision produces feature-grounded rationales, empowering SOC analysts to understand exactly why a request was blocked.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-sentinel-900 border border-sentinel-800 rounded-xl p-6 shadow-xl">
              <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-4 flex items-center justify-between">
                <span>Active Model Benchmark Telemetry</span>
                <span className="text-cyan-400">v1.0.0-hybrid</span>
              </h3>
              <div className="space-y-3 font-mono text-xs">
                <div className="flex justify-between p-2.5 rounded bg-sentinel-850 border border-sentinel-800">
                  <span className="text-slate-400">Supervised Algorithm:</span>
                  <span className="text-slate-200 font-semibold">XGBoost (9 Classes)</span>
                </div>
                <div className="flex justify-between p-2.5 rounded bg-sentinel-850 border border-sentinel-800">
                  <span className="text-slate-400">Anomaly Detector:</span>
                  <span className="text-slate-200">Isolation Forest (35k samples)</span>
                </div>
                <div className="flex justify-between p-2.5 rounded bg-sentinel-850 border border-sentinel-800">
                  <span className="text-slate-400">Test Precision / Recall:</span>
                  <span className="text-emerald-400 font-semibold">100.0% / 100.0%</span>
                </div>
                <div className="flex justify-between p-2.5 rounded bg-sentinel-850 border border-sentinel-800">
                  <span className="text-slate-400">Average Inference Latency:</span>
                  <span className="text-cyan-400 font-semibold">2.4 ms</span>
                </div>
                <div className="flex justify-between p-2.5 rounded bg-sentinel-850 border border-sentinel-800">
                  <span className="text-slate-400">Unseen Attack Detection Rate:</span>
                  <span className="text-indigo-400 font-semibold">100.0% (Hybrid Fusion)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Login Shield Highlight */}
      <section id="login-shield" className="py-20 px-6 border-t border-sentinel-800">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1 bg-sentinel-900 border border-sentinel-800 rounded-xl p-6 shadow-xl">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-sentinel-800 text-xs">
                <Lock className="w-4 h-4 text-cyan-400" />
                <span className="font-semibold text-white">Login Shield Defense Policy</span>
              </div>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center p-2 rounded bg-sentinel-850">
                  <span className="text-slate-300">Max Failed Attempts Before Lockout</span>
                  <span className="font-mono text-cyan-400 font-bold">5 Attempts</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded bg-sentinel-850">
                  <span className="text-slate-300">Lockout Duration Window</span>
                  <span className="font-mono text-slate-200 font-semibold">5 Minutes</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded bg-sentinel-850">
                  <span className="text-slate-300">Challenge Risk Threshold</span>
                  <span className="font-mono text-amber-400 font-semibold">0.40 Score</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded bg-sentinel-850">
                  <span className="text-slate-300">MFA Escalation Trigger</span>
                  <span className="font-mono text-indigo-400 font-semibold">Enabled</span>
                </div>
              </div>
            </div>

            <div className="order-1 md:order-2">
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest font-semibold block mb-2">
                Dedicated Identity Protection
              </span>
              <h2 className="text-3xl font-bold text-white mb-5">
                Login Shield: Neutralize Authentication Attacks
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed mb-6">
                Protect sensitive endpoints like <code>/login</code>, <code>/signin</code>, and <code>/register</code> against brute force, credential stuffing, and account enumeration. The engine tracks IP lockout thresholds server-side without degrading legitimate user experiences.
              </p>
              <Link
                to="/login-shield"
                className="inline-flex items-center gap-2 text-xs font-semibold text-cyan-400 hover:text-cyan-300"
              >
                Inspect Login Shield Center
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Developer Experience & Future SDK Section */}
      <section id="developer" className="py-20 px-6 border-t border-sentinel-800 bg-sentinel-900/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest font-semibold block mb-2">
              Developer First
            </span>
            <h2 className="text-3xl font-bold text-white mb-4">Future-Proof SDK Ecosystem</h2>
            <p className="text-sm text-slate-400">
              API Sentinel exposes a single, rock-solid security evaluation boundary: <code>POST /api/v1/security/evaluate</code>. Connect via Gateway today, or drop in SDK middleware in the future.
            </p>
          </div>

          <div className="max-w-3xl mx-auto bg-sentinel-900 border border-sentinel-800 rounded-xl overflow-hidden shadow-2xl">
            <div className="flex border-b border-sentinel-800 bg-sentinel-850 px-4">
              <button
                onClick={() => setSelectedSnippet('node')}
                className={`px-4 py-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 ${
                  selectedSnippet === 'node'
                    ? 'border-cyan-400 text-cyan-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>Node.js Express</span>
                <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-sentinel-800 text-amber-400">Coming Soon</span>
              </button>

              <button
                onClick={() => setSelectedSnippet('python')}
                className={`px-4 py-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 ${
                  selectedSnippet === 'python'
                    ? 'border-cyan-400 text-cyan-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>Python FastAPI</span>
                <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-sentinel-800 text-amber-400">Coming Soon</span>
              </button>

              <button
                onClick={() => setSelectedSnippet('java')}
                className={`px-4 py-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 ${
                  selectedSnippet === 'java'
                    ? 'border-cyan-400 text-cyan-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>Java Spring Boot</span>
                <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-sentinel-800 text-amber-400">Coming Soon</span>
              </button>
            </div>

            <div className="p-5 font-mono text-xs text-slate-300 overflow-x-auto bg-sentinel-950">
              <pre>{snippets[selectedSnippet]}</pre>
            </div>
          </div>
        </div>
      </section>

      {/* Architecture Diagram Section */}
      <section id="architecture" className="py-20 px-6 border-t border-sentinel-800">
        <div className="max-w-6xl mx-auto text-center">
          <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest font-semibold block mb-2">
            System Architecture
          </span>
          <h2 className="text-3xl font-bold text-white mb-6">Complete End-to-End Pipeline</h2>
          <p className="text-sm text-slate-400 max-w-2xl mx-auto mb-12">
            Clean boundary between client, enforcement gateway, detection heuristics, ML microservice, and real-time dashboard.
          </p>

          <div className="grid md:grid-cols-5 gap-3 text-left">
            <div className="p-4 rounded-lg bg-sentinel-900 border border-sentinel-800">
              <span className="text-[10px] font-mono text-cyan-400 block mb-1">INGRESS</span>
              <h4 className="text-sm font-semibold text-white mb-1">API Gateway</h4>
              <p className="text-xs text-slate-400">Reverse proxy intercepting live client traffic on port :8081.</p>
            </div>

            <div className="p-4 rounded-lg bg-sentinel-900 border border-sentinel-800">
              <span className="text-[10px] font-mono text-indigo-400 block mb-1">STAGE 1</span>
              <h4 className="text-sm font-semibold text-white mb-1">Detection Engine</h4>
              <p className="text-xs text-slate-400">Regex filters & sliding-window rate tracking.</p>
            </div>

            <div className="p-4 rounded-lg bg-sentinel-900 border border-sentinel-800">
              <span className="text-[10px] font-mono text-amber-400 block mb-1">STAGE 2</span>
              <h4 className="text-sm font-semibold text-white mb-1">ML Microservice</h4>
              <p className="text-xs text-slate-400">FastAPI with Isolation Forest & XGBoost classifiers on port :8000.</p>
            </div>

            <div className="p-4 rounded-lg bg-sentinel-900 border border-sentinel-800">
              <span className="text-[10px] font-mono text-emerald-400 block mb-1">CORE</span>
              <h4 className="text-sm font-semibold text-white mb-1">Backend Core</h4>
              <p className="text-xs text-slate-400">Spring Boot 3.3 REST API with persistence on port :8080.</p>
            </div>

            <div className="p-4 rounded-lg bg-sentinel-900 border border-sentinel-800">
              <span className="text-[10px] font-mono text-rose-400 block mb-1">UI / SOC</span>
              <h4 className="text-sm font-semibold text-white mb-1">SOC Platform</h4>
              <p className="text-xs text-slate-400">Real-time React 18 dashboard on port :3000.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 border-t border-sentinel-800 bg-gradient-to-b from-sentinel-900 to-sentinel-950 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-5">
            Ready to secure your APIs with machine learning?
          </h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto mb-8">
            Deploy API Sentinel Gateway today and start defending against automated attacks in minutes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="px-8 py-3.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm transition-all shadow-lg shadow-cyan-500/25"
            >
              Get Started Free
            </Link>
            <Link
              to="/demo"
              className="px-8 py-3.5 rounded-lg bg-sentinel-800 hover:bg-sentinel-750 text-slate-200 font-semibold text-sm border border-sentinel-700 transition-all"
            >
              Launch Live Attack Bench
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-sentinel-800 bg-sentinel-950 px-6 py-10 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold text-slate-400">API Sentinel Platform</span>
            <span>© 2026 CyberCorp Security. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#how-it-works" className="hover:text-slate-400">Documentation</a>
            <a href="#architecture" className="hover:text-slate-400">Architecture</a>
            <Link to="/demo" className="hover:text-slate-400">Demo Target API</Link>
            <Link to="/login" className="hover:text-slate-400">Console Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
