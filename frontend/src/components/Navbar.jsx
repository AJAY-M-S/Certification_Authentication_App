import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signOut as fbSignOut } from '../firebase'
import { clearAuthToken } from '../services/api'

export default function Navbar({ user }) {
  const navigate = useNavigate()
  const bypass = String(import.meta.env.VITE_BYPASS_AUTH || '').toLowerCase() === 'true' || String(import.meta.env.VITE_BYPASS_AUTH || '') === '1'

  let loginMode = 'student'
  try {
    loginMode = localStorage.getItem('loginMode') || 'student'
  } catch {}
  const isOrganizer = (user?.role || '') === 'organizer'

  const handleLogin = () => {
    // Ensure a predictable default mode when user starts login from navbar.
    try { localStorage.setItem('loginMode', 'student') } catch {}
    navigate('/login')
  }

  const handleLogout = async () => {
    try {
      if (!bypass) await fbSignOut()
      clearAuthToken()
      navigate('/login')
    } catch {
      // ignore
    }
  }

  return (
    <nav className="nav">
      <div className="nav__brand">Skill Credentials</div>
      <div className="nav__links">
        {loginMode !== 'conductor' ? <Link to="/me">My Certificates</Link> : null}
        {(loginMode === 'conductor' && isOrganizer) ? <Link to="/conductor">Conductor</Link> : null}
      </div>
      <div className="nav__auth">
        {user ? (
          <div className="nav__user">
            <span>{user.displayName || user.email}</span>
            <button onClick={handleLogout} className="btn btn--ghost">Logout</button>
          </div>
        ) : (
          <button onClick={handleLogin} className="btn">Login with Google</button>
        )}
      </div>
    </nav>
  )
}
