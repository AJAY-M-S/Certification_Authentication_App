import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'

export default function ProtectedRoute({ isAuthed, children, requiredRole, requiredMode }) {
  const location = useLocation()
  if (!isAuthed) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (requiredMode) {
    try {
      const mode = localStorage.getItem('loginMode')
      if (mode !== requiredMode) {
        return <Navigate to="/me" replace />
      }
    } catch {
      return <Navigate to="/me" replace />
    }
  }

  if (requiredRole) {
    const role = children?.props?.user?.role
    if (role !== requiredRole) {
      return <Navigate to="/me" replace />
    }
  }
  return children
}
