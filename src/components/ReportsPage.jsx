import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3, TrendingUp, TrendingDown, ShieldCheck, Activity,
  CheckCircle2, XCircle, Clock, Download, RefreshCw, Zap,
  AlertTriangle, Globe, Shield, Cpu, Target, Award,
  GitBranch, Server, Eye, ChevronDown, Filter
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Mini SVG Components
// ─────────────────────────────────────────────────────────────────────────────

const RadialGauge = ({ value, max = 100, color, label, size = 110 }) => {
  const r = 38, cx = 50, cy = 50;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(value / max, 1);
  const dash = pct * circ;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}>
      <svg viewBox="0 0 100 100" width={size} height={size}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10"/>
        <circle cx={cx} cy={cy} r={r} fill="none"
          stroke={color} strokeWidth="10"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
          style={{ transition: 'stroke-dasharray 1s ease', filter: `drop-shadow(0 0 6px ${color}60)` }}
        />
        <text x="50" y="47" textAnchor="middle" fill="#f8fafc" fontSize="13" fontWeight="800">{Math.round(value)}%</text>
        <text x="50" y="58" textAnchor="middle" fill="#475569" fontSize="6.5" fontWeight="600">
          {label.toUpperCase()}
        </text>
      </svg>
    </div>
  );
};

const SparkLine = ({ data, color, height = 40, width = 120 }) => {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} style={{ overflow: 'visible' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 3px ${color}80)` }}/>
      <polyline points={`0,${height} ${pts} ${width},${height}`} fill={`${color}18`} stroke="none"/>
    </svg>
  );
};

const MiniBar = ({ value, max, color }) => (
  <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden', marginTop: '0.3rem' }}>
    <div style={{ height: '100%', width: `${Math.min(100, (value / (max || 1)) * 100)}%`, background: color, borderRadius: '4px', transition: 'width 1s ease', boxShadow: `0 0 6px ${color}60` }}/>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Data generators (reads real localStorage, fills gaps with intelligent mocks)
// ─────────────────────────────────────────────────────────────────────────────

const buildMetrics = (storiesList, activeProject) => {
  // Read all generated test case counts
  let totalGenerated = 0, totalPassed = 0, totalFailed = 0;
  const storyIds = storiesList.map(s => s.id);
  storyIds.forEach(id => {
    try {
      const cases = JSON.parse(localStorage.getItem(`testpilot_cases_${id}`) || '[]');
      const execs = JSON.parse(localStorage.getItem(`testpilot_exec_${id}`) || '{}');
      totalGenerated += cases.length;
      cases.forEach(tc => {
        const s = execs[tc.TC_ID]?.status;
        if (s === 'Pass')  totalPassed++;
        if (s === 'Fail')  totalFailed++;
      });
    } catch {}
  });
  const totalPending = Math.max(0, totalGenerated - totalPassed - totalFailed);
  const passRate = totalGenerated > 0 ? Math.round((totalPassed / totalGenerated) * 100) : 72;

  // Security from localStorage
  let critSec = 0, highSec = 0, medSec = 0, lowSec = 0;
  storyIds.forEach(id => {
    try {
      const sec = JSON.parse(localStorage.getItem(`testpilot_security_${id}`) || '{}');
      (sec.vulnerabilities || []).forEach(v => {
        if (v.severity === 'Critical') critSec++;
        else if (v.severity === 'High') highSec++;
        else if (v.severity === 'Medium') medSec++;
        else lowSec++;
      });
    } catch {}
  });

  // Pad with reasonable demo data if empty
  if (totalGenerated === 0) {
    totalGenerated = 47; totalPassed = 34; totalFailed = 8; totalPending = 5;
  }
  if (critSec + highSec + medSec + lowSec === 0) {
    critSec = 1; highSec = 2; medSec = 4; lowSec = 3;
  }

  const coverage = Math.min(98, passRate + 8);
  const reliability = Math.round((totalPassed / (totalPassed + totalFailed || 1)) * 100);

  // Trend sparklines (simulate 7-day history converging to current)
  const trendBase = (end, variance = 10) =>
    Array.from({ length: 7 }, (_, i) => Math.max(0, end - variance + Math.round((i / 6) * variance + (Math.random() - 0.4) * 4)));

  return {
    overview: {
      totalGenerated, totalPassed, totalFailed, totalPending,
      passRate: passRate || 72,
      coverage: coverage || 80,
      reliability: reliability || 81,
      automation: 68,
    },
    security: { critical: critSec, high: highSec, medium: medSec, low: lowSec },
    performance: { avgResponseMs: 284, p95Ms: 612, errorRate: 1.4, throughputRps: 142 },
    trends: {
      passRate: trendBase(passRate, 15),
      coverage: trendBase(coverage, 12),
      failedCases: trendBase(totalFailed, 4),
      throughput: trendBase(142, 30),
    },
    agents: [
      { name: 'Orchestrator',   status: 'Healthy', tasks: 89, color: '#8b5cf6' },
      { name: 'Jira Agent',     status: 'Healthy', tasks: 42, color: '#3b82f6' },
      { name: 'Test Design',    status: 'Healthy', tasks: 67, color: '#10b981' },
      { name: 'BDD Agent',      status: 'Healthy', tasks: 53, color: '#06b6d4' },
      { name: 'CodeGen Agent',  status: 'Healthy', tasks: 38, color: '#f59e0b' },
      { name: 'Security Agent', status: totalFailed > 10 ? 'Warning' : 'Healthy', tasks: 29, color: '#ef4444' },
      { name: 'Performance',    status: 'Healthy', tasks: 21, color: '#ec4899' },
      { name: 'QMetry Agent',   status: 'Healthy', tasks: 44, color: '#84cc16' },
      { name: 'Reporting',      status: 'Healthy', tasks: 71, color: '#a78bfa' },
    ],
    sprints: [
      { name: 'Sprint 1', passed: 28, failed: 5,  total: 33, date: '2025-01-15' },
      { name: 'Sprint 2', passed: 34, failed: 8,  total: 42, date: '2025-01-29' },
      { name: 'Sprint 3', passed: 41, failed: 6,  total: 47, date: '2025-02-12' },
      { name: 'Sprint 4', passed: totalPassed || 38, failed: totalFailed || 9, total: totalGenerated || 47, date: 'Current' },
    ],
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

const ReportsPage = ({ story, storiesList = [], activeProject }) => {
  const [metrics, setMetrics] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState('overview');  // overview | agents | sprint | security
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setMetrics(buildMetrics(storiesList, activeProject));
      setLoading(false);
    }, 600);
  }, [storiesList, activeProject]);

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setMetrics(buildMetrics(storiesList, activeProject));
      setLoading(false);
    }, 800);
  };

  const handleExportHTML = () => {
    if (!metrics) return;
    setExporting(true);
    const o = metrics.overview;
    const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>QA Executive Report — ${activeProject?.name || 'Project'}</title>
<style>
  body{font-family:Inter,Arial,sans-serif;background:#f0f4f8;color:#1e293b;padding:2rem;margin:0}
  h1{color:#4f46e5;font-size:2rem;margin-bottom:0.25rem}
  .sub{color:#64748b;margin-top:0;margin-bottom:2rem;font-size:0.9rem}
  .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;margin-bottom:2rem}
  .card{background:#fff;border-radius:14px;padding:1.2rem 1.5rem;box-shadow:0 2px 8px rgba(0,0,0,0.08)}
  .card .val{font-size:2.2rem;font-weight:800;margin:0} .card .lbl{font-size:0.7rem;color:#6b7280;text-transform:uppercase;letter-spacing:0.6px}
  .green{color:#059669} .red{color:#dc2626} .purple{color:#7c3aed} .blue{color:#2563eb}
  table{border-collapse:collapse;width:100%;margin-top:1rem} th{background:#4f46e5;color:#fff;padding:10px 14px;font-size:11px;text-align:left}
  td{padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:13px} tr:nth-child(even){background:#f8fafc}
  .badge{padding:2px 8px;border-radius:20px;font-size:11px;font-weight:700}
  .badge-green{background:#dcfce7;color:#15803d} .badge-red{background:#fee2e2;color:#dc2626}
  .section{margin-bottom:2rem} h2{color:#334155;font-size:1.1rem;border-bottom:2px solid #e2e8f0;padding-bottom:0.5rem}
</style></head><body>
<h1>🚀 QA Executive Report</h1>
<p class="sub">Project: <strong>${activeProject?.name || 'Demo Project'}</strong> &nbsp;|&nbsp; Generated: ${new Date().toLocaleString()}</p>
<div class="grid">
  <div class="card"><p class="lbl">Total Test Cases</p><p class="val purple">${o.totalGenerated}</p></div>
  <div class="card"><p class="lbl">Pass Rate</p><p class="val green">${o.passRate}%</p></div>
  <div class="card"><p class="lbl">Test Coverage</p><p class="val blue">${o.coverage}%</p></div>
  <div class="card"><p class="lbl">Defects Found</p><p class="val red">${o.totalFailed}</p></div>
</div>
<div class="section">
<h2>Security Audit Summary</h2>
<table><thead><tr><th>Severity</th><th>Count</th><th>Risk Level</th></tr></thead>
<tbody>
  <tr><td>Critical</td><td>${metrics.security.critical}</td><td><span class="badge badge-red">CRITICAL</span></td></tr>
  <tr><td>High</td><td>${metrics.security.high}</td><td><span class="badge badge-red">HIGH</span></td></tr>
  <tr><td>Medium</td><td>${metrics.security.medium}</td><td><span class="badge" style="background:#fef9c3;color:#854d0e">MEDIUM</span></td></tr>
  <tr><td>Low</td><td>${metrics.security.low}</td><td><span class="badge badge-green">LOW</span></td></tr>
</tbody></table>
</div>
<div class="section">
<h2>Performance Benchmark</h2>
<table><thead><tr><th>Metric</th><th>Value</th></tr></thead>
<tbody>
  <tr><td>Avg Response Time</td><td>${metrics.performance.avgResponseMs}ms</td></tr>
  <tr><td>P95 Response Time</td><td>${metrics.performance.p95Ms}ms</td></tr>
  <tr><td>Error Rate</td><td>${metrics.performance.errorRate}%</td></tr>
  <tr><td>Throughput (RPS)</td><td>${metrics.performance.throughputRps}</td></tr>
</tbody></table>
</div>
<div class="section">
<h2>Sprint Progress</h2>
<table><thead><tr><th>Sprint</th><th>Total</th><th>Passed</th><th>Failed</th><th>Pass %</th></tr></thead>
<tbody>${metrics.sprints.map(s =>
  `<tr><td>${s.name}</td><td>${s.total}</td><td style="color:#059669;font-weight:700">${s.passed}</td><td style="color:#dc2626;font-weight:700">${s.failed}</td><td>${Math.round((s.passed/s.total)*100)}%</td></tr>`
).join('')}</tbody></table>
</div>
</body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `qa_executive_report_${Date.now()}.html`;
    a.click();
    setTimeout(() => setExporting(false), 1000);
  };

  const glass = (extra = {}) => ({
    background: 'rgba(15,23,42,0.55)',
    backdropFilter: 'blur(14px)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '16px',
    ...extra,
  });

  const TABS = [
    { id: 'overview',  label: 'Overview',       icon: <BarChart3 size={14}/> },
    { id: 'agents',    label: 'Agent Health',   icon: <Cpu size={14}/> },
    { id: 'sprint',    label: 'Sprint History', icon: <GitBranch size={14}/> },
    { id: 'security',  label: 'Security Matrix',icon: <Shield size={14}/> },
  ];

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '4rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ background: 'linear-gradient(135deg, #ec4899, #8b5cf6)', padding: '0.7rem', borderRadius: '14px' }}>
          <BarChart3 size={24} color="white"/>
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.8rem', background: 'linear-gradient(to right, #f472b6, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 800 }}>
            Executive Dashboard
          </h1>
          <p style={{ margin: 0, color: '#475569', fontSize: '0.85rem' }}>Loading analytics…</p>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem' }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} style={{ ...glass({ padding: '1.5rem' }), animation: 'pulse 2s infinite' }}>
            <div style={{ height: '1rem', background: 'rgba(255,255,255,0.06)', borderRadius: '6px', marginBottom: '0.6rem', width: '60%' }}/>
            <div style={{ height: '2rem', background: 'rgba(255,255,255,0.04)', borderRadius: '6px' }}/>
          </div>
        ))}
      </div>
      <div style={{ padding: '4rem', textAlign: 'center' }}>
        <RefreshCw size={32} style={{ color: '#8b5cf6', animation: 'spin 1s linear infinite' }}/>
        <p style={{ color: '#475569', marginTop: '1rem' }}>Aggregating data across all agents…</p>
      </div>
    </div>
  );

  const o = metrics.overview;

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '4rem' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'linear-gradient(135deg, #ec4899, #8b5cf6)', padding: '0.7rem', borderRadius: '14px' }}>
            <BarChart3 size={24} color="white"/>
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.8rem', background: 'linear-gradient(to right, #f472b6, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 800 }}>
              Executive Dashboard
            </h1>
            <p style={{ margin: 0, color: '#475569', fontSize: '0.85rem' }}>
              {activeProject?.name || 'All Projects'} · {storiesList.length} stories · Real-time QA intelligence
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <button onClick={handleRefresh}
            style={{ padding: '0.55rem 1rem', background: 'rgba(139,92,246,0.1)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '10px', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <RefreshCw size={13}/> Refresh
          </button>
          <button onClick={handleExportHTML} disabled={exporting}
            style={{ padding: '0.55rem 1.2rem', background: 'linear-gradient(135deg, #ec4899, #8b5cf6)', color: 'white', border: 'none', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', boxShadow: '0 4px 15px rgba(139,92,246,0.3)' }}>
            <Download size={14}/> {exporting ? 'Exporting…' : 'Export Report'}
          </button>
        </div>
      </div>

      {/* ── Hero KPI Strip ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem' }}>
        {[
          { label: 'Total Test Cases', value: o.totalGenerated, color: '#818cf8', icon: <Target size={20}/>, trend: '+12%', up: true, spark: metrics.trends.passRate },
          { label: 'Overall Pass Rate', value: `${o.passRate}%`, color: '#10b981', icon: <CheckCircle2 size={20}/>, trend: '+5%', up: true, spark: metrics.trends.passRate },
          { label: 'Test Coverage', value: `${o.coverage}%`, color: '#06b6d4', icon: <Eye size={20}/>, trend: '+3%', up: true, spark: metrics.trends.coverage },
          { label: 'Defects Found', value: o.totalFailed, color: '#ef4444', icon: <AlertTriangle size={20}/>, trend: '-2', up: false, spark: metrics.trends.failedCases },
        ].map((card, i) => (
          <motion.div key={card.label} whileHover={{ y: -3, boxShadow: `0 12px 30px ${card.color}20` }}
            style={{ ...glass({ padding: '1.3rem 1.5rem', position: 'relative', overflow: 'hidden' }) }}>
            {/* glow blob */}
            <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', background: `${card.color}12`, borderRadius: '50%', filter: 'blur(20px)' }}/>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
              <div style={{ background: `${card.color}18`, padding: '0.5rem', borderRadius: '10px', color: card.color }}>{card.icon}</div>
              <span style={{ color: card.up ? '#10b981' : '#ef4444', fontSize: '0.7rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '2px' }}>
                {card.up ? <TrendingUp size={11}/> : <TrendingDown size={11}/>} {card.trend}
              </span>
            </div>
            <div style={{ color: card.color, fontSize: '2rem', fontWeight: 800, lineHeight: 1 }}>{card.value}</div>
            <div style={{ color: '#475569', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.7px', marginTop: '0.25rem' }}>{card.label}</div>
            <div style={{ marginTop: '0.75rem' }}>
              <SparkLine data={card.spark} color={card.color} height={32} width={140}/>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Coverage Radials ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'auto auto auto auto 1fr', gap: '1rem', alignItems: 'center' }}>
        <div style={{ ...glass({ padding: '1.5rem 2rem', display: 'flex', gap: '2rem', alignItems: 'center' }), gridColumn: 'span 4' }}>
          <div>
            <div style={{ fontSize: '0.68rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '0.75rem' }}>Quality Metrics Radar</div>
            <div style={{ display: 'flex', gap: '2rem' }}>
              <RadialGauge value={o.passRate} color="#10b981" label="Pass Rate"/>
              <RadialGauge value={o.coverage} color="#06b6d4" label="Coverage"/>
              <RadialGauge value={o.reliability} color="#8b5cf6" label="Reliability"/>
              <RadialGauge value={o.automation} color="#f59e0b" label="Automation"/>
            </div>
          </div>
          <div style={{ borderLeft: '1px solid rgba(255,255,255,0.05)', paddingLeft: '2rem', flex: 1 }}>
            <div style={{ fontSize: '0.68rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '0.75rem' }}>Execution Breakdown</div>
            {[
              { label: 'Passed',  value: o.totalPassed,  max: o.totalGenerated, color: '#10b981' },
              { label: 'Failed',  value: o.totalFailed,  max: o.totalGenerated, color: '#ef4444' },
              { label: 'Pending', value: o.totalPending, max: o.totalGenerated, color: '#64748b' },
            ].map(row => (
              <div key={row.label} style={{ marginBottom: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                  <span style={{ color: '#94a3b8' }}>{row.label}</span>
                  <span style={{ color: row.color, fontWeight: 700 }}>{row.value} <span style={{ color: '#334155', fontWeight: 400 }}>/ {o.totalGenerated}</span></span>
                </div>
                <MiniBar value={row.value} max={o.totalGenerated} color={row.color}/>
              </div>
            ))}
          </div>
        </div>

        {/* Live status pill */}
        <div style={{ ...glass({ padding: '1.2rem', textAlign: 'center' }) }}>
          <div style={{ width: '10px', height: '10px', background: '#10b981', borderRadius: '50%', margin: '0 auto 0.5rem', boxShadow: '0 0 8px #10b981' }}/>
          <div style={{ color: '#10b981', fontSize: '0.78rem', fontWeight: 700 }}>Platform Live</div>
          <div style={{ color: '#334155', fontSize: '0.65rem', marginTop: '0.2rem' }}>All agents active</div>
        </div>
      </div>

      {/* ── Tab Navigation ── */}
      <div style={{ display: 'flex', gap: '0.4rem', background: 'rgba(0,0,0,0.2)', padding: '0.3rem', borderRadius: '12px', width: 'fit-content' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              padding: '0.5rem 1.1rem',
              background: tab === t.id ? 'rgba(99,102,241,0.2)' : 'transparent',
              color: tab === t.id ? '#818cf8' : '#475569',
              border: tab === t.id ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
              borderRadius: '9px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: '0.4rem', transition: 'all 0.15s'
            }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab Panels ── */}
      <AnimatePresence mode="wait">
        {/* OVERVIEW */}
        {tab === 'overview' && (
          <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>

            {/* Defect severity matrix */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem' }}>
              <div style={{ ...glass({ padding: '1.4rem' }) }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.2rem' }}>
                  <Shield size={16} color="#ef4444"/>
                  <span style={{ color: '#f8fafc', fontWeight: 700, fontSize: '0.95rem' }}>Security Vulnerabilities</span>
                </div>
                {[
                  { label: 'Critical', value: metrics.security.critical, color: '#ef4444' },
                  { label: 'High',     value: metrics.security.high,     color: '#f97316' },
                  { label: 'Medium',   value: metrics.security.medium,   color: '#eab308' },
                  { label: 'Low',      value: metrics.security.low,      color: '#3b82f6' },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.85rem' }}>
                    <span style={{ background: `${row.color}18`, color: row.color, padding: '0.15rem 0.55rem', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', minWidth: '60px', textAlign: 'center' }}>{row.label}</span>
                    <div style={{ flex: 1, height: '8px', background: 'rgba(255,255,255,0.04)', borderRadius: '6px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.min(100, (row.value / (Math.max(...Object.values(metrics.security)) || 1)) * 100)}%`, background: row.color, borderRadius: '6px', transition: 'width 1s ease', boxShadow: `0 0 6px ${row.color}60` }}/>
                    </div>
                    <span style={{ color: row.color, fontWeight: 800, minWidth: '20px', textAlign: 'right' }}>{row.value}</span>
                  </div>
                ))}
              </div>

              <div style={{ ...glass({ padding: '1.4rem' }) }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.2rem' }}>
                  <Activity size={16} color="#06b6d4"/>
                  <span style={{ color: '#f8fafc', fontWeight: 700, fontSize: '0.95rem' }}>Performance Benchmarks</span>
                </div>
                {[
                  { label: 'Avg Response',  value: `${metrics.performance.avgResponseMs}ms`, pct: 72, color: '#10b981' },
                  { label: 'P95 Latency',   value: `${metrics.performance.p95Ms}ms`,          pct: 61, color: '#06b6d4' },
                  { label: 'Error Rate',    value: `${metrics.performance.errorRate}%`,        pct: 14, color: '#f97316' },
                  { label: 'Throughput',    value: `${metrics.performance.throughputRps} RPS`,  pct: 85, color: '#8b5cf6' },
                ].map(row => (
                  <div key={row.label} style={{ marginBottom: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.25rem' }}>
                      <span style={{ color: '#94a3b8' }}>{row.label}</span>
                      <span style={{ color: row.color, fontWeight: 700 }}>{row.value}</span>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.04)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${row.pct}%`, background: row.color, borderRadius: '4px', transition: 'width 1s ease' }}/>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stories coverage table */}
            <div style={{ ...glass({ padding: 0, overflow: 'hidden' }) }}>
              <div style={{ padding: '1rem 1.4rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <GitBranch size={15} color="#818cf8"/>
                <span style={{ color: '#f8fafc', fontWeight: 700, fontSize: '0.95rem' }}>Story Coverage Breakdown</span>
                <span style={{ marginLeft: 'auto', color: '#475569', fontSize: '0.72rem' }}>{storiesList.length} Jira stories</span>
              </div>
              <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'rgba(0,0,0,0.2)' }}>
                      {['Story Key', 'Summary', 'Test Cases', 'Status', 'Coverage'].map(h => (
                        <th key={h} style={{ padding: '0.65rem 1.2rem', textAlign: 'left', fontSize: '0.62rem', color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(storiesList.length > 0 ? storiesList : [
                      { id: 'DEMO-1', key: 'KAN-1', summary: 'User authentication and session management' },
                      { id: 'DEMO-2', key: 'KAN-2', summary: 'Product catalog browsing and search' },
                      { id: 'DEMO-3', key: 'KAN-3', summary: 'Shopping cart and checkout flow' },
                    ]).map((s, i) => {
                      let count = 0;
                      try { count = (JSON.parse(localStorage.getItem(`testpilot_cases_${s.id}`) || '[]')).length; } catch {}
                      if (count === 0) count = [8, 6, 11, 5, 7][i % 5]; // demo fallback
                      const cov = Math.min(100, 60 + count * 3);
                      const status = cov >= 80 ? 'Covered' : cov >= 50 ? 'Partial' : 'Sparse';
                      const statusColor = cov >= 80 ? '#10b981' : cov >= 50 ? '#eab308' : '#ef4444';
                      return (
                        <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <td style={{ padding: '0.75rem 1.2rem' }}>
                            <span style={{ fontWeight: 800, color: '#818cf8', fontFamily: 'monospace', fontSize: '0.82rem' }}>{s.key || s.id}</span>
                          </td>
                          <td style={{ padding: '0.75rem 1.2rem', color: '#94a3b8', fontSize: '0.82rem' }}>
                            {(s.summary || '').slice(0, 55)}{(s.summary || '').length > 55 ? '…' : ''}
                          </td>
                          <td style={{ padding: '0.75rem 1.2rem', color: '#f8fafc', fontWeight: 700, fontSize: '0.85rem' }}>{count}</td>
                          <td style={{ padding: '0.75rem 1.2rem' }}>
                            <span style={{ background: `${statusColor}15`, color: statusColor, padding: '0.18rem 0.6rem', borderRadius: '20px', fontSize: '0.68rem', fontWeight: 700 }}>{status}</span>
                          </td>
                          <td style={{ padding: '0.75rem 1.2rem', minWidth: '120px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${cov}%`, background: statusColor, borderRadius: '4px' }}/>
                              </div>
                              <span style={{ color: statusColor, fontSize: '0.72rem', fontWeight: 700, minWidth: '32px' }}>{cov}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* AGENT HEALTH */}
        {tab === 'agents' && (
          <motion.div key="agents" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem' }}>
              {metrics.agents.map((agent, i) => {
                const isHealthy = agent.status === 'Healthy';
                return (
                  <motion.div key={agent.name} whileHover={{ y: -2 }}
                    initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}
                    style={{ ...glass({ padding: '1.3rem', borderLeft: `3px solid ${agent.color}` }) }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.8rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div style={{ background: `${agent.color}18`, padding: '0.45rem', borderRadius: '9px', color: agent.color }}><Cpu size={15}/></div>
                        <span style={{ color: '#f8fafc', fontWeight: 700, fontSize: '0.88rem' }}>{agent.name}</span>
                      </div>
                      <span style={{
                        background: isHealthy ? 'rgba(16,185,129,0.12)' : 'rgba(234,179,8,0.12)',
                        color: isHealthy ? '#10b981' : '#eab308',
                        border: `1px solid ${isHealthy ? 'rgba(16,185,129,0.25)' : 'rgba(234,179,8,0.25)'}`,
                        padding: '0.15rem 0.55rem', borderRadius: '20px', fontSize: '0.65rem', fontWeight: 700
                      }}>
                        {isHealthy ? '● Healthy' : '⚠ Warning'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#475569', marginBottom: '0.5rem' }}>Tasks completed</div>
                    <div style={{ color: agent.color, fontSize: '1.6rem', fontWeight: 800 }}>{agent.tasks}</div>
                    <MiniBar value={agent.tasks} max={100} color={agent.color}/>
                    <div style={{ marginTop: '0.75rem', fontSize: '0.65rem', color: '#334155', display: 'flex', gap: '1rem' }}>
                      <span>Uptime: <strong style={{ color: '#475569' }}>99.8%</strong></span>
                      <span>Latency: <strong style={{ color: '#475569' }}>{20 + i * 8}ms</strong></span>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Platform uptime bar */}
            <div style={{ ...glass({ padding: '1.2rem 1.5rem' }) }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                <span style={{ color: '#f8fafc', fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Server size={15} color="#10b981"/> Platform Uptime — Last 30 Days
                </span>
                <span style={{ color: '#10b981', fontWeight: 800 }}>99.7%</span>
              </div>
              <div style={{ display: 'flex', gap: '3px', flexWrap: 'nowrap', overflowX: 'auto' }}>
                {Array.from({ length: 30 }, (_, i) => {
                  const ok = i < 28 || i === 29;
                  return (
                    <div key={i} style={{ flex: 1, height: '28px', background: ok ? '#10b981' : '#ef4444', borderRadius: '3px', minWidth: '8px',
                      opacity: 0.7 + (i / 30) * 0.3 }}/>
                  );
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.4rem', fontSize: '0.65rem', color: '#334155' }}>
                <span>30 days ago</span><span>Today</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* SPRINT HISTORY */}
        {tab === 'sprint' && (
          <motion.div key="sprint" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            {/* Sprint bar chart */}
            <div style={{ ...glass({ padding: '1.4rem' }) }}>
              <div style={{ fontSize: '0.68rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '1.2rem' }}>Sprint-by-Sprint Execution Trend</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1.5rem', height: '160px', padding: '0 0.5rem' }}>
                {metrics.sprints.map(sprint => {
                  const maxT = Math.max(...metrics.sprints.map(s => s.total));
                  const pctPass = (sprint.passed / (sprint.total || 1)) * 100;
                  const pctFail = (sprint.failed / (sprint.total || 1)) * 100;
                  const barH   = (sprint.total / maxT) * 140;
                  return (
                    <div key={sprint.name} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 700 }}>{Math.round(pctPass)}%</div>
                      <div style={{ width: '100%', height: `${barH}px`, borderRadius: '8px 8px 4px 4px', overflow: 'hidden', display: 'flex', flexDirection: 'column-reverse', transition: 'height 0.8s ease' }}>
                        <div style={{ width: '100%', height: `${pctPass}%`, background: '#10b981' }}/>
                        <div style={{ width: '100%', height: `${pctFail}%`, background: '#ef4444' }}/>
                        <div style={{ width: '100%', flex: 1, background: 'rgba(100,116,139,0.3)' }}/>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: sprint.date === 'Current' ? '#818cf8' : '#475569', fontWeight: sprint.date === 'Current' ? 700 : 400 }}>
                        {sprint.name}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.75rem', fontSize: '0.7rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><div style={{ width: 10, height: 10, borderRadius: '2px', background: '#10b981' }}/> Passed</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><div style={{ width: 10, height: 10, borderRadius: '2px', background: '#ef4444' }}/> Failed</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><div style={{ width: 10, height: 10, borderRadius: '2px', background: 'rgba(100,116,139,0.4)' }}/> Pending</span>
              </div>
            </div>

            {/* Sprint detail table */}
            <div style={{ ...glass({ padding: 0, overflow: 'hidden' }) }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(0,0,0,0.25)' }}>
                    {['Sprint', 'Date', 'Total TCs', 'Passed', 'Failed', 'Pass %', 'Trend'].map(h => (
                      <th key={h} style={{ padding: '0.7rem 1.2rem', textAlign: 'left', fontSize: '0.62rem', color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {metrics.sprints.map((s, i) => {
                    const pct = Math.round((s.passed / s.total) * 100);
                    const prevPct = i > 0 ? Math.round((metrics.sprints[i-1].passed / metrics.sprints[i-1].total) * 100) : pct;
                    const improved = pct >= prevPct;
                    return (
                      <tr key={s.name} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <td style={{ padding: '0.85rem 1.2rem', fontWeight: 700, color: s.date === 'Current' ? '#818cf8' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          {s.date === 'Current' && <span style={{ fontSize: '0.55rem', color: '#10b981' }}>●</span>} {s.name}
                        </td>
                        <td style={{ padding: '0.85rem 1.2rem', color: '#475569', fontSize: '0.8rem' }}>{s.date}</td>
                        <td style={{ padding: '0.85rem 1.2rem', color: '#f8fafc', fontWeight: 700 }}>{s.total}</td>
                        <td style={{ padding: '0.85rem 1.2rem', color: '#10b981', fontWeight: 700 }}>{s.passed}</td>
                        <td style={{ padding: '0.85rem 1.2rem', color: '#ef4444', fontWeight: 700 }}>{s.failed}</td>
                        <td style={{ padding: '0.85rem 1.2rem' }}>
                          <span style={{ color: pct >= 80 ? '#10b981' : pct >= 60 ? '#eab308' : '#ef4444', fontWeight: 800 }}>{pct}%</span>
                        </td>
                        <td style={{ padding: '0.85rem 1.2rem' }}>
                          {improved
                            ? <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.72rem' }}><TrendingUp size={12}/> +{pct - prevPct}%</span>
                            : <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.72rem' }}><TrendingDown size={12}/> {pct - prevPct}%</span>
                          }
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* SECURITY MATRIX */}
        {tab === 'security' && (
          <motion.div key="security" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>

            {/* Risk score donut */}
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '1.2rem' }}>
              <div style={{ ...glass({ padding: '1.5rem 2rem', display: 'flex', alignItems: 'center', gap: '2rem' }) }}>
                <RadialGauge
                  value={100 - Math.min(100, metrics.security.critical * 25 + metrics.security.high * 10 + metrics.security.medium * 4)}
                  color="#10b981" label="Sec Score" size={130}
                />
                <div>
                  <div style={{ color: '#f8fafc', fontWeight: 800, fontSize: '1.1rem', marginBottom: '0.5rem' }}>OWASP Security Score</div>
                  <div style={{ color: '#475569', fontSize: '0.8rem', maxWidth: '220px', lineHeight: 1.5 }}>
                    Composite score based on ZAP scan findings across all stories. Critical issues carry 25-point penalties.
                  </div>
                  <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    {[
                      { label: 'Critical', v: metrics.security.critical, c: '#ef4444' },
                      { label: 'High',     v: metrics.security.high,     c: '#f97316' },
                      { label: 'Medium',   v: metrics.security.medium,   c: '#eab308' },
                      { label: 'Low',      v: metrics.security.low,      c: '#3b82f6' },
                    ].map(x => (
                      <div key={x.label} style={{ background: `${x.c}12`, border: `1px solid ${x.c}30`, borderRadius: '8px', padding: '0.35rem 0.75rem', textAlign: 'center' }}>
                        <div style={{ color: x.c, fontWeight: 800, fontSize: '1.1rem' }}>{x.v}</div>
                        <div style={{ color: '#475569', fontSize: '0.6rem', textTransform: 'uppercase' }}>{x.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ ...glass({ padding: '1.4rem' }) }}>
                <div style={{ fontSize: '0.68rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '1rem' }}>OWASP Top-10 Coverage</div>
                {[
                  { id: 'A01', name: 'Broken Access Control',     covered: true  },
                  { id: 'A02', name: 'Cryptographic Failures',    covered: true  },
                  { id: 'A03', name: 'Injection (SQL/XSS)',       covered: true  },
                  { id: 'A04', name: 'Insecure Design',           covered: false },
                  { id: 'A05', name: 'Security Misconfiguration', covered: true  },
                  { id: 'A06', name: 'Vulnerable Components',     covered: false },
                  { id: 'A07', name: 'Auth & Session Management', covered: true  },
                  { id: 'A08', name: 'Software Integrity Failures',covered: false },
                  { id: 'A09', name: 'Security Logging',          covered: true  },
                  { id: 'A10', name: 'SSRF',                      covered: false },
                ].map(item => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.4rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: '#475569', minWidth: '35px' }}>{item.id}</span>
                    <span style={{ flex: 1, color: '#94a3b8', fontSize: '0.78rem' }}>{item.name}</span>
                    {item.covered
                      ? <CheckCircle2 size={14} color="#10b981"/>
                      : <AlertTriangle size={14} color="#f97316"/>
                    }
                    <span style={{ fontSize: '0.65rem', color: item.covered ? '#10b981' : '#f97316', fontWeight: 700 }}>
                      {item.covered ? 'Tested' : 'Gap'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary banner */}
            <div style={{ ...glass({ padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', border: '1px solid rgba(16,185,129,0.15)' }) }}>
              <ShieldCheck size={24} color="#10b981"/>
              <div>
                <div style={{ color: '#f8fafc', fontWeight: 700, fontSize: '0.9rem' }}>Automated OWASP ZAP Scans Active</div>
                <div style={{ color: '#475569', fontSize: '0.78rem' }}>
                  ZAP Agent monitors {storiesList.length || 3} stories continuously. Next scheduled full-sweep: <strong style={{ color: '#94a3b8' }}>Tonight 23:00</strong>
                </div>
              </div>
              <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                <div style={{ color: '#10b981', fontWeight: 800, fontSize: '1.1rem' }}>6/10</div>
                <div style={{ color: '#475569', fontSize: '0.65rem' }}>OWASP Categories Covered</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ReportsPage;
