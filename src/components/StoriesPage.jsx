import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ListTodo, Search, AlertCircle, Calendar, User, Tag, Zap, ArrowRight } from 'lucide-react'

const StoriesPage = ({ storiesList, selectedStory, onSelectStory, onGenerateClick, activeProject, projectsList, onActivateProject, connectionError }) => {
  const [search, setSearch] = useState('')

  const filtered = storiesList.filter(story => 
    story.key.toLowerCase().includes(search.toLowerCase()) || 
    story.summary.toLowerCase().includes(search.toLowerCase())
  )

  const getPriorityColor = (p) => {
    switch (p?.toLowerCase()) {
      case 'high': return '#f87171';
      case 'medium': return '#fbbf24';
      default: return '#60a5fa';
    }
  }

  const getStatusColor = (s) => {
    switch (s?.toLowerCase()) {
      case 'ready for qa':
      case 'done':
        return '#10b981';
      case 'in progress':
        return '#3b82f6';
      default:
        return '#64748b';
    }
  }

  const glassStyle = {
    background: 'rgba(30, 41, 59, 0.45)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '16px',
    padding: '1.5rem'
  }

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="animate-fade-in" style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header section */}
      <div style={{ flexShrink: 0, marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <div style={{ background: 'linear-gradient(135deg, #10b981, #059669)', padding: '0.7rem', borderRadius: '14px' }}>
            <ListTodo size={24} color="white" />
          </div>
          <div>
            <h1 className="title-gradient" style={{ margin: 0, fontSize: '1.8rem', background: 'linear-gradient(to right, #34d399, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Jira Backlog
            </h1>
            <p style={{ color: '#94a3b8', margin: '0.2rem 0 0', fontSize: '0.88rem' }}>
              {activeProject ? `Project: ${activeProject.name} (${activeProject.key})` : 'Review issues, stories, and acceptance criteria fetched automatically.'}
            </p>
          </div>
        </div>

        {/* Project Selector & Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {projectsList && projectsList.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 600 }}>Project:</span>
              <select
                value={activeProject?.key || ''}
                onChange={(e) => {
                  const selected = projectsList.find(p => p.key === e.target.value)
                  if (selected && onActivateProject) onActivateProject(selected)
                }}
                style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  padding: '0.55rem 2rem 0.55rem 1rem',
                  color: '#60a5fa',
                  fontSize: '0.85rem',
                  fontWeight: 600,
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

          <div style={{ position: 'relative', width: '280px' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
            <input 
              type="text" 
              placeholder="Search story key or summary..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ 
                paddingLeft: '2.4rem', 
                fontSize: '0.85rem', 
                borderRadius: '10px',
                background: 'rgba(15, 23, 42, 0.6)',
                width: '100%'
              }}
            />
          </div>
        </div>
      </div>

      {/* Warning banner for connection errors */}
      {connectionError && (
        <div style={{
          flexShrink: 0,
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: '12px',
          padding: '1rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          color: '#fca5a5',
          fontSize: '0.85rem'
        }}>
          <AlertCircle size={18} style={{ color: '#f87171', flexShrink: 0 }} />
          <div>
            <strong style={{ color: '#f87171' }}>Jira Integration Offline:</strong> {connectionError}
          </div>
        </div>
      )}

      {storiesList.length === 0 ? (
        <div style={{ ...glassStyle, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
          <AlertCircle size={48} style={{ opacity: 0.4, marginBottom: '1rem' }} />
          <h3>No User Stories Found</h3>
          <p style={{ maxWidth: '400px', textAlign: 'center', fontSize: '0.85rem', marginTop: '0.4rem' }}>
            {connectionError 
              ? 'Could not load backlog stories from Jira due to a connection failure. Please review your credentials on the Projects tab.'
              : 'Select an onboarded project key with active Jira credentials, or load the mock KAN project to test the framework.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '1.5rem', flex: 1, minHeight: 0 }}>
          
          {/* LEFT LIST PANEL */}
          <div style={{ 
            ...glassStyle, 
            padding: '1rem', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '0.65rem', 
            overflowY: 'auto',
            height: '100%'
          }}>
            <div style={{ fontSize: '0.7rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 700, padding: '0 0.5rem', marginBottom: '0.2rem' }}>
              Jira Stories ({filtered.length})
            </div>
            
            {filtered.map(story => {
              const isSelected = selectedStory && selectedStory.key === story.key
              return (
                <div
                  key={story.key}
                  onClick={() => onSelectStory(story)}
                  style={{
                    background: isSelected ? 'rgba(59, 130, 246, 0.08)' : 'rgba(255,255,255,0.02)',
                    border: '1px solid',
                    borderColor: isSelected ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255,255,255,0.04)',
                    borderRadius: '12px',
                    padding: '1rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => { if(!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                  onMouseLeave={(e) => { if(!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: isSelected ? '#60a5fa' : '#818cf8', fontSize: '0.82rem' }}>
                      {story.key}
                    </span>
                    <span style={{ 
                      fontSize: '0.65rem', 
                      background: `${getStatusColor(story.status)}12`, 
                      color: getStatusColor(story.status),
                      border: `1px solid ${getStatusColor(story.status)}25`,
                      padding: '0.15rem 0.45rem',
                      borderRadius: '20px',
                      fontWeight: 700,
                      textTransform: 'uppercase'
                    }}>
                      {story.status}
                    </span>
                  </div>
                  
                  <h4 style={{ margin: 0, color: '#f1f5f9', fontSize: '0.88rem', fontWeight: 600, lineHeight: 1.4, wordBreak: 'break-word' }}>
                    {story.summary}
                  </h4>
                  
                  <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.75rem', fontSize: '0.72rem', color: '#64748b' }}>
                    <span style={{ color: getPriorityColor(story.priority), fontWeight: 600 }}>Priority: {story.priority}</span>
                    <span>•</span>
                    <span>Assignee: {story.assignee || 'Unassigned'}</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* RIGHT DETAIL PANEL */}
          <div style={{ ...glassStyle, display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
            {selectedStory ? (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                
                {/* Meta details */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '1.25rem', marginBottom: '1.25rem' }}>
                  <div>
                    <span style={{ fontFamily: 'monospace', color: '#38bdf8', fontSize: '0.9rem', fontWeight: 700 }}>
                      Jira Issue Detail / {selectedStory.key}
                    </span>
                    <h2 style={{ color: '#f8fafc', fontSize: '1.35rem', margin: '0.35rem 0 0', fontWeight: 700, lineHeight: 1.3 }}>
                      {selectedStory.summary}
                    </h2>
                  </div>
                  
                  <motion.button 
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={onGenerateClick}
                    style={{
                      background: 'linear-gradient(135deg, #a78bfa, #8b5cf6)',
                      color: 'white',
                      border: 'none',
                      padding: '0.65rem 1.25rem',
                      borderRadius: '10px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      flexShrink: 0
                    }}
                  >
                    <Zap size={15} /> Generation Hub <ArrowRight size={14} />
                  </motion.button>
                </div>

                {/* Sub details banner */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', background: 'rgba(0,0,0,0.15)', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid rgba(255,255,255,0.03)' }}>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</span>
                    <strong style={{ color: getStatusColor(selectedStory.status), fontSize: '0.85rem', textTransform: 'uppercase' }}>{selectedStory.status}</strong>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Priority</span>
                    <strong style={{ color: getPriorityColor(selectedStory.priority), fontSize: '0.85rem' }}>{selectedStory.priority}</strong>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Assignee</span>
                    <strong style={{ color: '#cbd5e1', fontSize: '0.85rem' }}><User size={11} style={{ display: 'inline', marginRight: '0.2rem' }} /> {selectedStory.assignee}</strong>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Reporter</span>
                    <strong style={{ color: '#cbd5e1', fontSize: '0.85rem' }}>{selectedStory.reporter || 'Unassigned'}</strong>
                  </div>
                </div>

                {/* Story Description & Acceptance Criteria */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div>
                    <h4 style={{ margin: '0 0 0.5rem', color: '#94a3b8', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Description / Acceptance Criteria</h4>
                    <pre style={{ 
                      whiteSpace: 'pre-wrap', 
                      background: 'rgba(0,0,0,0.2)', 
                      border: '1px solid rgba(255,255,255,0.04)',
                      borderRadius: '12px', 
                      padding: '1.25rem', 
                      color: '#cbd5e1', 
                      fontSize: '0.9rem',
                      lineHeight: '1.6',
                      fontFamily: 'inherit',
                      margin: 0
                    }}>
                      {selectedStory.description}
                    </pre>
                  </div>
                  
                  {selectedStory.created && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#475569', fontSize: '0.72rem', marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                      <Calendar size={11} /> Created Date: {selectedStory.created}
                    </div>
                  )}
                </div>

              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#475569' }}>
                <AlertCircle size={32} style={{ opacity: 0.5, marginBottom: '0.5rem' }} />
                <span>Select a story from the left list to review detailed acceptance criteria.</span>
              </div>
            )}
          </div>

        </div>
      )}

    </motion.div>
  )
}

export default StoriesPage
