import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Globe, Play, Server, Database, CheckCircle, AlertCircle, Download, Clock } from 'lucide-react'

const ApiTestingPage = ({ story, credentials }) => {
  const [collection, setCollection] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [logs, setLogs] = useState([])
  const [stats, setStats] = useState({ passed: 0, failed: 0, avgLatency: 0 })

  useEffect(() => {
    const cached = localStorage.getItem(`testpilot_api_${story?.id}`)
    if (cached) {
      setCollection(cached)
    } else {
      // Default initial mock Postman collection
      const initialCollection = {
        info: {
          name: `API Verification Suite - ${story?.key || 'KAN'}`,
          description: `Generated Postman collection for validation of story: ${story?.summary || 'User Actions'}`,
          schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
        },
        item: [
          {
            name: "Health Ping Validation",
            request: {
              method: "GET",
              url: "http://localhost:3001/api/ping",
              header: [{ key: "Accept", value: "application/json" }]
            },
            response: []
          },
          {
            name: "Jira Fetch Proxy Check",
            request: {
              method: "POST",
              url: "http://localhost:3001/api/jira/fetch",
              body: {
                mode: "raw",
                raw: "{\n  \"storyId\": \"KAN-9\",\n  \"baseUrl\": \"https://fliptestmax.atlassian.net\"\n}"
              }
            },
            response: []
          }
        ]
      }
      setCollection(JSON.stringify(initialCollection, null, 2))
    }
  }, [story])

  const runSimulation = async () => {
    setIsRunning(true)
    setLogs([])
    setStats({ passed: 0, failed: 0, avgLatency: 0 })

    const steps = [
      { name: "Initiating endpoint connectivity probe...", latency: 24, status: "Pass", detail: "DNS resolved successfully" },
      { name: "GET http://localhost:3001/api/ping", latency: 85, status: "Pass", detail: "Response 200 OK. JSON schema matches default structure." },
      { name: "GET http://localhost:3001/api/execution-results", latency: 130, status: "Pass", detail: "Response 200 OK. Returned 12 records." },
      { name: "POST http://localhost:3001/api/jira/fetch", latency: 195, status: "Pass", detail: "Response 200 OK. Mocked KAN-9 issue successfully retrieved." },
      { name: "POST http://localhost:3001/api/qmetry/test", latency: 310, status: "Blocked", detail: "Response 401 Unauthorized. Connection credentials invalid." }
    ]

    let passedCount = 0
    let failedCount = 0
    let totalLatency = 0

    for (let i = 0; i < steps.length; i++) {
      await new Promise(r => setTimeout(r, 800))
      const step = steps[i]
      totalLatency += step.latency
      
      if (step.status === "Pass") passedCount++
      else failedCount++

      setLogs(prev => [...prev, {
        id: Date.now() + i,
        time: new Date().toLocaleTimeString(),
        name: step.name,
        latency: step.latency,
        status: step.status,
        detail: step.detail
      }])
      
      setStats({
        passed: passedCount,
        failed: failedCount,
        avgLatency: Math.round(totalLatency / (i + 1))
      })
    }
    
    setIsRunning(false)
  }

  const handleDownload = () => {
    const blob = new Blob([collection], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `postman_collection_${story?.key || 'KAN'}.json`
    link.click()
  }

  const glassStyle = {
    background: 'rgba(30, 41, 59, 0.45)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '16px',
    padding: '1.5rem'
  }

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <div style={{ background: 'linear-gradient(135deg, #10b981, #059669)', padding: '0.7rem', borderRadius: '14px' }}>
            <Globe size={24} color="white" />
          </div>
          <div>
            <h1 className="title-gradient" style={{ margin: 0, fontSize: '1.8rem', background: 'linear-gradient(to right, #34d399, #059669)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              API Testing & Integrations
            </h1>
            <p style={{ color: '#94a3b8', margin: '0.2rem 0 0', fontSize: '0.88rem' }}>
              Simulate Postman endpoint executions, evaluate schemas, and log connection response speed.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            onClick={handleDownload}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#cbd5e1',
              padding: '0.55rem 1.1rem',
              borderRadius: '9px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.82rem'
            }}
          >
            <Download size={14} /> Download Collection
          </button>
          
          <button 
            onClick={runSimulation}
            disabled={isRunning}
            style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: 'white',
              border: 'none',
              padding: '0.55rem 1.25rem',
              borderRadius: '9px',
              fontWeight: 600,
              cursor: isRunning ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.82rem',
              boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
            }}
          >
            <Play size={14} /> {isRunning ? 'Running Simulation...' : 'Simulate API Call'}
          </button>
        </div>
      </div>

      {/* Latency / Stats Cards */}
      {logs.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          <div style={{ ...glassStyle, padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.12)', padding: '8px', borderRadius: '10px', color: '#10b981' }}><CheckCircle size={18} /></div>
            <div>
              <div style={{ color: '#64748b', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Passed Assertions</div>
              <div style={{ color: '#f8fafc', fontSize: '1.2rem', fontWeight: 700 }}>{stats.passed}</div>
            </div>
          </div>
          <div style={{ ...glassStyle, padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ background: 'rgba(239, 68, 68, 0.12)', padding: '8px', borderRadius: '10px', color: '#ef4444' }}><AlertCircle size={18} /></div>
            <div>
              <div style={{ color: '#64748b', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Failed / Blocked</div>
              <div style={{ color: '#f8fafc', fontSize: '1.2rem', fontWeight: 700 }}>{stats.failed}</div>
            </div>
          </div>
          <div style={{ ...glassStyle, padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ background: 'rgba(59, 130, 246, 0.12)', padding: '8px', borderRadius: '10px', color: '#3b82f6' }}><Clock size={18} /></div>
            <div>
              <div style={{ color: '#64748b', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Average Latency</div>
              <div style={{ color: '#f8fafc', fontSize: '1.2rem', fontWeight: 700 }}>{stats.avgLatency} ms</div>
            </div>
          </div>
        </div>
      )}

      {/* Main split */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', flex: 1 }}>
        {/* Editor */}
        <div style={{ ...glassStyle, display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <h3 style={{ margin: 0, fontSize: '0.95rem', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Database size={15} color="#10b981" /> Postman Collection Blueprint
          </h3>
          <textarea
            value={collection}
            onChange={(e) => setCollection(e.target.value)}
            spellCheck="false"
            style={{
              flex: 1,
              minHeight: '450px',
              background: '#020617',
              color: '#94a3b8',
              fontFamily: 'monospace',
              fontSize: '0.82rem',
              lineHeight: 1.5,
              padding: '1rem',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.08)',
              outline: 'none',
              resize: 'none'
            }}
          />
        </div>

        {/* Live Terminal Output */}
        <div style={{ ...glassStyle, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '0.75rem 1.25rem', background: 'rgba(15,23,42,0.8)', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Server size={14} color="#10b981" />
            <span style={{ fontSize: '0.72rem', color: '#cbd5e1', fontWeight: 700, fontFamily: 'monospace' }}>API_EXECUTION_PROBE</span>
          </div>

          <div style={{ 
            flex: 1, 
            background: '#020617', 
            padding: '1.25rem', 
            fontFamily: 'monospace', 
            fontSize: '0.8rem', 
            lineHeight: 1.6, 
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.65rem'
          }}>
            {logs.length === 0 ? (
              <div style={{ color: '#475569', textAlign: 'center', padding: '4rem' }}>
                Console log idle. Click 'Simulate API Call' to test the connection.
              </div>
            ) : (
              logs.map(log => (
                <div key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '0.45rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                    <span style={{ color: log.status === 'Pass' ? '#34d399' : '#f87171', fontWeight: 700 }}>
                      [{log.status.toUpperCase()}] {log.name}
                    </span>
                    <span style={{ color: '#475569', fontSize: '0.75rem' }}>{log.latency}ms</span>
                  </div>
                  <div style={{ color: '#64748b', fontSize: '0.75rem', paddingLeft: '0.5rem' }}>
                    ↳ {log.detail}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

    </motion.div>
  )
}

export default ApiTestingPage
