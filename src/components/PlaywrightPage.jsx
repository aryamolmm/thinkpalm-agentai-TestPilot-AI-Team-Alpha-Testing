import { useState, useEffect } from 'react'
import axios from 'axios'
import { generatePlaywrightScriptAI, reworkScriptAI, downloadFile } from '../services/generator'

const PlaywrightPage = ({ story, credentials, onBack, onGoToDashboard }) => {
  const [script, setScript] = useState('')
  const [testOutput, setTestOutput] = useState(null)
  const [isRunning, setIsRunning] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isReworking, setIsReworking] = useState(false)
  const [copied, setCopied] = useState(false)
  const [errorCount, setErrorCount] = useState(0)

  useEffect(() => {
    const initScript = async () => {
      setIsGenerating(true)
      try {
        const generatedScript = await generatePlaywrightScriptAI(story, credentials.geminiKey, credentials.engine)
        setScript(generatedScript)
      } catch (err) {
        console.error(err)
      } finally {
        setIsGenerating(false)
      }
    }
    initScript()
  }, [story, credentials])

  const handleRunTest = async () => {
    setIsRunning(true)
    setTestOutput('🚀 Initializing Playwright Environment...\n\n')
    
    const PROXY_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
      ? 'http://127.0.0.1:3001' 
      : window.location.origin;

    try {
      const response = await axios.post(`${PROXY_URL}/api/test/run`, {
        script: script,
        id: story.id
      })
      
      const output = response.data.output || response.data.error || 'Test process completed.'
      setTestOutput(prev => prev + output)
      
      if (response.data.error || output.toLowerCase().includes('failed')) {
        setErrorCount(prev => prev + 1)
      }
    } catch (err) {
      setTestOutput(prev => prev + `❌ Connection Error: ${err.message}`)
    } finally {
      setIsRunning(false)
    }
  }

  const handleRework = async () => {
    setIsReworking(true)
    setTestOutput(prev => prev + '\n\n🔄 Analyzing failures and reworking script...\n')
    try {
      const fixedScript = await reworkScriptAI(story, script, testOutput, credentials.geminiKey, credentials.engine)
      setScript(fixedScript)
      setTestOutput(prev => prev + '✅ Rework complete. Try running the script again.\n')
      setErrorCount(0)
    } catch (err) {
      setTestOutput(prev => prev + `\n❌ Rework Error: ${err.message}`)
    } finally {
      setIsReworking(false)
    }
  }

  const handleDownload = () => {
    downloadFile(script, `Agent2_${story.id}_test.spec.ts`, 'text/typescript')
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
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <button onClick={onBack} style={{ width: 'auto', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
              ← Back to QA Suite
            </button>
            <button onClick={onGoToDashboard} style={{ width: 'auto', background: 'transparent', border: '1px solid #10b981', color: '#10b981', padding: '0.4rem 1rem', fontSize: '0.85rem', borderRadius: '8px' }}>
              🔍 Fetch Another ID
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
           <h1 className="title-gradient" style={{ margin: 0 }}>Playwright Automation IDE</h1>
          </div>
          <p style={{ color: '#94a3b8', margin: '0.5rem 0 0' }}>Dynamic Scripting Engine for {story.id}</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {errorCount > 0 && (
            <button 
              onClick={handleRework} 
              disabled={isReworking} 
              style={{ width: 'auto', padding: '1rem 2rem', background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', border: '1px solid #f59e0b' }}
            >
              {isReworking ? 'Reworking...' : '🔄 Fix Errors'}
            </button>
          )}
          <button onClick={handleDownload} className="btn-secondary" style={{ width: 'auto' }}>Download .ts</button>
          <button 
            onClick={handleRunTest} 
            disabled={isRunning || isGenerating || isReworking} 
            style={{ width: 'auto', padding: '1rem 2rem', background: isRunning ? '#1e293b' : 'linear-gradient(135deg, #6366f1, #818cf8)', fontSize: '1rem' }}
          >
            {isRunning ? 'Running Test...' : '▶ Launch Automation'}
          </button>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '2rem' }}>
        <div className="glass-card" style={{ padding: '2rem', height: 'fit-content' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, color: '#818cf8' }}>Source Code (.ts)</h3>
            <button onClick={copyToClipboard} style={{ width: 'auto', padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.05)' }}>
              {copied ? 'Copied!' : 'Copy Code'}
            </button>
          </div>
          
          {isGenerating ? (
            <div style={{ height: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <div className="spinner"></div>
               <p style={{ marginLeft: '1rem' }}>Generating script...</p>
            </div>
          ) : (
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
          )}
        </div>

        <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ margin: '0 0 1rem', color: '#10b981' }}>Live Test Output</h3>
          <div style={{ 
            background: '#000', 
            padding: '1.5rem', 
            borderRadius: '12px', 
            flex: 1, 
            minHeight: '500px',
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
                Console ready. Click "Launch Automation" to run the script.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PlaywrightPage
