import React, { useState } from 'react'
import { verifyCertificate } from '../services/api'

export default function VerifyCertificate() {
  const [tokenId, setTokenId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setData(null)
    try {
      if (!tokenId) throw new Error('Please enter a token ID')
      const res = await verifyCertificate(tokenId)
      setData(res)
    } catch (err) {
      setError(err?.message || 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2>Verify Certificate</h2>
      <form className="form" onSubmit={handleSubmit}>
        <label>
          Token ID
          <input value={tokenId} onChange={(e) => setTokenId(e.target.value)} placeholder="e.g. 1" />
        </label>
        <button className="btn" disabled={loading}>{loading ? 'Verifying...' : 'Verify'}</button>
      </form>

      {error && <div className="alert alert--error">{error}</div>}

      {data && (
        <div className="card">
          <h3>Verification Result</h3>
          <div><strong>Status:</strong> {data.verification_status ? 'Valid' : 'Invalid'}</div>
          {data.student_name && <div><strong>Student:</strong> {data.student_name}</div>}
          {data.skill_name && <div><strong>Skill:</strong> {data.skill_name}</div>}
          {data.issuer_name && <div><strong>Issuer:</strong> {data.issuer_name}</div>}
          {data.issue_date && <div><strong>Issued On:</strong> {data.issue_date}</div>}
          {data.wallet_address && <div><strong>Wallet:</strong> {data.wallet_address}</div>}
        </div>
      )}
    </div>
  )
}
