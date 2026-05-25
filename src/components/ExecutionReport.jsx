import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_URLS } from '../services/api';
import { BarChart3, CheckCircle2, XCircle, Clock, Search, Filter, FileText, ChevronDown, ChevronRight, AlertCircle, Download } from 'lucide-react';
import axios from 'axios';

const ExecutionReport = ({ story }) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRun, setSelectedRun] = useState(null);
  const [testCases, setTestCases] = useState([]);
  const [expandedTC, setExpandedTC] = useState(null);

  useEffect(() => {
    fetchResults();
    loadTestCases();
  }, [story]);

  const loadTestCases = () => {
    let allCases = [];
    if (story?.id) {
      // Only load test cases for the current story
      try {
        const saved = localStorage.getItem(`testpilot_cases_${story.id}`);
        if (saved) allCases = JSON.parse(saved) || [];
      } catch (e) {}
    } else {
      // Fallback: load all if no story context
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('testpilot_cases_')) {
          try {
            const saved = JSON.parse(localStorage.getItem(key));
            if (Array.isArray(saved)) saved.forEach(c => {
              if (!allCases.find(e => e.TC_ID === c.TC_ID)) allCases.push(c);
            });
          } catch (e) {}
        }
      }
    }
    allCases.sort((a, b) => {
      const n = s => parseInt((s.TC_ID || '').replace(/\D/g, '')) || 0;
      return n(a) - n(b);
    });
    setTestCases(allCases);
  };

  const fetchResults = async () => {
    try {
      const resp = await axios.get(API_URLS.EXECUTION_RESULTS);
      setResults(Array.isArray(resp.data) ? resp.data : []);
    } catch { } finally { setLoading(false); }
  };

  const getTitle = tc =>
    tc.Title || tc['Test Case Title'] || tc.Scenario?.split('\n')[0]?.replace(/^Scenario:\s*/i, '').trim() || tc.TC_ID;

  const getDisplayRows = () => {
    return testCases.map(tc => {
      const latest = [...results]
        .filter(r => r.test_case_id === tc.TC_ID)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
      return {
        TC_ID: tc.TC_ID,
        title: getTitle(tc),
        gherkin: tc.Gherkin || tc.Steps || tc.Scenario || '',
        precondition: tc.Precondition || tc.Preconditions || '',
        status: latest ? latest.status : 'Pending',
        timestamp: latest?.timestamp || null,
        comments: latest?.comments || 'Not executed yet',
        isExecuted: !!latest,
        raw: latest
      };
    }).filter(row => {
      const s = searchTerm.toLowerCase();
      const matchSearch = !s || row.TC_ID?.toLowerCase().includes(s) || row.title?.toLowerCase().includes(s);
      const matchStatus = statusFilter === 'all' || row.status?.toLowerCase() === statusFilter ||
        (statusFilter === 'pass' && row.status === 'Success');
      return matchSearch && matchStatus;
    });
  };

  const rows = getDisplayRows();
  const executed = [...new Map(results.map(r => [r.test_case_id, r])).values()];
  const stats = {
    total: testCases.length,
    passed: executed.filter(r => ['Pass','Success'].includes(r.status)).length,
    failed: executed.filter(r => ['Fail','Error','Failed'].includes(r.status)).length,
    pending: Math.max(0, testCases.length - executed.length),
  };
  const passRate = (stats.passed + stats.failed) > 0
    ? Math.round((stats.passed / (stats.passed + stats.failed)) * 100) : 0;

  const statusColor = s => ['Pass','Success'].includes(s) ? '#10b981' : ['Fail','Error','Failed'].includes(s) ? '#ef4444' : '#64748b';
  const statusBg = s => ['Pass','Success'].includes(s) ? 'rgba(16,185,129,0.1)' : ['Fail','Error','Failed'].includes(s) ? 'rgba(239,68,68,0.1)' : 'rgba(100,116,139,0.1)';
  const statusLabel = s => s === 'Success' ? 'PASS' : (s || 'PENDING').toUpperCase();

  // ── Export HTML ──
  const downloadHTML = () => {
    const storyTitle = story?.key || story?.id || 'All Stories';
    const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Execution Report - ${storyTitle}</title>
<style>
  body{font-family:Arial,sans-serif;background:#f0f4f8;color:#222;padding:2rem}
  h1{color:#4f46e5} table{border-collapse:collapse;width:100%;margin-top:1.5rem}
  th{background:#4f46e5;color:#fff;padding:10px 14px;text-align:left;font-size:12px}
  td{padding:10px 14px;border-bottom:1px solid #ddd;vertical-align:top;font-size:13px}
  tr:nth-child(even){background:#f8f9fa}
  .pass{color:#059669;font-weight:700} .fail{color:#dc2626;font-weight:700} .pending{color:#6b7280;font-weight:700}
  .summary{display:flex;gap:1.5rem;margin-bottom:1.5rem}
  .card{background:#fff;border-radius:10px;padding:1rem 1.5rem;box-shadow:0 1px 4px rgba(0,0,0,0.08);min-width:120px;text-align:center}
  .card .val{font-size:2rem;font-weight:800} .card .lbl{font-size:11px;color:#6b7280;text-transform:uppercase}
</style></head><body>
<h1>Execution Report</h1>
<p style="color:#6b7280">Story: <strong>${storyTitle}</strong> &nbsp;|&nbsp; Generated: ${new Date().toLocaleString()}</p>
<div class="summary">
  <div class="card"><div class="val">${stats.total}</div><div class="lbl">Total TCs</div></div>
  <div class="card"><div class="val" style="color:#059669">${passRate}%</div><div class="lbl">Pass Rate</div></div>
  <div class="card"><div class="val" style="color:#059669">${stats.passed}</div><div class="lbl">Passed</div></div>
  <div class="card"><div class="val" style="color:#dc2626">${stats.failed}</div><div class="lbl">Failed</div></div>
  <div class="card"><div class="val" style="color:#6b7280">${stats.pending}</div><div class="lbl">Pending</div></div>
</div>
<table><thead><tr><th>TC ID</th><th>Title</th><th>BDD Steps</th><th>Status</th><th>Last Run</th><th>Comments</th></tr></thead>
<tbody>${rows.map(r => `
<tr>
  <td><strong>${r.TC_ID}</strong></td>
  <td>${r.title}</td>
  <td><pre style="margin:0;font-size:12px;white-space:pre-wrap">${r.gherkin || '—'}</pre></td>
  <td class="${['Pass','Success'].includes(r.status)?'pass':['Fail','Error','Failed'].includes(r.status)?'fail':'pending'}">${statusLabel(r.status)}</td>
  <td>${r.timestamp ? new Date(r.timestamp).toLocaleString() : '—'}</td>
  <td>${r.comments}</td>
</tr>`).join('')}
</tbody></table></body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `execution_report_${storyTitle}_${Date.now()}.html`; a.click();
  };

  // ── Export CSV (Excel-compatible) ──
  const downloadCSV = () => {
    const storyTitle = story?.key || story?.id || 'All';
    const escape = v => `"${String(v || '').replace(/"/g, '""')}"`;
    const header = ['TC ID','Title','BDD Steps','Precondition','Status','Last Run','Comments'];
    const csvRows = rows.map(r => [
      r.TC_ID, r.title, r.gherkin, r.precondition,
      statusLabel(r.status),
      r.timestamp ? new Date(r.timestamp).toLocaleString() : '',
      r.comments
    ].map(escape).join(','));
    const csv = [header.map(escape).join(','), ...csvRows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `execution_report_${storyTitle}_${Date.now()}.csv`; a.click();
  };

  const handleClear = async () => {
    if (!window.confirm('Clear all execution history?')) return;
    try {
      await axios.post(API_URLS.CLEAR_RESULTS);
      if (story?.id) localStorage.removeItem(`testpilot_cases_${story.id}`);
      setTestCases([]); fetchResults();
    } catch { alert('Failed to clear'); }
  };

  const glass = { background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(12px)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)', padding: '1.5rem' };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '4rem' }}>

      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'linear-gradient(135deg,#ec4899,#8b5cf6)', padding: '0.6rem', borderRadius: '12px' }}>
            <BarChart3 size={24} color="white" />
          </div>
          <div>
            <h1 className="title-gradient" style={{ margin: 0, fontSize: '1.8rem' }}>Execution Report</h1>
            <p style={{ color: '#94a3b8', margin: '0.2rem 0 0', fontSize: '0.88rem' }}>
              {story ? `Story: ${story.key || story.id} — ${testCases.length} BDD test case(s)` : 'All generated BDD test cases'}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button onClick={downloadCSV} style={{ padding: '0.55rem 1rem', background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '10px', fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Download size={14} /> Export CSV
          </button>
          <button onClick={downloadHTML} style={{ padding: '0.55rem 1rem', background: 'rgba(99,102,241,0.1)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '10px', fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Download size={14} /> Export HTML
          </button>
          <button onClick={handleClear} style={{ padding: '0.55rem 1rem', background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', fontSize: '0.82rem', cursor: 'pointer' }}>Clear All</button>
          <button onClick={() => { fetchResults(); loadTestCases(); }} className="btn-secondary" style={{ width: 'auto', padding: '0.55rem 1rem', fontSize: '0.82rem' }}>Refresh</button>
        </div>
      </header>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '1rem' }}>
        {[
          { label: 'Total Generated', value: stats.total, color: '#818cf8' },
          { label: 'Pass Rate', value: `${passRate}%`, color: '#10b981' },
          { label: 'Passed', value: stats.passed, color: '#10b981' },
          { label: 'Failed', value: stats.failed, color: '#ef4444' },
          { label: 'Pending', value: stats.pending, color: '#64748b' },
        ].map((c, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            style={{ background: 'rgba(30,41,59,0.4)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '14px', padding: '1.1rem', textAlign: 'center' }}>
            <div style={{ color: c.color, fontSize: '1.8rem', fontWeight: 800 }}>{c.value}</div>
            <div style={{ color: '#475569', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.6px', marginTop: '0.3rem' }}>{c.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Progress bar */}
      {stats.total > 0 && (
        <div style={{ ...glass, padding: '0.9rem 1.4rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#64748b', marginBottom: '0.4rem' }}>
            <span>Execution Progress</span>
            <span>{stats.passed + stats.failed} / {stats.total} run</span>
          </div>
          <div style={{ height: '7px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ display: 'flex', height: '100%' }}>
              <div style={{ width: `${(stats.passed / stats.total) * 100}%`, background: '#10b981' }} />
              <div style={{ width: `${(stats.failed / stats.total) * 100}%`, background: '#ef4444' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1.2rem', marginTop: '0.4rem', fontSize: '0.7rem' }}>
            <span style={{ color: '#10b981' }}>● Passed: {stats.passed}</span>
            <span style={{ color: '#ef4444' }}>● Failed: {stats.failed}</span>
            <span style={{ color: '#64748b' }}>● Pending: {stats.pending}</span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: '1rem', background: 'rgba(15,23,42,0.6)', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
          <input type="text" placeholder="Search TC ID or title..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '0.45rem 1rem 0.45rem 2rem', color: '#f8fafc', outline: 'none', fontSize: '0.85rem' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={15} color="#6366f1" />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '0.45rem 0.8rem', color: '#f8fafc', outline: 'none', fontSize: '0.85rem' }}>
            <option value="all">All Status</option>
            <option value="pass">Passed</option>
            <option value="fail">Failed</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div style={{ ...glass, padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr 140px 160px 28px', padding: '0.65rem 1.4rem', background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {['TC ID', 'Test Case Title', 'Status', 'Last Run', ''].map((h, i) => (
            <div key={i} style={{ fontSize: '0.62rem', color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.7px' }}>{h}</div>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Loading...</div>
        ) : rows.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
            {testCases.length === 0 ? 'No test cases generated for this story yet.' : 'No results match your filter.'}
          </div>
        ) : (
          <AnimatePresence>
            {rows.map((row, i) => (
              <motion.div key={row.TC_ID} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <div onClick={() => setExpandedTC(expandedTC === row.TC_ID ? null : row.TC_ID)}
                  style={{ display: 'grid', gridTemplateColumns: '90px 1fr 140px 160px 28px', padding: '0.9rem 1.4rem', cursor: 'pointer', borderLeft: `3px solid ${statusColor(row.status)}`, transition: 'background 0.12s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontWeight: 800, color: '#818cf8', fontSize: '0.85rem', fontFamily: 'monospace' }}>{row.TC_ID}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', paddingRight: '0.8rem' }}>
                    <span style={{ color: '#e2e8f0', fontSize: '0.88rem' }}>{row.title}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ background: statusBg(row.status), color: statusColor(row.status), padding: '0.2rem 0.65rem', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700 }}>
                      {statusLabel(row.status)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#475569', fontSize: '0.72rem' }}>
                    {row.timestamp ? <><Clock size={11} />{new Date(row.timestamp).toLocaleDateString()} {new Date(row.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</> : <span>—</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', color: '#475569' }}>
                    {expandedTC === row.TC_ID ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                  </div>
                </div>

                <AnimatePresence>
                  {expandedTC === row.TC_ID && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      style={{ overflow: 'hidden', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                      <div style={{ padding: '1rem 1.4rem 1rem 2.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div>
                          <div style={{ fontSize: '0.62rem', color: '#6366f1', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '0.5rem' }}>BDD Scenario</div>
                          {row.precondition && <p style={{ color: '#f59e0b', fontSize: '0.78rem', margin: '0 0 0.5rem', background: 'rgba(245,158,11,0.08)', padding: '0.3rem 0.6rem', borderRadius: '6px' }}>📋 {row.precondition}</p>}
                          <pre style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '0.75rem', fontSize: '0.78rem', color: '#a5b4fc', fontFamily: 'monospace', whiteSpace: 'pre-wrap', lineHeight: 1.7, margin: 0 }}>
                            {row.gherkin || 'No BDD steps defined.'}
                          </pre>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.62rem', color: '#6366f1', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '0.5rem' }}>Execution Result</div>
                          {row.isExecuted ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                {['Pass','Success'].includes(row.status) ? <CheckCircle2 size={16} color="#10b981" /> : <XCircle size={16} color="#ef4444" />}
                                <span style={{ color: statusColor(row.status), fontWeight: 700, fontSize: '0.88rem' }}>{statusLabel(row.status)}</span>
                              </div>
                              <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '0.75rem', fontSize: '0.78rem', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.05)' }}>
                                {row.comments}
                              </div>
                              <button onClick={e => { e.stopPropagation(); setSelectedRun(row.raw); }}
                                style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8', padding: '0.35rem 0.75rem', borderRadius: '8px', fontSize: '0.75rem', cursor: 'pointer', width: 'fit-content' }}>
                                View Full Logs
                              </button>
                            </div>
                          ) : (
                            <div style={{ color: '#475569', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <AlertCircle size={15} color="#475569" /> Not executed yet
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Logs Modal */}
      <AnimatePresence>
        {selectedRun && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              style={{ background: '#0f172a', width: '100%', maxWidth: '800px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden' }}>
              <div style={{ padding: '1.1rem 1.4rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 800, color: '#818cf8', fontFamily: 'monospace' }}>{selectedRun.test_case_id}</span>
                <button onClick={() => setSelectedRun(null)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
              </div>
              <div style={{ padding: '1.4rem', maxHeight: '65vh', overflowY: 'auto' }}>
                <pre style={{ background: '#020617', padding: '1.2rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)', color: '#94a3b8', fontSize: '0.82rem', whiteSpace: 'pre-wrap', fontFamily: 'monospace', lineHeight: 1.7, margin: 0 }}>
                  {selectedRun.output || selectedRun.comments || 'No logs.'}
                </pre>
              </div>
              <div style={{ padding: '0.9rem 1.4rem', background: 'rgba(0,0,0,0.2)', display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={() => window.print()} className="btn-primary" style={{ width: 'auto', padding: '0.5rem 1.2rem', fontSize: '0.85rem' }}>Print</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ExecutionReport;
