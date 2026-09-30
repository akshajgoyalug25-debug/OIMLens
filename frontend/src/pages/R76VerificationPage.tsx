import { useEffect, useState } from 'react'
import { verifyR76Report, type R76VerificationResponse } from '../services/r76Api'

interface Props {
  reportId: string
}

export function R76VerificationPage({ reportId }: Props) {
  const [data, setData] = useState<R76VerificationResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')

    verifyR76Report(reportId)
      .then((result) => setData(result))
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Unable to verify report.')
      })
      .finally(() => setLoading(false))
  }, [reportId])

  if (loading) {
    return (
      <main className="r76-verification-page">
        <div className="r76-verification-card">
          <div className="r76-verification-logo">OIMLense</div>
          <div className="r76-verification-spinner" />
          <h1>Verifying Report</h1>
          <p>Please wait while we verify this report.</p>
        </div>
      </main>
    )
  }

  if (error || !data?.verified) {
    return (
      <main className="r76-verification-page">
        <div className="r76-verification-card">
          <div className="r76-verification-logo">OIMLense</div>
          <div className="r76-verification-status invalid">!</div>
          <h1>Report Not Verified</h1>
          <p>{error || 'This report could not be verified.'}</p>
          <div className="r76-verification-report-id">
            Report ID: <strong>{reportId}</strong>
          </div>
        </div>
      </main>
    )
  }

  const report = data.report
  const instrument = report.instrument

  return (
    <main className="r76-verification-page">
      <div className="r76-verification-card">
        <div className="r76-verification-logo">OIMLense</div>

        <div className="r76-verification-status valid">✓</div>

        <div className="r76-verification-label">AUTHENTIC REPORT</div>

        <h1>Report Verified</h1>

        <p className="r76-verification-subtitle">
          This report has been successfully verified through the OIMLense
          verification system.
        </p>

        <div className="r76-verification-id">
          <span>Report ID</span>
          <strong>{report.report_id || reportId}</strong>
        </div>

        <div className="r76-verification-grid">
          <div>
            <span>Session</span>
            <strong>{report.session_number || '—'}</strong>
          </div>

          <div>
            <span>Test Type</span>
            <strong>{report.test_type || '—'}</strong>
          </div>

          <div>
            <span>Status</span>
            <strong>{report.status || '—'}</strong>
          </div>

          <div>
            <span>Final Result</span>
            <strong>
              {report.final_result === true
                ? 'PASS'
                : report.final_result === false
                  ? 'FAIL'
                  : 'Pending'}
            </strong>
          </div>
        </div>

        <div className="r76-verification-section">
          <h2>Instrument Details</h2>

          <div className="r76-verification-details">
            <div>
              <span>Instrument Type</span>
              <strong>{instrument?.instrument_type || '—'}</strong>
            </div>

            <div>
              <span>Manufacturer</span>
              <strong>{instrument?.manufacturer || '—'}</strong>
            </div>

            <div>
              <span>Model</span>
              <strong>{instrument?.model || '—'}</strong>
            </div>

            <div>
              <span>Serial Number</span>
              <strong>{instrument?.serial_number || '—'}</strong>
            </div>
          </div>
        </div>

        <div className="r76-verification-footer">
          <span>OIMLense</span>
          <span>Digital NAWI Testing &amp; Compliance Platform</span>
        </div>
      </div>
    </main>
  )
}
