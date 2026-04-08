import { useState } from 'react'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import TestCasePage from './components/TestCasePage'
import PlaywrightPage from './components/PlaywrightPage'

function App() {
  const [credentials, setCredentials] = useState(null)
  const [view, setView] = useState('login')
  const [currentStory, setCurrentStory] = useState(null)

  const handleLogin = (creds) => {
    setCredentials(creds)
    setView('dashboard')
  }

  const handleLogout = () => {
    setCredentials(null)
    setCurrentStory(null)
    setView('login')
  }

  const goToQA = (story) => {
    setCurrentStory(story)
    setView('qa')
  }

  const goToAutomation = () => {
    setView('automation')
  }

  const backToDashboard = () => setView('dashboard')
  const backToQA = () => setView('qa')

  const handleUpdateCreds = (newCreds) => {
    setCredentials(newCreds)
  }

  return (
    <div className="app-container">
      {view === 'login' && (
        <Login onLogin={handleLogin} />
      )}
      
      {view === 'dashboard' && (
        <Dashboard 
          credentials={credentials} 
          onUpdateCredentials={handleUpdateCreds}
          onLogout={handleLogout} 
          onGoToGenerator={goToQA} 
        />
      )}

      {view === 'qa' && currentStory && (
        <TestCasePage 
          story={currentStory} 
          credentials={credentials}
          onBack={backToDashboard}
          onGoToAutomation={goToAutomation}
        />
      )}

      {view === 'automation' && currentStory && (
        <PlaywrightPage 
          story={currentStory} 
          credentials={credentials}
          onBack={backToQA}
          onGoToDashboard={backToDashboard}
        />
      )}
    </div>
  )
}

export default App
