import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Square, Terminal, Globe, User, Lock, 
  Eye, EyeOff, Loader2, Code, ShieldAlert, Sparkles,
  FileText, Check, Cpu, Info, CheckCircle2, AlertTriangle,
  Save
} from 'lucide-react';
import axios from 'axios';
import { API_URLS } from '../services/api';

const ExecutionPage = ({ story, credentials }) => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [headless, setHeadless] = useState(true);
  const [logs, setLogs] = useState([]);
  const [contextCode, setContextCode] = useState('');
  
  const [targetUrl, setTargetUrl] = useState('');
  const [targetUser, setTargetUser] = useState('');
  const [targetPass, setTargetPass] = useState('');
  
  const [generatedCases, setGeneratedCases] = useState([]);
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [browser, setBrowser] = useState('all');
  const [showCodePreview, setShowCodePreview] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  
  const [executionServerUrl, setExecutionServerUrl] = useState(() => {
    return localStorage.getItem('testpilot_execution_server_url') || 'http://localhost:3001';
  });

  const handleServerUrlChange = (val) => {
    setExecutionServerUrl(val);
    localStorage.setItem('testpilot_execution_server_url', val);
  };

  const handleTargetUrlChange = (val) => {
    setTargetUrl(val);
    if (story?.id) {
      const currentEnv = JSON.parse(localStorage.getItem(`testpilot_env_${story.id}`) || '{}');
      localStorage.setItem(`testpilot_env_${story.id}`, JSON.stringify({ ...currentEnv, url: val }));
    }
  };

  const handleTargetUserChange = (val) => {
    setTargetUser(val);
    if (story?.id) {
      const currentEnv = JSON.parse(localStorage.getItem(`testpilot_env_${story.id}`) || '{}');
      localStorage.setItem(`testpilot_env_${story.id}`, JSON.stringify({ ...currentEnv, user: val }));
    }
  };

  const handleTargetPassChange = (val) => {
    setTargetPass(val);
    if (story?.id) {
      const currentEnv = JSON.parse(localStorage.getItem(`testpilot_env_${story.id}`) || '{}');
      localStorage.setItem(`testpilot_env_${story.id}`, JSON.stringify({ ...currentEnv, pass: val }));
    }
  };
  
  const eventSourceRef = useRef(null);
  const logEndRef = useRef(null);

  // Load Generated Script, Cases, and Env Config
  useEffect(() => {
    if (story?.id) {
      const storedScript = localStorage.getItem(`testpilot_script_${story.id}`);
      if (storedScript) setContextCode(storedScript);

      const storedCases = localStorage.getItem(`testpilot_cases_${story.id}`);
      if (storedCases) {
        try {
          const parsed = JSON.parse(storedCases);
          setGeneratedCases(parsed);
          if (parsed.length > 0) {
            setSelectedCaseId(parsed[0].TC_ID || '');
          }
        } catch (e) {
          console.error('Failed to parse generated cases', e);
        }
      }

      // Load saved environment config for this story
      const savedEnv = localStorage.getItem(`testpilot_env_${story.id}`);
      if (savedEnv) {
        try {
          const { url, user, pass } = JSON.parse(savedEnv);
          setTargetUrl(url || '');
          setTargetUser(user || '');
          setTargetPass(pass || '');
        } catch (e) {}
      } else {
        // Smart URL auto-detection from story description or BDD steps
        let detectedUrl = '';
        const desc = story.description || story.Description || '';
        const stepsText = story.Steps || '';
        
        const extractUrl = (text, ignorePlaceholders = false) => {
          const regex = /(?:https?:\/\/[^\s"']+|www\.[^\s"']+|[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s"']*)?)/gi;
          const matches = text.match(regex) || [];
          const filtered = ignorePlaceholders 
              ? matches.filter(u => !u.includes('example.com') && !u.includes('localhost'))
              : matches;
          if (filtered.length > 0) {
              const best = filtered.find(u => u.startsWith('http')) || filtered[0];
              return best.startsWith('http') ? best : 'https://' + best;
          }
          return null;
        };

        if (desc.toLowerCase().includes('swag labs') || desc.toLowerCase().includes('saucedemo')) {
          detectedUrl = 'https://www.saucedemo.com';
        } else {
          detectedUrl = extractUrl(stepsText, true) || extractUrl(desc, true) || extractUrl(stepsText, false) || extractUrl(desc, false) || '';
        }

        setTargetUrl(detectedUrl);
        setTargetUser('');
        setTargetPass('');
      }
    }
  }, [story]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const startExecution = async () => {
    if (!contextCode) return;
    setIsExecuting(true);
    setLogs([]);
    
    try {
      const activeTcId = selectedCaseId || story.id;
      
      const resp = await axios.post(API_URLS.AGENT_EXECUTE, {
        test_case_id: activeTcId,
        steps: [],
        headless,
        browser,
        contextCode,
        credentials,
        envConfig: { url: targetUrl, user: targetUser, pass: targetPass },
        mode: 'codegen'
      });

      const { executionId } = resp.data;
      setupStream(executionId, activeTcId);
    } catch (err) {
      let errMsg = err.message;
      if (err.message === 'Network Error' || !err.response) {
        errMsg = `Could not connect to local execution server at ${executionServerUrl}. Make sure 'npm run server' is running on your machine.`;
      }
      addLog(`❌ Failed to start execution: ${errMsg}`, 'error');
      setIsExecuting(false);
    }
  };

  const setupStream = (executionId, tcId) => {
    if (eventSourceRef.current) eventSourceRef.current.close();
    
    const es = new EventSource(API_URLS.AGENT_STREAM(executionId));
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleAgentEvent(data, tcId);
    };

    es.onerror = () => {
      addLog('⚠️ Stream disconnected', 'warn');
      es.close();
    };
  };

  const handleAgentEvent = (data, tcId) => {
    switch (data.type) {
      case 'STEP_START':
        addLog(`🚀 Starting: ${data.step}`, 'info');
        break;
      case 'CLI_LOG':
        addLog(data.text, data.logType || 'info');
        break;
      case 'STEP_COMPLETE':
        addLog(`✅ Task finished successfully`, 'success');
        break;
      case 'STEP_FAILED':
        addLog(`❌ Task failed`, 'error');
        break;
      case 'EXECUTION_COMPLETE':
        setIsExecuting(false);
        addLog(`🏁 Playwright Run Finished: ${data.status} ${data.error ? '(' + data.error + ')' : ''}`, data.status === 'Success' ? 'success' : 'error');
        eventSourceRef.current?.close();
        
        axios.post(API_URLS.EXECUTE_TEST, {
          test_case_id: tcId,
          status: data.status === 'Success' ? 'Pass' : 'Fail',
          comments: `Playwright CLI execution finished with status: ${data.status}`,
          manual: false,
          storyKey: story?.key
        }).catch(err => console.error('Failed to save execution report', err));
        break;
      case 'ERROR':
        addLog(`⚠️ Error: ${data.error}`, 'error');
        break;
    }
  };

  const addLog = (text, type) => {
    setLogs(prev => [...prev, { id: Date.now() + Math.random(), text, type, time: new Date().toLocaleTimeString() }]);
  };

  const stopExecution = () => {
    eventSourceRef.current?.close();
    setIsExecuting(false);
    addLog('🛑 Execution stopped by user', 'warn');
    axios.post(API_URLS.STOP_EXECUTION, {
      test_case_id: selectedCaseId || story.id
    }).catch(err => console.error('Failed to stop execution on server', err));
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(contextCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const manualSave = () => {
    if (story?.id) {
      localStorage.setItem(`testpilot_script_${story.id}`, contextCode);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const logColors = {
    info: '#818cf8',
    tool: '#fbbf24',
    obs: '#94a3b8',
    success: '#10b981',
    error: '#ef4444',
    warn: '#f59e0b'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: 'calc(100vh - 140px)', overflow: 'hidden' }}>
      
      {/* Header Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div>
          <h1 className="title-gradient" style={{ margin: 0, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={20} color="#818cf8" /> Automation Execution Workspace
          </h1>
          <p style={{ color: '#94a3b8', margin: '0.1rem 0 0', fontSize: '0.8rem' }}>
            Configure preconditions, monitor integration states, and run Playwright CLI tests using custom CodeGen scripts
          </p>
        </div>
      </div>

      {/* Main 3-Column Grid Layout */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '320px 1fr 1fr', 
        gap: '1rem', 
        flex: 1, 
        minHeight: 0,
        overflow: 'hidden'
      }}>
        
        {/* ===== COLUMN 1: CONFIGURATION ===== */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '0.85rem',
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(12px)',
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.06)',
          padding: '1.1rem',
          height: '100%',
          overflowY: 'auto',
          boxSizing: 'border-box'
        }}>
          
          {/* Test Case Selection */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.7rem', color: '#818cf8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <FileText size={12} /> Select Test Case
            </span>
            <select 
              value={selectedCaseId} 
              onChange={(e) => setSelectedCaseId(e.target.value)}
              style={{ 
                width: '100%', background: 'rgba(0,0,0,0.3)', 
                border: '1px solid rgba(99,102,241,0.25)', color: '#f1f5f9', 
                outline: 'none', fontSize: '0.82rem', padding: '0.5rem 0.75rem', 
                borderRadius: '8px', cursor: 'pointer',
                boxSizing: 'border-box'
              }}
            >
              {generatedCases.length > 0 ? (
                generatedCases.map(tc => (
                  <option key={tc.TC_ID} value={tc.TC_ID} style={{ background: '#0f172a' }}>
                    {tc.TC_ID}: {tc.Title || tc['Test Case Title'] || tc.Scenario?.split('\n')[0]?.slice(0, 30)}
                  </option>
                ))
              ) : (
                <option value="" style={{ background: '#0f172a' }}>Default Story Test</option>
              )}
            </select>
          </div>

          <hr style={{ border: 'none', borderBottom: '1px solid rgba(255,255,255,0.05)', margin: '0.2rem 0' }} />

          {/* Form Fields */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            
            {/* Target URL */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Application URL</span>
              <div style={{ position: 'relative' }}>
                <Globe size={12} color="#475569" style={{ position: 'absolute', left: '0.7rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="text" 
                  placeholder="e.g. http://192.168.1.1/login" 
                  value={targetUrl}
                  onChange={(e) => handleTargetUrlChange(e.target.value)}
                  style={{ 
                    width: '100%', background: 'rgba(0,0,0,0.25)', 
                    border: '1px solid rgba(255,255,255,0.07)', color: '#f1f5f9', 
                    padding: '0.55rem 0.7rem 0.55rem 2.1rem', borderRadius: '8px', 
                    fontSize: '0.8rem', outline: 'none', boxSizing: 'border-box',
                    transition: 'border-color 0.2s'
                  }}
                />
              </div>
            </div>

            {/* Username */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Username</span>
              <div style={{ position: 'relative' }}>
                <User size={12} color="#475569" style={{ position: 'absolute', left: '0.7rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="text" 
                  placeholder="Username / Email" 
                  value={targetUser}
                  onChange={(e) => handleTargetUserChange(e.target.value)}
                  style={{ 
                    width: '100%', background: 'rgba(0,0,0,0.25)', 
                    border: '1px solid rgba(255,255,255,0.07)', color: '#f1f5f9', 
                    padding: '0.55rem 0.7rem 0.55rem 2.1rem', borderRadius: '8px', 
                    fontSize: '0.8rem', outline: 'none', boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Password</span>
              <div style={{ position: 'relative' }}>
                <Lock size={12} color="#475569" style={{ position: 'absolute', left: '0.7rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="password" 
                  placeholder="Password" 
                  value={targetPass}
                  onChange={(e) => handleTargetPassChange(e.target.value)}
                  style={{ 
                    width: '100%', background: 'rgba(0,0,0,0.25)', 
                    border: '1px solid rgba(255,255,255,0.07)', color: '#f1f5f9', 
                    padding: '0.55rem 0.7rem 0.55rem 2.1rem', borderRadius: '8px', 
                    fontSize: '0.8rem', outline: 'none', boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* Visibility & Execution Server Toggles */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.1rem' }}>
              
              <div style={{ 
                background: 'rgba(255,255,255,0.015)', 
                borderRadius: '8px', 
                padding: '0.5rem 0.7rem', 
                border: '1px solid rgba(255,255,255,0.03)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.72rem', color: '#e2e8f0', fontWeight: 500 }}>Browser Visibility</span>
                  <span style={{ fontSize: '0.6rem', color: '#64748b' }}>Show browser during CLI execution</span>
                </div>
                <button 
                  onClick={() => setHeadless(!headless)} 
                  style={{ 
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', 
                    color: headless ? '#94a3b8' : '#10b981', borderRadius: '6px',
                    display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer', 
                    fontSize: '0.7rem', padding: '0.3rem 0.55rem', fontWeight: 600,
                    transition: 'all 0.2s'
                  }}
                >
                  {headless ? <EyeOff size={11} /> : <Eye size={11} />} {headless ? 'Headless' : 'Headed'}
                </button>
              </div>

              {/* Browser Selector */}
              <div style={{ 
                background: 'rgba(255,255,255,0.015)', 
                borderRadius: '8px', 
                padding: '0.5rem 0.7rem', 
                border: '1px solid rgba(255,255,255,0.03)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.2rem'
              }}>
                <span style={{ fontSize: '0.72rem', color: '#e2e8f0', fontWeight: 500 }}>Target Browser Project</span>
                <select 
                  value={browser} 
                  onChange={(e) => setBrowser(e.target.value)}
                  style={{ 
                    width: '100%', background: 'rgba(0,0,0,0.3)', 
                    border: '1px solid rgba(255,255,255,0.08)', color: '#f1f5f9', 
                    outline: 'none', fontSize: '0.75rem', padding: '0.35rem 0.6rem', 
                    borderRadius: '6px', cursor: 'pointer',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="all" style={{ background: '#0f172a' }}>All Browsers (Sequential)</option>
                  <option value="chromium" style={{ background: '#0f172a' }}>Chromium (Chrome)</option>
                  <option value="firefox" style={{ background: '#0f172a' }}>Firefox</option>
                  <option value="webkit" style={{ background: '#0f172a' }}>Webkit (Safari)</option>
                </select>
              </div>

              <div style={{ 
                background: 'rgba(255,255,255,0.015)', 
                borderRadius: '8px', 
                padding: '0.5rem 0.7rem', 
                border: '1px solid rgba(255,255,255,0.03)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.2rem'
              }}>
                <span style={{ fontSize: '0.72rem', color: '#e2e8f0', fontWeight: 500 }}>Local Execution Server</span>
                <input 
                  type="text" 
                  value={executionServerUrl} 
                  onChange={(e) => handleServerUrlChange(e.target.value)}
                  placeholder="e.g. http://localhost:3001"
                  style={{ 
                    background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.1)', 
                    color: '#94a3b8', outline: 'none', fontSize: '0.75rem', padding: '1px 0', width: '100%' 
                  }}
                />
              </div>

            </div>

          </div>

          <div style={{ flex: 1 }} />

          {/* Warning banner when Script is missing */}
          {!contextCode && (
            <div style={{ 
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.18)',
              borderRadius: '8px',
              padding: '0.55rem 0.75rem',
              display: 'flex',
              gap: '0.5rem',
              alignItems: 'flex-start',
              flexShrink: 0
            }}>
              <ShieldAlert size={14} color="#ef4444" style={{ marginTop: '1px', flexShrink: 0 }} />
              <div style={{ fontSize: '0.7rem', color: '#fca5a5', lineHeight: 1.35 }}>
                <strong>No script generated:</strong> Go to the <strong>Automation Scripts</strong> page and generate the script first.
              </div>
            </div>
          )}

          {/* Action button */}
          <button 
            onClick={() => isExecuting ? stopExecution() : startExecution()} 
            disabled={!contextCode && !isExecuting}
            style={{ 
              width: '100%',
              padding: '0.65rem',
              borderRadius: '9px',
              border: `1px solid ${isExecuting ? '#ef4444' : (!contextCode ? 'rgba(255,255,255,0.05)' : '#10b981')}`,
              background: isExecuting 
                ? 'linear-gradient(135deg, rgba(239,68,68,0.12), rgba(220,38,38,0.08))' 
                : (!contextCode 
                    ? 'rgba(255,255,255,0.02)'
                    : 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(5,150,105,0.1))'),
              color: isExecuting ? '#ef4444' : (!contextCode ? '#475569' : '#10b981'),
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: (!contextCode && !isExecuting) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              transition: 'all 0.2s',
              letterSpacing: '0.02em',
              opacity: (!contextCode && !isExecuting) ? 0.6 : 1,
              flexShrink: 0,
              boxShadow: isExecuting ? '0 0 12px rgba(239,68,68,0.08)' : (!contextCode ? 'none' : '0 0 12px rgba(16,185,129,0.08)')
            }}
          >
            {isExecuting ? <Square size={13} /> : <Play size={13} />}
            {isExecuting ? 'Stop Execution' : 'Run Automation Script (CodeGen)'}
          </button>
        </div>

        {/* ===== COLUMN 2: CODEGEN INTEGRATION (CIRCULAR ENGINE) ===== */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '1rem',
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(12px)',
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.06)',
          padding: '1.25rem',
          height: '100%',
          alignItems: 'center',
          justifyContent: 'center',
          boxSizing: 'border-box',
          position: 'relative'
        }}>
          {/* Header */}
          <div style={{ position: 'absolute', top: '1.25rem', left: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Cpu size={15} color="#818cf8" />
            <span style={{ fontSize: '0.85rem', color: '#f8fafc', fontWeight: 600 }}>CodeGen Integration</span>
          </div>

          {/* Glowing Circular Hub */}
          <div style={{ position: 'relative', width: '180px', height: '180px', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
            
            {/* Pulsing Dotted Outer Rings */}
            <div style={{ 
              position: 'absolute', width: '100%', height: '100%', borderRadius: '50%', 
              border: `2px dashed ${contextCode ? '#10b981' : '#ef4444'}`,
              animation: 'spin 15s linear infinite', opacity: 0.35
            }} />
            <div style={{ 
              position: 'absolute', width: '85%', height: '85%', borderRadius: '50%', 
              border: `1.5px solid ${contextCode ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}`,
              animation: 'pulse 2.2s ease-in-out infinite', opacity: 0.5
            }} />
            
            {/* Core Circle */}
            <div style={{ 
              width: '135px', height: '135px', borderRadius: '50%', 
              background: contextCode 
                ? 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, rgba(16,185,129,0.01) 100%)' 
                : 'radial-gradient(circle, rgba(239,68,68,0.12) 0%, rgba(239,68,68,0.01) 100%)',
              border: `2px solid ${contextCode ? '#10b981' : '#ef4444'}`,
              boxShadow: contextCode ? '0 0 25px rgba(16,185,129,0.12)' : '0 0 25px rgba(239,68,68,0.12)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', zIndex: 2
            }}>
              <Code size={28} color={contextCode ? '#10b981' : '#ef4444'} />
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: contextCode ? '#10b981' : '#ef4444', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {contextCode ? 'Connected' : 'Missing'}
              </span>
              <span style={{ fontSize: '0.55rem', color: '#64748b', fontWeight: 600 }}>
                {contextCode ? 'Playwright Spec' : 'No Spec Code'}
              </span>
            </div>
          </div>

          {/* Integration Status Properties */}
          <div style={{ 
            width: '100%', 
            background: 'rgba(0,0,0,0.15)', 
            borderRadius: '10px', 
            padding: '0.85rem 1rem', 
            border: '1px solid rgba(255,255,255,0.03)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            marginTop: '0.5rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.73rem', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '0.35rem' }}>
              <span style={{ color: '#64748b' }}>Test Suite Type</span>
              <strong style={{ color: '#e2e8f0' }}>Playwright CLI</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.73rem', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '0.35rem' }}>
              <span style={{ color: '#64748b' }}>Script File Spec</span>
              <strong style={{ color: '#818cf8', fontFamily: 'monospace' }}>
                {selectedCaseId ? `tests/tp_${selectedCaseId}.spec.ts` : `tests/tp_${story.id}.spec.ts`}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.73rem', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '0.35rem' }}>
              <span style={{ color: '#64748b' }}>Target State</span>
              <strong style={{ color: contextCode ? '#10b981' : '#ef4444', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                {contextCode ? 'Ready' : 'Not Loaded'}
              </strong>
            </div>
          </div>

          {/* Preview code toggle button */}
          {contextCode && (
            <button 
              onClick={() => setShowCodePreview(true)}
              style={{ 
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                color: '#818cf8', fontSize: '0.7rem', fontWeight: 600, padding: '0.35rem 0.7rem', borderRadius: '5px',
                cursor: 'pointer', transition: 'all 0.2s', marginTop: '0.25rem'
              }}
              onMouseOver={(e) => { e.target.style.background = 'rgba(99, 102, 241, 0.08)'; }}
              onMouseOut={(e) => { e.target.style.background = 'rgba(255,255,255,0.03)'; }}
            >
              Preview Spec Code
            </button>
          )}
        </div>

        {/* ===== COLUMN 3: TERMINAL LOGS ===== */}
        <div style={{ 
          background: 'rgba(8, 12, 28, 0.85)', 
          backdropFilter: 'blur(12px)',
          borderRadius: '16px', 
          border: '1px solid rgba(255,255,255,0.05)', 
          padding: '1.1rem', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '0.75rem', 
          minWidth: 0, 
          height: '100%', 
          overflow: 'hidden',
          boxSizing: 'border-box'
        }}>
          {/* Log Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
            <h3 style={{ margin: 0, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.92rem', fontWeight: 600 }}>
              <Terminal size={15} color="#10b981" /> 
              Terminal Output
              {isExecuting && (
                <span style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981', padding: '2px 8px', borderRadius: '50px', fontSize: '0.62rem', border: '1px solid rgba(16,185,129,0.18)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Loader2 size={9} className="spin-icon" /> Run Active
                </span>
              )}
            </h3>
            {logs.length > 0 && (
              <button 
                onClick={clearLogs}
                style={{ 
                  background: 'transparent', border: 'none', color: '#64748b', 
                  fontSize: '0.68rem', cursor: 'pointer', outline: 'none',
                  textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600,
                  transition: 'color 0.2s'
                }}
                onMouseOver={(e) => e.target.style.color = '#cbd5e1'}
                onMouseOut={(e) => e.target.style.color = '#64748b'}
              >
                Clear
              </button>
            )}
          </div>

          {/* Log Terminal */}
          <div style={{ 
            flex: 1, background: 'rgba(0,0,0,0.45)', borderRadius: '10px', padding: '0.85rem', 
            fontFamily: '"Fira Code", "Cascadia Code", monospace', fontSize: '0.76rem', 
            overflowY: 'auto', border: '1px solid rgba(255,255,255,0.04)', minHeight: 0
          }}>
            {logs.length === 0 && (
              <div style={{ color: '#334155', textAlign: 'center', marginTop: '6rem', fontSize: '0.8rem' }}>
                <Terminal size={24} style={{ marginBottom: '0.5rem', opacity: 0.25 }} />
                <div>Waiting for Playwright execution to begin...</div>
              </div>
            )}
            {logs.map((log) => (
              <div key={log.id} style={{ marginBottom: '0.35rem', display: 'flex', gap: '0.55rem', lineHeight: '1.4' }}>
                <span style={{ color: '#334155', flexShrink: 0, userSelect: 'none' }}>[{log.time}]</span>
                <span style={{ color: logColors[log.type] || '#f8fafc', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{log.text}</span>
              </div>
            ))}
            <div ref={logEndRef} />
          </div>

          {/* Status info */}
          {contextCode && (
            <div style={{ 
              fontSize: '0.7rem', color: '#10b981', 
              background: 'rgba(16,185,129,0.05)', 
              padding: '0.45rem 0.75rem', borderRadius: '7px', 
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              border: '1px solid rgba(16,185,129,0.08)',
              flexShrink: 0
            }}>
              <Info size={11} /> Spec script testDir path resolved dynamically inside tests/
            </div>
          )}
        </div>
      </div>

      {/* ===== SPEC CODE MODAL WINDOW ===== */}
      <AnimatePresence>
        {showCodePreview && (
          <div style={{ 
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
          }}>
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{ 
                width: '680px', height: '520px', 
                background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.1)', 
                borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '1.25rem'
              }}
            >
              {/* Modal Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Code size={16} color="#818cf8" />
                  <span style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 600 }}>Playwright Spec Source Code</span>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button 
                    onClick={manualSave}
                    style={{ 
                      background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', 
                      color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.25rem', 
                      fontSize: '0.68rem', cursor: 'pointer', padding: '0.3rem 0.6rem', borderRadius: '5px', fontWeight: 600
                    }}
                  >
                    {saved ? <Check size={11} /> : <Save size={11} />}
                    {saved ? 'Saved' : 'Save'}
                  </button>
                  <button 
                    onClick={copyCode}
                    style={{ 
                      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', 
                      color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '0.25rem', 
                      fontSize: '0.68rem', cursor: 'pointer', padding: '0.3rem 0.6rem', borderRadius: '5px', fontWeight: 600
                    }}
                  >
                    {copied ? <Check size={11} /> : null}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                  <button 
                    onClick={() => setShowCodePreview(false)}
                    style={{ 
                      background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', 
                      color: '#ef4444', fontSize: '0.68rem', cursor: 'pointer', padding: '0.3rem 0.6rem', 
                      borderRadius: '5px', fontWeight: 600
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>

              {/* Code text block */}
              <div style={{ flex: 1, background: '#090d16', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.03)' }}>
                <textarea
                  spellCheck="false"
                  value={contextCode}
                  onChange={(e) => setContextCode(e.target.value)}
                  style={{
                    width: '100%', height: '100%', background: 'transparent', color: '#94a3b8',
                    fontFamily: '"Fira Code", monospace', fontSize: '0.78rem', lineHeight: '1.45',
                    padding: '1rem', border: 'none', resize: 'none', outline: 'none', boxSizing: 'border-box'
                  }}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .spin-icon { animation: spin 1.5s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        
        * {
          scrollbar-width: thin;
          scrollbar-color: rgba(99,102,241,0.12) rgba(255,255,255,0.01);
        }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: rgba(255,255,255,0.01); border-radius: 8px; }
        ::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.12); border-radius: 8px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(99,102,241,0.3); }
      `}</style>
    </div>
  );
};

export default ExecutionPage;
