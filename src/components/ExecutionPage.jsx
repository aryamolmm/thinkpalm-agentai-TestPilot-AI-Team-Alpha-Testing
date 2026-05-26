import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, Play, Square, Terminal, CheckCircle2, XCircle, 
  Loader2, Image as ImageIcon, Settings, Eye, EyeOff,
  Plus, Trash2, Edit3, Save, ChevronRight, FileText, Code,
  ChevronDown, ChevronUp, Globe, User, Lock, Zap
} from 'lucide-react';
import axios from 'axios';
import { API_URLS } from '../services/api';

const ExecutionPage = ({ story, credentials }) => {
  const [steps, setSteps] = useState([]);
  const [generatedCases, setGeneratedCases] = useState([]);
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [headless, setHeadless] = useState(true);
  const [engine, setEngine] = useState('groq');
  const [currentExecution, setCurrentExecution] = useState(null);
  const [logs, setLogs] = useState([]);
  const [stepStatus, setStepStatus] = useState({}); 
  const [screenshots, setScreenshots] = useState({}); 
  const [contextCode, setContextCode] = useState('');
  
  const [targetUrl, setTargetUrl] = useState('');
  const [targetUser, setTargetUser] = useState('');
  const [targetPass, setTargetPass] = useState('');
  const [showWarning, setShowWarning] = useState(true);
  const [envExpanded, setEnvExpanded] = useState(true);
  const [caseExpanded, setCaseExpanded] = useState(true);
  
  const eventSourceRef = useRef(null);
  const logEndRef = useRef(null);

  // Load Generated Cases and Script
  useEffect(() => {
    if (story?.id) {
      const storedCases = localStorage.getItem(`testpilot_cases_${story.id}`);
      if (storedCases) {
        const parsed = JSON.parse(storedCases);
        setGeneratedCases(parsed);
        if (parsed.length > 0) {
            handleCaseSelect(parsed[0].TC_ID, parsed);
        }
      } else {
        const initialSteps = story.Steps?.split('\n').filter(s => s.trim()) || [];
        setSteps(initialSteps.map((text, id) => ({ id, text, isEditing: false })));
      }

      const storedScript = localStorage.getItem(`testpilot_script_${story.id}`);
      if (storedScript) setContextCode(storedScript);
    }
  }, [story]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleCaseSelect = (caseId, sourceCases = generatedCases) => {
    setSelectedCaseId(caseId);
    const tc = sourceCases.find(c => c.TC_ID === caseId);
    if (tc) {
        let uiSteps = [];
        if (tc.Precondition || tc.Preconditions) {
            uiSteps.push(`PRECONDITION: ${tc.Precondition || tc.Preconditions}`);
        } else {
            uiSteps.push('No preconditions defined.');
        }
        setSteps(uiSteps.map((text, id) => ({ id, text, isEditing: false })));
    }
  };

  const addStep = () => {
    setSteps([...steps, { id: Date.now(), text: 'New Step', isEditing: true }]);
  };

  const removeStep = (id) => {
    setSteps(steps.filter(s => s.id !== id));
  };

  const updateStepText = (id, text) => {
    setSteps(steps.map(s => s.id === id ? { ...s, text } : s));
  };

  const toggleEdit = (id) => {
    setSteps(steps.map(s => s.id === id ? { ...s, isEditing: !s.isEditing } : s));
  };

  const [executionQueue, setExecutionQueue] = useState([]);
  const [runningTcId, setRunningTcId] = useState('');
  const isTransitioningRef = useRef(false);

  useEffect(() => {
    if (!isExecuting && executionQueue.length > 0 && !isTransitioningRef.current) {
      isTransitioningRef.current = true;
      const nextTcId = executionQueue[0];
      
      const tc = generatedCases.find(c => c.TC_ID === nextTcId);
      if (tc) {
        setRunningTcId(nextTcId);
        setExecutionQueue(prev => prev.slice(1));
        
        let allSteps = [];
        if (tc.Precondition || tc.Preconditions) {
            allSteps.push(`PRECONDITION: ${tc.Precondition || tc.Preconditions}`);
        }
        const rawSteps = tc.Gherkin || tc.Steps || tc.Scenario || '';
        const parsedSteps = rawSteps.split('\n')
            .filter(s => s.trim())
            .filter(s => !s.trim().toLowerCase().startsWith('scenario:'))
            .map(s => s.trim());
        allSteps = [...allSteps, ...parsedSteps];
        
        handleCaseSelect(nextTcId);
        
        setIsExecuting(true);
        setTimeout(() => {
           startAgentExecution(nextTcId, allSteps);
           isTransitioningRef.current = false;
        }, 1000);
      } else {
        setExecutionQueue(prev => prev.slice(1));
        isTransitioningRef.current = false;
      }
    } else if (!isExecuting && executionQueue.length === 0) {
      setRunningTcId('');
    }
  }, [isExecuting, executionQueue, generatedCases]);

  const runAllSequential = () => {
    if (generatedCases.length === 0) return;
    const allIds = generatedCases.map(c => c.TC_ID);
    setExecutionQueue(allIds);
  };

  const startAgentExecution = async (tcIdOverride = null, stepsOverride = null) => {
    setIsExecuting(true);
    setLogs([]);
    setStepStatus({});
    setScreenshots({});
    
    try {
      const activeTcId = tcIdOverride || selectedCaseId || story.id;
      const tc = generatedCases.find(c => c.TC_ID === activeTcId);
      
      let finalSteps = [];
      const uiSteps = steps.map(s => s.text);
      
      if (stepsOverride) {
          finalSteps = stepsOverride;
      } else if (tc) {
          const rawBdd = tc.Gherkin || tc.Steps || tc.Scenario || '';
          const bddSteps = rawBdd.split('\n')
              .filter(s => s.trim())
              .filter(s => !s.trim().toLowerCase().startsWith('scenario:'))
              .map(s => s.trim());
          finalSteps = [...uiSteps, ...bddSteps];
      } else {
          finalSteps = uiSteps;
      }

      const storedInstruction = localStorage.getItem(`testpilot_instruction_${story.id}`);
      const fallbackInstruction = localStorage.getItem('testpilot_ai_memory') || '';
      
      const resp = await axios.post(API_URLS.AGENT_EXECUTE, {
        test_case_id: activeTcId,
        steps: finalSteps,
        headless,
        engine,
        contextCode,
        userInstructions: storedInstruction || story.Description || fallbackInstruction || '',
        credentials,
        envConfig: { url: targetUrl, user: targetUser, pass: targetPass }
      });

      const { executionId } = resp.data;
      setCurrentExecution(executionId);
      setupStream(executionId, activeTcId);
    } catch (err) {
      addLog(`❌ Failed to start agent: ${err.message}`, 'error');
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
        setStepStatus(prev => ({ ...prev, [data.index]: 'running' }));
        addLog(`🚀 Starting: ${data.step}`, 'info');
        break;
      case 'TOOL_CALL':
        addLog(`🛠️ Tool: ${data.name} (${JSON.stringify(data.args)})`, 'tool');
        break;
      case 'OBSERVATION':
        addLog(`👁️ Obs: ${data.observation}`, 'obs');
        break;
      case 'SCREENSHOT':
        setScreenshots(prev => {
            const stepIdx = Object.keys(stepStatus).find(k => stepStatus[k] === 'running');
            return { ...prev, [stepIdx]: [...(prev[stepIdx] || []), data.filename] };
        });
        break;
      case 'STEP_COMPLETE':
        setStepStatus(prev => ({ ...prev, [data.index]: 'completed' }));
        addLog(`✅ Step ${data.index + 1} finished`, 'success');
        break;
      case 'STEP_FAILED':
        setStepStatus(prev => ({ ...prev, [data.index]: 'failed' }));
        addLog(`❌ Step ${data.index + 1} failed`, 'error');
        break;
      case 'EXECUTION_COMPLETE':
        setIsExecuting(false);
        addLog(`🏁 Execution Finished: ${data.status} ${data.error ? '(' + data.error + ')' : ''}`, data.status === 'Success' ? 'success' : 'error');
        eventSourceRef.current?.close();
        
        axios.post(API_URLS.EXECUTE_TEST, {
          test_case_id: tcId,
          status: data.status === 'Success' ? 'Pass' : 'Fail',
          comments: `AI Agent execution finished with status: ${data.status}`,
          manual: false,
          storyKey: story?.key
        }).catch(err => console.error('Failed to save AI report', err));
        break;
      case 'ERROR':
        addLog(`⚠️ Error: ${data.error}`, 'error');
        break;
    }
  };

  const addLog = (text, type) => {
    setLogs(prev => [...prev, { id: Date.now(), text, type, time: new Date().toLocaleTimeString() }]);
  };

  const stopExecution = () => {
    eventSourceRef.current?.close();
    setIsExecuting(false);
    addLog('🛑 Execution stopped by user', 'warn');
  };

  const logColors = {
    info: '#818cf8',
    tool: '#fbbf24',
    obs: '#94a3b8',
    success: '#10b981',
    error: '#ef4444',
    warn: '#f59e0b'
  };

  const isVercel = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: 'calc(100vh - 140px)', overflow: 'hidden' }}>
      
      {/* Top Warning Banner */}
      {isVercel && (
        <div style={{ 
          background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(234,88,12,0.08))', 
          border: '1px solid rgba(245,158,11,0.3)', 
          borderRadius: '10px', 
          padding: '0.65rem 1.2rem', 
          color: '#fef3c7',
          fontSize: '0.82rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flex: 1 }}>
            <span style={{ fontSize: '1rem' }}>🚫</span>
            <span>
              <strong style={{ color: '#fbbf24' }}>Browser Execution Unavailable on Vercel: </strong>
              Headless Chrome cannot run in serverless containers. Please run locally:
              <code style={{ background: 'rgba(0,0,0,0.35)', padding: '1px 6px', borderRadius: '3px', marginLeft: '4px' }}>npm run server</code>
              {' '}then open{' '}
              <code style={{ background: 'rgba(0,0,0,0.35)', padding: '1px 6px', borderRadius: '3px' }}>http://localhost:5173</code>
            </span>
          </div>
        </div>
      )}

      {/* Main 2-column Layout */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '420px 1fr', 
        gap: '1.25rem', 
        flex: 1, 
        minHeight: 0,
        overflow: 'hidden'
      }}>
        
        {/* ===== LEFT PANEL ===== */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '0.85rem',
          overflowY: 'auto',
          paddingRight: '4px',
          height: '100%'
        }}>
          
          {/* Header Row */}
          <div style={{ 
            background: 'rgba(15,23,42,0.7)', 
            backdropFilter: 'blur(12px)', 
            borderRadius: '14px', 
            border: '1px solid rgba(99,102,241,0.15)', 
            padding: '1rem 1.2rem',
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ margin: 0, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
                  <FileText size={17} color="#818cf8" /> Agent Execution
                </h3>
                <p style={{ margin: '0.2rem 0 0', color: '#64748b', fontSize: '0.78rem' }}>Configure and run AI-driven test sequences</p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                <button 
                  onClick={runAllSequential} 
                  disabled={isExecuting || generatedCases.length === 0} 
                  style={{ 
                    background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', 
                    color: '#10b981', padding: '0.4rem 0.75rem', borderRadius: '8px', 
                    fontSize: '0.73rem', cursor: isExecuting ? 'not-allowed' : 'pointer', 
                    display: 'flex', alignItems: 'center', gap: '0.35rem', opacity: isExecuting ? 0.5 : 1 
                  }}
                >
                  <Play size={12} /> Run All
                </button>
                <button 
                  onClick={addStep} 
                  style={{ 
                    background: 'rgba(129,140,248,0.1)', border: '1px solid rgba(129,140,248,0.3)', 
                    color: '#818cf8', padding: '0.4rem 0.75rem', borderRadius: '8px', 
                    fontSize: '0.73rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' 
                  }}
                >
                  <Plus size={12} /> Add Step
                </button>
              </div>
            </div>
          </div>

          {/* Test Case Selector */}
          <div style={{ 
            background: 'rgba(15,23,42,0.7)', 
            backdropFilter: 'blur(12px)', 
            borderRadius: '14px', 
            border: '1px solid rgba(255,255,255,0.06)', 
            overflow: 'hidden',
            flexShrink: 0
          }}>
            <div 
              onClick={() => setCaseExpanded(!caseExpanded)}
              style={{ 
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                padding: '0.75rem 1.1rem', cursor: 'pointer',
                background: 'rgba(99,102,241,0.04)',
                borderBottom: caseExpanded ? '1px solid rgba(255,255,255,0.04)' : 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Zap size={13} color="#6366f1" />
                <span style={{ fontSize: '0.72rem', color: '#6366f1', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Select Test Case
                </span>
              </div>
              {caseExpanded ? <ChevronUp size={14} color="#6366f1" /> : <ChevronDown size={14} color="#6366f1" />}
            </div>
            {caseExpanded && (
              <div style={{ padding: '0.85rem 1.1rem' }}>
                <select 
                    value={selectedCaseId} 
                    onChange={(e) => handleCaseSelect(e.target.value)}
                    style={{ 
                      width: '100%', background: 'rgba(0,0,0,0.25)', 
                      border: '1px solid rgba(99,102,241,0.2)', color: '#f1f5f9', 
                      outline: 'none', fontSize: '0.85rem', padding: '0.55rem 0.8rem', 
                      borderRadius: '9px', cursor: 'pointer',
                      boxSizing: 'border-box'
                    }}
                >
                    <option value="" disabled style={{ background: '#0f172a' }}>Choose a test case...</option>
                    {generatedCases.length > 0 ? (
                        generatedCases.map(tc => (
                            <option key={tc.TC_ID} value={tc.TC_ID} style={{ background: '#0f172a' }}>
                                {tc.TC_ID}: {tc.Title || tc['Test Case Title'] || tc.Scenario?.split('\n')[0]?.slice(0, 45)}
                            </option>
                        ))
                    ) : (
                        <option value="manual" style={{ background: '#0f172a' }}>Story Default Steps</option>
                    )}
                </select>
              </div>
            )}
          </div>

          {/* Target Environment */}
          <div style={{ 
            background: 'rgba(15,23,42,0.7)', 
            backdropFilter: 'blur(12px)', 
            borderRadius: '14px', 
            border: '1px solid rgba(255,255,255,0.06)', 
            overflow: 'hidden',
            flexShrink: 0
          }}>
            <div 
              onClick={() => setEnvExpanded(!envExpanded)}
              style={{ 
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                padding: '0.75rem 1.1rem', cursor: 'pointer',
                background: 'rgba(16,185,129,0.04)',
                borderBottom: envExpanded ? '1px solid rgba(255,255,255,0.04)' : 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Globe size={13} color="#10b981" />
                <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Target Environment
                </span>
              </div>
              {envExpanded ? <ChevronUp size={14} color="#10b981" /> : <ChevronDown size={14} color="#10b981" />}
            </div>
            {envExpanded && (
              <div style={{ padding: '0.85rem 1.1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <div style={{ position: 'relative' }}>
                  <Globe size={13} color="#475569" style={{ position: 'absolute', left: '0.7rem', top: '50%', transform: 'translateY(-50%)' }} />
                  <input 
                      type="text" 
                      placeholder="Application URL (e.g., http://192.168.1.1/login)" 
                      value={targetUrl}
                      onChange={(e) => setTargetUrl(e.target.value)}
                      style={{ 
                        width: '100%', background: 'rgba(0,0,0,0.2)', 
                        border: '1px solid rgba(255,255,255,0.07)', color: '#f1f5f9', 
                        padding: '0.55rem 0.8rem 0.55rem 2.2rem', borderRadius: '9px', 
                        fontSize: '0.83rem', outline: 'none', boxSizing: 'border-box'
                      }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                  <div style={{ position: 'relative' }}>
                    <User size={13} color="#475569" style={{ position: 'absolute', left: '0.7rem', top: '50%', transform: 'translateY(-50%)' }} />
                    <input 
                        type="text" 
                        placeholder="Username" 
                        value={targetUser}
                        onChange={(e) => setTargetUser(e.target.value)}
                        style={{ 
                          width: '100%', background: 'rgba(0,0,0,0.2)', 
                          border: '1px solid rgba(255,255,255,0.07)', color: '#f1f5f9', 
                          padding: '0.55rem 0.6rem 0.55rem 2.2rem', borderRadius: '9px', 
                          fontSize: '0.83rem', outline: 'none', boxSizing: 'border-box'
                        }}
                    />
                  </div>
                  <div style={{ position: 'relative' }}>
                    <Lock size={13} color="#475569" style={{ position: 'absolute', left: '0.7rem', top: '50%', transform: 'translateY(-50%)' }} />
                    <input 
                        type="password" 
                        placeholder="Password" 
                        value={targetPass}
                        onChange={(e) => setTargetPass(e.target.value)}
                        style={{ 
                          width: '100%', background: 'rgba(0,0,0,0.2)', 
                          border: '1px solid rgba(255,255,255,0.07)', color: '#f1f5f9', 
                          padding: '0.55rem 0.6rem 0.55rem 2.2rem', borderRadius: '9px', 
                          fontSize: '0.83rem', outline: 'none', boxSizing: 'border-box'
                        }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Execution Steps */}
          <div style={{ 
            background: 'rgba(15,23,42,0.7)', 
            backdropFilter: 'blur(12px)', 
            borderRadius: '14px', 
            border: '1px solid rgba(255,255,255,0.06)', 
            padding: '0.85rem 1.1rem',
            flex: '1 1 auto',
            minHeight: '120px',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.6rem'
          }}>
            <div style={{ fontSize: '0.72rem', color: '#818cf8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
              <ChevronRight size={13} /> Execution Steps
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              <AnimatePresence>
                {steps.map((step, index) => (
                  <motion.div 
                    key={step.id}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    style={{ 
                      background: stepStatus[index] === 'running' 
                        ? 'rgba(99,102,241,0.08)' 
                        : 'rgba(255,255,255,0.02)', 
                      borderRadius: '10px', 
                      padding: '0.65rem 0.9rem', 
                      marginBottom: '0.5rem',
                      border: `1px solid ${
                        stepStatus[index] === 'running' ? 'rgba(99,102,241,0.4)' : 
                        stepStatus[index] === 'completed' ? 'rgba(16,185,129,0.2)' : 
                        stepStatus[index] === 'failed' ? 'rgba(239,68,68,0.2)' : 
                        'rgba(255,255,255,0.04)'
                      }`,
                      display: 'flex',
                      gap: '0.75rem',
                      alignItems: 'center',
                      transition: 'border-color 0.2s'
                    }}
                  >
                    <div style={{ 
                      width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
                      background: stepStatus[index] === 'completed' ? 'rgba(16,185,129,0.15)' : 
                                  stepStatus[index] === 'failed' ? 'rgba(239,68,68,0.15)' :
                                  'rgba(99,102,241,0.15)', 
                      color: stepStatus[index] === 'completed' ? '#10b981' : 
                             stepStatus[index] === 'failed' ? '#ef4444' : '#818cf8',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.72rem', fontWeight: 700
                    }}>
                      {index + 1}
                    </div>
                    
                    <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                      {step.isEditing ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%' }}>
                          <input 
                            autoFocus
                            style={{ 
                              flex: 1,
                              minWidth: 0,
                              background: 'rgba(99,102,241,0.08)', 
                              border: 'none',
                              borderBottom: '2px solid #818cf8', 
                              color: '#f8fafc', 
                              outline: 'none', 
                              padding: '4px 6px', 
                              fontSize: '0.85rem',
                              borderRadius: '4px 4px 0 0'
                            }}
                            value={step.text}
                            onChange={(e) => updateStepText(step.id, e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && toggleEdit(step.id)}
                          />
                          <button 
                            onClick={() => toggleEdit(step.id)} 
                            title="Save (Enter)"
                            style={{ 
                              background: 'rgba(16,185,129,0.15)', 
                              border: '1px solid rgba(16,185,129,0.3)', 
                              color: '#10b981', 
                              cursor: 'pointer', 
                              flexShrink: 0,
                              width: '28px',
                              height: '28px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '6px'
                            }}
                          >
                            <Save size={13} />
                          </button>
                        </div>
                      ) : (
                        <div 
                          onClick={() => !isExecuting && toggleEdit(step.id)}
                          title={isExecuting ? '' : 'Click to edit'}
                          style={{ color: '#cbd5e1', cursor: isExecuting ? 'default' : 'text', fontSize: '0.85rem', wordBreak: 'break-word', lineHeight: '1.4' }}
                        >
                          {step.text}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center', flexShrink: 0 }}>
                      {stepStatus[index] === 'completed' && <CheckCircle2 size={15} color="#10b981" />}
                      {stepStatus[index] === 'failed' && <XCircle size={15} color="#ef4444" />}
                      {stepStatus[index] === 'running' && <Loader2 size={15} color="#818cf8" className="spin-icon" />}
                      {!isExecuting && (
                        <button onClick={() => removeStep(step.id)} style={{ background: 'transparent', border: 'none', color: '#334155', cursor: 'pointer', marginLeft: '0.2rem', display: 'flex', alignItems: 'center' }}>
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Context Info */}
          {contextCode && (
            <div style={{ 
              fontSize: '0.75rem', color: '#10b981', 
              background: 'rgba(16,185,129,0.06)', 
              padding: '0.5rem 0.85rem', borderRadius: '9px', 
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              border: '1px solid rgba(16,185,129,0.1)',
              flexShrink: 0
            }}>
              <Code size={13} /> Automation context loaded — agent will use it for selector hints.
            </div>
          )}

          {/* Engine + Mode + Run Button */}
          <div style={{ 
            background: 'rgba(15,23,42,0.7)', 
            backdropFilter: 'blur(12px)', 
            borderRadius: '14px', 
            border: '1px solid rgba(255,255,255,0.06)', 
            padding: '0.9rem 1.1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            flexShrink: 0
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {/* Engine Selector */}
              <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '0.5rem 0.75rem', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: '0.68rem', color: '#64748b', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>AI Engine</div>
                <select 
                  value={engine} 
                  onChange={(e) => setEngine(e.target.value)}
                  style={{ background: 'transparent', border: 'none', color: '#f1f5f9', outline: 'none', fontSize: '0.85rem', width: '100%', cursor: 'pointer' }}
                >
                  <option value="groq" style={{ background: '#0f172a' }}>⚡ Groq (Llama 3)</option>
                  <option value="openrouter" style={{ background: '#0f172a' }}>🔀 OpenRouter</option>
                  <option value="gemini" style={{ background: '#0f172a' }}>✨ Gemini</option>
                </select>
              </div>
              
              {/* Mode Toggle */}
              <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '0.5rem 0.75rem', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Browser Mode</div>
                <button 
                  onClick={() => setHeadless(!headless)} 
                  style={{ 
                    background: 'transparent', border: 'none', color: headless ? '#94a3b8' : '#10b981', 
                    display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.85rem', padding: 0, fontWeight: 500
                  }}
                >
                  {headless ? <EyeOff size={14} /> : <Eye size={14} />} {headless ? 'Headless' : 'Headed (Visible)'}
                </button>
              </div>
            </div>

            {/* Run/Stop Button */}
            {isVercel ? (
              <div style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '11px',
                border: '1px solid rgba(245,158,11,0.3)',
                background: 'rgba(245,158,11,0.06)',
                color: '#92400e',
                fontSize: '0.85rem',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                cursor: 'not-allowed',
                letterSpacing: '0.01em'
              }}>
                <span style={{ fontSize: '1rem' }}>🚫</span>
                Execution requires local server
              </div>
            ) : (
              <button 
                onClick={() => isExecuting ? stopExecution() : startAgentExecution(selectedCaseId || null, null)} 
                style={{ 
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '11px',
                  border: `1px solid ${isExecuting ? '#ef4444' : '#10b981'}`,
                  background: isExecuting 
                    ? 'linear-gradient(135deg, rgba(239,68,68,0.12), rgba(220,38,38,0.08))' 
                    : 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(5,150,105,0.1))',
                  color: isExecuting ? '#ef4444' : '#10b981',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s',
                  letterSpacing: '0.02em'
                }}
              >
                {isExecuting ? <Square size={16} /> : <Bot size={16} />}
                {isExecuting 
                  ? `Stop Agent ${executionQueue.length > 0 ? `(${executionQueue.length} queued)` : ''}` 
                  : 'Run Selected Test Case'
                }
              </button>
            )}
          </div>
        </div>

        {/* ===== RIGHT PANEL: LIVE AGENT LOGS ===== */}
        <div style={{ 
          background: 'rgba(8,12,28,0.85)', 
          backdropFilter: 'blur(12px)',
          borderRadius: '16px', 
          border: '1px solid rgba(255,255,255,0.05)', 
          padding: '1.2rem', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '1rem', 
          minWidth: 0, 
          height: '100%', 
          overflow: 'hidden' 
        }}>
          {/* Log Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
            <h3 style={{ margin: 0, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1rem' }}>
              <Terminal size={17} color="#10b981" /> 
              Live Agent Log 
              {runningTcId && (
                <span style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8', padding: '2px 10px', borderRadius: '6px', fontSize: '0.7rem', border: '1px solid rgba(99,102,241,0.2)', fontWeight: 600 }}>
                  {runningTcId}
                </span>
              )}
            </h3>
            {isExecuting && (
              <div style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="dot-blink" style={{ width: '7px', height: '7px', background: '#10b981', borderRadius: '50%', display: 'inline-block' }} />
                {runningTcId ? 'Executing Test Case...' : 'Streaming...'}
              </div>
            )}
          </div>

          {/* Log Terminal */}
          <div style={{ 
            flex: 1, background: 'rgba(0,0,0,0.4)', borderRadius: '12px', padding: '1rem', 
            fontFamily: '"Fira Code", "Cascadia Code", monospace', fontSize: '0.82rem', 
            overflowY: 'auto', border: '1px solid rgba(255,255,255,0.04)', minHeight: 0
          }}>
            {logs.length === 0 && (
              <div style={{ color: '#334155', textAlign: 'center', marginTop: '5rem', fontSize: '0.85rem' }}>
                <Terminal size={32} style={{ marginBottom: '0.75rem', opacity: 0.3 }} />
                <div>Waiting for execution to start...</div>
              </div>
            )}
            {logs.map(log => (
              <div key={log.id} style={{ marginBottom: '0.45rem', display: 'flex', gap: '0.75rem', lineHeight: '1.5' }}>
                <span style={{ color: '#334155', flexShrink: 0 }}>[{log.time}]</span>
                <span style={{ color: logColors[log.type] || '#f8fafc', wordBreak: 'break-word' }}>{log.text}</span>
              </div>
            ))}
            <div ref={logEndRef} />
          </div>

          {/* Screenshot Gallery */}
          <div style={{ 
            height: '110px', background: 'rgba(255,255,255,0.02)', borderRadius: '11px', 
            padding: '0.65rem 0.85rem', display: 'flex', gap: '0.65rem', 
            overflowX: 'auto', flexShrink: 0, border: '1px solid rgba(255,255,255,0.03)',
            alignItems: 'center'
          }}>
            {Object.values(screenshots).flat().length === 0 ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#1e293b' }}>
                <ImageIcon size={22} style={{ marginBottom: '0.35rem' }} />
                <span style={{ fontSize: '0.72rem' }}>No screenshots yet</span>
              </div>
            ) : (
              Object.values(screenshots).flat().map((src, i) => (
                <div key={i} style={{ position: 'relative', minWidth: '160px', height: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
                  <img src={API_URLS.RECORDINGS(src)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Step screenshot" />
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.65)', padding: '2px 7px', fontSize: '0.62rem', color: '#fff' }}>
                    Capture #{i+1}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <style>{`
        .dot-blink { animation: blink 1.5s infinite; }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        .spin-icon { animation: spin 2s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        
        * {
          scrollbar-width: thin;
          scrollbar-color: rgba(99,102,241,0.2) rgba(255,255,255,0.01);
        }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: rgba(255,255,255,0.01); border-radius: 8px; }
        ::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.2); border-radius: 8px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(99,102,241,0.4); }
      `}</style>
    </div>
  );
};

export default ExecutionPage;
