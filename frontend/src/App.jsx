import { useState } from 'react'
import './App.css'

function App() {
  const [query, setQuery] = useState('')
  const [location, setLocation] = useState('')
  const [jobs, setJobs] = useState([])
  const [all_jobs, setAll_Jobs] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)

  const handleSearch = async () => {
    if (!query.trim()) return
    setLoading(true)
    setError('')
    setSearched(true)
    try {
      const response = await fetch(
        `/jobs?query=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}`
      )
      if (!response.ok) throw new Error(`Server error: ${response.status}`)
      const data = await response.json()
      setJobs(data.jobs_results || [])
    } catch (err) {
      setError(err.message || 'Failed to fetch jobs. Make sure the backend is running.')
      setJobs([])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch()
  }

  const display_all_jobs = async () => {
    setLoading(true)
    setError('')
    setSearched(true)
    try {
      const response = await fetch('/all-jobs')
      if (!response.ok) throw new Error(`Server error: ${response.status}`)
      const data = await response.json()
      setJobs(data.jobs || [])
      setAll_Jobs(data.jobs || [])
    } catch (err) {
      setError(err.message || 'Failed to fetch all jobs. Make sure the backend is running.')
      setJobs([])
    } finally {
      setLoading(false)
    }

  }



  return (
    <div style={{ maxWidth: 800, margin: '40px auto', padding: '0 20px', fontFamily: 'sans-serif' }}>
      <h1 style={{ marginBottom: 24 }}>Job Search</h1>

      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Job title (e.g. React Developer)"
          style={{ flex: 1, padding: '10px 14px', fontSize: 16, border: '1px solid #ccc', borderRadius: 6 }}
        />
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Location (e.g. Austin, Texas)"
          style={{ flex: 1, padding: '10px 14px', fontSize: 16, border: '1px solid #ccc', borderRadius: 6 }}
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          style={{ padding: '10px 24px', fontSize: 16, background: '#6366f1', color: '#fff', border: 'none', borderRadius: 6, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {error && (
        <p style={{ color: 'red', marginBottom: 16 }}>⚠ {error}</p>
      )}

      {!loading && searched && jobs.length === 0 && !error && (
        <p style={{ color: '#888' }}>No jobs found. Try a different search.</p>
      )}

      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {jobs.map((job) => (
          <li key={job.job_id} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '16px 20px' }}>
            <h2 style={{ margin: '0 0 4px', fontSize: 18 }}>{job.title}</h2>
            <p style={{ margin: '0 0 4px', fontWeight: 600, color: '#6366f1' }}>{job.company_name}</p>
            <p style={{ margin: '0 0 8px', color: '#888', fontSize: 14 }}>{job.location}</p>
            {job.description && (
              <p style={{ margin: 0, fontSize: 14, color: '#555', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {job.description}
              </p>
            )}
          </li>
        ))}
      </ul>



      <h1>All Jobs</h1>
      <button onClick={display_all_jobs}>Display All Jobs</button>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {all_jobs.map((job) => (
          <li key={job._id} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '16px 20px' }}>
            <h2 style={{ margin: '0 0 4px', fontSize: 18 }}>{job.title}</h2>
            <p style={{ margin: '0 0 4px', fontWeight: 600, color: '#6366f1' }}>{job.company_name}</p>
            <p style={{ margin: '0 0 8px', color: '#888', fontSize: 14 }}>{job.location}</p>
            {job.description && (
              <p style={{ margin: 0, fontSize: 14, color: '#555', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {job.description}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default App
