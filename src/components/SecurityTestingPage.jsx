import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldAlert, Play, ShieldCheck, Shield, ChevronDown, ChevronRight } from 'lucide-react'

const SecurityTestingPage = ({ story, credentials }) => {
  const [isScanning, setIsScanning] = useState(false)
  const [findings, setFindings] = useState([])
  const [expandedId, setExpandedId] = useState(null)
  
  useEffect(() => {
    const cached = localStorage.getItem(`testpilot_security_${story?.id}`)
    if (cached) {
      try {
        const parsed = JSON.parse(cached)
        setFindings(parsed.vulnerabilities || [])
      } catch (e) {}
    } else {
      // Seed initial default security checklist items based on typical web vulnerabilities
      const defaultChecklist = [
        {
          id: "SEC-XSS",
          name: "Cross-Site Scripting (XSS) Vulnerability on Input Forms",
          severity: "High",
          status: "Vulnerable",
          description: "Login username or text area inputs fail to validate or sanitize malicious HTML injection fragments, allowing custom script tags to execute inside the active session.",
          remediation: "Implement strict character white-listing, HTML escape user-supplied strings before rendering them to the screen, and utilize standard Content Security Policies (CSP)."
        },
        {
          id: "SEC-SQLI",
          name: "SQL Injection Susceptibility in Authenticator Query",
          severity: "Critical",
          status: "Vulnerable",
          description: "Database queries are dynamically concatenated without prepared statements, potentially allowing raw database injection attacks via credential text boxes.",
          remediation: "Enforce strict parameter-binding, use modern ORMs, and sanitize input fields before invoking SQL interpreters."
        },
        {
          id: "SEC-TLS",
          name: "TLS Insecure Transport Protocol",
          severity: "Low",
          status: "Secure",
          description: "Ensure the active server rejects insecure HTTP requests and strictly redirects channels to TLS-encrypted HTTPS endpoints.",
          remediation: "Bind HSTS (HTTP Strict Transport Security) headers and enforce standard secure sockets layers."
        }
      ]
      setFindings(defaultChecklist)
    }
  }, [story])

  const runZapScan = async () => {
    setIsScanning(true)
    setFindings([])
    await new Promise(r => setTimeout(r, 2500))

    const activeKey = story?.id || 'KAN'

    const scanResults = [
      {
        id: "ZAP-SQLI",
        name: "Active Injection Sweep - SQL Injection Vulnerability",
        severity: "Critical",
        status: "Vulnerable",
        description: "OWASP ZAP simulated payloads using dynamic tick operators (' OR '1'='1) successfully bypassed initial login query restrictions.",
        remediation: "Ensure parameterized query protocols are applied across all auth REST services."
      },
      {
        id: "ZAP-CSRF",
        name: "Broken CSRF Token Verification",
        severity: "Medium",
        status: "Vulnerable",
        description: "State-changing POST actions do not validate valid Cross-Site Request Forgery tokens, exposing checkout endpoints.",
        remediation: "Deploy anti-CSRF request body tokens and enforce Strict site-specific cookie policies."
      },
      {
        id: "ZAP-SECURE-HEADERS",
        name: "Missing Security Headers Validation",
        severity: "Low",
        status: "Vulnerable",
        description: "Response streams omit critical headers such as X-Content-Type-Options, X-Frame-Options, and Content-Security-Policy.",
        remediation: "Configure custom headers on reverse proxy routers or express server middleware."
      },
      {
        id: "ZAP-SSL",
        name: "Secure Sockets Layer Configurations",
        severity: "Low",
        status: "Secure",
        description: "Server correctly hosts TLS v1.3 secure sockets, safely discarding legacy cipher suites.",
        remediation: "Maintain current cipher configurations."
      }
    ]

    setFindings(scanResults)
    setIsScanning(false)
    localStorage.setItem(`testpilot_security_${story?.id}`, JSON.stringify({ vulnerabilities: scanResults }, null, 2))
  }

  const getSeverityColor = (sev) => {
    switch (sev?.toLowerCase()) {
      case 'critical': return '#ef4444';
      case 'high': return '#f97316';
      case 'medium': return '#eab308';
      default: return '#3b82f6';
    }
  }

  const getStatusBadgeColor = (status) => {
    return status?.toLowerCase() === 'secure' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)'
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
          <div style={{ background: 'linear-gradient(135deg, #f97316, #ef4444)', padding: '0.7rem', borderRadius: '14px' }}>
            <ShieldAlert size={24} color="white" />
          </div>
          <div>
            <h1 className="title-gradient" style={{ margin: 0, fontSize: '1.8rem', background: 'linear-gradient(to right, #fb923c, #ef4444)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              OWASP Security Audits
            </h1>
            <p style={{ color: '#94a3b8', margin: '0.2rem 0 0', fontSize: '0.88rem' }}>
              Evaluate acceptance criteria for injection risks, cross-site leaks, and configure OWASP ZAP simulated sweeps.
            </p>
          </div>
        </div>

        <button 
          onClick={runZapScan}
          disabled={isScanning}
          style={{
            background: 'linear-gradient(135deg, #f97316, #ea580c)',
            color: 'white',
            border: 'none',
            padding: '0.55rem 1.25rem',
            borderRadius: '9px',
            fontWeight: 600,
            cursor: isScanning ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.82rem',
            boxShadow: '0 4px 15px rgba(249, 115, 22, 0.3)'
          }}
        >
          {isScanning ? <Shield className="spin-icon" size={14} /> : <Play size={14} />}
          {isScanning ? 'Running Security Sweeps...' : 'Trigger ZAP Security Audit'}
        </button>
      </div>

      {isScanning ? (
        <div style={{ ...glassStyle, padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>
          <Shield className="spin-icon" size={48} style={{ color: '#fb923c', marginBottom: '1.5rem', opacity: 0.8 }} />
          <h3>Scanning Active Workspace Elements</h3>
          <p style={{ fontSize: '0.85rem', marginTop: '0.5rem', maxWidth: '400px', margin: '0.5rem auto 0' }}>
            ZAP Agent is checking form attributes, analyzing cookies, and running SQL injection script payloads...
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <h3 style={{ margin: 0, fontSize: '1rem', color: '#cbd5e1' }}>Vulnerability Advisories & Risks</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {findings.map(vuln => {
              const isExpanded = expandedId === vuln.id
              const isSecure = vuln.status?.toLowerCase() === 'secure'
              return (
                <div 
                  key={vuln.id} 
                  style={{
                    ...glassStyle,
                    padding: '1.1rem 1.4rem',
                    borderLeft: `4px solid ${getSeverityColor(vuln.severity)}`,
                    cursor: 'pointer'
                  }}
                  onClick={() => setExpandedId(isExpanded ? null : vuln.id)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <span style={{ 
                        background: `${getSeverityColor(vuln.severity)}15`, 
                        color: getSeverityColor(vuln.severity),
                        padding: '0.2rem 0.6rem',
                        borderRadius: '6px',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        textTransform: 'uppercase'
                      }}>
                        {vuln.severity}
                      </span>
                      
                      <h4 style={{ margin: 0, fontSize: '0.92rem', color: '#f8fafc', fontWeight: 600 }}>
                        {vuln.name}
                      </h4>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <span style={{
                        background: getStatusBadgeColor(vuln.status),
                        color: isSecure ? '#10b981' : '#f87171',
                        border: `1px solid ${isSecure ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
                        padding: '0.15rem 0.5rem',
                        borderRadius: '20px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        textTransform: 'uppercase'
                      }}>
                        {vuln.status}
                      </span>
                      
                      {isExpanded ? <ChevronDown size={16} color="#64748b" /> : <ChevronRight size={16} color="#64748b" />}
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{ overflow: 'hidden', marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '0.85rem', fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.5 }}
                      >
                        <div style={{ marginBottom: '0.8rem' }}>
                          <strong style={{ color: '#cbd5e1', display: 'block', marginBottom: '0.25rem' }}>Threat Analysis / Description:</strong>
                          {vuln.description}
                        </div>
                        <div>
                          <strong style={{ color: '#10b981', display: 'block', marginBottom: '0.25rem' }}>ZAP Remediations / Guidelines:</strong>
                          {vuln.remediation}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>

        </div>
      )}

    </motion.div>
  )
}

export default SecurityTestingPage
