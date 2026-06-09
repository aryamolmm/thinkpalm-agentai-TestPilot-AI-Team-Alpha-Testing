import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, XCircle, Clock, Save, MessageSquare,
  AlertCircle, RefreshCw, Upload, Filter, Search,
  ChevronDown, ChevronRight, Zap, Link2, CheckCheck,
  ClipboardList, BarChart2, Shield
} from 'lucide-react';
import axios from 'axios';
import { getQMetrySettings } from '../services/settingsService';

const STATUSES = ['Not Run', 'Pass', 'Fail', 'Blocked', 'Skipped'];

const STATUS_META = {
  'Pass':     { color: '#10b981', bg: 'rgba(16,185,129,0.12)', icon: <CheckCircle2 size={14}/> },
  'Fail':     { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  icon: <XCircle size={14}/> },
  'Blocked':  { color: '#f97316', bg: 'rgba(249,115,22,0.12)', icon: <Shield size={14}/> },
  'Skipped':  { color: '#eab308', bg: 'rgba(234,179,8,0.12)',  icon: <ChevronRight size={14}/> },
  'Not Run':  { color: '#64748b', bg: 'rgba(100,116,139,0.12)',icon: <Clock size={14}/> },
};

// ── Donut chart SVG ──────────────────────────────────────────────────────────
const DonutRing = ({ passed, failed, blocked, skipped, total }) => {
  const r = 42, cx = 50, cy = 50;
  const circ = 2 * Math.PI * r;
  const segments = [
    { value: passed,  color: '#10b981' },
    { value: failed,  color: '#ef4444' },
    { value: blocked, color: '#f97316' },
    { value: skipped, color: '#eab308' },
  ];
  let offset = 0;
  const arcs = segments.map(seg => {
    const frac = total > 0 ? seg.value / total : 0;
    const len  = frac * circ;
    const arc  = { color: seg.color, dashArray: `${len} ${circ - len}`, dashOffset: -offset };
    offset += len;
    return arc;
  });
  const pct = total > 0 ? Math.round((passed / total) * 100) : 0;
  return (
    <svg viewBox="0 0 100 100" width="120" height="120">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12"/>
      {arcs.map((arc, i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill="none"
          stroke={arc.color} strokeWidth="12"
          strokeDasharray={arc.dashArray}
          strokeDashoffset={arc.dashOffset}
          strokeLinecap="butt"
          transform="rotate(-90 50 50)"
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
      ))}
      <text x="50" y="46" textAnchor="middle" fill="#f8fafc" fontSize="14" fontWeight="800">{pct}%</text>
      <text x="50" y="58" textAnchor="middle" fill="#64748b" fontSize="7" fontWeight="600">PASS RATE</text>
    </svg>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const ManualExecutionPage = ({ story, credentials, activeProject }) => {
  const [testCases,   setTestCases]   = useState([]);
  const [results,     setResults]     = useState({});   // { TC_ID: { status, comment, synced } }
  const [saving,      setSaving]      = useState({});   // { TC_ID: true/false }
  const [bulkSyncing, setBulkSyncing] = useState(false);
  const [search,      setSearch]      = useState('');
  const [filter,      setFilter]      = useState('all');
  const [expandedId,  setExpandedId]  = useState(null);
  const [notification, setNotification] = useState(null);
  const [syncLog,     setSyncLog]     = useState([]);
  const [showLog,     setShowLog]     = useState(false);

  // ── Load test cases from localStorage ──────────────────────────────────────
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(`testpilot_cases_${story?.id}`) || '[]');
    setTestCases(saved);

    // Load persisted execution results
    const storedResults = JSON.parse(localStorage.getItem(`testpilot_exec_${story?.id}`) || '{}');
    setResults(storedResults);
  }, [story?.id]);

  // ── Persist results on change ───────────────────────────────────────────────
  useEffect(() => {
    if (story?.id && Object.keys(results).length > 0) {
      localStorage.setItem(`testpilot_exec_${story.id}`, JSON.stringify(results));
    }
  }, [results, story?.id]);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = useCallback(() => {
    let pass = 0, fail = 0, blocked = 0, skipped = 0;
    testCases.forEach(tc => {
      const s = results[tc.TC_ID]?.status;
      if (s === 'Pass')    pass++;
      if (s === 'Fail')    fail++;
      if (s === 'Blocked') blocked++;
      if (s === 'Skipped') skipped++;
    });
    const notRun = testCases.length - (pass + fail + blocked + skipped);
    return { total: testCases.length, pass, fail, blocked, skipped, notRun };
  }, [testCases, results])();

  // ── Filtered rows ──────────────────────────────────────────────────────────
  const visibleCases = testCases.filter(tc => {
    const s = results[tc.TC_ID]?.status || 'Not Run';
    const matchFilter = filter === 'all' || s.toLowerCase() === filter.toLowerCase();
    const q = search.toLowerCase();
    const matchSearch = !q || (tc.TC_ID || '').toLowerCase().includes(q) ||
      (tc.Scenario_Name || tc.Scenario || '').toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  // ── Notify helper ──────────────────────────────────────────────────────────
  const notify = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const getProxyUrl = () => window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://127.0.0.1:3001' 
    : window.location.origin;

  const performRealSync = async (executionsList) => {
    let settings = null;
    if (activeProject && activeProject.qmetryEnabled && activeProject.qmetryBaseUrl && activeProject.qmetryApiToken) {
      settings = {
        qmetryBaseUrl: activeProject.qmetryBaseUrl,
        apiToken: activeProject.qmetryApiToken,
        projectId: activeProject.qmetryProjectId
      };
    } else {
      settings = getQMetrySettings();
    }

    if (!settings || !settings.qmetryBaseUrl || !settings.apiToken) {
      throw new Error("QMetry settings are incomplete. Please configure them in active Project settings or global Settings.");
    }

    const PROXY_URL = getProxyUrl();
    const response = await axios.post(`${PROXY_URL}/api/qmetry/sync-executions`, {
      settings,
      jiraKey: story?.key,
      executions: executionsList,
      // Pass sprint info so QMetry can attach results to the correct sprint cycle
      sprintId: story?.sprintId || null,
      sprintName: story?.sprintName || null
    });
    return response.data;
  };

  // ── Save single row ────────────────────────────────────────────────────────
  const handleSave = async (tcId) => {
    try {
      setSaving(p => ({ ...p, [tcId]: true }));
      const tc = testCases.find(t => t.TC_ID === tcId);
      const res = results[tcId] || {};
      
      const payload = {
        tcId: tc.TC_ID,
        name: tc.Scenario_Name || tc.Scenario || tc.TC_ID,
        status: res.status || 'Not Run',
        comment: res.comment || '',
        qmetryId: tc.qmetryId
      };

      const syncResult = await performRealSync([payload]);
      
      setResults(p => ({ 
        ...p, 
        [tcId]: { 
          ...p[tcId], 
          synced: true, 
          syncedAt: new Date().toISOString() 
        } 
      }));

      const trackingId = syncResult.trackingId || 'N/A';
      const logLine = `[${new Date().toLocaleTimeString()}] ✅ Synced ${tcId} → QMetry | Status: ${res.status || 'Not Run'} | Tracking ID: ${trackingId}`;
      setSyncLog(p => [logLine, ...p].slice(0, 50));
      notify(`${tcId} synced to QMetry successfully`);
    } catch (err) {
      const errMsg = err.response?.data?.details?.errorMessage || 
                     err.response?.data?.error || 
                     err.message;
      alert(`Sync failed: ${errMsg}`);
    } finally {
      setSaving(p => ({ ...p, [tcId]: false }));
    }
  };

  // ── Bulk sync all ──────────────────────────────────────────────────────────
  const handleBulkSync = async () => {
    try {
      setBulkSyncing(true);
      const executionsList = testCases.map(tc => {
        const res = results[tc.TC_ID] || {};
        return {
          tcId: tc.TC_ID,
          name: tc.Scenario_Name || tc.Scenario || tc.TC_ID,
          status: res.status || 'Not Run',
          comment: res.comment || '',
          qmetryId: tc.qmetryId
        };
      });

      const syncResult = await performRealSync(executionsList);
      
      const updatedResults = { ...results };
      testCases.forEach(tc => {
        updatedResults[tc.TC_ID] = {
          ...updatedResults[tc.TC_ID],
          synced: true,
          syncedAt: new Date().toISOString()
        };
      });
      setResults(updatedResults);

      const trackingId = syncResult.trackingId || 'N/A';
      const logLine = `[${new Date().toLocaleTimeString()}] 🔄 Bulk Synced all test cases → QMetry | Tracking ID: ${trackingId}`;
      setSyncLog(p => [logLine, ...p].slice(0, 100));
      notify(`All ${testCases.length} test cases synced to QMetry!`);
      setShowLog(true);
    } catch (err) {
      const errMsg = err.response?.data?.details?.errorMessage || 
                     err.response?.data?.error || 
                     err.message;
      alert(`Bulk sync failed: ${errMsg}`);
    } finally {
      setBulkSyncing(false);
    }
  };

  // ── Update a field ─────────────────────────────────────────────────────────
  const setField = (tcId, field, value) => {
    setResults(p => ({ ...p, [tcId]: { ...p[tcId], [field]: value, synced: false } }));
  };

  // ── Glass card style ───────────────────────────────────────────────────────
  const glass = (extra = {}) => ({
    background: 'rgba(15,23,42,0.55)',
    backdropFilter: 'blur(14px)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '16px',
    ...extra
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '4rem' }}
    >
      {/* ── Toast Notification ── */}
      <AnimatePresence>
        {notification && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            style={{
              position: 'fixed', top: '1.5rem', right: '2rem', zIndex: 9999,
              background: notification.type === 'success' ? 'rgba(16,185,129,0.95)' : 'rgba(239,68,68,0.95)',
              color: 'white', padding: '0.75rem 1.5rem', borderRadius: '12px',
              fontSize: '0.85rem', fontWeight: 600, boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
              display: 'flex', alignItems: 'center', gap: '0.5rem'
            }}
          >
            <CheckCheck size={16} /> {notification.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'linear-gradient(135deg, #10b981, #059669)', padding: '0.7rem', borderRadius: '14px' }}>
            <ClipboardList size={24} color="white" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.8rem', background: 'linear-gradient(to right, #34d399, #10b981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 800 }}>
              Manual Testing & QMetry
            </h1>
            <p style={{ color: '#64748b', margin: '0.15rem 0 0', fontSize: '0.85rem' }}>
              Story: <strong style={{ color: '#94a3b8' }}>{story?.key || '—'}</strong>
              {' · '}{story?.summary?.slice(0, 55)}{story?.summary?.length > 55 ? '…' : ''}
            </p>
            {story?.sprintName && (
              <div style={{ marginTop: '0.35rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                background: story.sprintState === 'active' ? 'rgba(16,185,129,0.12)' : 'rgba(99,102,241,0.12)',
                border: `1px solid ${story.sprintState === 'active' ? 'rgba(16,185,129,0.3)' : 'rgba(99,102,241,0.3)'}`,
                borderRadius: '20px', padding: '0.2rem 0.7rem', fontSize: '0.72rem', fontWeight: 600,
                color: story.sprintState === 'active' ? '#34d399' : '#818cf8' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }}/>
                {story.sprintName}
                {story.sprintState === 'active' && <span style={{ opacity: 0.7 }}>(Active)</span>}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowLog(p => !p)}
            style={{ padding: '0.55rem 1rem', background: 'rgba(99,102,241,0.1)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '10px', fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <BarChart2 size={14} /> {showLog ? 'Hide' : 'View'} Sync Log
          </button>
          <button
            onClick={handleBulkSync}
            disabled={bulkSyncing || testCases.length === 0}
            style={{ padding: '0.55rem 1.2rem', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 700, cursor: bulkSyncing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', boxShadow: '0 4px 15px rgba(16,185,129,0.3)', opacity: bulkSyncing ? 0.7 : 1 }}
          >
            {bulkSyncing
              ? <><RefreshCw size={14} className="spin-icon" /> Syncing All…</>
              : <><Upload size={14} /> Sync All to QMetry</>
            }
          </button>
        </div>
      </div>

      {/* ── KPI Cards + Donut ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: '1rem', alignItems: 'stretch' }}>
        {[
          { label: 'Total Cases', value: stats.total, color: '#818cf8', icon: <MessageSquare size={18}/> },
          { label: 'Passed',      value: stats.pass,  color: '#10b981', icon: <CheckCircle2 size={18}/> },
          { label: 'Failed',      value: stats.fail,  color: '#ef4444', icon: <XCircle size={18}/> },
          { label: 'Not Run',     value: stats.notRun,color: '#64748b', icon: <Clock size={18}/> },
        ].map(card => (
          <motion.div key={card.label} whileHover={{ y: -2 }}
            style={{ ...glass({ padding: '1.2rem', display: 'flex', alignItems: 'center', gap: '1rem' }) }}>
            <div style={{ background: `${card.color}18`, padding: '10px', borderRadius: '12px', color: card.color }}>{card.icon}</div>
            <div>
              <div style={{ color: '#475569', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{card.label}</div>
              <div style={{ color: card.color, fontSize: '1.6rem', fontWeight: 800 }}>{card.value}</div>
            </div>
          </motion.div>
        ))}

        {/* Donut */}
        <div style={{ ...glass({ padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1.2rem' }) }}>
          <DonutRing passed={stats.pass} failed={stats.fail} blocked={stats.blocked} skipped={stats.skipped} total={stats.total} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {[
              { label: 'Pass',    color: '#10b981', v: stats.pass },
              { label: 'Fail',    color: '#ef4444', v: stats.fail },
              { label: 'Blocked', color: '#f97316', v: stats.blocked },
              { label: 'Skipped', color: '#eab308', v: stats.skipped },
            ].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.72rem' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: l.color }}/>
                <span style={{ color: '#64748b' }}>{l.label}</span>
                <span style={{ color: l.color, fontWeight: 700, marginLeft: 'auto', paddingLeft: '0.5rem' }}>{l.v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Progress Bar ── */}
      {stats.total > 0 && (
        <div style={{ ...glass({ padding: '0.85rem 1.4rem' }) }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#475569', marginBottom: '0.4rem' }}>
            <span>Execution Progress</span>
            <span>{stats.total - stats.notRun} / {stats.total} executed</span>
          </div>
          <div style={{ height: '8px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', overflow: 'hidden', display: 'flex' }}>
            {[
              { w: stats.pass,    c: '#10b981' },
              { w: stats.fail,    c: '#ef4444' },
              { w: stats.blocked, c: '#f97316' },
              { w: stats.skipped, c: '#eab308' },
            ].map((s, i) => (
              <div key={i} style={{ width: `${(s.w / stats.total) * 100}%`, background: s.c, transition: 'width 0.5s ease' }}/>
            ))}
          </div>
        </div>
      )}

      {/* ── Filters ── */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#475569' }}/>
          <input
            type="text" placeholder="Search TC ID or scenario name…"
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '0.6rem 1rem 0.6rem 2.2rem', color: '#f8fafc', outline: 'none', fontSize: '0.85rem' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={14} color="#10b981"/>
          <select value={filter} onChange={e => setFilter(e.target.value)}
            style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '0.6rem 0.8rem', color: '#f8fafc', outline: 'none', fontSize: '0.85rem' }}>
            <option value="all">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* ── Test Case Table ── */}
      <div style={{ ...glass({ padding: 0, overflow: 'hidden', border: '1px solid rgba(16,185,129,0.15)' }) }}>
        {/* Table header */}
        <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr 160px 1fr 120px 32px', padding: '0.7rem 1.4rem', background: 'rgba(0,0,0,0.25)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          {['TC ID', 'Scenario', 'Status', 'Tester Notes', 'Action', ''].map((h, i) => (
            <div key={i} style={{ fontSize: '0.62rem', color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.7px' }}>{h}</div>
          ))}
        </div>

        {visibleCases.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: '#334155' }}>
            <AlertCircle size={40} style={{ margin: '0 auto 1rem', opacity: 0.4 }}/>
            <p style={{ fontSize: '0.9rem' }}>
              {testCases.length === 0
                ? 'No test cases found. Generate test cases first from the Test Generation module.'
                : 'No results match your current filter.'}
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {visibleCases.map((tc, idx) => {
              const res = results[tc.TC_ID] || {};
              const status = res.status || 'Not Run';
              const meta = STATUS_META[status] || STATUS_META['Not Run'];
              const isExpanded = expandedId === tc.TC_ID;
              const isSaving = saving[tc.TC_ID];
              const isSynced = res.synced;

              return (
                <motion.div key={tc.TC_ID}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.02 }}
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', borderLeft: `3px solid ${meta.color}` }}
                >
                  <div style={{
                    display: 'grid', gridTemplateColumns: '90px 1fr 160px 1fr 120px 32px',
                    padding: '0.9rem 1.4rem', alignItems: 'center',
                    transition: 'background 0.15s'
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {/* TC ID */}
                    <div>
                      <span style={{ fontWeight: 800, color: '#818cf8', fontSize: '0.78rem', fontFamily: 'monospace' }}>{tc.TC_ID}</span>
                      {isSynced && <div style={{ fontSize: '0.58rem', color: '#10b981', marginTop: '2px' }}>● Synced</div>}
                    </div>

                    {/* Scenario Name */}
                    <div style={{ paddingRight: '1rem' }}>
                      <div style={{ color: '#e2e8f0', fontSize: '0.82rem', fontWeight: 500, lineHeight: 1.35 }}>
                        {(tc.Scenario_Name || tc.Scenario || '').split('\n')[0].slice(0, 80)}
                      </div>
                    </div>

                    {/* Status Select */}
                    <div>
                      <select
                        value={status}
                        onChange={e => setField(tc.TC_ID, 'status', e.target.value)}
                        style={{
                          width: '100%', background: meta.bg, border: `1px solid ${meta.color}40`,
                          borderRadius: '8px', padding: '0.4rem 0.6rem', color: meta.color,
                          outline: 'none', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer'
                        }}
                      >
                        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>

                    {/* Comment input */}
                    <div style={{ paddingRight: '1rem' }}>
                      <textarea
                        placeholder="Add observations, defect IDs, or notes…"
                        value={res.comment || ''}
                        onChange={e => setField(tc.TC_ID, 'comment', e.target.value)}
                        rows={2}
                        style={{
                          width: '100%', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.07)',
                          borderRadius: '8px', padding: '0.45rem 0.65rem', color: '#cbd5e1',
                          outline: 'none', fontSize: '0.78rem', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.4
                        }}
                      />
                    </div>

                    {/* Save / Sync button */}
                    <div>
                      <button
                        onClick={() => handleSave(tc.TC_ID)}
                        disabled={isSaving}
                        style={{
                          width: '100%', padding: '0.5rem 0',
                          background: isSynced ? 'rgba(16,185,129,0.08)' : 'rgba(16,185,129,0.15)',
                          color: isSynced ? '#10b981' : '#34d399',
                          border: `1px solid ${isSynced ? 'rgba(16,185,129,0.2)' : 'rgba(52,211,153,0.3)'}`,
                          borderRadius: '8px', cursor: isSaving ? 'wait' : 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
                          fontWeight: 700, fontSize: '0.75rem', transition: 'all 0.2s'
                        }}
                      >
                        {isSaving
                          ? <><RefreshCw size={12} className="spin-icon"/> Syncing…</>
                          : isSynced
                            ? <><CheckCheck size={12}/> Synced</>
                            : <><Save size={12}/> Save & Sync</>
                        }
                      </button>
                    </div>

                    {/* Expand toggle */}
                    <div style={{ display: 'flex', justifyContent: 'center', cursor: 'pointer', color: '#475569' }}
                      onClick={() => setExpandedId(isExpanded ? null : tc.TC_ID)}>
                      {isExpanded ? <ChevronDown size={15}/> : <ChevronRight size={15}/>}
                    </div>
                  </div>

                  {/* Expanded BDD Steps */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div style={{ padding: '1rem 1.4rem 1.2rem 2.5rem', background: 'rgba(0,0,0,0.18)', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                          <div>
                            <div style={{ fontSize: '0.62rem', color: '#6366f1', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '0.5rem' }}>BDD Scenario Steps</div>
                            <pre style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '0.75rem', fontSize: '0.75rem', color: '#a5b4fc', fontFamily: 'monospace', whiteSpace: 'pre-wrap', lineHeight: 1.7, margin: 0 }}>
                              {tc.Scenario || tc.Steps || tc.Gherkin || 'No BDD steps recorded.'}
                            </pre>
                          </div>
                          <div>
                            <div style={{ fontSize: '0.62rem', color: '#6366f1', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '0.5rem' }}>QMetry Sync Details</div>
                            <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)', padding: '0.8rem', fontSize: '0.78rem', color: '#64748b', lineHeight: 2 }}>
                              <div><span style={{ color: '#475569' }}>Jira Story:</span> <strong style={{ color: '#60a5fa' }}>{story?.key || '—'}</strong></div>
                              <div><span style={{ color: '#475569' }}>Execution Status:</span> <strong style={{ color: meta.color }}>{status}</strong></div>
                              <div><span style={{ color: '#475569' }}>Last Synced:</span> <strong style={{ color: '#94a3b8' }}>{res.syncedAt ? new Date(res.syncedAt).toLocaleString() : 'Not yet synced'}</strong></div>
                              <div>
                                <span style={{ color: '#475569' }}>Sprint:</span>{' '}
                                {story?.sprintName
                                  ? <strong style={{ color: story?.sprintState === 'active' ? '#34d399' : '#818cf8' }}>
                                      {story.sprintName}{story?.sprintState === 'active' ? ' 🟢' : ''}
                                    </strong>
                                  : <strong style={{ color: '#475569' }}>No sprint assigned</strong>
                                }
                              </div>
                              <div><span style={{ color: '#475569' }}>QMetry Cycle:</span> <strong style={{ color: '#94a3b8' }}>
                                {story?.sprintName ? `${story.sprintName} - ${story?.key}` : `Manual Execution Cycle - ${story?.key || '—'}`}
                              </strong></div>
                            </div>
                            {res.syncedAt && (
                              <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.85rem', background: 'rgba(16,185,129,0.08)', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.15)', fontSize: '0.72rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <Link2 size={11}/> Successfully synced to QMetry execution cycle
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* ── QMetry Sync Activity Log ── */}
      <AnimatePresence>
        {showLog && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
            <div style={{ ...glass({ padding: '1.25rem', border: '1px solid rgba(16,185,129,0.15)' }) }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                <h4 style={{ margin: 0, color: '#10b981', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Zap size={15}/> QMetry Synchronisation Activity Log
                </h4>
                <button onClick={() => setSyncLog([])} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.75rem' }}>Clear Log</button>
              </div>
              <div style={{
                background: '#020617', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)',
                padding: '1rem', maxHeight: '200px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '0.75rem', lineHeight: 1.8
              }}>
                {syncLog.length === 0
                  ? <span style={{ color: '#334155' }}>// No sync activity yet. Save a test case or run Bulk Sync.</span>
                  : syncLog.map((line, i) => (
                    <div key={i} style={{ color: i === 0 ? '#34d399' : '#475569' }}>{line}</div>
                  ))
                }
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ManualExecutionPage;
