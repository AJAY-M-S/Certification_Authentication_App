import React, { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import ConductorIssue from './pages/ConductorIssue'
import MyCertificates from './pages/MyCertificates'
import { auth, onAuthStateChanged, getIdToken, getIdTokenResult } from './firebase'
import { setAuthToken, clearAuthToken, loadAuthToken } from './services/api'

export default function App() {
  const [user, setUser] = useState(null)
  const [initializing, setInitializing] = useState(true)

  let loginMode = 'student'
  try {
    loginMode = localStorage.getItem('loginMode') || 'student'
  } catch {}
  const isOrganizer = (user?.role || '') === 'organizer'

  useEffect(() => {
    loadAuthToken()
  }, [])

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        try {
          const token = await getIdToken(u, true)
          const tokenResult = await getIdTokenResult(u, true)
          setAuthToken(token)
          setUser({
            uid: u.uid,
            displayName: u.displayName,
            email: u.email,
            photoURL: u.photoURL,
            role: tokenResult?.claims?.role || 'student',
          })
        } catch (e) {
          console.error('Failed to get ID token', e)
        }
      } else {
        clearAuthToken()
        setUser(null)
      }
      setInitializing(false)
    })
    return () => unsub()
  }, [])

  if (initializing) {
    return <div style={{ padding: 24 }}>Loading...</div>
  }

  return (
    <div>
      <Navbar user={user} />
      <div className="container">
        <Routes>
          <Route path="/login" element={<Login user={user} />} />
          <Route
            path="/conductor"
            element={
              <ProtectedRoute isAuthed={!!user} requiredRole="organizer" requiredMode="conductor">
                <ConductorIssue user={user} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/me"
            element={
              <ProtectedRoute isAuthed={!!user} requiredMode="student">
                <MyCertificates />
              </ProtectedRoute>
            }
          />
          <Route
            path="*"
            element={<Navigate to={(loginMode === 'conductor' && isOrganizer) ? '/conductor' : '/me'} replace />}
          />
        </Routes>
      </div>
    </div>
  )
}
