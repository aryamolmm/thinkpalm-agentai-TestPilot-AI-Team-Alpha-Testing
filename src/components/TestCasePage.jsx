import { useState, useEffect, useRef } from 'react'
import { generateTestCasesAI, convertToCSV, convertToExcel, generatePlaywrightScriptAI } from '../services/generator'

const TestCasePage = ({ story, credentials, onBack, onGoToAutomation }) => {
  const [testCases, setTestCases] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [autoGenerate, setAutoGenerate] = useState(false)
  const [script, setScript] = useState('')
  const [isGeneratingScript, setIsGeneratingScript] = useState(false)
  const [editingIndex, setEditingIndex] = useState(null)
  const [editFormData, setEditFormData] = useState({})
  
  const scriptRef = useRef(null)
  const hasGeneratedRef = useRef(false)

  // Run analysis on mount
  useEffect(() => {
    const performAnalysis = async () => {
      try {
        setLoading(true)
        setError(null)
        const cases = await generateTestCasesAI(story, credentials.geminiKey, credentials.engine)
        
        // Map Work Key to TC_ID
        const mappedCases = cases.map(c => {
          const newC = { ...c, 'TC_ID': c['Work Key'] || c['TC_ID'] || `TC-${Math.floor(Math.random() * 1000)}` };
          delete newC['Work Key'];
          return newC;
        });

        setTestCases(mappedCases)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    performAnalysis()
  }, [])

  // When autoGenerate is toggled ON and test cases are ready, auto-generate script
  useEffect(() => {
    if (autoGenerate && testCases.length > 0 && !script && !isGeneratingScript && !hasGeneratedRef.current) {
      hasGeneratedRef.current = true
      handleGenerateScript()
    }
    // If toggled off, reset so it can regenerate when toggled on again
    if (!autoGenerate) {
      hasGeneratedRef.current = false
    }
  }, [autoGenerate, testCases])

  // When script is ready and auto is on, scroll to it
  useEffect(() => {
    if (script && autoGenerate && scriptRef.current) {
      scriptRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [script])

  const handleGenerateScript = async () => {
    setIsGeneratingScript(true)
    setScript('')
    try {
      const generatedScript = await generatePlaywrightScriptAI(story, credentials.geminiKey, credentials.engine)
      setScript(generatedScript)
    } catch (err) {
      console.error(err)
    } finally {
      setIsGeneratingScript(false)
    }
  }

  const handleEditRow = (index, tc) => {
    setEditingIndex(index)
    setEditFormData({ ...tc })
  }

  const handleCancelEdit = () => {
    setEditingIndex(null)
    setEditFormData({})
  }

  const handleSaveRow = (index) => {
    const updatedCases = [...testCases]
    updatedCases[index] = { ...editFormData }
    setTestCases(updatedCases)
    setEditingIndex(null)
    setEditFormData({})
  }

  const downloadFile = (content, fileName, type) => {
    const blob = new Blob([content], { type: `${type};charset=utf-8;` })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    a.click()
  }

  if (loading) return (
    <div className="glass-card animate-pulse" style={{ textAlign: 'center', padding: '4rem' }}>
      <div className="spinner" style={{ margin: '0 auto 1.5rem' }}></div>
      <h2 className="title-gradient">Analyzing Story</h2>
      <p style={{ color: '#94a3b8' }}>Generating a comprehensive QA suite...</p>
    </div>
  )

  if (error) return (
    <div className="glass-card" style={{ textAlign: 'center', padding: '3rem', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
      <p style={{ color: '#ef4444', fontSize: '1.1rem', marginBottom: '0.5rem' }}>⚠️</p>
      <p style={{ color: '#ef4444', marginBottom: '1.5rem' }}>Analysis Failure<br />{error}</p>
      <button onClick={() => window.location.reload()}>Retry Analysis</button>
    </div>
  )

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '5rem' }}>
      {/* Header */}
      <div className="glass-card" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <button onClick={onBack} style={{ width: 'auto', marginBottom: '0.75rem', background: 'transparent', border: '1px solid #10b981', color: '#10b981', padding: '0.4rem 1rem', fontSize: '0.85rem', borderRadius: '8px' }}>
            🔍 Fetch Another ID
          </button>
          <h2 className="title-gradient" style={{ margin: 0 }}>Test Cases</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: '0.25rem 0 0' }}>{story?.key} – {story?.summary?.slice(0, 60)}...</p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* AUTO TOGGLE */}
          <div
            onClick={() => setAutoGenerate(prev => !prev)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.6rem',
              background: autoGenerate ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.05)',
              padding: '0.5rem 1rem', borderRadius: '30px',
              border: `1px solid ${autoGenerate ? '#6366f1' : 'rgba(255,255,255,0.1)'}`,
              cursor: 'pointer', transition: '0.3s', userSelect: 'none'
            }}
          >
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: autoGenerate ? '#818cf8' : '#64748b' }}>
              AUTO
            </span>
            <div style={{ width: '38px', height: '20px', background: autoGenerate ? '#6366f1' : '#334155', borderRadius: '10px', position: 'relative', transition: '0.3s' }}>
              <div style={{ width: '14px', height: '14px', background: 'white', borderRadius: '50%', position: 'absolute', top: '3px', left: autoGenerate ? '20px' : '3px', transition: '0.3s ease' }}></div>
            </div>
            <span style={{ fontSize: '0.78rem', color: autoGenerate ? '#4ade80' : '#ef4444', fontWeight: 700 }}>
              {autoGenerate ? 'ON' : 'OFF'}
            </span>
          </div>

          <button
            onClick={() => downloadFile(convertToCSV(testCases), `${story.id}_test_cases.csv`, 'text/csv')}
            className="secondary-btn"
            disabled={testCases.length === 0}
          >
            ↓ CSV
          </button>
          <button
            onClick={() => downloadFile(convertToExcel(testCases), `${story.id}_test_cases.xls`, 'application/vnd.ms-excel')}
            className="secondary-btn"
            disabled={testCases.length === 0}
          >
            ↓ Excel
          </button>
        </div>
      </div>

      {/* Test Cases Table */}
      {testCases.length > 0 && (
        <div className="glass-card" style={{ padding: 0, overflowX: 'auto', marginBottom: '2rem' }}>
          <table style={{ minWidth: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead style={{ background: 'rgba(255,255,255,0.03)' }}>
              <tr>
                {['TC_ID', 'Summary', 'Step Summary', 'Expected Result', 'Type', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '0.9rem 1rem', textAlign: 'left', color: '#818cf8', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {testCases.map((tc, i) => {
                const isEditing = editingIndex === i;
                
                return (
                  <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s', background: isEditing ? 'rgba(99, 102, 241, 0.05)' : 'transparent' }}
                    onMouseEnter={e => { if(!isEditing) e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
                    onMouseLeave={e => { if(!isEditing) e.currentTarget.style.background = 'transparent' }}
                  >
                    {isEditing ? (
                      <>
                        <td style={{ padding: '0.9rem 1rem' }}>
                          <input type="text" value={editFormData['TC_ID'] || ''} onChange={e => setEditFormData({...editFormData, 'TC_ID': e.target.value})} style={{ width: '80px', padding: '0.4rem', fontSize: '0.8rem' }} />
                        </td>
                        <td style={{ padding: '0.9rem 1rem' }}>
                          <textarea value={editFormData.Summary || ''} onChange={e => setEditFormData({...editFormData, Summary: e.target.value})} style={{ width: '100%', minWidth: '150px', padding: '0.4rem', fontSize: '0.8rem', minHeight: '60px' }} />
                        </td>
                        <td style={{ padding: '0.9rem 1rem' }}>
                          <textarea value={editFormData['Step Summary'] || ''} onChange={e => setEditFormData({...editFormData, 'Step Summary': e.target.value})} style={{ width: '100%', minWidth: '200px', padding: '0.4rem', fontSize: '0.8rem', minHeight: '60px' }} />
                        </td>
                        <td style={{ padding: '0.9rem 1rem' }}>
                          <textarea value={editFormData['Expected Result'] || ''} onChange={e => setEditFormData({...editFormData, 'Expected Result': e.target.value})} style={{ width: '100%', minWidth: '180px', padding: '0.4rem', fontSize: '0.8rem', minHeight: '60px' }} />
                        </td>
                        <td style={{ padding: '0.9rem 1rem' }}>
                          <input type="text" value={editFormData['TestCase Type'] || ''} onChange={e => setEditFormData({...editFormData, 'TestCase Type': e.target.value})} style={{ width: '100px', padding: '0.4rem', fontSize: '0.8rem' }} />
                        </td>
                        <td style={{ padding: '0.9rem 1rem', whiteSpace: 'nowrap' }}>
                          <button onClick={() => handleSaveRow(i)} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '4px', marginRight: '0.5rem' }}>Save</button>
                          <button onClick={handleCancelEdit} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px' }}>Cancel</button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td style={{ padding: '0.9rem 1rem', color: '#6366f1', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{tc['TC_ID']}</td>
                        <td style={{ padding: '0.9rem 1rem', fontWeight: '500', maxWidth: '220px' }}>{tc.Summary}</td>
                        <td style={{ padding: '0.9rem 1rem', color: '#cbd5e1', whiteSpace: 'pre-wrap', maxWidth: '220px' }}>{tc['Step Summary']}</td>
                        <td style={{ padding: '0.9rem 1rem', color: '#94a3b8', maxWidth: '200px' }}>{tc['Expected Result']}</td>
                        <td style={{ padding: '0.9rem 1rem' }}>
                          <span style={{
                            padding: '0.2rem 0.7rem', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 600, whiteSpace: 'nowrap',
                            background: tc['TestCase Type']?.toLowerCase().includes('negative') ? 'rgba(239, 68, 68, 0.12)' : 'rgba(34, 197, 94, 0.12)',
                            color: tc['TestCase Type']?.toLowerCase().includes('negative') ? '#f87171' : '#4ade80',
                            border: `1px solid ${tc['TestCase Type']?.toLowerCase().includes('negative') ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)'}`
                          }}>
                            {tc['TestCase Type']}
                          </span>
                        </td>
                        <td style={{ padding: '0.9rem 1rem' }}>
                           <button onClick={() => handleEditRow(i, tc)} style={{ padding: '0.3rem 0.6rem', background: 'rgba(255,255,255,0.05)', fontSize: '0.75rem', border: '1px solid rgba(255,255,255,0.1)' }}>✏️ Edit</button>
                        </td>
                      </>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* AUTO ON: Show script below */}
      {autoGenerate && (
        <div ref={scriptRef} className="glass-card animate-fade-in" style={{ borderTop: '2px solid #6366f1', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h3 className="title-gradient" style={{ margin: 0 }}>Playwright Script</h3>
              <p style={{ color: '#64748b', fontSize: '0.8rem', margin: '0.25rem 0 0' }}>Auto-generated from your test cases</p>
            </div>
            <button onClick={handleGenerateScript} className="secondary-btn" disabled={isGeneratingScript}>
              {isGeneratingScript ? '⏳ Generating...' : '↺ Regenerate'}
            </button>
          </div>

          {isGeneratingScript ? (
            <div style={{ height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
              <div className="spinner"></div>
              <p style={{ color: '#94a3b8' }}>Generating Playwright script...</p>
            </div>
          ) : (
            <textarea
              value={script}
              onChange={e => setScript(e.target.value)}
              spellCheck="false"
              style={{
                width: '100%', height: '420px', background: '#0f172a', color: '#38bdf8',
                fontFamily: 'monospace', padding: '1.5rem', borderRadius: '12px',
                border: '1px solid #1e293b', fontSize: '0.85rem', resize: 'vertical', outline: 'none'
              }}
              placeholder="Script will appear here automatically..."
            />
          )}
        </div>
      )}

      {/* AUTO OFF: Show button to navigate to Automation page */}
      {!autoGenerate && testCases.length > 0 && (
        <div style={{ textAlign: 'center', paddingTop: '1rem' }}>
          <button
            onClick={onGoToAutomation}
            style={{
              padding: '1.2rem 3rem', fontSize: '1.1rem',
              background: 'linear-gradient(135deg, #6366f1, #818cf8)',
              boxShadow: '0 10px 25px -5px rgba(99,102,241,0.4)',
              borderRadius: '14px', transition: 'transform 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            Generate Automation Script →
          </button>
          <p style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '0.75rem' }}>Opens the Automation IDE with script editor & terminal</p>
        </div>
      )}
    </div>
  )
}

export default TestCasePage
