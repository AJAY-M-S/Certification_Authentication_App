import React, { useState, useEffect, useRef } from 'react'
import { issueCredential, listIssuedCredentials, verifyCertificate, setDevUser } from '../services/api'

export default function ConductorIssue() {
  const bypass = String(import.meta.env.VITE_BYPASS_AUTH || '').toLowerCase() === 'true' || String(import.meta.env.VITE_BYPASS_AUTH || '') === '1'
  const [organizerEmail, setOrganizerEmail] = useState('organizer@example.com')

  const [issuerName, setIssuerName] = useState('')
  const [issuerWalletAddress, setIssuerWalletAddress] = useState('')
  const [setupError, setSetupError] = useState('')
  const [setupComplete, setSetupComplete] = useState(false)

  const [form, setForm] = useState({
    student_email: '',
    student_name: '',
    skill_name: '',
    issuer_name: '',
    issue_date: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  const [issued, setIssued] = useState([])
  const [issuedLoading, setIssuedLoading] = useState(true)
  const [issuedError, setIssuedError] = useState('')

  const [view, setView] = useState('issue')

  const [selectedIssued, setSelectedIssued] = useState(null)
  const [selectedIssuedDetails, setSelectedIssuedDetails] = useState(null)
  const [selectedLoading, setSelectedLoading] = useState(false)
  const [selectedError, setSelectedError] = useState('')

  const detailsCacheRef = useRef(new Map())
  const [cacheVersion, setCacheVersion] = useState(0)

  const loadIssuerProfile = () => {
    try {
      const n = localStorage.getItem('issuerName') || ''
      const w = localStorage.getItem('issuerWalletAddress') || ''
      setIssuerName(n)
      setIssuerWalletAddress(w)
      setSetupComplete(Boolean(n && w))
      if (n) {
        setForm((f) => ({ ...f, issuer_name: n }))
      }
    } catch {
      setSetupComplete(false)
    }
  }

  useEffect(() => {
    loadIssuerProfile()
  }, [])

  const saveIssuerProfile = (e) => {
    e.preventDefault()
    setSetupError('')
    if (!issuerName || !issuerWalletAddress) {
      setSetupError('Please provide issuer name and issuer wallet address')
      return
    }
    try {
      localStorage.setItem('issuerName', issuerName)
      localStorage.setItem('issuerWalletAddress', issuerWalletAddress)
    } catch {
      // ignore
    }
    setForm((f) => ({ ...f, issuer_name: issuerName }))
    setSetupComplete(true)
    setView('issue')
  }

  const viewIssuedDetails = async (row) => {
    setSelectedIssued(row)
    const key = String(row.token_id)
    const cached = detailsCacheRef.current.get(key)
    if (cached) {
      setSelectedIssuedDetails(cached)
      setSelectedError('')
      setSelectedLoading(false)
      return
    }

    setSelectedIssuedDetails(null)
    setSelectedError('')
    setSelectedLoading(true)
    try {
      const res = await verifyCertificate(row.token_id)
      detailsCacheRef.current.set(key, res)
      setCacheVersion((v) => v + 1)
      setSelectedIssuedDetails(res)
    } catch (e) {
      setSelectedError(e?.message || 'Failed to load certificate details')
    } finally {
      setSelectedLoading(false)
    }
  }

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

  const loadIssued = async () => {
    setIssuedLoading(true)
    setIssuedError('')
    try {
      const res = await listIssuedCredentials()
      setIssued(res || [])

      // Prefetch details in background to make "View details" fast.
      // We limit concurrency to avoid overloading the verify endpoint (chain/IPFS).
      const rows = (res || []).slice(0, 12)
      const concurrency = 2
      const queue = [...rows]
      const workers = Array.from({ length: concurrency }).map(async () => {
        while (queue.length > 0) {
          const row = queue.shift()
          if (!row) return
          const key = String(row.token_id)
          if (detailsCacheRef.current.get(key)) continue
          try {
            const d = await verifyCertificate(row.token_id)
            if (!detailsCacheRef.current.get(key)) {
              detailsCacheRef.current.set(key, d)
              setCacheVersion((v) => v + 1)
            }
          } catch {
            // ignore prefetch errors; user can still click to retry
          }
        }
      })
      Promise.all(workers)
    } catch (e) {
      setIssuedError(e?.message || 'Failed to load issued certificates')
    } finally {
      setIssuedLoading(false)
    }
  }

  useEffect(() => {
    loadIssued()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)
    try {
      if (!setupComplete) {
        throw new Error('Complete issuer setup before issuing certificates')
      }
      if (bypass) {
        setDevUser({ email: organizerEmail, role: 'organizer' })
      }
      if (!form.student_email || !form.student_name || !form.skill_name || !form.issuer_name || !form.issue_date) {
        throw new Error('Please fill all fields')
      }
      const payload = {
        ...form,
        // Student should not be required to have a wallet.
        // We keep backend contract unchanged by using the issuer wallet as the on-chain recipient.
        student_wallet_address: issuerWalletAddress,
      }
      const res = await issueCredential(payload)
      setResult(res)
      await loadIssued()
    } catch (err) {
      setError(err?.message || 'Failed to issue credential')
    } finally {
      setLoading(false)
    }
  }

  const cred = result?.credential

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, marginBottom: 10 }}>
        <div>
          <h2>{issuerName ? issuerName : 'Issuer'}</h2>
          <p>Issue and manage verifiable certificates.</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        {!setupComplete ? null : (
          <button className={view === 'issue' ? 'btn' : 'btn btn--ghost'} onClick={() => setView('issue')}>Issue Certificate</button>
        )}
        <button className={view === 'issued' ? 'btn' : 'btn btn--ghost'} onClick={() => setView('issued')}>Issued Certificates</button>
      </div>

      {bypass && (
        <form className="form" onSubmit={(e) => { e.preventDefault(); setDevUser({ email: organizerEmail, role: 'organizer' }) }}>
          <label>
            Test as Organizer Email
            <input value={organizerEmail} onChange={(e) => setOrganizerEmail(e.target.value)} placeholder="organizer@example.com" />
          </label>
        </form>
      )}

      {!setupComplete && (
        <div className="card">
          <h3>Issuer setup</h3>
          <p style={{ marginTop: 6 }}>Set your issuer details once. The issuer wallet pays gas and holds the on-chain certificate.</p>
          <form className="form" onSubmit={saveIssuerProfile}>
            <label>
              Issuer Name
              <input value={issuerName} onChange={(e) => setIssuerName(e.target.value)} placeholder="Organization / Institute" />
            </label>
            <label>
              Issuer Wallet Address (pays gas & holds certificate)
              <input value={issuerWalletAddress} onChange={(e) => setIssuerWalletAddress(e.target.value)} placeholder="0x..." />
            </label>
            <button className="btn" style={{ width: '100%' }} type="submit">Continue</button>
          </form>
          {setupError && <div className="alert alert--error">{setupError}</div>}
        </div>
      )}

      {setupComplete && view === 'issue' && (
        <div className="card">
          <h3>Certificate details</h3>
          <form className="form" onSubmit={handleSubmit}>
            <label>
              Student Email
              <input name="student_email" value={form.student_email} onChange={handleChange} placeholder="student@example.com" />
            </label>
            <label>
              Student Name
              <input name="student_name" value={form.student_name} onChange={handleChange} />
            </label>
            <label>
              Skill Name
              <input name="skill_name" value={form.skill_name} onChange={handleChange} />
            </label>
            <label>
              Issuer Name
              <input name="issuer_name" value={form.issuer_name} onChange={handleChange} />
            </label>
            <label>
              Issue Date
              <input type="date" name="issue_date" value={form.issue_date} onChange={handleChange} />
            </label>

            <button className="btn" disabled={loading} style={{ width: '100%' }}>
              {loading ? 'Issuing...' : 'Issue certificate'}
            </button>
          </form>
        </div>
      )}

      {error && <div className="alert alert--error">{error}</div>}

      {cred && (
        <div className="card">
          <h3>Issued successfully</h3>
          <div><strong>Recipient:</strong> {cred.student_email}</div>
          <div><strong>Certificate ID:</strong> {cred.token_id}</div>
          <div><strong>Storage:</strong> IPFS</div>
        </div>
      )}

      {view === 'issued' && (
        <div className="card">
          <h3>Issued certificates</h3>
          {issuedLoading && <div>Loading...</div>}
          {issuedError && <div className="alert alert--error">{issuedError}</div>}
          {!issuedLoading && !issuedError && issued.length === 0 && (
            <div style={{ color: 'rgba(255,255,255,0.72)' }}>No issued certificates yet.</div>
          )}
          {!issuedLoading && !issuedError && issued.length > 0 && (
            <div style={{ display: 'grid', gap: 10 }}>
              {issued.map((r) => (
                <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.10)' }}>
                  <div>
                    <div style={{ fontWeight: 650 }}>{r.student_email}</div>
                    {detailsCacheRef.current.get(String(r.token_id))?.skill_name ? (
                      <div style={{ opacity: 0.74, fontSize: 13, marginTop: 4 }}>{detailsCacheRef.current.get(String(r.token_id))?.skill_name}</div>
                    ) : null}
                    <div style={{ opacity: 0.74, fontSize: 13, marginTop: 4 }}>Certificate ID {r.token_id}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ opacity: 0.74, fontSize: 13 }}>{formatDate(r.created_at)}</div>
                    <button className="btn btn--ghost" onClick={() => viewIssuedDetails(r)} disabled={selectedLoading}>View details</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {(selectedLoading || selectedError || selectedIssuedDetails) && (
            <div style={{ marginTop: 14 }}>
              {selectedError && <div className="alert alert--error">{selectedError}</div>}

              {(selectedLoading || selectedIssuedDetails) && (
                <div className="card" style={{ marginTop: 12 }}>
                  <h3>Certificate details</h3>
                  {selectedLoading && <div>Loading...</div>}
                  {selectedIssued && <div style={{ opacity: 0.82, fontSize: 13, marginTop: 6 }}>Student Email: {selectedIssued.student_email}</div>}

                  {selectedIssuedDetails && (
                    <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
                      <div><strong>Verification:</strong> {selectedIssuedDetails.verification_status ? 'Verified' : 'Not verified'}</div>
                      {selectedIssuedDetails.student_name && <div><strong>Name:</strong> {selectedIssuedDetails.student_name}</div>}
                      {selectedIssuedDetails.skill_name && <div><strong>Certification:</strong> {selectedIssuedDetails.skill_name}</div>}
                      {selectedIssuedDetails.issuer_name && <div><strong>Issued By:</strong> {selectedIssuedDetails.issuer_name}</div>}
                      {selectedIssuedDetails.issue_date && <div><strong>Issued On:</strong> {formatDate(selectedIssuedDetails.issue_date)}</div>}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
 }
