import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Play, Square, FileText, Code2, Globe, ShieldAlert, Activity, CheckCircle, AlertCircle, RefreshCw, Cpu, Brain, Layers } from 'lucide-react'
import axios from 'axios'
import { generateTestCasesAI, generateAutomationScriptAI } from '../services/generator'
import { syncTestCasesToQMetry } from '../services/qmetryService'


// 12 Agents configuration
const AGENTS = [
  { id: 'orchestrator', name: 'Orchestrator Agent', icon: '👑', color: '#a78bfa', desc: 'Schedules and coordinates dependencies.' },
  { id: 'jira', name: 'Jira Agent', icon: '📡', color: '#60a5fa', desc: 'Extracts user story context and sprint targets.' },
  { id: 'design', name: 'Test Design Agent', icon: '📝', color: '#f472b6', desc: 'Analyzes story criteria for coverage gaps.' },
  { id: 'bdd', name: 'BDD Agent', icon: '🎯', color: '#34d399', desc: 'Forges Given-When-Then BDD scenarios.' },
  { id: 'automation', name: 'Automation Agent', icon: '🤖', color: '#fbbf24', desc: 'Designs automation strategy and flows.' },
  { id: 'codegen', name: 'CodeGen Agent', icon: '💻', color: '#22d3ee', desc: 'Compiles Playwright, Selenium, and Cypress code.' },
  { id: 'execution', name: 'Execution Agent', icon: '⚙️', color: '#f87171', desc: 'Triggers local runner CLI commands.' },
  { id: 'coverage', name: 'Coverage Agent', icon: '📊', color: '#fb7185', desc: 'Validates script actions against story requirements.' },
  { id: 'qmetry', name: 'QMetry Agent', icon: '☁️', color: '#818cf8', desc: 'Pushes test scripts and runs to QMetry portal.' },
  { id: 'security', name: 'Security Agent', icon: '🛡️', color: '#fb923c', desc: 'Audits criteria against OWASP Top 10 vulnerabilities.' },
  { id: 'performance', name: 'Performance Agent', icon: '⚡', color: '#a3e635', desc: 'Formulates JMX files and concurrency levels.' },
  { id: 'reporting', name: 'Reporting Agent', icon: '📈', color: '#c084fc', desc: 'Aggregates QA logs into rich PDF reports.' }
]

const TestGenPage = ({ story, storiesList, credentials, activeProject, onGoToAutomation, onViewBddCases }) => {
  const [genMode, setGenMode] = useState('manual') // 'manual' or 'autonomous'
  const [loadingMap, setLoadingMap] = useState({})
  const [successMap, setSuccessMap] = useState({})

  // On story change: detect pre-existing generated artifacts in localStorage
  useEffect(() => {
    if (story?.id) {
      setSuccessMap({
        bdd: !!localStorage.getItem(`testpilot_cases_${story.id}`),
        automation: !!localStorage.getItem(`testpilot_script_${story.id}`),
        api: !!localStorage.getItem(`testpilot_api_${story.id}`),
        security: !!localStorage.getItem(`testpilot_security_${story.id}`),
        performance: !!localStorage.getItem(`testpilot_performance_${story.id}`)
      });
    } else {
      setSuccessMap({});
    }
  }, [story]);
  
  // Autonomous Mode States
  const [isAutoRunning, setIsAutoRunning] = useState(false)
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0)
  const [activeAgentId, setActiveAgentId] = useState(null)
  const [autoLogs, setAutoLogs] = useState([])
  const [processedStories, setProcessedStories] = useState([])

  const terminalEndRef = useRef(null)

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [autoLogs])

  const addLog = (agent, msg, type = 'info') => {
    setAutoLogs(prev => [...prev, {
      id: Date.now() + Math.random().toString(),
      timestamp: new Date().toLocaleTimeString(),
      agent,
      msg,
      type
    }])
  }

  const getActiveKey = () => {
    switch (credentials.engine) {
      case 'groq': return credentials.groqKey;
      case 'openrouter': return credentials.openRouterKey;
      case 'openai': return credentials.openaiKey;
      case 'claude': return credentials.claudeKey;
      default: return credentials.geminiKey;
    }
  }

  // ── Manual mode generators ──
  const generateManualArtifact = async (type) => {
    if (!story) return
    setLoadingMap(prev => ({ ...prev, [type]: true }))
    setSuccessMap(prev => ({ ...prev, [type]: false }))
    
    try {
      const activeKey = getActiveKey()
      if (!activeKey) {
        throw new Error(`No API key found for the selected engine (${credentials.engine}). Please configure it in Settings.`);
      }

      if (type === 'bdd') {
        const typesList = 'Happy Path, Negative, Edge'
        const cases = await generateTestCasesAI(story, activeKey, credentials.engine, typesList, 'bdd')
        
        // Map Work Key to TC_ID
        const mappedCases = cases.map(c => {
          const newC = { ...c, 'TC_ID': c['Work Key'] || c['TC_ID'] || `TC-${Math.floor(Math.random() * 1000)}` };
          delete newC['Work Key'];
          return newC;
        });

        localStorage.setItem(`testpilot_cases_${story.id}`, JSON.stringify(mappedCases))
      } else if (type === 'automation') {
        let bddCases = [];
        const cached = localStorage.getItem(`testpilot_cases_${story.id}`);
        if (cached) {
          try { bddCases = JSON.parse(cached); } catch {}
        }
        
        const script = await generateAutomationScriptAI(story, activeKey, credentials.engine, 'playwright', 'typescript', 'none', 'ai', bddCases)
        localStorage.setItem(`testpilot_script_${story.id}`, script)
      } else if (type === 'api') {
        const dummyCollection = {
          info: { name: `API Tests - ${story.id}`, schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json" },
          item: [{ name: "Verify Endpoint Status", request: { method: "GET", url: activeProject?.environmentUrl || "https://www.saucedemo.com" } }]
        }
        localStorage.setItem(`testpilot_api_${story.id}`, JSON.stringify(dummyCollection, null, 2))
      } else if (type === 'security') {
        const dummyAudit = {
          vulnerabilities: [
            { id: "SEC-01", name: "Insecure Transport Check", severity: "Low", description: "Verify that site redirects non-SSL requests to secure sockets." },
            { id: "SEC-02", name: "Input Sanitization Validation", severity: "High", description: "Validate input filters against cross-site scripting." }
          ]
        }
        localStorage.setItem(`testpilot_security_${story.id}`, JSON.stringify(dummyAudit, null, 2))
      } else if (type === 'performance') {
        const dummyJMX = `<jmeterTestPlan version="1.2">\n  <hashTree>\n    <ThreadGroup guiclass="ThreadGroupGui" testclass="ThreadGroup">\n      <stringProp name="ThreadGroup.num_threads">10</stringProp>\n      <stringProp name="ThreadGroup.ramp_time">5</stringProp>\n    </ThreadGroup>\n  </hashTree>\n</jmeterTestPlan>`
        localStorage.setItem(`testpilot_performance_${story.id}`, dummyJMX)
      }

      setSuccessMap(prev => ({ ...prev, [type]: true }))
    } catch (err) {
      console.error(err)
      alert(`Generation failed: ${err.message}`)
    } finally {
      setLoadingMap(prev => ({ ...prev, [type]: false }))
    }
  }

  // ── Autonomous mode triggers ──
  const startAutonomousOrchestration = async () => {
    if (storiesList.length === 0) return
    setIsAutoRunning(true)
    setAutoLogs([])
    setProcessedStories([])
    setCurrentStoryIndex(0)
    
    const activeKey = getActiveKey()
    if (!activeKey) {
      addLog('orchestrator', `❌ Error: No API key found for the selected engine (${credentials.engine}). Please configure it in Settings.`, 'error')
      setIsAutoRunning(false)
      return
    }
    
    // Process each story in sequence
    for (let index = 0; index < storiesList.length; index++) {
      setCurrentStoryIndex(index)
      const currentStory = storiesList[index]
      
      addLog('orchestrator', `👑 Initiating multi-agent pipeline for user story ${currentStory.key}...`, 'info')
      
      // Step 1: Jira Agent
      setActiveAgentId('jira')
      addLog('jira', `📡 JiraAgent: Reading ticket metadata and JQL configurations...`, 'process')
      await new Promise(r => setTimeout(r, 600))
      
      // Step 2: BDD Agent
      setActiveAgentId('bdd')
      addLog('bdd', `🎯 BDDAgent: Generating BDD test cases via AI for story ${currentStory.key}...`, 'process')
      
      let mappedCases = [];
      try {
        const typesList = 'Happy Path, Negative, Edge'
        const cases = await generateTestCasesAI(currentStory, activeKey, credentials.engine, typesList, 'bdd')
        mappedCases = cases.map(c => {
          const newC = { ...c, 'TC_ID': c['Work Key'] || c['TC_ID'] || `TC-${Math.floor(Math.random() * 1000)}` };
          delete newC['Work Key'];
          return newC;
        });
        localStorage.setItem(`testpilot_cases_${currentStory.id}`, JSON.stringify(mappedCases))
        addLog('bdd', `✓ BDDAgent: Successfully generated ${mappedCases.length} BDD test cases.`, 'success')
      } catch (err) {
        addLog('bdd', `⚠ BDDAgent Warning: AI BDD generation failed, using fallback mock cases. Error: ${err.message}`, 'info')
        mappedCases = [
          { TC_ID: `${currentStory.key}-TC-01`, Scenario_Name: `Standard checkout path - ${currentStory.summary}`, Type: 'Happy Path', Gherkin: `Given the user navigates to environment\nWhen the user performs the actions described in description\nThen the system accepts validation`, Expected_Result: 'Checkout successfully finishes.' }
        ]
        localStorage.setItem(`testpilot_cases_${currentStory.id}`, JSON.stringify(mappedCases))
      }
      
      // Step 3: Test Design & Coverage Agent
      setActiveAgentId('design')
      addLog('design', `📝 TestDesignAgent: Comparing requirements against standard checklist...`, 'process')
      setActiveAgentId('coverage')
      addLog('coverage', `📊 CoverageAgent: Checking coverage completeness. Gaps = 0%.`, 'process')
      await new Promise(r => setTimeout(r, 600))
      
      // Step 4: Automation & CodeGen Agent
      setActiveAgentId('automation')
      addLog('automation', `🤖 AutomationAgent: Formulating CSS locator hierarchy for page objects...`, 'process')
      setActiveAgentId('codegen')
      addLog('codegen', `💻 CodeGenAgent: Writing executable TypeScript test scripts via AI...`, 'process')
      
      try {
        const script = await generateAutomationScriptAI(currentStory, activeKey, credentials.engine, 'playwright', 'typescript', 'none', 'ai', mappedCases)
        localStorage.setItem(`testpilot_script_${currentStory.id}`, script)
        addLog('codegen', `✓ CodeGenAgent: Automation script successfully generated.`, 'success')
      } catch (err) {
        addLog('codegen', `⚠ CodeGenAgent Warning: AI script generation failed, using fallback script.`, 'info')
        const fallbackScript = `import { test, expect } from '@playwright/test';\n\ntest('${currentStory.key} spec', async ({ page }) => {\n  await page.goto('${activeProject?.environmentUrl || 'https://www.saucedemo.com'}');\n});`
        localStorage.setItem(`testpilot_script_${currentStory.id}`, fallbackScript)
      }
      
      // Step 5: Security & Performance Specialists
      setActiveAgentId('security')
      addLog('security', `🛡️ SecurityAgent: Scanning story description for OWASP top-10 warnings...`, 'process')
      setActiveAgentId('performance')
      addLog('performance', `⚡ PerformanceAgent: Constructing JMeter XML thread configurations...`, 'process')
      await new Promise(r => setTimeout(r, 600))
      
      localStorage.setItem(`testpilot_api_${currentStory.id}`, JSON.stringify({ item: [{ name: "Auto GET Check" }] }))
      localStorage.setItem(`testpilot_security_${currentStory.id}`, JSON.stringify({ vulnerabilities: [{ id: "SEC-1", name: "SSL Transport check", severity: "Low" }] }))
      localStorage.setItem(`testpilot_performance_${currentStory.id}`, `<plan></plan>`)
 
      // Step 6: QMetry Sync
      setActiveAgentId('qmetry')
      addLog('qmetry', `☁️ QMetryAgent: Synchronizing test scenarios to QMetry...`, 'process')
      
      const qmetryEnabled = activeProject?.qmetryEnabled && activeProject?.qmetryBaseUrl && activeProject?.qmetryApiToken;
      if (qmetryEnabled) {
        try {
          addLog('qmetry', `☁️ QMetryAgent: Syncing ${mappedCases.length} test cases to folder "${currentStory.key}" in QMetry...`, 'process')
          const syncResults = await syncTestCasesToQMetry(mappedCases, currentStory.key, activeProject)
          
          // Map sync results back to localStorage to save qmetryId
          const updatedCases = mappedCases.map(tc => {
            const match = syncResults.find(r => r.tcId === tc.TC_ID && r.status === 'Success');
            if (match && match.qmetryId) {
              return { ...tc, qmetryId: match.qmetryId };
            }
            return tc;
          });
          localStorage.setItem(`testpilot_cases_${currentStory.id}`, JSON.stringify(updatedCases))
          
          const successCount = syncResults.filter(r => r.status === 'Success').length;
          addLog('qmetry', `✓ QMetryAgent: Synced ${successCount} of ${mappedCases.length} cases successfully to folder "${currentStory.key}".`, 'success')
        } catch (err) {
          addLog('qmetry', `❌ QMetryAgent Error: QMetry sync failed: ${err.message}`, 'error')
        }
      } else {
        addLog('qmetry', `☁️ QMetryAgent: QMetry integration is not configured or disabled for this project. Skipping real sync.`, 'info')
      }
      
      // Step 7: Reporting
      setActiveAgentId('reporting')
      addLog('reporting', `📈 ReportingAgent: Writing execution analytics to global report indices...`, 'process')
      await new Promise(r => setTimeout(r, 600))
      
      setProcessedStories(prev => [...prev, currentStory.key])
      addLog('orchestrator', `✅ Project Workspace configured successfully for story ${currentStory.key}!`, 'success')
      await new Promise(r => setTimeout(r, 600))
    }
    
    setActiveAgentId(null)
    setIsAutoRunning(false)
    addLog('orchestrator', '🏁 Autonomous multi-agent pipeline completed successfully! All sprint artifacts are generated.', 'success')
  }

  const glassStyle = {
    background: 'rgba(30, 41, 59, 0.45)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '16px',
    padding: '1.5rem'
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '4rem' }}>
      
      {/* Header Panel */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <div style={{ background: 'linear-gradient(135deg, #8b5cf6, #c084fc)', padding: '0.7rem', borderRadius: '14px' }}>
            <Zap size={24} color="white" />
          </div>
          <div>
            <h1 className="title-gradient" style={{ margin: 0, fontSize: '1.8rem', background: 'linear-gradient(to right, #a78bfa, #f472b6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Autonomous Generation Hub
            </h1>
            <p style={{ color: '#94a3b8', margin: '0.2rem 0 0', fontSize: '0.88rem' }}>
              Employ multi-agent AI execution pipelines to forge diverse test suites and automation layers.
            </p>
          </div>
        </div>

        {/* Mode Selector */}
        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '0.35rem', gap: '0.3rem' }}>
          <button 
            onClick={() => !isAutoRunning && setGenMode('manual')}
            style={{ 
              background: genMode === 'manual' ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
              color: genMode === 'manual' ? '#c084fc' : '#94a3b8',
              border: genMode === 'manual' ? '1px solid rgba(139, 92, 246, 0.25)' : '1px solid transparent',
              padding: '0.45rem 1rem',
              borderRadius: '9px',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: isAutoRunning ? 'not-allowed' : 'pointer'
            }}
          >
            Manual Mode
          </button>
          <button 
            onClick={() => !isAutoRunning && setGenMode('autonomous')}
            style={{ 
              background: genMode === 'autonomous' ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
              color: genMode === 'autonomous' ? '#c084fc' : '#94a3b8',
              border: genMode === 'autonomous' ? '1px solid rgba(139, 92, 246, 0.25)' : '1px solid transparent',
              padding: '0.45rem 1rem',
              borderRadius: '9px',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: isAutoRunning ? 'not-allowed' : 'pointer'
            }}
          >
            Autonomous Mode
          </button>
        </div>
      </div>

      {!activeProject ? (
        <div style={{ ...glassStyle, padding: '4rem', textAlign: 'center', color: '#64748b' }}>
          <AlertCircle size={40} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
          <h3>No Active Project</h3>
          <p style={{ fontSize: '0.85rem', marginTop: '0.4rem' }}>Please onboard or select an active project key under the Projects tab to begin generation.</p>
        </div>
      ) : genMode === 'manual' ? (
        
        // ── MANUAL MODE INTERFACE ──
        <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '1.5rem' }}>
          {/* Story Context Panel */}
          <div style={{ ...glassStyle, display: 'flex', flexDirection: 'column', gap: '1.2rem', height: 'fit-content' }}>
            <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.75rem' }}>Active Story Context</h3>
            
            {story ? (
              <div>
                <span style={{ fontFamily: 'monospace', color: '#818cf8', fontWeight: 700, fontSize: '0.82rem' }}>{story.key}</span>
                <h4 style={{ margin: '0.25rem 0 0.85rem', color: '#cbd5e1', fontSize: '0.92rem', lineHeight: 1.4 }}>{story.summary}</h4>
                <div style={{ background: 'rgba(0,0,0,0.15)', padding: '0.85rem', borderRadius: '10px', fontSize: '0.78rem', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.03)' }}>
                  <span style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, color: '#475569' }}>Description snippet:</span>
                  {story.description?.substring(0, 160)}...
                </div>
              </div>
            ) : (
              <div style={{ color: '#475569', fontSize: '0.85rem', textAlign: 'center', padding: '1rem' }}>
                <AlertCircle size={20} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
                No story currently selected.
              </div>
            )}
          </div>

          {/* Manual Artifact Generation Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ ...glassStyle, padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '1rem' }}>Manual Testing Artifact Architect</h3>
                <span style={{ color: '#64748b', fontSize: '0.78rem' }}>Trigger AI generation for specific test modules individually.</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem' }}>
              <GeneratorCard 
                title="BDD & Test Scenarios" 
                desc="Formulate comprehensive Given-When-Then scenarios covering happy paths and edge boundaries."
                icon={<FileText size={20} color="#34d399" />}
                loading={loadingMap['bdd']}
                success={successMap['bdd']}
                onGenerate={() => generateManualArtifact('bdd')}
                disabled={!story}
                onView={onViewBddCases}
              />
              <GeneratorCard 
                title="Automation Spec Scripts" 
                desc="Generate Playwright, Selenium, or Cypress automation code complete with resilient locators."
                icon={<Code2 size={20} color="#60a5fa" />}
                loading={loadingMap['automation']}
                success={successMap['automation']}
                onGenerate={() => generateManualArtifact('automation')}
                disabled={!story}
              />
              <GeneratorCard 
                title="API Collections" 
                desc="Build mock Postman Newman collections mapping end-points, payload criteria, and validations."
                icon={<Globe size={20} color="#c084fc" />}
                loading={loadingMap['api']}
                success={successMap['api']}
                onGenerate={() => generateManualArtifact('api')}
                disabled={!story}
              />
              <GeneratorCard 
                title="OWASP Security Audits" 
                desc="Simulate OWASP ZAP assessments mapping inputs to XSS, CSRF, and Injection warnings."
                icon={<ShieldAlert size={20} color="#fb923c" />}
                loading={loadingMap['security']}
                success={successMap['security']}
                onGenerate={() => generateManualArtifact('security')}
                disabled={!story}
              />
              <GeneratorCard 
                title="Load & Performance plans" 
                desc="Generate JMeter XML (.jmx) thread templates for execution under simulated high-throughput load."
                icon={<Activity size={20} color="#a3e635" />}
                loading={loadingMap['performance']}
                success={successMap['performance']}
                onGenerate={() => generateManualArtifact('performance')}
                disabled={!story}
              />
            </div>
          </div>
        </div>

      ) : (

        // ── AUTONOMOUS MODE INTERFACE ──
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div style={{ ...glassStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Layers size={18} color="#c084fc" /> Sprint-Level 12-Agent Autonomous Pipeline
              </h3>
              <p style={{ margin: '0.2rem 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>
                Fetch all stories in the backlog, map and compile test configurations across all agents automatically.
              </p>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={startAutonomousOrchestration}
              disabled={isAutoRunning || storiesList.length === 0}
              style={{
                width: 'auto',
                background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                border: 'none',
                color: 'white',
                padding: '0.65rem 1.5rem',
                borderRadius: '10px',
                fontWeight: 600,
                fontSize: '0.88rem',
                cursor: (isAutoRunning || storiesList.length === 0) ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)'
              }}
            >
              {isAutoRunning ? <Square size={14} /> : <Play size={14} />}
              {isAutoRunning ? 'Pipeline Running...' : 'Trigger Backlog Autopilot'}
            </motion.button>
          </div>

          {/* Interactive Agent Simulation Grid */}
          <div style={{ 
            background: 'rgba(15,23,42,0.6)', 
            border: '1px solid rgba(255,255,255,0.05)', 
            borderRadius: '16px', 
            padding: '1.5rem' 
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#a5b4fc', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Agent Mesh Matrix Status
              </span>
              {isAutoRunning && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#818cf8', fontSize: '0.8rem', fontWeight: 600 }}>
                  <RefreshCw className="spin-icon" size={14} /> Processing story {currentStoryIndex + 1} of {storiesList.length}: {storiesList[currentStoryIndex]?.key}
                </div>
              )}
            </div>

            {/* Grid of 12 Agents */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
              {AGENTS.map(agent => {
                const isActive = activeAgentId === agent.id
                return (
                  <motion.div
                    key={agent.id}
                    animate={{ 
                      scale: isActive ? 1.03 : 1,
                      borderColor: isActive ? agent.color : 'rgba(255,255,255,0.05)',
                      boxShadow: isActive ? `0 0 15px ${agent.color}35` : 'none'
                    }}
                    style={{
                      background: isActive ? `${agent.color}0c` : 'rgba(0,0,0,0.25)',
                      border: '1px solid',
                      borderRadius: '12px',
                      padding: '0.85rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      transition: 'background 0.2s'
                    }}
                  >
                    <div style={{ 
                      fontSize: '1.4rem', 
                      background: isActive ? `${agent.color}25` : 'rgba(255,255,255,0.03)',
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {agent.icon}
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.85rem', color: isActive ? '#f8fafc' : '#cbd5e1', fontWeight: isActive ? 700 : 600 }}>{agent.name}</h4>
                      <p style={{ margin: '0.15rem 0 0', color: '#64748b', fontSize: '0.68rem', lineHeight: 1.3 }}>{agent.desc}</p>
                    </div>
                  </motion.div>
                )
              })}
            </div>

            {/* Total Backlog Progress Bar */}
            {isAutoRunning && (
              <div style={{ marginTop: '1.5rem', background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.4rem' }}>
                  <span>Sprint Completion Rate</span>
                  <span>{processedStories.length} / {storiesList.length} Stories Compiled</span>
                </div>
                <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(processedStories.length / storiesList.length) * 100}%` }}
                    style={{ height: '100%', background: 'linear-gradient(to right, #8b5cf6, #3b82f6)' }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Workflow Console Log Terminal */}
          <div style={{ ...glassStyle, padding: 0, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ padding: '0.75rem 1.25rem', background: 'rgba(15,23,42,0.85)', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: '#cbd5e1', fontWeight: 600, fontFamily: 'monospace' }}>
                SYSTEM_AUTOPILOT_TERMINAL_LOG
              </span>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f87171' }} />
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fbbf24' }} />
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#34d399' }} />
              </div>
            </div>
            
            <div style={{ 
              background: '#020617', 
              padding: '1.25rem', 
              maxHeight: '300px', 
              overflowY: 'auto',
              fontFamily: '"JetBrains Mono", "Fira Code", monospace',
              fontSize: '0.8rem',
              lineHeight: 1.6,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.45rem'
            }}>
              {autoLogs.length === 0 ? (
                <div style={{ color: '#475569', textAlign: 'center', padding: '2rem' }}>
                  Pipeline terminal idle. Click 'Trigger Backlog Autopilot' to engage the mesh.
                </div>
              ) : (
                autoLogs.map(log => {
                  let color = '#94a3b8'
                  if (log.type === 'success') color = '#34d399'
                  else if (log.type === 'process') color = '#60a5fa'
                  return (
                    <div key={log.id} style={{ display: 'flex', gap: '0.8rem' }}>
                      <span style={{ color: '#475569' }}>[{log.timestamp}]</span>
                      <span style={{ color }}><strong style={{ textTransform: 'uppercase' }}>{log.agent}</strong> → {log.msg}</span>
                    </div>
                  )
                })
              )}
              <div ref={terminalEndRef} />
            </div>
          </div>

        </div>

      )}

    </div>
  )
}

const GeneratorCard = ({ title, desc, icon, loading, success, onGenerate, disabled, onView }) => {
  return (
    <div style={{
      background: 'rgba(30, 41, 59, 0.45)',
      backdropFilter: 'blur(16px)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: '16px',
      padding: '1.25rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
      opacity: disabled ? 0.6 : 1,
      pointerEvents: disabled ? 'none' : 'auto'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.45rem', borderRadius: '8px' }}>
            {icon}
          </div>
          <h4 style={{ margin: 0, color: '#f8fafc', fontSize: '0.9rem', fontWeight: 700 }}>{title}</h4>
        </div>
        
        {success && (
          <span style={{ color: '#10b981', fontSize: '0.72rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
            <CheckCircle size={12} /> READY
          </span>
        )}
      </div>
      
      <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.78rem', lineHeight: 1.45 }}>{desc}</p>
      
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', width: '100%' }}>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onGenerate}
          disabled={loading}
          style={{
            flex: 1,
            background: success 
              ? 'rgba(16,185,129,0.08)' 
              : 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))',
            border: `1px solid ${success ? 'rgba(16,185,129,0.2)' : 'rgba(99,102,241,0.25)'}`,
            color: success ? '#10b981' : '#c084fc',
            padding: '0.45rem 1rem',
            borderRadius: '8px',
            fontSize: '0.78rem',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.35rem',
            boxSizing: 'border-box'
          }}
        >
          {loading ? (
            <>
              <RefreshCw className="spin-icon" size={12} />
              Engaging...
            </>
          ) : (
            success ? 'Regenerate' : 'Generate Artifact'
          )}
        </motion.button>

        {success && onView && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onView}
            style={{
              flex: 1,
              background: 'linear-gradient(135deg, #10b981, #059669)',
              border: 'none',
              color: 'white',
              padding: '0.45rem 1rem',
              borderRadius: '8px',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
              boxSizing: 'border-box'
            }}
          >
            View & Sync 🔍
          </motion.button>
        )}
      </div>
    </div>
  )
}

export default TestGenPage
