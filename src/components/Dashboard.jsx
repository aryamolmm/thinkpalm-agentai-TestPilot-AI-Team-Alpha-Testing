import { useState } from 'react'
import { fetchUserStory } from '../services/jira'

const Dashboard = ({ credentials, onUpdateCredentials, onLogout, onGoToGenerator }) => {
  const [formData, setFormData] = useState({
    type: 'story',
    storyId: '',
    engine: 'gemini',
    aiKey: credentials.geminiKey || ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.storyId || !formData.aiKey) return

    try {
      setLoading(true)
      setError(null)
      
      const story = await fetchUserStory(
        credentials.baseUrl,
        credentials.email,
        credentials.token,
        formData.storyId
      )

      // Update global credentials with the selected AI info
      onUpdateCredentials({
        ...credentials,
        engine: formData.engine,
        geminiKey: formData.aiKey
      })

      // Navigate to the test case generation page
      onGoToGenerator(story)
    } catch (err) {
      setError(err.message || 'Failed to fetch the story. Check your Story ID.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-fade-in">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <div>
          <h1 className="title-gradient" style={{ margin: 0 }}>Configure QA Generation</h1>
          <p style={{ color: '#94a3b8', margin: '0.5rem 0 0' }}>Connected to {credentials.baseUrl}</p>
        </div>
        <button onClick={onLogout} style={{ width: 'auto', padding: '0.5rem 1rem', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          Disconnect
        </button>
      </header>

      <div className="glass-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label>Type</label>
              <select 
                value={formData.type} 
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                style={{ width: '100%', padding: '0.9rem', borderRadius: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', marginTop: '0.5rem' }}
              >
                <option value="story">Story</option>
                <option value="bug">Bug</option>
              </select>
            </div>
            
            <div style={{ flex: 2 }}>
              <label>Story / Bug ID</label>
              <input 
                type="text" 
                placeholder="e.g. KAN-123" 
                value={formData.storyId}
                onChange={(e) => setFormData({...formData, storyId: e.target.value})}
                required
                style={{ marginTop: '0.5rem' }}
              />
            </div>
          </div>

          <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(99, 102, 241, 0.3)', marginBottom: '1.5rem', marginTop: '1.5rem' }}>
            <label style={{ color: '#818cf8', marginBottom: '1rem', display: 'block' }}>Choose AI Orchestrator</label>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <button 
                type="button"
                onClick={() => setFormData({...formData, engine: 'gemini'})}
                style={{ 
                  background: formData.engine === 'gemini' ? '#6366f1' : 'rgba(255,255,255,0.05)',
                  fontSize: '0.8rem', padding: '0.5rem', flex: 1
                }}
              >
                Google Gemini (Pro)
              </button>
              <button 
                type="button"
                onClick={() => setFormData({...formData, engine: 'groq'})}
                style={{ 
                  background: formData.engine === 'groq' ? '#6366f1' : 'rgba(255,255,255,0.05)',
                  fontSize: '0.8rem', padding: '0.5rem', flex: 1
                }}
              >
                Groq (Express)
              </button>
            </div>

            <label style={{ fontSize: '0.8rem' }}>
              {formData.engine === 'gemini' ? 'Gemini API Key' : 'Groq API Key'}
            </label>
            <input 
              type="password" 
              placeholder={`Enter ${formData.engine === 'gemini' ? 'Gemini' : 'Groq'} API Key`} 
              value={formData.aiKey}
              onChange={(e) => setFormData({...formData, aiKey: e.target.value})}
              style={{ margin: '0.5rem 0 0', border: 'none', background: 'rgba(0,0,0,0.2)' }}
              required
            />
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.7rem', color: '#64748b' }}>
              {formData.engine === 'gemini' 
                ? 'Uses Google Cloud for light-speed analysis.' 
                : 'Uses Groq LPUs for the fastest response times.'}
            </p>
          </div>

          {error && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '1rem', borderRadius: '12px', color: '#ef4444', marginBottom: '1.5rem' }}>
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              width: '100%', 
              padding: '1.2rem', 
              fontSize: '1.1rem', 
              background: 'linear-gradient(135deg, #10b981, #059669)'
            }}
          >
            {loading ? 'Fetching Story...' : 'Generate Testcase'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Dashboard

