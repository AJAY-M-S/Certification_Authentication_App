const BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:8000'
const BYPASS_AUTH = String(import.meta.env.VITE_BYPASS_AUTH || '').toLowerCase() === 'true' || String(import.meta.env.VITE_BYPASS_AUTH || '') === '1'

let _token = null
let _devEmail = null
let _devRole = null

export const setDevUser = ({ email, role }) => {
  _devEmail = email || null
  _devRole = role || null
  try {
    if (email) localStorage.setItem('devEmail', email)
    if (role) localStorage.setItem('devRole', role)
  } catch {}
}

export const loadDevUser = () => {
  try {
    _devEmail = localStorage.getItem('devEmail') || null
    _devRole = localStorage.getItem('devRole') || null
  } catch {}
}

export const setAuthToken = (token) => {
  _token = token
  try { localStorage.setItem('idToken', token || '') } catch {}
}

export const loadAuthToken = () => {
  try {
    const t = localStorage.getItem('idToken')
    _token = t || null
  } catch {}
}

export const clearAuthToken = () => {
  _token = null
  try { localStorage.removeItem('idToken') } catch {}
}

const authedFetch = async (url, options = {}) => {
  const headers = {
    ...(options.headers || {}),
  }

  if (BYPASS_AUTH) {
    if (!_devEmail) loadDevUser()
    headers['X-User-Email'] = _devEmail || 'student@example.com'
    headers['X-User-Role'] = _devRole || 'student'
    return fetch(url, { ...options, headers })
  }

  if (!_token) throw new Error('Not authenticated')
  headers['Authorization'] = `Bearer ${_token}`
  return fetch(url, { ...options, headers })
}

export const issueCredential = async (payload) => {
  const res = await authedFetch(`${BASE_URL}/credentials/issue`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `HTTP ${res.status}`)
  }
  return res.json()
}

export const listMyCredentials = async () => {
  const res = await authedFetch(`${BASE_URL}/credentials/me`)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `HTTP ${res.status}`)
  }
  return res.json()
}

export const listIssuedCredentials = async () => {
  const res = await authedFetch(`${BASE_URL}/credentials/issued`)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `HTTP ${res.status}`)
  }
  return res.json()
}

export const verifyCertificate = async (tokenId) => {
  const res = await fetch(`${BASE_URL}/verify/${encodeURIComponent(tokenId)}`)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `HTTP ${res.status}`)
  }
  return res.json()
}
