import { useState, useEffect } from 'react'
import axios from 'axios'
import { generatePlaywrightScript } from '../services/generator'

const PlaywrightPage = ({ story, onBack }) => {
  const [script, setScript] = useState('')
  const [testOutput, setTestOutput] = useState(null)
  const [isRunning, setIsRunning] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setScript(generatePlaywrightScript(story))
  }, [story])

  const handleRunTest = async () => {
    setIsRunning(true)
    setTestOutput('🚀 Initializing Environment...\nRunning Playwright dynamic test suite...\n\n')
    
    const PROXY_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
      ? 'http://127.0.0.1:3001' 
      : window.location.origin;

    try {
      const response = await axios.post(`${PROXY_URL}/api/test/run`, {
        script: script,
        id: story.id
      })
      
      setTestOutput(prev => prev + (response.data.output || response.data.error || 'Test process completed.'))
    } catch (err) {
      setTestOutput(prev => prev + `❌ Connection Error: ${err.message}\nMake sure your backend server is running on port 3001.`)
    } finally {
      setIsRunning(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(script)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '5rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <div>
          <button onClick={onBack} style={{ width: 'auto', marginBottom: '1rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', padding: '0.5rem 1rem' }}>
            ← Back to QA Suite
          </button>
          <h1 className="title-gradient" style={{ margin: 0 }}>Playwright Automation IDE</h1>
          <p style={{ color: '#94a3b8', margin: '0.5rem 0 0' }}>TypeScript Scripting for {story.id}</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={handleRunTest} disabled={isRunning} style={{ width: 'auto', padding: '1rem 2rem', background: isRunning ? '#1e293b' : 'linear-gradient(135deg, #6366f1, #818cf8)', fontSize: '1rem' }}>
            {isRunning ? 'Running Test...' : '▶ Launch Automation'}
          </button>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div className="glass-card" style={{ padding: '2rem', height: 'fit-content' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, color: '#818cf8' }}>Source Code (.ts)</h3>
            <button onClick={copyToClipboard} style={{ width: 'auto', padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.05)' }}>
              {copied ? 'Copied!' : 'Copy Code'}
            </button>
          </div>
          <textarea 
            spellCheck="false"
            value={script}
            onChange={(e) => setScript(e.target.value)}
            style={{ 
              width: '100%', 
              height: '500px', 
              background: '#0f172a', 
              color: '#94a3b8', 
              fontFamily: 'monospace', 
              padding: '1.5rem', 
              borderRadius: '12px', 
              border: '1px solid rgba(255,255,255,0.1)',
              resize: 'none',
              outline: 'none',
              fontSize: '0.9rem',
              lineHeight: '1.5'
            }}
          />
        </div>

        <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ margin: '0 0 1rem', color: '#10b981' }}>Live Test Output</h3>
          <div style={{ 
            background: '#000', 
            padding: '1.5rem', 
            borderRadius: '12px', 
            flex: 1, 
            maxHeight: '500px',
            overflowY: 'auto', 
            fontFamily: 'monospace', 
            fontSize: '0.85rem',
            color: '#4ade80',
            border: '1px solid rgba(255,255,255,0.05)'
          }}>
            {testOutput ? (
              <div style={{ whiteSpace: 'pre-wrap' }}>{testOutput}</div>
            ) : (
              <div style={{ color: '#64748b', textAlign: 'center', marginTop: '150px' }}>
                Console ready. Click "Launch Automation" to run Playwright tests against your target environment.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PlaywrightPage
