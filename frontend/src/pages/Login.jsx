import React, { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { signInWithGoogle } from '../firebase'
import { setAuthToken, setDevUser } from '../services/api'

export default function Login({ user }) {
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/me'
  const bypass = String(import.meta.env.VITE_BYPASS_AUTH || '').toLowerCase() === 'true' || String(import.meta.env.VITE_BYPASS_AUTH || '') === '1'

  useEffect(() => {
    if (user) navigate(from, { replace: true })
  }, [user, from, navigate])

  const handleLogin = async (mode) => {
    try {
      try { localStorage.setItem('loginMode', mode) } catch {}
      if (bypass) {
        setDevUser({ email: 'student@example.com', role: 'student' })
      } else {
        const { token, claims } = await signInWithGoogle()
        setAuthToken(token)

        if (mode === 'conductor' && claims?.role !== 'organizer') {
          alert('This account is not authorized as a Conductor. Please login as Student or contact admin.')
          try { localStorage.setItem('loginMode', 'student') } catch {}
          navigate('/me')
          return
        }
      }
      navigate(mode === 'conductor' ? '/conductor' : '/me')
    } catch (e) {
      alert('Login failed: ' + (e?.message || e))
    }
  }

  return (
    <div>
      <div className="card" style={{ maxWidth: 560, margin: '0 auto' }}>
        <h2>Sign in</h2>
        <p>Choose how you want to access the platform.</p>
        <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
          <button className="btn" onClick={() => handleLogin('student')} style={{ width: '100%' }}>Login as Student</button>
          <button className="btn btn--ghost" onClick={() => handleLogin('conductor')} style={{ width: '100%' }}>Login as Conductor</button>
        </div>
      </div>
    </div>
  )
}
