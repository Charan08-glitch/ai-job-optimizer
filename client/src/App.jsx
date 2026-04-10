import { useState } from 'react'
import './App.css'

function App() {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || ''
  const [resumeFile, setResumeFile] = useState(null)
  const [jobDescription, setJobDescription] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const readResponseData = async (response) => {
    const rawText = await response.text()

    if (!rawText) {
      return null
    }

    try {
      return JSON.parse(rawText)
    } catch {
      return {
        error: rawText,
      }
    }
  }

  const getErrorMessage = (data, fallbackMessage) => {
    if (typeof data?.error === 'string') {
      return data.error
    }

    if (data?.error?.message) {
      return data.error.message
    }

    return fallbackMessage
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!resumeFile) {
      setError('Please upload a resume PDF before submitting.')
      return
    }

    if (!jobDescription.trim()) {
      setError('Please paste a job description before submitting.')
      return
    }

    try {
      setIsLoading(true)
      setError('')
      setResult(null)

      const formData = new FormData()
      formData.append('resume', resumeFile)
      formData.append('jobDescription', jobDescription)

      const response = await fetch(`${apiBaseUrl}/analyze`, {
        method: 'POST',
        body: formData,
      })

      const data = await readResponseData(response)

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, 'Something went wrong while analyzing the resume.'),
        )
      }

      if (!data) {
        throw new Error('The backend returned an empty response. Please try again.')
      }

      setResult(data)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <p className="eyebrow">MERN + Gemini Project</p>
        <h1>AI Job Application Optimizer</h1>
        <p className="hero-copy">
          Upload a resume PDF, paste a job description, and get a simple AI
          breakdown of how well the profile matches the role.
        </p>
      </section>

      <section className="workspace">
        <form className="analysis-form" onSubmit={handleSubmit}>
          <div className="field-group">
            <label htmlFor="resume">Resume PDF</label>
            <input
              id="resume"
              type="file"
              accept="application/pdf"
              onChange={(event) => {
                setResumeFile(event.target.files?.[0] || null)
              }}
            />
            <small>Only PDF files are allowed.</small>
          </div>

          <div className="field-group">
            <label htmlFor="jobDescription">Job Description</label>
            <textarea
              id="jobDescription"
              rows="10"
              placeholder="Paste the job description here..."
              value={jobDescription}
              onChange={(event) => setJobDescription(event.target.value)}
            />
          </div>

          <button className="submit-button" type="submit" disabled={isLoading}>
            {isLoading ? 'Analyzing Resume...' : 'Analyze Application'}
          </button>

          {error ? <p className="message error-message">{error}</p> : null}
        </form>

        <section className="results-panel">
          <div className="results-header">
            <h2>Results</h2>
            <p>The analysis will appear here after the request finishes.</p>
          </div>

          {isLoading ? (
            <div className="message loading-message">Please wait while the AI processes the resume.</div>
          ) : null}

          {!isLoading && !result ? (
            <div className="empty-state">
              <p>No analysis yet.</p>
              <span>Submit a resume and job description to see the match report.</span>
            </div>
          ) : null}

          {result ? (
            <div className="results-grid">
              <article className="result-card score-card">
                <h3>Match Score</h3>
                <p className="score-value">{result.matchScore}%</p>
              </article>

              <article className="result-card">
                <h3>Missing Skills</h3>
                <ul>
                  {(result.missingSkills.length ? result.missingSkills : ['No major missing skills detected.']).map((skill) => (
                    <li key={skill}>{skill}</li>
                  ))}
                </ul>
              </article>

              <article className="result-card">
                <h3>Weak Areas</h3>
                <ul>
                  {(result.weakAreas.length ? result.weakAreas : ['No clear weak areas were found.']).map((area) => (
                    <li key={area}>{area}</li>
                  ))}
                </ul>
              </article>

              <article className="result-card">
                <h3>Suggestions</h3>
                <ul>
                  {(result.suggestions.length ? result.suggestions : ['No additional suggestions were generated.']).map((suggestion) => (
                    <li key={suggestion}>{suggestion}</li>
                  ))}
                </ul>
              </article>
            </div>
          ) : null}
        </section>
      </section>
    </main>
  )
}

export default App
