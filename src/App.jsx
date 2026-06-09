import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  LayoutDashboard, FolderKanban, ListTodo, Zap, Code2, 
  CheckSquare, Globe, ShieldAlert, Activity, BarChart3, 
  Settings, LogOut, Brain, Play, Bot 
} from 'lucide-react'

import Dashboard from './components/Dashboard'
import ProjectsPage from './components/ProjectsPage'
import StoriesPage from './components/StoriesPage'
import TestGenPage from './components/TestGenPage'
import PlaywrightPage from './components/PlaywrightPage'
import ManualExecutionPage from './components/ManualExecutionPage'
import ExecutionPage from './components/ExecutionPage'
import ApiTestingPage from './components/ApiTestingPage'
import SecurityTestingPage from './components/SecurityTestingPage'
import PerformanceTestingPage from './components/PerformanceTestingPage'
import ExecutionReport from './components/ExecutionReport'
import SettingsPage from './components/SettingsPage'
import TestCasePage from './components/TestCasePage'

const API_KEYS_KEY = 'testpilot_api_keys'

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [projectsList, setProjectsList] = useState([])
  const [activeProject, setActiveProject] = useState(null)
  const [storiesList, setStoriesList] = useState([])
  const [selectedStory, setSelectedStory] = useState(null)
  const [storiesConnectionError, setStoriesConnectionError] = useState(null)
  
  // API credentials loaded from local storage
  const [credentials, setCredentials] = useState({
    engine: 'gemini',
    geminiKey: '',
    groqKey: '',
    openaiKey: '',
    claudeKey: '',
    openRouterKey: ''
  })

  // Load projects and credentials on mount
  useEffect(() => {
    fetchProjects()
    
    const savedKeys = localStorage.getItem(API_KEYS_KEY)
    if (savedKeys) {
      try {
        const parsed = JSON.parse(savedKeys)
        setCredentials(prev => ({
          ...prev,
          engine: parsed._activeEngine || 'gemini',
          geminiKey: parsed.gemini || '',
          groqKey: parsed.groq || '',
          openaiKey: parsed.openai || '',
          claudeKey: parsed.claude || '',
          openRouterKey: parsed.openrouter || ''
        }))
      } catch (e) {}
    }
  }, [])

  // Whenever credentials change, persist active engine
  const handleUpdateCredentials = (updated) => {
    setCredentials(updated)
    const savedKeys = JSON.parse(localStorage.getItem(API_KEYS_KEY) || '{}')
    localStorage.setItem(API_KEYS_KEY, JSON.stringify({ 
      ...savedKeys, 
      gemini: updated.geminiKey,
      groq: updated.groqKey,
      openai: updated.openaiKey,
      claude: updated.claudeKey,
      openrouter: updated.openRouterKey,
      _activeEngine: updated.engine 
    }))
  }

  // Fetch all projects from backend
  const fetchProjects = async () => {
    try {
      const resp = await fetch('http://localhost:3001/api/projects')
      const data = await resp.json()
      setProjectsList(data)
      
      // Auto-activate the first project if none is active, or if the active one was deleted
      const activeProjExists = data.some(p => p.key === activeProject?.key)
      if (data.length > 0 && (!activeProject || !activeProjExists)) {
        handleActivateProject(data[0])
      } else if (data.length === 0) {
        setActiveProject(null)
        setStoriesList([])
        setSelectedStory(null)
        setStoriesConnectionError(null)
      }
    } catch (e) {
      console.error('Failed to load projects from backend', e)
    }
  }

  // Activate a selected project and load its stories
  const handleActivateProject = async (project) => {
    setActiveProject(project)
    setSelectedStory(null) // clear story context
    setStoriesConnectionError(null)
    
    // Propagate project's credentials to credentials state
    setCredentials(prev => ({
      ...prev,
      baseUrl: project.jiraUrl,
      email: project.email,
      token: project.token
    }))
    
    // Fetch stories for this project key
    try {
      const resp = await fetch('http://localhost:3001/api/jira/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectKey: project.key,
          baseUrl: project.jiraUrl,
          email: project.email,
          token: project.token
        })
      })
      
      if (!resp.ok) {
        const errorData = await resp.json()
        throw new Error(errorData.message || `HTTP error ${resp.status}`)
      }
      
      const stories = await resp.json()
      if (Array.isArray(stories)) {
        setStoriesList(stories)
        // Select first story by default
        if (stories.length > 0) {
          setSelectedStory(stories[0])
        }
      } else {
        throw new Error('Stories data is not in array format')
      }
    } catch (err) {
      console.error('Failed to load project stories', err)
      setStoriesList([])
      setStoriesConnectionError(err.message)
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%', maxWidth: '100vw', background: '#020617', color: '#f8fafc' }}>
      
      {/* ── SIDEBAR ─────────────────────────────────────────────── */}
      <motion.aside
        initial={{ x: -260 }}
        animate={{ x: 0 }}
        style={{
          width: '275px',
          background: 'rgba(15, 23, 42, 0.95)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          padding: '1.5rem 1.25rem',
          display: 'flex',
          flexDirection: 'column',
          backdropFilter: 'blur(16px)',
          position: 'fixed',
          top: 0, left: 0, bottom: 0,
          zIndex: 50,
          overflowY: 'auto'
        }}
      >
        {/* Brand Label */}
        <div style={{ paddingBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '1.2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', padding: '0.5rem', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={20} color="white" />
            </div>
            <div>
              <h2 className="title-gradient-primary" style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, background: 'linear-gradient(to right, #a78bfa, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                TestPilot Autonomous
              </h2>
              <span style={{ color: '#64748b', fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                Enterprise QA Agent
              </span>
            </div>
          </div>
        </div>

        {/* Active Project Dropdown */}
        {projectsList.length > 0 && (
          <div style={{ 
            marginBottom: '1.2rem', 
            padding: '0.75rem 0.9rem', 
            background: 'rgba(59, 130, 246, 0.08)', 
            borderRadius: '12px', 
            border: '1px solid rgba(59, 130, 246, 0.15)',
            fontSize: '0.78rem' 
          }}>
            <span style={{ color: '#94a3b8', fontSize: '0.68rem', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.4rem', fontWeight: 600 }}>Active Project</span>
            <select
              value={activeProject?.key || ''}
              onChange={(e) => {
                const selected = projectsList.find(p => p.key === e.target.value)
                if (selected) {
                  handleActivateProject(selected)
                }
              }}
              style={{
                width: '100%',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '8px',
                padding: '0.45rem 0.6rem',
                color: '#60a5fa',
                fontSize: '0.82rem',
                fontWeight: 700,
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {projectsList.map(project => (
                <option key={project.key} value={project.key} style={{ background: '#0f172a', color: '#cbd5e1' }}>
                  {project.name} ({project.key})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Nav list */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', flex: 1 }}>
          <div className="nav-section-title">Core Operations</div>
          <SidebarButton active={activeTab === 'dashboard'} icon={<LayoutDashboard size={17} />} label="Dashboard" onClick={() => setActiveTab('dashboard')} />
          <SidebarButton active={activeTab === 'projects'} icon={<FolderKanban size={17} />} label="Projects" onClick={() => { setActiveTab('projects'); fetchProjects(); }} />
          <SidebarButton active={activeTab === 'stories'} icon={<ListTodo size={17} />} label="Stories" onClick={() => setActiveTab('stories')} />
          <SidebarButton active={activeTab === 'generator'} icon={<Zap size={17} />} label="Test Generation" onClick={() => setActiveTab('generator')} />

          <div className="nav-section-title">Manual & Scripting</div>
          <SidebarButton active={activeTab === 'manual'} disabled={!selectedStory} icon={<CheckSquare size={17} />} label="Manual Testing" onClick={() => setActiveTab('manual')} />
          <SidebarButton active={activeTab === 'automation'} disabled={!selectedStory} icon={<Code2 size={17} />} label="Automation Scripts" onClick={() => setActiveTab('automation')} />

          <div className="nav-section-title">Specialist Quality</div>
          <SidebarButton active={activeTab === 'execution'} disabled={!selectedStory} icon={<Play size={17} />} label="Automation Execution" onClick={() => setActiveTab('execution')} />
          <SidebarButton active={activeTab === 'api'} disabled={!selectedStory} icon={<Globe size={17} />} label="API Testing" onClick={() => setActiveTab('api')} />
          <SidebarButton active={activeTab === 'security'} disabled={!selectedStory} icon={<ShieldAlert size={17} />} label="Security Audits" onClick={() => setActiveTab('security')} />
          <SidebarButton active={activeTab === 'performance'} disabled={!selectedStory} icon={<Activity size={17} />} label="Load Performance" onClick={() => setActiveTab('performance')} />

          <div className="nav-section-title">Executive Control</div>
          <SidebarButton active={activeTab === 'reports'} icon={<BarChart3 size={17} />} label="Reports Dashboard" onClick={() => setActiveTab('reports')} />
          <SidebarButton active={activeTab === 'settings'} icon={<Settings size={17} />} label="Settings & Keys" onClick={() => setActiveTab('settings')} />
        </nav>

        {/* Inference status badge */}
        <div style={{ 
          marginTop: '1rem', 
          padding: '0.65rem 0.85rem', 
          background: 'rgba(139, 92, 246, 0.08)', 
          borderRadius: '12px', 
          border: '1px solid rgba(139, 92, 246, 0.15)', 
          fontSize: '0.73rem', 
          color: '#a78bfa' 
        }}>
          🤖 Model: <strong style={{ color: '#c084fc', textTransform: 'capitalize' }}>{credentials.engine}</strong>
        </div>
      </motion.aside>

      {/* ── MAIN CONTENT ────────────────────────────────────────── */}
      <main style={{ marginLeft: '275px', flex: 1, padding: '2rem', maxWidth: 'calc(100% - 275px)', overflowY: 'auto' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', width: '100%' }}>
          
          {activeTab === 'dashboard' && (
            <Dashboard 
              credentials={credentials} 
              onUpdateCredentials={handleUpdateCredentials}
              onLogout={() => setActiveTab('projects')}
              onGoToGenerator={() => setActiveTab('generator')}
              activeProject={activeProject}
              storiesCount={storiesList.length}
            />
          )}

          {activeTab === 'projects' && (
            <ProjectsPage 
              projectsList={projectsList} 
              activeProject={activeProject}
              onActivate={handleActivateProject}
              onRefresh={fetchProjects}
            />
          )}

          {activeTab === 'stories' && (
            <StoriesPage 
              storiesList={storiesList}
              selectedStory={selectedStory}
              onSelectStory={setSelectedStory}
              onGenerateClick={() => setActiveTab('generator')}
              activeProject={activeProject}
              projectsList={projectsList}
              onActivateProject={handleActivateProject}
              connectionError={storiesConnectionError}
            />
          )}

          {activeTab === 'generator' && (
            <TestGenPage 
              story={selectedStory}
              storiesList={storiesList}
              credentials={credentials}
              activeProject={activeProject}
              onGoToAutomation={() => setActiveTab('automation')}
              onViewBddCases={() => setActiveTab('bdd-cases')}
            />
          )}

          {activeTab === 'bdd-cases' && selectedStory && (
            <TestCasePage 
              story={selectedStory}
              credentials={credentials}
              activeProject={activeProject}
              onBack={() => setActiveTab('generator')}
              onGoToAutomation={() => setActiveTab('automation')}
            />
          )}

          {activeTab === 'automation' && selectedStory && (
            <PlaywrightPage 
              story={selectedStory}
              credentials={credentials}
              onBack={() => setActiveTab('generator')}
              onGoToDashboard={() => setActiveTab('dashboard')}
            />
          )}

           {activeTab === 'manual' && selectedStory && (
            <ManualExecutionPage 
              story={selectedStory}
              credentials={credentials}
              activeProject={activeProject}
            />
          )}

          {activeTab === 'execution' && selectedStory && (
            <ExecutionPage 
              story={selectedStory}
              credentials={credentials}
            />
          )}

          {activeTab === 'api' && selectedStory && (
            <ApiTestingPage 
              story={selectedStory}
              credentials={credentials}
            />
          )}

          {activeTab === 'security' && selectedStory && (
            <SecurityTestingPage 
              story={selectedStory}
              credentials={credentials}
            />
          )}

          {activeTab === 'performance' && selectedStory && (
            <PerformanceTestingPage 
              story={selectedStory}
              credentials={credentials}
            />
          )}

          {activeTab === 'reports' && (
            <ExecutionReport 
              story={selectedStory}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsPage 
              credentials={credentials}
              onUpdateCredentials={handleUpdateCredentials}
            />
          )}

        </div>
      </main>

      <style>{`
        .nav-section-title {
          font-size: 0.65rem;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          font-weight: 700;
          margin: 0.85rem 0.5rem 0.35rem;
        }
        .title-gradient-primary {
          background: linear-gradient(to right, #c084fc, #6366f1);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
      `}</style>
    </div>
  )
}

const SidebarButton = ({ active, disabled, icon, label, onClick }) => (
  <button
    onClick={!disabled ? onClick : null}
    style={{
      display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.65rem 0.8rem',
      background: active ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
      color: active ? '#818cf8' : (disabled ? '#334155' : '#94a3b8'),
      border: '1px solid',
      borderColor: active ? 'rgba(99, 102, 241, 0.25)' : 'transparent',
      borderRadius: '10px',
      boxShadow: 'none',
      fontWeight: active ? 600 : 500,
      opacity: disabled ? 0.5 : 1,
      cursor: disabled ? 'not-allowed' : 'pointer',
      textAlign: 'left',
      width: '100%',
      fontSize: '0.85rem',
      transition: 'all 0.12s ease'
    }}
    onMouseEnter={(e) => { if (!active && !disabled) { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = '#f8fafc' } }}
    onMouseLeave={(e) => { if (!active && !disabled) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8' } }}
  >
    {icon} <span style={{ flex: 1 }}>{label}</span>
  </button>
)

export default App
