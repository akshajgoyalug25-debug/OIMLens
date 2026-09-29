import { useEffect, useMemo, useState } from 'react'
import { R76TestForm } from '../components/r76/R76TestForm'
import { R76_78_TEST_PROCEDURES } from '../data/r76TestProceduresCatalog'
import {
  createR76Instrument,
  createR76TestSession,
  executeR76Test,
  getR76Results,
  getR76TestDefinitions,
  getR76TestSessions,
  getR76Instruments,
  type R76Instrument,
  type R76TestDefinition,
  type R76TestResult,
  type R76TestSession,
} from '../services/r76Api'

type Props = {
  user: {
    id?: string
    name?: string
    officer_id?: string
    email?: string
  } | null
  onLogout: () => void
  onGoToLanding?: () => void
  onBackToOldApp?: () => void
}

export function SIH26035DashboardPage({
  user,
  onLogout,
  onGoToLanding,
}: Props) {
  const [instruments, setInstruments] = useState<R76Instrument[]>([])
  const [definitions, setDefinitions] = useState<R76TestDefinition[]>([])
  const [sessions, setSessions] = useState<R76TestSession[]>([])

  const [selectedInstrumentId, setSelectedInstrumentId] = useState('')
  const [selectedSessionId, setSelectedSessionId] = useState('')
  const [selectedTestCode, setSelectedTestCode] = useState('')

  const [results, setResults] = useState<R76TestResult[]>([])

  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const [showInstrumentForm, setShowInstrumentForm] = useState(false)
  const [activeView, setActiveView] = useState<'overview' | 'instruments' | 'sessions' | 'tests' | 'history' | 'reports'>('overview')
  const [showSessionForm, setShowSessionForm] = useState(false)

  const [categoryFilter, setCategoryFilter] = useState<'all' | 'weighing' | 'mechanical' | 'environmental' | 'electrical' | 'other'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'NOT_STARTED' | 'PASSED' | 'FAILED'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showMobileProcDropdown, setShowMobileProcDropdown] = useState(false)

  const catalogProcedures = useMemo(() => {
    const apiMap = new Map(definitions.map((d) => [d.test_code, d]))
    return R76_78_TEST_PROCEDURES.map((catItem) => {
      const apiDef = apiMap.get(catItem.test_code)
      return {
        id: apiDef?.id || catItem.id,
        test_code: catItem.test_code,
        test_name: apiDef?.test_name || catItem.test_name,
        description: apiDef?.description || catItem.description,
        category: catItem.category,
        source_clause: apiDef?.source_clause || catItem.source_clause,
        source_document: apiDef?.source_document || catItem.source_document,
        applicable_accuracy_classes: apiDef?.applicable_accuracy_classes,
        applicable_instrument_types: apiDef?.applicable_instrument_types,
        report_standard: apiDef?.report_standard,
        report_section: apiDef?.report_section,
        rule_version: apiDef?.rule_version,
        enabled: true,
      }
    })
  }, [definitions])

  const filteredProcedures = useMemo(() => {
    return catalogProcedures.filter((proc) => {
      const matchesCategory = categoryFilter === 'all' || proc.category === categoryFilter
      const existing = results.find(
        (r) => r.test_definition_id === proc.id || r.rule_id === proc.test_code,
      )
      let matchesStatus = true
      if (statusFilter === 'NOT_STARTED') {
        matchesStatus = !existing
      } else if (statusFilter === 'PASSED') {
        matchesStatus = existing?.pass_fail === true
      } else if (statusFilter === 'FAILED') {
        matchesStatus = existing?.pass_fail === false
      }

      const query = searchQuery.trim().toLowerCase()
      const matchesQuery =
        !query ||
        proc.test_code.toLowerCase().includes(query) ||
        proc.test_name.toLowerCase().includes(query) ||
        proc.description.toLowerCase().includes(query) ||
        proc.source_clause.toLowerCase().includes(query)
      return matchesCategory && matchesStatus && matchesQuery
    })
  }, [catalogProcedures, categoryFilter, statusFilter, searchQuery, results])

  const [instrumentForm, setInstrumentForm] = useState({
    manufacturer: 'Test Manufacturer',
    model: 'NAWI-100',
    serial_number: '',
    instrument_type: 'Non-automatic weighing instrument',
    accuracy_class: 'III',
    indication_type: 'Digital',
    weighing_principle: 'Electronic load cell',
    max_capacity: '30',
    min_capacity: '0.2',
    e: '0.01',
    d: '0.01',
    tare_type: 'Semi-automatic',
    unit: 'kg',
    type_approval_number: '',
    software_version: '',
    year_of_manufacture: '2026',
    markings: '',
    documentation_reference: '',
    remarks: '',
  })

  const [sessionForm, setSessionForm] = useState({
    session_number: '',
    test_type: 'initial_verification',
    verification_stage: 'initial_verification',
    test_location: 'Test Laboratory',
  })

  const selectedInstrument = useMemo(
    () => instruments.find((item) => item.id === selectedInstrumentId),
    [instruments, selectedInstrumentId],
  )

  const selectedSession = useMemo(
    () => sessions.find((item) => item.id === selectedSessionId),
    [sessions, selectedSessionId],
  )

  const selectedDefinition = useMemo(
    () => catalogProcedures.find((item) => item.test_code === selectedTestCode) || catalogProcedures[0],
    [catalogProcedures, selectedTestCode],
  )

  useEffect(() => {
    document.title = 'OIMLense — SIH26035'
    loadInitialData()
  }, [])

  function selectInstrument(id: string) {
    setSelectedInstrumentId(id)
    localStorage.setItem('oimlense_selected_instrument_id', id)
  }

  function selectSession(id: string) {
    setSelectedSessionId(id)
    localStorage.setItem('oimlense_selected_session_id', id)
  }

  async function loadInitialData() {
    setLoading(true)
    setError('')

    try {
      const [instrumentData, definitionData, sessionData] =
        await Promise.all([
          getR76Instruments(),
          getR76TestDefinitions(),
          getR76TestSessions(),
        ])

      setInstruments(instrumentData)
      setDefinitions(definitionData)
      setSessions(sessionData)

      if (instrumentData.length > 0) {
        const savedInst = localStorage.getItem('oimlense_selected_instrument_id')
        if (savedInst && instrumentData.some((i) => i.id === savedInst)) {
          setSelectedInstrumentId(savedInst)
        } else {
          setSelectedInstrumentId(instrumentData[0].id)
        }
      }

      if (sessionData.length > 0) {
        const savedSess = localStorage.getItem('oimlense_selected_session_id')
        if (savedSess && sessionData.some((s) => s.id === savedSess)) {
          setSelectedSessionId(savedSess)
        } else {
          setSelectedSessionId(sessionData[0].id)
        }
      }

      if (definitionData.length > 0) {
        setSelectedTestCode(definitionData[0].test_code)
      } else {
        setSelectedTestCode('ZERO_RANGE')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load R76 data.')
    } finally {
      setLoading(false)
    }
  }

  async function loadResults(sessionId: string) {
    try {
      const data = await getR76Results(sessionId)
      setResults(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load results.')
    }
  }

  useEffect(() => {
    if (selectedSessionId) {
      loadResults(selectedSessionId)
    } else {
      setResults([])
    }
  }, [selectedSessionId])

  async function handleCreateInstrument() {
    setBusy(true)
    setError('')

    try {
      const eVal = Number(instrumentForm.e) || 0.01
      const dVal = Number(instrumentForm.d) || 0.01
      const maxVal = Number(instrumentForm.max_capacity) || 30
      const nVal = eVal > 0 ? Math.round(maxVal / eVal) : 3000

      const instrument = await createR76Instrument({
        manufacturer: instrumentForm.manufacturer,
        model: instrumentForm.model,
        serial_number: instrumentForm.serial_number || null,
        instrument_type: instrumentForm.instrument_type,
        accuracy_class: instrumentForm.accuracy_class,
        indication_type: instrumentForm.indication_type,
        weighing_principle: instrumentForm.weighing_principle,
        max_capacity: maxVal,
        min_capacity: Number(instrumentForm.min_capacity) || 0.2,
        e: eVal,
        d: dVal,
        n: nVal,
        verification_scale_interval_e: eVal,
        actual_scale_interval_d: dVal,
        number_of_verification_scale_intervals_n: nVal,
        tare_type: instrumentForm.tare_type,
        unit: instrumentForm.unit,
        type_approval_number: instrumentForm.type_approval_number || null,
        software_version: instrumentForm.software_version || null,
        year_of_manufacture: Number(instrumentForm.year_of_manufacture) || 2026,
        markings: instrumentForm.markings || null,
        documentation_reference:
          instrumentForm.documentation_reference || null,
        remarks: instrumentForm.remarks || null,
      })

      setInstruments((current) => [instrument, ...current])
      selectInstrument(instrument.id)
      setShowInstrumentForm(false)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to create instrument.',
      )
    } finally {
      setBusy(false)
    }
  }

  async function handleCreateSession() {
    if (!selectedInstrumentId) {
      setError('Select an instrument first.')
      return
    }

    setBusy(true)
    setError('')

    try {
      const session = await createR76TestSession({
        instrument_id: selectedInstrumentId,
        officer_id: user?.id,
        session_number:
          sessionForm.session_number ||
          `R76-${new Date().getTime()}`,
        test_type: sessionForm.test_type,
        verification_stage: sessionForm.verification_stage,
        test_location: sessionForm.test_location,
        status: 'draft',
      })

      setSessions((current) => [session, ...current])
      selectSession(session.id)
      setShowSessionForm(false)
      setActiveView('tests')
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to create test session.',
      )
    } finally {
      setBusy(false)
    }
  }

  async function handleExecuteTest(inputs: Record<string, unknown>) {
    if (!selectedSessionId) {
      setError('Please create or select a test session first.')
      return
    }

    if (!selectedTestCode) {
      setError('Please select a test.')
      return
    }

    setBusy(true)
    setError('')

    try {
      const payload: Record<string, unknown> = {
        ...inputs,
      }

      if (selectedInstrument) {
        payload.accuracy_class = selectedInstrument.accuracy_class
        payload.max_capacity = selectedInstrument.max_capacity
        payload.min_capacity = selectedInstrument.min_capacity
        payload.e = selectedInstrument.e
        payload.d = selectedInstrument.d
      }

      await executeR76Test(
        selectedSessionId,
        selectedTestCode,
        payload,
      )

      await loadResults(selectedSessionId)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to execute R76 test.',
      )
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="oiml-loading-overlay">
        <div className="oiml-loading-box">
          <img
            src="/oimlense-logo.png"
            alt="OIMLense Logo"
            className="oiml-loading-logo"
          />
          <div className="oiml-loading-bar-container">
            <div
              className="oiml-loading-bar"
              style={{
                width: '100%',
                animation: 'pulseGlow 1.5s infinite ease-in-out',
              }}
            />
          </div>
          <div className="oiml-loading-status">
            <span>Loading R76 Compliance Suite...</span>
            <small>FETCHING DATA</small>
          </div>
        </div>
      </div>
    )
  }

  const completedTests = results.length
  const passedTests = results.filter((item) => item.pass_fail === true).length
  const failedTests = results.filter((item) => item.pass_fail === false).length

  const navItems = [
    { id: 'overview', label: 'Overview', icon: '⌂' },
    { id: 'instruments', label: 'Instruments', icon: '▣' },
    { id: 'sessions', label: 'Test Sessions', icon: '◫' },
    { id: 'tests', label: 'R76 Test Suite', icon: '✓' },
    { id: 'history', label: 'History', icon: '↺' },
    { id: 'reports', label: 'Reports', icon: '▤' },
  ] as const

  return (
    <div className="sih-shell">
      <aside className="sih-sidebar">
        <div className="sih-logo" />

        <div className="sih-sidebar-section">
          <span className="sih-sidebar-label">WORKSPACE</span>
          <nav className="sih-nav">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className={activeView === item.id ? 'active' : ''}
                onClick={() => setActiveView(item.id)}
              >
                <span className="sih-nav-icon">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="sih-sidebar-bottom">
          <div className="sih-standard-card">
            <span>ACTIVE STANDARD</span>
            <strong>OIML R 76-1:2006</strong>
            <small>Non-automatic weighing instruments</small>
          </div>

          <div className="sih-user-card">
            <div className="sih-avatar">
              {(user?.name || user?.officer_id || user?.email || 'O')
                .charAt(0)
                .toUpperCase()}
            </div>
            <div className="sih-user-info">
              <strong>{user?.name || user?.officer_id || 'Officer'}</strong>
              <span>{user?.email || 'R76 Test Officer'}</span>
            </div>
            <button type="button" onClick={onLogout} title="Logout">
              ↪
            </button>
          </div>
        </div>
      </aside>

      <main className={`sih-main sih-view-${activeView}`}>
        <header className="sih-topbar">
          <div className="sih-top-brand" />

          <nav className="sih-top-navigation" aria-label="Application navigation">
            <button
              type="button"
              className="sih-nav-home-btn"
              onClick={onGoToLanding}
              title="Return to Public Landing Page"
            >
              Home
            </button>

            <button
              type="button"
              className={activeView === 'overview' ? 'active' : ''}
              onClick={() => setActiveView('overview')}
            >
              Overview
            </button>

            <button
              type="button"
              className={activeView === 'instruments' ? 'active' : ''}
              onClick={() => setActiveView('instruments')}
            >
              Instruments
            </button>

            <button
              type="button"
              className={activeView === 'sessions' ? 'active' : ''}
              onClick={() => setActiveView('sessions')}
            >
              Sessions
            </button>

            <button
              type="button"
              className={activeView === 'tests' ? 'active' : ''}
              onClick={() => setActiveView('tests')}
            >
              R76 Tests
            </button>

            <button
              type="button"
              className={activeView === 'history' ? 'active' : ''}
              onClick={() => setActiveView('history')}
            >
              History
            </button>

            <button
              type="button"
              className={activeView === 'reports' ? 'active' : ''}
              onClick={() => setActiveView('reports')}
            >
              Reports
            </button>
          </nav>

          <div className="sih-top-actions">
            <span className="sih-standard-pill">OIML R 76</span>
            <button
              type="button"
              className="sih-primary-action"
              onClick={() => {
                setShowSessionForm(true)
                setActiveView('sessions')
              }}
            >
              + New Session
            </button>
          </div>
        </header>

        {error && (
          <div className="sih-alert">
            <span>{error}</span>
            <button type="button" onClick={() => setError('')}>×</button>
          </div>
        )}

        {activeView === 'overview' && (
          <>
            <section className="sih-welcome">
              <div>
                <span className="sih-eyebrow">TEST LABORATORY</span>
                <h2>NAWI verification workspace</h2>
                <p>
                  Manage instruments, execute OIML R 76 tests and review
                  deterministic compliance results from one workspace.
                </p>
              </div>
              <div className="sih-welcome-actions">
                <button
                  type="button"
                  className="sih-primary-action"
                  onClick={() => {
                    setShowSessionForm(true)
                    setActiveView('sessions')
                  }}
                >
                  Start New Test
                </button>
                <button
                  type="button"
                  className="sih-secondary-action"
                  onClick={() => setActiveView('instruments')}
                >
                  Manage Instruments
                </button>
              </div>
            </section>

            <section className="sih-stat-grid">
              <div className="sih-stat-card">
                <span>CURRENT INSTRUMENT</span>
                <strong>{instruments.length} registered</strong>
                <small>{selectedInstrument ? `${selectedInstrument.manufacturer} ${selectedInstrument.model}` : 'Instrument profile active'}</small>
              </div>
              <div className="sih-stat-card">
                <span>ACTIVE SESSION</span>
                <strong>{selectedSession?.status ? selectedSession.status.toUpperCase() : (sessions.length > 0 ? `${sessions.length} draft` : '0 active')}</strong>
                <small>{selectedSession?.session_number || 'No active session'}</small>
              </div>
              <div className="sih-stat-card accent">
                <span>TEST PROCEDURES</span>
                <strong>78 available</strong>
                <small>Full OIML R 76 test suite</small>
              </div>
              <div className="sih-stat-card">
                <span>TEST RUNS</span>
                <strong>{results.length} recorded</strong>
                <small>Test runs in current session</small>
              </div>
            </section>

            <section className="sih-dashboard-grid">
              <div className="sih-panel sih-panel-large">
                <div className="sih-panel-header">
                  <div>
                    <span className="sih-eyebrow">CURRENT INSTRUMENT</span>
                    <h3>
                      {selectedInstrument
                        ? `${selectedInstrument.manufacturer} ${selectedInstrument.model}`
                        : 'No instrument selected'}
                    </h3>
                  </div>
                  <button
                    type="button"
                    className="sih-link-button"
                    onClick={() => setActiveView('instruments')}
                  >
                    View instruments →
                  </button>
                </div>

                {selectedInstrument ? (
                  <div className="sih-spec-grid">
                    <div><span>Serial number</span><strong>{selectedInstrument.serial_number || '—'}</strong></div>
                    <div><span>Accuracy class</span><strong>Class {selectedInstrument.accuracy_class || '—'}</strong></div>
                    <div><span>Maximum capacity</span><strong>{selectedInstrument.max_capacity ?? '—'} {selectedInstrument.unit || ''}</strong></div>
                    <div><span>Verification interval</span><strong>{selectedInstrument.e ?? '—'} {selectedInstrument.unit || ''}</strong></div>
                    <div><span>Actual scale interval</span><strong>{selectedInstrument.d ?? '—'} {selectedInstrument.unit || ''}</strong></div>
                    <div><span>Number of intervals</span><strong>{selectedInstrument.n ?? '—'}</strong></div>
                  </div>
                ) : (
                  <div className="sih-empty">
                    <strong>No instrument records yet</strong>
                    <span>Create an instrument to begin a verification session.</span>
                    <button
                      type="button"
                      className="sih-primary-action"
                      onClick={() => {
                        setShowInstrumentForm(true)
                        setActiveView('instruments')
                      }}
                    >
                      + Add Instrument
                    </button>
                  </div>
                )}
              </div>

              <div className="sih-panel">
                <div className="sih-panel-header">
                  <div>
                    <span className="sih-eyebrow">CURRENT SESSION</span>
                    <h3>{selectedSession?.session_number || 'No active session'}</h3>
                  </div>
                </div>

                {selectedSession ? (
                  <div className="sih-session-card">
                    <div><span>Status</span><strong className={`sih-status ${selectedSession.status || 'draft'}`}>{selectedSession.status || 'draft'}</strong></div>
                    <div><span>Verification</span><strong>{selectedSession.verification_stage || '—'}</strong></div>
                    <div><span>Test type</span><strong>{selectedSession.test_type || '—'}</strong></div>

                    <div className="sih-session-breakdown">
                      <span className="sih-breakdown-title">CURRENT SESSION RESULT</span>
                      <div className="sih-breakdown-row">
                        <span className="sih-tag-pass">Passed: <strong>{passedTests}</strong></span>
                        <span className="sih-tag-fail">Failed: <strong>{failedTests}</strong></span>
                        <span className="sih-tag-pending">Pending: <strong>{Math.max(0, 78 - passedTests - failedTests)}</strong></span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="sih-primary-action full"
                      onClick={() => setActiveView('tests')}
                    >
                      Open 78 Test Procedures →
                    </button>
                  </div>
                ) : (
                  <div className="sih-empty compact">
                    <span>Create a session to start recording observations.</span>
                    <button
                      type="button"
                      className="sih-primary-action"
                      onClick={() => {
                        setShowSessionForm(true)
                        setActiveView('sessions')
                      }}
                    >
                      Create Session
                    </button>
                  </div>
                )}
              </div>
            </section>

            <section className="sih-panel">
              <div className="sih-panel-header">
                <div>
                  <span className="sih-eyebrow">RECENT ACTIVITY</span>
                  <h3>Latest test sessions</h3>
                </div>
                <button type="button" className="sih-link-button" onClick={() => setActiveView('history')}>
                  View history →
                </button>
              </div>

              {sessions.length === 0 ? (
                <div className="sih-empty">No test sessions have been created yet.</div>
              ) : (
                <div className="sih-table-wrap">
                  <table className="sih-table">
                    <thead>
                      <tr>
                        <th>Session</th>
                        <th>Verification</th>
                        <th>Location</th>
                        <th>Status</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessions.slice(0, 5).map((session) => (
                        <tr key={session.id}>
                          <td><strong>{session.session_number || session.id}</strong></td>
                          <td>{session.verification_stage || '—'}</td>
                          <td>{session.test_location || '—'}</td>
                          <td><span className={`sih-status ${session.status || 'draft'}`}>{session.status || 'draft'}</span></td>
                          <td>
                            <button
                              type="button"
                              className="sih-row-action"
                              onClick={() => {
                                setSelectedSessionId(session.id)
                                setActiveView('tests')
                              }}
                            >
                              Open →
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}

        {activeView === 'instruments' && (
          <section className="sih-panel">
            <div className="sih-panel-header">
              <div>
                <span className="sih-eyebrow">INSTRUMENT REGISTER</span>
                <h3>Non-automatic weighing instruments</h3>
                <p>Maintain the instrument specifications used by the R76 calculation engine.</p>
              </div>
              <button
                type="button"
                className="sih-primary-action"
                onClick={() => setShowInstrumentForm((value) => !value)}
              >
                {showInstrumentForm ? 'Close form' : '+ New Instrument'}
              </button>
            </div>

            {showInstrumentForm && (
              <div className="sih-form-panel">
                <div className="sih-form-grid">
                  {Object.entries(instrumentForm).map(([key, value]) => (
                    <label key={key}>
                      <span>{key.replaceAll('_', ' ')}</span>
                      <input
                        value={value}
                        onChange={(event) =>
                          setInstrumentForm((current) => ({
                            ...current,
                            [key]: event.target.value,
                          }))
                        }
                      />
                    </label>
                  ))}
                </div>
                <div className="sih-form-actions">
                  <button
                    type="button"
                    className="sih-primary-action"
                    disabled={busy}
                    onClick={handleCreateInstrument}
                  >
                    {busy ? 'Saving...' : 'Create Instrument'}
                  </button>
                </div>
              </div>
            )}

            <div className="sih-instrument-grid">
              {instruments.map((instrument) => (
                <button
                  type="button"
                  key={instrument.id}
                  className={`sih-instrument-card ${selectedInstrumentId === instrument.id ? 'selected' : ''}`}
                  onClick={() => setSelectedInstrumentId(instrument.id)}
                >
                  <div className="sih-instrument-top">
                    <span className="sih-instrument-icon">⚖</span>
                    <span>NAWI</span>
                  </div>
                  <h4>{instrument.manufacturer} {instrument.model}</h4>
                  <p>{instrument.serial_number || 'Serial number not recorded'}</p>
                  <div className="sih-instrument-meta">
                    <span>Class <strong>{instrument.accuracy_class || '—'}</strong></span>
                    <span>Max <strong>{instrument.max_capacity ?? '—'} {instrument.unit || ''}</strong></span>
                    <span>e <strong>{instrument.e ?? '—'}</strong></span>
                    <span>n <strong>{instrument.n ?? '—'}</strong></span>
                  </div>
                </button>
              ))}
              {instruments.length === 0 && (
                <div className="sih-empty">No instruments registered yet.</div>
              )}
            </div>
          </section>
        )}

        {activeView === 'sessions' && (
          <section className="sih-panel">
            <div className="sih-panel-header">
              <div>
                <span className="sih-eyebrow">VERIFICATION WORKSPACES</span>
                <h3>Test sessions</h3>
                <p>Each session groups an instrument, observations, calculations and results.</p>
              </div>
              <button
                type="button"
                className="sih-primary-action"
                onClick={() => setShowSessionForm((value) => !value)}
              >
                {showSessionForm ? 'Close form' : '+ New Session'}
              </button>
            </div>

            {showSessionForm && (
              <div className="sih-form-panel">
                <div className="sih-form-grid">
                  <label>
                    <span>Instrument</span>
                    <select
                      value={selectedInstrumentId}
                      onChange={(event) => setSelectedInstrumentId(event.target.value)}
                    >
                      <option value="">Select instrument</option>
                      {instruments.map((instrument) => (
                        <option key={instrument.id} value={instrument.id}>
                          {instrument.manufacturer} {instrument.model}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>Session number</span>
                    <input
                      value={sessionForm.session_number}
                      placeholder="R76-2026-001"
                      onChange={(event) =>
                        setSessionForm((current) => ({
                          ...current,
                          session_number: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label>
                    <span>Test type</span>
                    <select
                      value={sessionForm.test_type}
                      onChange={(event) =>
                        setSessionForm((current) => ({
                          ...current,
                          test_type: event.target.value,
                        }))
                      }
                    >
                      <option value="type_evaluation">Type evaluation</option>
                      <option value="initial_verification">Initial verification</option>
                      <option value="in_service">In-service verification</option>
                    </select>
                  </label>
                  <label>
                    <span>Verification stage</span>
                    <select
                      value={sessionForm.verification_stage}
                      onChange={(event) =>
                        setSessionForm((current) => ({
                          ...current,
                          verification_stage: event.target.value,
                        }))
                      }
                    >
                      <option value="initial_verification">Initial verification</option>
                      <option value="type_evaluation">Type evaluation</option>
                      <option value="in_service">In-service</option>
                    </select>
                  </label>
                  <label>
                    <span>Test location</span>
                    <input
                      value={sessionForm.test_location}
                      onChange={(event) =>
                        setSessionForm((current) => ({
                          ...current,
                          test_location: event.target.value,
                        }))
                      }
                    />
                  </label>
                </div>
                <div className="sih-form-actions">
                  <button
                    type="button"
                    className="sih-primary-action"
                    disabled={busy || !selectedInstrumentId}
                    onClick={handleCreateSession}
                  >
                    {busy ? 'Creating...' : 'Create Test Session'}
                  </button>
                </div>
              </div>
            )}

            <div className="sih-table-wrap">
              <table className="sih-table">
                <thead>
                  <tr>
                    <th>Session</th>
                    <th>Type</th>
                    <th>Stage</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session) => (
                    <tr key={session.id}>
                      <td><strong>{session.session_number || session.id}</strong></td>
                      <td>{session.test_type || '—'}</td>
                      <td>{session.verification_stage || '—'}</td>
                      <td>{session.test_location || '—'}</td>
                      <td><span className={`sih-status ${session.status || 'draft'}`}>{session.status || 'draft'}</span></td>
                      <td>
                        <button
                          type="button"
                          className="sih-row-action"
                          onClick={() => {
                            setSelectedSessionId(session.id)
                            setActiveView('tests')
                          }}
                        >
                          Open →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeView === 'tests' && (
          <section className="sih-panel">
            <div className="sih-panel-header">
              <div>
                <span className="sih-eyebrow">LABORATORY TESTING WORKFLOW</span>
                <h3>OIML R 76 Verification Workspace</h3>
                <p>
                  78 standard OIML R 76 test procedures available for compliance verification.
                </p>
              </div>
              <div className="sih-context">
                <span>Active Session</span>
                <strong>{selectedSession?.session_number || 'Select a session'}</strong>
              </div>
            </div>

            {!selectedSessionId ? (
              <div className="sih-empty large">
                <strong>Select or create a test session first.</strong>
                <span>The test runner needs an active session to store observations and evaluate compliance.</span>
                <button type="button" className="sih-primary-action" onClick={() => setActiveView('sessions')}>
                  Go to Sessions
                </button>
              </div>
            ) : (
              <div className="sih-test-workspace">
                {/* Active Verification Context Bar */}
                <div className="sih-active-verification-bar">
                  <div className="sih-vbar-section">
                    <span className="sih-vbar-badge">ACTIVE INSTRUMENT</span>
                    <div className="sih-vbar-details">
                      <strong>{selectedInstrument ? `${selectedInstrument.manufacturer} ${selectedInstrument.model}` : 'No Instrument Selected'}</strong>
                      <span>
                        S/N: {selectedInstrument?.serial_number || 'N/A'} • Class {selectedInstrument?.accuracy_class || 'III'} • Max {selectedInstrument?.max_capacity || 30} {selectedInstrument?.unit || 'kg'} • e={selectedInstrument?.e || 0.01} {selectedInstrument?.unit || 'kg'}
                      </span>
                    </div>
                  </div>

                  <div className="sih-vbar-divider" />

                  <div className="sih-vbar-section">
                    <span className="sih-vbar-badge">ACTIVE SESSION</span>
                    <div className="sih-vbar-details">
                      <strong>{selectedSession?.session_number || 'No Active Session'}</strong>
                      <span>
                        Type: {selectedSession?.test_type || 'Initial Verification'} • Stage: {selectedSession?.verification_stage || 'Standard'} • Location: {selectedSession?.test_location || 'Laboratory'}
                      </span>
                    </div>
                  </div>

                  <div className="sih-vbar-divider" />

                  <div className="sih-vbar-section status">
                    <span className="sih-vbar-badge">SESSION STATUS</span>
                    <span className={`sih-status-pill ${selectedSession?.status || 'draft'}`}>
                      {(selectedSession?.status || 'ACTIVE').toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Session Progress Breakdown Cards */}
                <div className="sih-session-metrics-row">
                  <div className="sih-metric-card total">
                    <span className="sih-metric-label">AVAILABLE PROCEDURES</span>
                    <strong className="sih-metric-val">78</strong>
                    <small>OIML R 76 catalog</small>
                  </div>
                  <div className="sih-metric-card completed">
                    <span className="sih-metric-label">COMPLETED RUNS</span>
                    <strong className="sih-metric-val">{completedTests}</strong>
                    <small>{Math.round((completedTests / 78) * 100)}% total coverage</small>
                  </div>
                  <div className="sih-metric-card passed">
                    <span className="sih-metric-label">PASSED TESTS</span>
                    <strong className="sih-metric-val">{results.filter(r => r.pass_fail === true).length}</strong>
                    <small>{completedTests > 0 ? `${Math.round((results.filter(r => r.pass_fail === true).length / completedTests) * 100)}% pass rate` : '0 tests passed'}</small>
                  </div>
                  <div className="sih-metric-card failed">
                    <span className="sih-metric-label">FAILED TESTS</span>
                    <strong className="sih-metric-val">{results.filter(r => r.pass_fail === false).length}</strong>
                    <small>{results.filter(r => r.pass_fail === false).length > 0 ? `${results.filter(r => r.pass_fail === false).length} procedure(s) failed` : '0 failures'}</small>
                  </div>
                  <div className="sih-metric-card pending">
                    <span className="sih-metric-label">PENDING PROCEDURES</span>
                    <strong className="sih-metric-val">{78 - completedTests}</strong>
                    <small>Awaiting evaluation</small>
                  </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="sih-proc-filter-bar">
                  <div className="sih-search-box">
                    <span className="sih-search-icon">🔍</span>
                    <input
                      type="text"
                      placeholder="Search procedures (e.g. Weighing, Repeatability, A.4.4.1)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="sih-search-input"
                    />
                    {searchQuery && (
                      <button type="button" className="sih-search-clear" onClick={() => setSearchQuery('')}>×</button>
                    )}
                  </div>

                  <div className="sih-category-tabs">
                    <button
                      type="button"
                      className={`sih-category-tab ${categoryFilter === 'all' ? 'active' : ''}`}
                      onClick={() => setCategoryFilter('all')}
                    >
                      All ({catalogProcedures.length})
                    </button>
                    <button
                      type="button"
                      className={`sih-category-tab ${categoryFilter === 'weighing' ? 'active' : ''}`}
                      onClick={() => setCategoryFilter('weighing')}
                    >
                      Weighing ({catalogProcedures.filter(p => p.category === 'weighing').length})
                    </button>
                    <button
                      type="button"
                      className={`sih-category-tab ${categoryFilter === 'mechanical' ? 'active' : ''}`}
                      onClick={() => setCategoryFilter('mechanical')}
                    >
                      Mechanical ({catalogProcedures.filter(p => p.category === 'mechanical').length})
                    </button>
                    <button
                      type="button"
                      className={`sih-category-tab ${categoryFilter === 'environmental' ? 'active' : ''}`}
                      onClick={() => setCategoryFilter('environmental')}
                    >
                      Environmental ({catalogProcedures.filter(p => p.category === 'environmental').length})
                    </button>
                    <button
                      type="button"
                      className={`sih-category-tab ${categoryFilter === 'electrical' ? 'active' : ''}`}
                      onClick={() => setCategoryFilter('electrical')}
                    >
                      Electrical ({catalogProcedures.filter(p => p.category === 'electrical').length})
                    </button>
                    <button
                      type="button"
                      className={`sih-category-tab ${categoryFilter === 'other' ? 'active' : ''}`}
                      onClick={() => setCategoryFilter('other')}
                    >
                      Other ({catalogProcedures.filter(p => p.category === 'other').length})
                    </button>
                  </div>

                  <div className="sih-category-tabs status-pills" style={{ marginTop: '8px' }}>
                    <button
                      type="button"
                      className={`sih-category-tab ${statusFilter === 'all' ? 'active' : ''}`}
                      onClick={() => setStatusFilter('all')}
                    >
                      All Statuses ({catalogProcedures.length})
                    </button>
                    <button
                      type="button"
                      className={`sih-category-tab ${statusFilter === 'NOT_STARTED' ? 'active' : ''}`}
                      onClick={() => setStatusFilter('NOT_STARTED')}
                    >
                      Not Started ({catalogProcedures.length - results.length})
                    </button>
                    <button
                      type="button"
                      className={`sih-category-tab ${statusFilter === 'PASSED' ? 'active' : ''}`}
                      onClick={() => setStatusFilter('PASSED')}
                    >
                      Passed ({passedTests})
                    </button>
                    <button
                      type="button"
                      className={`sih-category-tab ${statusFilter === 'FAILED' ? 'active' : ''}`}
                      onClick={() => setStatusFilter('FAILED')}
                    >
                      Failed ({failedTests})
                    </button>
                  </div>
                </div>

                {/* Mobile Procedure Selector Bar (Visible <= 768px) */}
                <div className="sih-mobile-proc-bar">
                  <div
                    className="sih-mobile-proc-trigger"
                    onClick={() => setShowMobileProcDropdown((v) => !v)}
                  >
                    <div>
                      <span className="sih-mobile-proc-tag">
                        PROCEDURE {String(R76_78_TEST_PROCEDURES.findIndex(p => p.test_code === selectedTestCode) + 1).padStart(2, '0')} OF 78
                      </span>
                      <strong>{selectedDefinition?.test_name || 'Select Procedure'}</strong>
                    </div>
                    <span className="sih-mobile-proc-arrow">{showMobileProcDropdown ? '▲' : '▼'}</span>
                  </div>

                  {showMobileProcDropdown && (
                    <div className="sih-mobile-proc-dropdown">
                      {filteredProcedures.map((definition) => {
                        const existing = results.find(
                          (result) => result.test_definition_id === definition.id || result.rule_id === definition.test_code
                        )
                        const selected = selectedTestCode === definition.test_code
                        const catIndex = R76_78_TEST_PROCEDURES.findIndex(p => p.test_code === definition.test_code)
                        const posNum = catIndex >= 0 ? String(catIndex + 1).padStart(2, '0') : '01'

                        return (
                          <button
                            type="button"
                            key={definition.test_code}
                            className={`sih-test-nav-item ${selected ? 'active' : ''}`}
                            onClick={() => {
                              setSelectedTestCode(definition.test_code)
                              setShowMobileProcDropdown(false)
                            }}
                          >
                            <span className="sih-proc-num">{posNum}</span>
                            <span className="sih-test-nav-meta">
                              <strong>{definition.test_name}</strong>
                              <small>{definition.test_code} • {definition.source_clause}</small>
                            </span>
                            {existing ? (
                              <span className={`sih-proc-badge ${existing.pass_fail ? 'pass' : 'fail'}`}>
                                {existing.pass_fail ? 'PASSED ✓' : 'FAILED ✕'}
                              </span>
                            ) : (
                              <span className="sih-proc-badge not-started">NOT STARTED</span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>

                <div className="sih-test-layout">
                  <aside className="sih-test-sidebar">
                    <div className="sih-test-progress">
                      <span>78 PROCEDURES · {completedTests} COMPLETED · {passedTests} PASSED · {failedTests} FAILED</span>
                      <strong>{filteredProcedures.length} procedures matching filter</strong>
                    </div>

                    <div className="sih-procedure-list">
                      {filteredProcedures.map((definition) => {
                        const existing = results.find(
                          (result) => result.test_definition_id === definition.id || result.rule_id === definition.test_code
                        )
                        const selected = selectedTestCode === definition.test_code
                        const catIndex = R76_78_TEST_PROCEDURES.findIndex(p => p.test_code === definition.test_code)
                        const posNum = catIndex >= 0 ? String(catIndex + 1).padStart(2, '0') : '01'

                        return (
                          <button
                            type="button"
                            key={definition.test_code}
                            className={`sih-test-nav-item ${selected ? 'active' : ''}`}
                            onClick={() => setSelectedTestCode(definition.test_code)}
                          >
                            <span className="sih-proc-num">{posNum}</span>
                            <span className="sih-test-nav-meta">
                              <strong>{definition.test_name}</strong>
                              <small>{definition.test_code} • {definition.source_clause}</small>
                            </span>
                            {existing ? (
                              <span className={`sih-proc-badge ${existing.pass_fail ? 'pass' : 'fail'}`}>
                                {existing.pass_fail ? 'PASSED ✓' : 'FAILED ✕'}
                              </span>
                            ) : (
                              <span className="sih-proc-badge not-started">NOT STARTED</span>
                            )}
                          </button>
                        )
                      })}
                      {filteredProcedures.length === 0 && (
                        <div className="sih-empty compact">No procedures match "{searchQuery}"</div>
                      )}
                    </div>
                  </aside>

                  <div className="sih-test-main">
                    {selectedDefinition ? (
                      <>
                        <div className="sih-test-heading">
                          <div className="sih-test-heading-top">
                            <span className="sih-eyebrow">OIML R 76-1:2006 • CLAUSE {selectedDefinition.source_clause || '—'}</span>
                            <span className="sih-test-pos-tag">
                              TEST {String(R76_78_TEST_PROCEDURES.findIndex(p => p.test_code === selectedDefinition.test_code) + 1).padStart(2, '0')} OF 78
                            </span>
                          </div>
                          <h4>{selectedDefinition.test_code}: {selectedDefinition.test_name}</h4>
                          <p>{selectedDefinition.description || 'OIML R 76 standard test procedure for non-automatic weighing instruments.'}</p>
                          <div className="sih-source-row">
                            <span><strong>Standard</strong> {selectedDefinition.source_document || 'OIML R 76-1:2006'}</span>
                            <span><strong>Category</strong> {(selectedDefinition.category || 'weighing').toUpperCase()}</span>
                            <span>
                              <strong>Status</strong>{' '}
                              {results.find(r => r.test_definition_id === selectedDefinition.id || r.rule_id === selectedDefinition.test_code) ? (
                                <span className={`sih-status-inline ${results.find(r => r.test_definition_id === selectedDefinition.id || r.rule_id === selectedDefinition.test_code)?.pass_fail ? 'pass' : 'fail'}`}>
                                  {results.find(r => r.test_definition_id === selectedDefinition.id || r.rule_id === selectedDefinition.test_code)?.pass_fail ? 'PASSED ✓' : 'FAILED ✕'}
                                </span>
                              ) : (
                                <span className="sih-status-inline pending">NOT STARTED</span>
                              )}
                            </span>
                          </div>
                        </div>

                        <R76TestForm
                          key={selectedTestCode}
                          definition={selectedDefinition}
                          instrument={selectedInstrument}
                          result={results.find(r => r.test_definition_id === selectedDefinition.id || r.rule_id === selectedDefinition.test_code)}
                          disabled={busy || !selectedSessionId}
                          error={error}
                          onExecute={handleExecuteTest}
                          onPreviousTest={() => {
                            setError('')
                            const currIdx = catalogProcedures.findIndex(p => p.test_code === selectedTestCode)
                            if (currIdx > 0) {
                              setSelectedTestCode(catalogProcedures[currIdx - 1].test_code)
                            }
                          }}
                          onNextTest={() => {
                            setError('')
                            const currIdx = catalogProcedures.findIndex(p => p.test_code === selectedTestCode)
                            if (currIdx >= 0 && currIdx < catalogProcedures.length - 1) {
                              setSelectedTestCode(catalogProcedures[currIdx + 1].test_code)
                            }
                          }}
                          onBackToProcedures={() => {
                            const searchEl = document.querySelector('.sih-search-input') as HTMLInputElement | null
                            if (searchEl) searchEl.focus()
                          }}
                        />
                      </>
                    ) : (
                      <div className="sih-empty">Select a procedure from the catalogue on the left.</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {activeView === 'history' && (
          <section className="sih-panel">
            <div className="sih-panel-header">
              <div>
                <span className="sih-eyebrow">AUDIT TRAIL</span>
                <h3>Verification history</h3>
                <p>Review previously created R76 test sessions.</p>
              </div>
            </div>

            {sessions.length === 0 ? (
              <div className="sih-empty large">No verification history yet.</div>
            ) : (
              <div className="sih-history-grid">
                {sessions.map((session) => {
                  const sessionResults =
                    session.id === selectedSessionId ? results : []
                  const passed = sessionResults.filter((item) => item.pass_fail === true).length
                  const failed = sessionResults.filter((item) => item.pass_fail === false).length
                  return (
                    <button
                      type="button"
                      key={session.id}
                      className="sih-history-card"
                      onClick={() => {
                        setSelectedSessionId(session.id)
                        setActiveView('tests')
                      }}
                    >
                      <div className="sih-history-top">
                        <span>{session.session_number || session.id}</span>
                        <span className={`sih-status ${session.status || 'draft'}`}>{session.status || 'draft'}</span>
                      </div>
                      <h4>{session.verification_stage || 'Verification session'}</h4>
                      <p>{session.test_location || 'Test location not recorded'}</p>
                      <div className="sih-history-meta">
                        <span>{passed} passed</span>
                        <span>{failed} failed</span>
                        <span>{session.started_at ? new Date(session.started_at).toLocaleDateString() : 'Date not recorded'}</span>
                      </div>
                      <strong>Open session →</strong>
                    </button>
                  )
                })}
              </div>
            )}
          </section>
        )}

        {activeView === 'reports' && (
          <section className="sih-panel">
            <div className="sih-panel-header">
              <div>
                <span className="sih-eyebrow">REPORT CENTRE</span>
                <h3>R76 test reports</h3>
                <p>Review sessions and their stored deterministic test results.</p>
              </div>
            </div>

            <div className="sih-report-notice">
              <div className="sih-report-icon">▤</div>
              <div>
                <strong>Report workspace</strong>
                <span>
                  Completed session results are available below. PDF/export
                  actions can be connected to the report generator endpoint
                  without changing the R76 calculation engine.
                </span>
              </div>
            </div>

            {sessions.map((session) => (
              <div className="sih-report-row" key={session.id}>
                <div>
                  <strong>{session.session_number || session.id}</strong>
                  <span>{session.test_type || 'Verification'} · {session.verification_stage || '—'}</span>
                </div>
                <span className={`sih-status ${session.status || 'draft'}`}>{session.status || 'draft'}</span>
                <button
                  type="button"
                  className="sih-secondary-action"
                  onClick={() => {
                    setSelectedSessionId(session.id)
                    setActiveView('tests')
                  }}
                >
                  View results
                </button>
              </div>
            ))}

            {sessions.length === 0 && (
              <div className="sih-empty large">Reports will appear after test sessions are created.</div>
            )}
          </section>
        )}
      </main>
    </div>
  )


}
