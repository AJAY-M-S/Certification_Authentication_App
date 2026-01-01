import React, { useState } from 'react'
import { issueCertificate } from '../services/api'

export default function IssueCertificate() {
  const [form, setForm] = useState({
    student_wallet_address: '',
    student_name: '',
    skill_name: '',
    issuer_name: '',
    issue_date: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

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
      if (!form.student_wallet_address || !form.student_name || !form.skill_name || !form.issuer_name || !form.issue_date) {
        throw new Error('Please fill all fields')
      }
      const res = await issueCertificate(form)
      setResult(res)
    } catch (err) {
      setError(err?.message || 'Failed to issue certificate')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2>Issue Certificate</h2>
      <form className="form" onSubmit={handleSubmit}>
        <label>
          Student Wallet Address
          <input name="student_wallet_address" value={form.student_wallet_address} onChange={handleChange} placeholder="0x..." />
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

        <button className="btn" disabled={loading}>{loading ? 'Issuing...' : 'Issue Certificate'}</button>
      </form>

      {error && <div className="alert alert--error">{error}</div>}
      {result && (
        <div className="card">
          <h3>Issued Successfully</h3>
          <div><strong>Transaction Hash:</strong> {result.transaction_hash}</div>
          <div><strong>Token ID:</strong> {result.token_id}</div>
          <div><strong>IPFS CID:</strong> {result.ipfs_cid}</div>
        </div>
      )}
    </div>
  )
}
