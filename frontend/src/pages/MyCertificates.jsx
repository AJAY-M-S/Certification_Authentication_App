import React, { useEffect, useRef, useState } from 'react'
import { listMyCredentials, verifyCertificate, setDevUser, loadDevUser } from '../services/api'

export default function MyCertificates() {
  const bypass = String(import.meta.env.VITE_BYPASS_AUTH || '').toLowerCase() === 'true' || String(import.meta.env.VITE_BYPASS_AUTH || '') === '1'
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [rows, setRows] = useState([])
  const [selected, setSelected] = useState(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [detailsError, setDetailsError] = useState('')
  const [email, setEmail] = useState('student@example.com')
  const issuerNameCacheRef = useRef(new Map())
  const [issuerNames, setIssuerNames] = useState({})

  const formatDate = (value) => {
    try {
      if (!value) return ''
      const d = new Date(value)
      if (Number.isNaN(d.getTime())) return String(value)
      return d.toLocaleDateString()
    } catch {
      return String(value || '')
    }
  }

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await listMyCredentials()
      setRows(res || [])
    } catch (e) {
      setError(e?.message || 'Failed to load credentials')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (bypass) {
      loadDevUser()
    }
    load()
  }, [])

  const applyEmail = async (e) => {
    e.preventDefault()
    setDevUser({ email, role: 'student' })
    await load()
  }

  const viewDetails = async (tokenId) => {
    setSelected(null)
    setDetailsLoading(true)
    setDetailsError('')
    try {
      const res = await verifyCertificate(tokenId)
      setSelected(res)
    } catch (e) {
      setDetailsError(e?.message || 'Failed to load details')
    } finally {
      setDetailsLoading(false)
    }
  }

  const hydrateIssuerName = async (tokenId) => {
    const key = String(tokenId)
    if (issuerNameCacheRef.current.has(key)) return
    issuerNameCacheRef.current.set(key, { status: 'loading' })
    try {
      const res = await verifyCertificate(tokenId)
      const name = res?.issuer_name || ''
      issuerNameCacheRef.current.set(key, { status: 'ready', name })
      if (name) {
        setIssuerNames((prev) => ({ ...prev, [key]: name }))
      }
    } catch {
      issuerNameCacheRef.current.set(key, { status: 'error' })
    }
  }

  useEffect(() => {
    // Prefetch issuer names in background so list shows names (not emails) without user clicks.
    let cancelled = false
    const run = async () => {
      const list = (rows || []).map((r) => r?.token_id).filter((v) => v !== undefined && v !== null)
      const concurrency = 3
      let i = 0
      const workers = new Array(Math.min(concurrency, list.length)).fill(0).map(async () => {
        while (!cancelled && i < list.length) {
          const tokenId = list[i]
          i += 1
          await hydrateIssuerName(tokenId)
        }
      })
      await Promise.all(workers)
    }
    if (rows?.length) run()
    return () => { cancelled = true }
  }, [rows])

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, marginBottom: 10 }}>
        <div>
          <h2>My Certificates</h2>
          <p>View certificates issued to your email. Each certificate is independently verifiable.</p>
        </div>
      </div>

      {bypass && (
        <form className="form" onSubmit={applyEmail}>
          <label>
            Test as Email
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="student@example.com" />
          </label>
          <button className="btn btn--ghost" type="submit">Load</button>
        </form>
      )}

      {loading && <div>Loading...</div>}
      {error && <div className="alert alert--error">{error}</div>}

      {!loading && !error && rows.length === 0 && (
        <div className="card">No certificates found for your email.</div>
      )}

      {rows.length > 0 && (
        <div className="card">
          <h3>Issued certificates</h3>
          {rows.map((r) => (
            <div key={r.id} style={{ padding: '14px 0', borderBottom: '1px solid rgba(15, 23, 42, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <div style={{ fontWeight: 650, letterSpacing: '-0.01em' }}>{issuerNames[String(r.token_id)] || r.issued_by_email}</div>
                <div style={{ color: 'rgba(91, 103, 122, 0.9)', fontSize: 13, marginTop: 4 }}>Issued on {formatDate(r.created_at)}</div>
              </div>
              <button className="btn btn--ghost" onClick={() => viewDetails(r.token_id)} disabled={detailsLoading}>
                {detailsLoading ? 'Loading...' : 'Open'}
              </button>
            </div>
          ))}
        </div>
      )}

      {detailsError && <div className="alert alert--error">{detailsError}</div>}

      {selected && (
        <div className="card">
          <h3>Certificate</h3>
          <div><strong>Verification:</strong> {selected.verification_status ? 'Verified' : 'Not verified'}</div>
          {selected.skill_name && <div><strong>Skill:</strong> {selected.skill_name}</div>}
          {selected.issuer_name && <div><strong>Issued By:</strong> {selected.issuer_name}</div>}
          {selected.issue_date && <div><strong>Issued On:</strong> {formatDate(selected.issue_date)}</div>}
        </div>
      )}
    </div>
  )
}
