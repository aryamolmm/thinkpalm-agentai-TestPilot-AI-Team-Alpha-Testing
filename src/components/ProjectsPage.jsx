import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FolderKanban, Plus, Power, Trash2, Edit2, Globe, Database, Mail, Link as LinkIcon, Key, Check } from 'lucide-react'

const ProjectsPage = ({ projectsList, activeProject, onActivate, onRefresh }) => {
  const [showAddForm, setShowAddForm] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    key: '',
    name: '',
    jiraUrl: '',
    email: '',
    token: '',
    environmentUrl: '',
    notificationEmail: '',
    qmetryBaseUrl: '',
    qmetryApiToken: '',
    qmetryProjectId: '',
    qmetryEnabled: true
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    
    try {
      const resp = await fetch('http://localhost:3001/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (!resp.ok) throw new Error('Failed to save project onboarding configuration')
      
      const res = await resp.json()
      onRefresh()
      setShowAddForm(false)
      setIsEditing(false)
      // Reset form
      setFormData({
        key: '',
        name: '',
        jiraUrl: '',
        email: '',
        token: '',
        environmentUrl: '',
        notificationEmail: '',
        qmetryBaseUrl: '',
        qmetryApiToken: '',
        qmetryProjectId: '',
        qmetryEnabled: true
      })
      
      // Auto-activate the newly onboarded project
      if (res.project) {
        onActivate(res.project)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (e, key) => {
    e.stopPropagation()
    if (!window.confirm(`Are you sure you want to offboard project key ${key}? This will erase local context settings.`)) return
    
    try {
      const resp = await fetch(`http://localhost:3001/api/projects/${key}`, {
        method: 'DELETE'
      })
      if (resp.ok) {
        onRefresh()
      }
    } catch (err) {
      console.error('Delete failed', err)
    }
  }

  const handleEdit = (e, project) => {
    e.stopPropagation()
    setIsEditing(true)
    setFormData({
      key: project.key,
      name: project.name,
      jiraUrl: project.jiraUrl,
      email: project.email,
      token: project.token || '',
      environmentUrl: project.environmentUrl || '',
      notificationEmail: project.notificationEmail || '',
      qmetryBaseUrl: project.qmetryBaseUrl || '',
      qmetryApiToken: project.qmetryApiToken || '',
      qmetryProjectId: project.qmetryProjectId || '',
      qmetryEnabled: !!project.qmetryEnabled
    })
    setShowAddForm(true)
    
    // Smooth scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCancel = () => {
    setShowAddForm(false)
    setIsEditing(false)
    setFormData({
      key: '',
      name: '',
      jiraUrl: '',
      email: '',
      token: '',
      environmentUrl: '',
      notificationEmail: '',
      qmetryBaseUrl: '',
      qmetryApiToken: '',
      qmetryProjectId: '',
      qmetryEnabled: true
    })
  }

  const glassStyle = {
    background: 'rgba(30, 41, 59, 0.45)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '16px',
    padding: '1.5rem'
  }

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="animate-fade-in">
      {/* Header banner */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', padding: '0.7rem', borderRadius: '14px', boxShadow: '0 8px 20px rgba(59,130,246,0.3)' }}>
            <FolderKanban size={24} color="white" />
          </div>
          <div>
            <h1 className="title-gradient" style={{ margin: 0, fontSize: '1.8rem', background: 'linear-gradient(to right, #60a5fa, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Project Board
            </h1>
            <p style={{ color: '#94a3b8', margin: '0.2rem 0 0', fontSize: '0.9rem' }}>
              Manage your connected Jira environments, QMetry links, and notifications.
            </p>
          </div>
        </div>
        
        <motion.button 
          whileHover={{ scale: 1.03 }} 
          whileTap={{ scale: 0.97 }}
          onClick={() => {
            if (showAddForm) {
              if (isEditing) {
                // If editing, clicking it resets the form to "create new"
                setIsEditing(false)
                setFormData({
                  key: '',
                  name: '',
                  jiraUrl: '',
                  email: '',
                  token: '',
                  environmentUrl: '',
                  notificationEmail: '',
                  qmetryBaseUrl: '',
                  qmetryApiToken: '',
                  qmetryProjectId: '',
                  qmetryEnabled: true
                })
              } else {
                setShowAddForm(false)
              }
            } else {
              setIsEditing(false)
              setFormData({
                key: '',
                name: '',
                jiraUrl: '',
                email: '',
                token: '',
                environmentUrl: '',
                notificationEmail: '',
                qmetryBaseUrl: '',
                qmetryApiToken: '',
                qmetryProjectId: '',
                qmetryEnabled: true
              })
              setShowAddForm(true)
            }
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
            color: 'white',
            border: 'none',
            padding: '0.65rem 1.2rem',
            borderRadius: '10px',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)'
          }}
        >
          <Plus size={16} /> Onboard Project
        </motion.button>
      </header>

      {/* Forms and listings */}
      <div style={{ display: 'grid', gridTemplateColumns: showAddForm ? '1fr' : '1fr', gap: '2rem' }}>
        
        <AnimatePresence>
          {showAddForm && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ ...glassStyle, borderTop: '4px solid #3b82f6', overflow: 'hidden' }}
            >
              <h3 style={{ margin: '0 0 1.5rem', color: '#f8fafc', fontSize: '1.1rem' }}>
                {isEditing ? `Edit Project Profile (${formData.key})` : 'New Project Onboarding Profile'}
              </h3>
              
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.25rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.4rem', fontWeight: 600 }}>Project Key</label>
                    <input 
                      type="text" 
                      name="key"
                      placeholder="e.g. KAN" 
                      value={formData.key}
                      onChange={handleInputChange}
                      required 
                      disabled={isEditing}
                      style={{ textTransform: 'uppercase', opacity: isEditing ? 0.6 : 1, cursor: isEditing ? 'not-allowed' : 'text' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.4rem', fontWeight: 600 }}>Project Display Name</label>
                    <input 
                      type="text" 
                      name="name"
                      placeholder="e.g. SwagLabs Web Application" 
                      value={formData.name}
                      onChange={handleInputChange}
                      required 
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.4rem', fontWeight: 600 }}>Jira Atlassian URL</label>
                    <input 
                      type="url" 
                      name="jiraUrl"
                      placeholder="e.g. https://domain.atlassian.net" 
                      value={formData.jiraUrl}
                      onChange={handleInputChange}
                      required 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.4rem', fontWeight: 600 }}>Target Environment URL</label>
                    <input 
                      type="url" 
                      name="environmentUrl"
                      placeholder="e.g. https://www.saucedemo.com" 
                      value={formData.environmentUrl}
                      onChange={handleInputChange}
                      required 
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.4rem', fontWeight: 600 }}>Jira Credential Email</label>
                    <input 
                      type="email" 
                      name="email"
                      placeholder="e.g. lead@company.com" 
                      value={formData.email}
                      onChange={handleInputChange}
                      required 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.4rem', fontWeight: 600 }}>Jira API Token / Passcode</label>
                    <input 
                      type="password" 
                      name="token"
                      placeholder="•••••••••••••••••••••" 
                      value={formData.token}
                      onChange={handleInputChange}
                      required 
                    />
                  </div>
                </div>

                {/* QMetry Sub-config */}
                <div style={{ 
                  background: 'rgba(0,0,0,0.2)', 
                  padding: '1.25rem', 
                  borderRadius: '12px', 
                  border: '1px solid rgba(255,255,255,0.04)',
                  marginTop: '0.5rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Database size={15} /> QMetry Synchronization Configuration
                    </h4>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', cursor: 'pointer', color: '#cbd5e1' }}>
                      <input 
                        type="checkbox" 
                        name="qmetryEnabled"
                        checked={formData.qmetryEnabled}
                        onChange={handleInputChange}
                        style={{ width: 'auto', margin: 0 }}
                      /> Enabled
                    </label>
                  </div>
                  
                  {formData.qmetryEnabled && (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px', gap: '1rem' }}>
                        <div>
                          <input 
                            type="text" 
                            name="qmetryBaseUrl"
                            placeholder="QMetry Base URL" 
                            value={formData.qmetryBaseUrl}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div>
                          <input 
                            type="password" 
                            name="qmetryApiToken"
                            placeholder="QMetry API Token" 
                            value={formData.qmetryApiToken}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div>
                          <input 
                            type="text" 
                            name="qmetryProjectId"
                            placeholder="Project ID" 
                            value={formData.qmetryProjectId}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.5rem', fontStyle: 'italic' }}>
                        💡 <strong>Note:</strong> Bulk sync requires a QMetry <strong>Automation API Key</strong> (generated from Integrations &gt; Automation API), not an Open API key.
                      </div>
                    </>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '0.4rem', fontWeight: 600 }}>Recipient Notification Email</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={13} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
                    <input 
                      type="email" 
                      name="notificationEmail"
                      placeholder="e.g. alerts@company.com" 
                      value={formData.notificationEmail}
                      onChange={handleInputChange}
                      required 
                      style={{ paddingLeft: '2.2rem' }}
                    />
                  </div>
                </div>

                {error && (
                  <div style={{ color: '#f87171', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239,68,68,0.2)', padding: '0.75rem', borderRadius: '10px', fontSize: '0.85rem' }}>
                    ⚠️ {error}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                  <button 
                    type="button" 
                    onClick={handleCancel}
                    style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', width: 'auto', padding: '0.55rem 1.2rem', borderRadius: '8px', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    style={{ 
                      background: 'linear-gradient(135deg, #10b981, #059669)', 
                      color: 'white', 
                      width: 'auto', 
                      padding: '0.55rem 1.5rem', 
                      borderRadius: '8px', 
                      cursor: 'pointer',
                      border: 'none',
                      fontWeight: 600
                    }}
                  >
                    {isSubmitting ? (isEditing ? 'Saving...' : 'Onboarding...') : (isEditing ? 'Save Changes' : 'Onboard Workspace')}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Projects Listing */}
        <div>
          <h3 style={{ margin: '0 0 1.25rem', color: '#e2e8f0', fontSize: '1rem' }}>Active QA Workspace Profiles</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
            {projectsList.map((project) => {
              const isActive = activeProject && activeProject.key === project.key
              return (
                <motion.div
                  key={project.key}
                  whileHover={{ scale: 1.02, y: -2 }}
                  onClick={() => onActivate(project)}
                  style={{
                    ...glassStyle,
                    borderLeft: `4px solid ${isActive ? '#3b82f6' : 'rgba(255,255,255,0.1)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    background: isActive ? 'linear-gradient(to right bottom, rgba(59, 130, 246, 0.08), rgba(15, 23, 42, 0.65))' : 'rgba(30, 41, 59, 0.45)',
                    boxShadow: isActive ? '0 10px 30px rgba(59, 130, 246, 0.15)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
                    <div>
                      <h4 style={{ margin: 0, color: '#f8fafc', fontSize: '1.05rem', fontWeight: 700 }}>{project.name}</h4>
                      <span style={{ fontFamily: 'monospace', color: isActive ? '#60a5fa' : '#64748b', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Key: {project.key}
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      {isActive && (
                        <span style={{ 
                          background: 'rgba(59, 130, 246, 0.15)', 
                          color: '#60a5fa', 
                          border: '1px solid rgba(59, 130, 246, 0.3)',
                          padding: '0.2rem 0.55rem', 
                          borderRadius: '20px', 
                          fontSize: '0.7rem', 
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.2rem'
                        }}>
                          <Check size={11} /> ACTIVE
                        </span>
                      )}
                      
                      <button 
                        onClick={(e) => handleEdit(e, project)}
                        style={{
                          background: 'rgba(59, 130, 246, 0.08)',
                          color: '#60a5fa',
                          border: '1px solid rgba(59, 130, 246, 0.15)',
                          borderRadius: '8px',
                          padding: '0.35rem',
                          cursor: 'pointer'
                        }}
                        title="Edit Onboarding Profile"
                      >
                        <Edit2 size={13} />
                      </button>

                      <button 
                        onClick={(e) => handleDelete(e, project.key)}
                        style={{
                          background: 'rgba(239, 68, 68, 0.08)',
                          color: '#ef4444',
                          border: '1px solid rgba(239, 68, 68, 0.15)',
                          borderRadius: '8px',
                          padding: '0.35rem',
                          cursor: 'pointer'
                        }}
                        title="Delete Onboarding Profile"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.78rem', color: '#94a3b8', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <LinkIcon size={12} color="#475569" />
                      <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>Jira: {project.jiraUrl}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Globe size={12} color="#475569" />
                      <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>Env: {project.environmentUrl || 'about:blank'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Mail size={12} color="#475569" />
                      <span>Alerts: {project.notificationEmail}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: project.qmetryEnabled ? '#10b981' : '#64748b', fontSize: '0.72rem', marginTop: '0.2rem' }}>
                      <Database size={11} />
                      <span>QMetry Synchronization: {project.qmetryEnabled ? 'Enabled' : 'Disabled'}</span>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>

      </div>

    </motion.div>
  )
}

export default ProjectsPage
