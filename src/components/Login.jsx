import { useState } from 'react'

const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    baseUrl: '',
    email: '',
    token: ''
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (formData.baseUrl && formData.email && formData.token) {
      onLogin(formData)
    }
  }

  return (
    <div className="glass-card animate-fade-in" style={{ maxWidth: '500px', margin: '10vh auto' }}>
      <h1 className="title-gradient" style={{ textAlign: 'center', marginBottom: '2rem' }}>Jira Connector</h1>
      <p style={{ textAlign: 'center', color: '#94a3b8', marginBottom: '2rem' }}>
        Connect to your Jira Cloud to fetch User Stories
      </p>
      
      <form onSubmit={handleSubmit}>
        <label>Jira URL</label>
        <input 
          type="url" 
          placeholder="https://your-domain.atlassian.net" 
          value={formData.baseUrl}
          onChange={(e) => setFormData({...formData, baseUrl: e.target.value})}
          required
        />

        <label>Email Address</label>
        <input 
          type="email" 
          placeholder="email@example.com" 
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          required
        />

        <label>API Token</label>
        <input 
          type="password" 
          placeholder="Jira API Token" 
          value={formData.token}
          onChange={(e) => setFormData({...formData, token: e.target.value})}
          required
        />

        <button type="submit">Connect to Jira</button>
      </form>
    </div>
  )
}

export default Login
