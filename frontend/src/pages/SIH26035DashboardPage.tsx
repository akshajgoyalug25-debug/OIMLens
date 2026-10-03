import { useEffect, useMemo, useState, Fragment } from 'react'
import { R76TestForm } from '../components/r76/R76TestForm'
import { R76_78_TEST_PROCEDURES } from '../data/r76TestProceduresCatalog'
import {
  createR76Instrument,
  updateR76Instrument,
  createR76TestSession,
  executeR76Test,
  downloadR76Report,
  downloadR76DocxReport,
  getR76Results,
  getR76TestDefinitions,
  getR76TestSessions,
  getR76Instruments,
  getR76InstrumentTestPlan,
  updateR76Session,
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
  const [testPlan, setTestPlan] = useState<Awaited<ReturnType<typeof getR76InstrumentTestPlan>> | null>(null)
  const [testPlanLoading, setTestPlanLoading] = useState(false)

  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  const CACHE_KEYS = {
    instruments: 'oimlense_cache_instruments',
    definitions: 'oimlense_cache_definitions',
    sessions: 'oimlense_cache_sessions',
  }
  const [busySessionId, setBusySessionId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null)

  const [showInstrumentForm, setShowInstrumentForm] = useState(false)
  const [editingInstrumentId, setEditingInstrumentId] = useState<string | null>(null)
  const dashboardViews = ['overview', 'instruments', 'sessions', 'tests', 'history', 'reports'] as const
  type DashboardView = typeof dashboardViews[number]

  function getViewFromPath(): DashboardView {
    const path = window.location.pathname.replace(/^\/+|\/+$/g, '')
    return dashboardViews.includes(path as DashboardView)
      ? (path as DashboardView)
      : 'overview'
  }

  const [activeView, setActiveView] = useState<DashboardView>(getViewFromPath())
  const [showSessionForm, setShowSessionForm] = useState(false)

  const [categoryFilter, setCategoryFilter] = useState<'all' | 'weighing' | 'mechanical' | 'environmental' | 'electrical' | 'other'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'NOT_STARTED' | 'PASSED' | 'FAILED'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showMobileProcDropdown, setShowMobileProcDropdown] = useState(false)
  const [showCompletionScreen, setShowCompletionScreen] = useState(false)
  const [showReportPreview, setShowReportPreview] = useState(false)
  const [showReportDetail, setShowReportDetail] = useState(false)
  const [expandedFailureCode, setExpandedFailureCode] = useState<string | null>(null)

  const [reportSearch, setReportSearch] = useState('')
  const [reportStatusFilter, setReportStatusFilter] = useState('')
  const [reportTypeFilter, setReportTypeFilter] = useState('')

  function navigateToView(view: DashboardView) {
    setActiveView(view)

    const path = view === 'overview' ? '/dashboard' : `/${view}`

    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path)
    }

    window.scrollTo(0, 0)
  }

  useEffect(() => {
    function handlePopState() {
      setActiveView(getViewFromPath())
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])


  const instrumentById = new Map(instruments.map((inst) => [inst.id, inst]))

  const filteredReportSessions = sessions.filter((session) => {
    const search = reportSearch.trim().toLowerCase()
    const inst = instrumentById.get(session.instrument_id)
    const instName = inst ? `${inst.manufacturer || ''} ${inst.model || ''}`.trim().toLowerCase() : ''
    const instSerial = inst?.serial_number ? String(inst.serial_number).toLowerCase() : ''

    const matchesSearch =
      !search ||
      String(session.session_number || '').toLowerCase().includes(search) ||
      String(session.report_id || '').toLowerCase().includes(search) ||
      String(session.id || '').toLowerCase().includes(search) ||
      String(session.test_location || '').toLowerCase().includes(search) ||
      instName.includes(search) ||
      instSerial.includes(search)

    const matchesStatus =
      !reportStatusFilter ||
      String(session.status || '').toLowerCase() === reportStatusFilter.toLowerCase()

    const matchesType =
      !reportTypeFilter ||
      String(session.test_type || '').toLowerCase() === reportTypeFilter.toLowerCase()

    return matchesSearch && matchesStatus && matchesType
  })

  useEffect(() => {
    void loadTestPlan(selectedInstrumentId)
  }, [selectedInstrumentId])

  async function loadTestPlan(instrumentId: string) {
    if (!instrumentId) {
      setTestPlan(null)
      return
    }

    setTestPlanLoading(true)

    try {
      const plan = await getR76InstrumentTestPlan(instrumentId)
      setTestPlan(plan)
    } catch (err) {
      setTestPlan(null)
      setError(
        err instanceof Error ? err.message : 'Failed to load test plan.',
      )
    } finally {
      setTestPlanLoading(false)
    }
  }

  async function handleSessionWorkflow(
    session: R76TestSession,
    action: 'submit' | 'review' | 'approve' | 'reject',
  ) {
    try {
      setBusySessionId(session.id)
      setError('')

      const updates: Record<string, unknown> = {}

      if (action === 'submit') {
        updates.status = 'submitted'
      } else if (action === 'review') {
        updates.status = 'under_review'
        updates.reviewer_user_id = user?.id || undefined
      } else if (action === 'approve') {
        updates.status = 'approved'
        updates.approver_user_id = user?.id || undefined
      } else {
        updates.status = 'rejected'
        updates.reviewer_user_id = user?.id || undefined
      }

      const response = await updateR76Session(session.id, updates)

      const updatedSession = response.session

      if (updatedSession) {
        setSessions((current) =>
          current.map((item) =>
            item.id === session.id
              ? { ...item, ...updatedSession }
              : item,
          ),
        )
      } else {
        const refreshed = await getR76TestSessions()
        setSessions(refreshed)
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to update session workflow.',
      )
    } finally {
      setBusySessionId(null)
    }
  }

  async function handleDownloadReport(sessionId: string) {
    try {
      setBusySessionId(sessionId)
      setError('')

      const blob = await downloadR76Report(sessionId)

      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')

      link.href = url
      link.download = `OIMLense-R76-${sessionId}.pdf`

      document.body.appendChild(link)
      link.click()
      link.remove()

      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to generate the PDF report.',
      )
    } finally {
      setBusySessionId(null)
    }
  }

  async function handleDownloadDocxReport(sessionId: string) {
    try {
      setBusySessionId(sessionId)
      setError('')

      const blob = await downloadR76DocxReport(sessionId)

      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')

      link.href = url
      link.download = `OIMLense-R76-${sessionId}.docx`

      document.body.appendChild(link)
      link.click()
      link.remove()

      setTimeout(() => {
        window.URL.revokeObjectURL(url)
      }, 1000)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to generate the editable DOCX report.',
      )
    } finally {
      setBusySessionId(null)
    }
  }

  async function handlePreviewReport(sessionId: string) {
    try {
      setBusySessionId(sessionId)
      setError('')

      if (previewPdfUrl) {
        window.URL.revokeObjectURL(previewPdfUrl)
        setPreviewPdfUrl(null)
      }

      const blob = await downloadR76Report(sessionId)
      const url = window.URL.createObjectURL(blob)

      setPreviewPdfUrl(url)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to generate the PDF preview.',
      )
    } finally {
      setBusySessionId(null)
    }
  }

  function closePdfPreview() {
    if (previewPdfUrl) {
      window.URL.revokeObjectURL(previewPdfUrl)
    }

    setPreviewPdfUrl(null)
  }

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
    setError('')

    // Show the last known dashboard data immediately after reload.
    try {
      const cachedInstruments = localStorage.getItem(CACHE_KEYS.instruments)
      const cachedDefinitions = localStorage.getItem(CACHE_KEYS.definitions)
      const cachedSessions = localStorage.getItem(CACHE_KEYS.sessions)

      if (cachedInstruments) setInstruments(JSON.parse(cachedInstruments))
      if (cachedDefinitions) setDefinitions(JSON.parse(cachedDefinitions))
      if (cachedSessions) setSessions(JSON.parse(cachedSessions))
    } catch {
      // Ignore invalid/stale cache and fetch fresh data below.
    }

    // Refresh from the server silently in the background.
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

      localStorage.setItem(CACHE_KEYS.instruments, JSON.stringify(instrumentData))
      localStorage.setItem(CACHE_KEYS.definitions, JSON.stringify(definitionData))
      localStorage.setItem(CACHE_KEYS.sessions, JSON.stringify(sessionData))

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
      setError(err instanceof Error ? err.message : 'Failed to refresh R76 data.')
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

  function handleEditInstrument(instrument: typeof instruments[number]) {
    setEditingInstrumentId(instrument.id)

    setInstrumentForm({
      manufacturer: instrument.manufacturer || '',
      model: instrument.model || '',
      serial_number: instrument.serial_number || '',
      instrument_type: instrument.instrument_type || '',
      accuracy_class: instrument.accuracy_class || 'III',
      indication_type: instrument.indication_type || '',
      weighing_principle: instrument.weighing_principle || '',
      max_capacity: String(instrument.max_capacity ?? ''),
      min_capacity: String(instrument.min_capacity ?? ''),
      e: String(instrument.e ?? ''),
      d: String(instrument.d ?? ''),
      tare_type: instrument.tare_type || '',
      unit: instrument.unit || '',
      type_approval_number: instrument.type_approval_number || '',
      software_version: instrument.software_version || '',
      year_of_manufacture: String(instrument.year_of_manufacture ?? ''),
      markings: instrument.markings || '',
      documentation_reference: instrument.documentation_reference || '',
      remarks: instrument.remarks || '',
    })

    setShowInstrumentForm(true)
    setError('')
  }

  async function handleUpdateInstrument() {
    if (!editingInstrumentId) {
      return
    }

    setBusy(true)
    setError('')

    try {
      const eVal = Number(instrumentForm.e) || 0.01
      const dVal = Number(instrumentForm.d) || 0.01
      const maxVal = Number(instrumentForm.max_capacity) || 30
      const nVal = eVal > 0 ? Math.round(maxVal / eVal) : 3000

      const instrument = await updateR76Instrument(editingInstrumentId, {
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

      setInstruments((current) =>
        current.map((item) =>
          item.id === instrument.id ? instrument : item,
        ),
      )

      setSelectedInstrumentId(instrument.id)
      setEditingInstrumentId(null)
      setShowInstrumentForm(false)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to update instrument.',
      )
    } finally {
      setBusy(false)
    }
  }

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
      navigateToView('tests')
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


  const completedTests = results.length
  const passedTests = results.filter((item) => item.pass_fail === true).length
  const failedTests = results.filter((item) => item.pass_fail === false).length

  const passRate = completedTests > 0
    ? Math.round((passedTests / completedTests) * 100)
    : 0

  const coverageRate = Math.round((completedTests / 78) * 100)

  const measuredErrors = results
    .map((item) => Number(item.measured_error))
    .filter((value) => Number.isFinite(value))

  const averageMeasuredError = measuredErrors.length > 0
    ? measuredErrors.reduce((sum, value) => sum + Math.abs(value), 0) / measuredErrors.length
    : 0

  const maximumMeasuredError = measuredErrors.length > 0
    ? Math.max(...measuredErrors.map((value) => Math.abs(value)))
    : 0

  const mpeUtilizations = results
    .map((item) => {
      const measuredError = Number(item.measured_error)
      const mpe = Number(item.mpe_value)

      if (!Number.isFinite(measuredError) || !Number.isFinite(mpe) || mpe <= 0) {
        return null
      }

      return (Math.abs(measuredError) / mpe) * 100
    })
    .filter((value): value is number => value !== null)

  const maximumMpeUtilization = mpeUtilizations.length > 0
    ? Math.max(...mpeUtilizations)
    : 0

  const averageMpeUtilization = mpeUtilizations.length > 0
    ? mpeUtilizations.reduce((sum, value) => sum + value, 0) / mpeUtilizations.length
    : 0

  const resultStatusCounts = results.reduce<Record<string, number>>((counts, item) => {
    const status = String(item.result_status || 'UNKNOWN').toUpperCase()
    counts[status] = (counts[status] || 0) + 1
    return counts
  }, {})

  const testDefinitionById = new Map(
    definitions.map((definition) => [definition.id, definition]),
  )

  const categoryAnalytics = results.reduce<Record<string, {
    total: number
    passed: number
    failed: number
  }>>((categories, result) => {
    const definition = testDefinitionById.get(result.test_definition_id)
    const catalogItem = definition
      ? R76_78_TEST_PROCEDURES.find(
          (procedure) => procedure.test_code === definition.test_code,
        )
      : undefined

    const category = catalogItem?.category || 'other'

    if (!categories[category]) {
      categories[category] = {
        total: 0,
        passed: 0,
        failed: 0,
      }
    }

    categories[category].total += 1

    if (result.pass_fail === true) {
      categories[category].passed += 1
    }

    if (result.pass_fail === false) {
      categories[category].failed += 1
    }

    return categories
  }, {})

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
                onClick={() => navigateToView(item.id as DashboardView)}
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
              onClick={() => navigateToView('overview')}
            >
              Overview
            </button>

            <button
              type="button"
              className={activeView === 'instruments' ? 'active' : ''}
              onClick={() => navigateToView('instruments')}
            >
              Instruments
            </button>

            <button
              type="button"
              className={activeView === 'sessions' ? 'active' : ''}
              onClick={() => navigateToView('sessions')}
            >
              Sessions
            </button>

            <button
              type="button"
              className={activeView === 'tests' ? 'active' : ''}
              onClick={() => navigateToView('tests')}
            >
              R76 Tests
            </button>

            <button
              type="button"
              className={activeView === 'history' ? 'active' : ''}
              onClick={() => navigateToView('history')}
            >
              History
            </button>

            <button
              type="button"
              className={activeView === 'reports' ? 'active' : ''}
              onClick={() => navigateToView('reports')}
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
                navigateToView('sessions')
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
                    navigateToView('sessions')
                  }}
                >
                  Start New Test
                </button>
                <button
                  type="button"
                  className="sih-secondary-action"
                  onClick={() => navigateToView('instruments')}
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

            <section className="sih-panel" style={{ marginTop: '18px' }}>
              <div className="sih-panel-header">
                <div>
                  <span className="sih-eyebrow">ADVANCED ANALYTICS</span>
                  <h3>OIML R 76 Compliance Analytics</h3>
                </div>
                <span className="sih-status completed">LIVE SESSION DATA</span>
              </div>

              <div className="sih-stat-grid">
                <div className="sih-stat-card accent">
                  <span>PASS RATE</span>
                  <strong>{passRate}%</strong>
                  <small>{passedTests} of {completedTests} completed tests passed</small>
                </div>

                <div className="sih-stat-card">
                  <span>TEST COVERAGE</span>
                  <strong>{coverageRate}%</strong>
                  <small>{completedTests} of 78 procedures completed</small>
                </div>

                <div className="sih-stat-card">
                  <span>AVG. MEASURED ERROR</span>
                  <strong>{averageMeasuredError.toFixed(4)}</strong>
                  <small>Absolute error across recorded results</small>
                </div>

                <div className="sih-stat-card">
                  <span>MAX MPE UTILIZATION</span>
                  <strong>{Math.round(maximumMpeUtilization)}%</strong>
                  <small>Highest error-to-MPE ratio recorded</small>
                </div>
              </div>

              <div className="sih-dashboard-grid" style={{ marginTop: '18px' }}>
                <div className="sih-panel">
                  <div className="sih-panel-header">
                    <div>
                      <span className="sih-eyebrow">TEST PROGRESS</span>
                      <h3>Verification coverage</h3>
                    </div>
                  </div>

                  <div className="sih-session-breakdown">
                    <div className="sih-breakdown-row">
                      <span className="sih-tag-pass">
                        Passed: <strong>{passedTests}</strong>
                      </span>
                      <span className="sih-tag-fail">
                        Failed: <strong>{failedTests}</strong>
                      </span>
                      <span className="sih-tag-pending">
                        Pending: <strong>{Math.max(0, 78 - completedTests)}</strong>
                      </span>
                    </div>
                  </div>

                  <div style={{ marginTop: '18px' }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '8px',
                    }}>
                      <span>Overall procedure coverage</span>
                      <strong>{coverageRate}%</strong>
                    </div>

                    <div style={{
                      height: '8px',
                      borderRadius: '999px',
                      background: 'rgba(255,255,255,0.08)',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        width: `${Math.min(coverageRate, 100)}%`,
                        height: '100%',
                        background: '#d6b36a',
                        borderRadius: '999px',
                        transition: 'width 0.3s ease',
                      }} />
                    </div>
                  </div>

                  <div style={{ marginTop: '18px' }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '8px',
                    }}>
                      <span>Pass rate of completed tests</span>
                      <strong>{passRate}%</strong>
                    </div>

                    <div style={{
                      height: '8px',
                      borderRadius: '999px',
                      background: 'rgba(255,255,255,0.08)',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        width: `${Math.min(passRate, 100)}%`,
                        height: '100%',
                        background: '#d6b36a',
                        borderRadius: '999px',
                        transition: 'width 0.3s ease',
                      }} />
                    </div>
                  </div>
                </div>

                <div className="sih-panel">
                  <div className="sih-panel-header">
                    <div>
                      <span className="sih-eyebrow">RESULT STATUS</span>
                      <h3>Execution status breakdown</h3>
                    </div>
                  </div>

                  {Object.keys(resultStatusCounts).length > 0 ? (
                    <div className="sih-session-card">
                      {Object.entries(resultStatusCounts).map(([status, count]) => (
                        <div key={status}>
                          <span>{status.replace(/_/g, ' ')}</span>
                          <strong>{count}</strong>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="sih-empty">
                      <strong>No test results yet</strong>
                      <span>Execution analytics will appear after tests are completed.</span>
                    </div>
                  )}

                  <div style={{
                    marginTop: '18px',
                    paddingTop: '18px',
                    borderTop: '1px solid rgba(255,255,255,0.08)',
                  }}>
                    <span className="sih-eyebrow">ERROR PROFILE</span>
                    <div className="sih-session-card" style={{ marginTop: '10px' }}>
                      <div>
                        <span>Average absolute error</span>
                        <strong>{averageMeasuredError.toFixed(4)}</strong>
                      </div>
                      <div>
                        <span>Maximum absolute error</span>
                        <strong>{maximumMeasuredError.toFixed(4)}</strong>
                      </div>
                      <div>
                        <span>Average MPE utilization</span>
                        <strong>{Math.round(averageMpeUtilization)}%</strong>
                      </div>
                    </div>
                  </div>

                  <div style={{
                    marginTop: '18px',
                    paddingTop: '18px',
                    borderTop: '1px solid rgba(255,255,255,0.08)',
                  }}>
                    <span className="sih-eyebrow">CATEGORY ANALYTICS</span>
                    <h4 style={{ margin: '6px 0 14px' }}>
                      Test performance by category
                    </h4>

                    {Object.keys(categoryAnalytics).length > 0 ? (
                      <div className="sih-session-card">
                        {Object.entries(categoryAnalytics).map(([category, stats]) => {
                          const categoryPassRate = stats.total > 0
                            ? Math.round((stats.passed / stats.total) * 100)
                            : 0

                          return (
                            <div key={category}>
                              <span style={{ textTransform: 'capitalize' }}>
                                {category}
                              </span>
                              <strong>
                                {stats.passed}/{stats.total}
                              </strong>
                              <small>
                                {categoryPassRate}% pass · {stats.failed} failed
                              </small>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="sih-empty">
                        <strong>No category data yet</strong>
                        <span>
                          Category analytics will appear after test execution.
                        </span>
                      </div>
                    )}
                  </div>
                </div>
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
                    onClick={() => navigateToView('instruments')}
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
                        navigateToView('instruments')
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
                      onClick={() => navigateToView('tests')}
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
                        navigateToView('sessions')
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
                <button type="button" className="sih-link-button" onClick={() => navigateToView('history')}>
                  View history →
                </button>
              </div>

              {sessions.length === 0 && !loading ? (

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
                                navigateToView('tests')
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
                    onClick={
                      editingInstrumentId
                        ? handleUpdateInstrument
                        : handleCreateInstrument
                    }
                  >
                    {busy
                      ? 'Saving...'
                      : editingInstrumentId
                        ? 'Save Changes'
                        : 'Create Instrument'}
                  </button>
                </div>
              </div>
            )}

            <div className="sih-instrument-grid">
              {instruments.map((instrument) => (
                <div
                  key={instrument.id}
                  className={`sih-instrument-card ${selectedInstrumentId === instrument.id ? 'selected' : ''}`}
                >
                  <button
                    type="button"
                    className="sih-instrument-card-main"
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
                      <span>d <strong>{instrument.d ?? '—'}</strong></span>
                      <span>n <strong>{instrument.n ?? '—'}</strong></span>
                    </div>
                  </button>

                  <div className="sih-instrument-actions">
                    <button
                      type="button"
                      className="sih-row-action"
                      onClick={() => setSelectedInstrumentId(instrument.id)}
                    >
                      Select
                    </button>
                    <button
                      type="button"
                      className="sih-row-action"
                      onClick={() => handleEditInstrument(instrument)}
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))}
              {instruments.length === 0 && !loading && (
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
                            navigateToView('tests')
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
            <div className="sih-panel-header sih-workbench-header">
              <div className="sih-workbench-title-area">
                <div className="sih-workbench-badge-row">
                  <span className="sih-eyebrow">METROLOGY LABORATORY WORKSTATION</span>
                  <span className="sih-standard-ref-badge">OIML R 76-1:2006</span>
                </div>
                <h3 className="sih-workbench-main-title">OIML R 76 Test Execution Workbench</h3>
                <p className="sih-workbench-sub">
                  78 standard metrological test procedures for compliance verification of non-automatic weighing instruments.
                </p>
              </div>

              <div className="sih-workbench-progress-box">
                <div className="sih-wb-progress-text">
                  <span className="sih-wb-progress-label">WORKBENCH PROGRESS</span>
                  <strong className="sih-wb-progress-count">
                    {completedTests} / {catalogProcedures.length} completed ({Math.round((completedTests / catalogProcedures.length) * 100)}%)
                  </strong>
                </div>
                <div className="sih-wb-progress-track">
                  <div
                    className="sih-wb-progress-fill"
                    style={{ width: `${Math.round((completedTests / catalogProcedures.length) * 100)}%` }}
                  />
                </div>
                <div className="sih-wb-session-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '8px', marginTop: '4px' }}>
                  <span className="sih-wb-session-tag">
                    Session: <strong>{selectedSession?.session_number || 'ACTIVE_SESSION'}</strong>
                  </span>
                  <button
                    type="button"
                    className="sih-completion-toggle-btn"
                    onClick={() => setShowCompletionScreen(!showCompletionScreen)}
                  >
                    {showCompletionScreen ? '← Back to Execution' : 'Inspection Completion & Results →'}
                  </button>
                </div>
              </div>
            </div>

            {!selectedSessionId ? (
              <div className="sih-empty large">
                <strong>Select or create a test session first.</strong>
                <span>The test runner needs an active session to store observations and evaluate compliance.</span>
                <button type="button" className="sih-primary-action" onClick={() => navigateToView('sessions')}>
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

                {showReportPreview ? (
                  <div className="sih-report-preview-container">
                    {/* Report Preview Header */}
                    <div className="sih-rp-header-bar">
                      <div className="sih-rp-header-titles">
                        <div className="sih-workbench-badge-row">
                          <span className="sih-eyebrow">METROLOGY REPORT WORKSTATION</span>
                          <span className="sih-standard-ref-badge font-mono">OIML R 76-1:2006</span>
                        </div>
                        <h2 className="sih-rp-main-title">REPORT PREVIEW</h2>
                        <p className="sih-rp-sub">OIML R 76 Test Report for Non-Automatic Weighing Instruments</p>
                      </div>

                      <div className="sih-rp-header-action">
                        <button
                          type="button"
                          className="sih-rp-back-btn"
                          onClick={() => setShowReportPreview(false)}
                        >
                          ← Back to Results Review
                        </button>
                      </div>
                    </div>

                    {/* Export Report Section */}
                    <div className="sih-rp-export-section">
                      <div className="sih-rp-export-header">
                        <span className="sih-rp-export-title">EXPORT REPORT</span>
                      </div>

                      <div className="sih-rp-cards-grid">
                        {/* PDF Format Option Card */}
                        <div className="sih-rp-card">
                          <div className="sih-rp-card-body">
                            <div className="sih-rp-card-header">
                              <span className="sih-rp-badge pdf">PDF</span>
                              <div className="sih-rp-card-text">
                                <h3 className="sih-rp-card-heading">Portable Document Format</h3>
                                <p className="sih-rp-card-desc">Official compliance report with digital verification badge</p>
                              </div>
                            </div>
                          </div>

                          <div className="sih-rp-card-actions">
                            <button
                              type="button"
                              className="sih-rp-btn secondary"
                              disabled={busySessionId === selectedSessionId}
                              onClick={() => handlePreviewReport(selectedSessionId)}
                            >
                              {busySessionId === selectedSessionId ? 'Generating PDF...' : 'Preview PDF'}
                            </button>
                            <button
                              type="button"
                              className="sih-rp-btn primary"
                              disabled={busySessionId === selectedSessionId}
                              onClick={() => handleDownloadReport(selectedSessionId)}
                            >
                              Download PDF
                            </button>
                          </div>
                        </div>

                        {/* DOCX Format Option Card */}
                        <div className="sih-rp-card">
                          <div className="sih-rp-card-body">
                            <div className="sih-rp-card-header">
                              <span className="sih-rp-badge docx">DOCX</span>
                              <div className="sih-rp-card-text">
                                <h3 className="sih-rp-card-heading">Editable Word Document</h3>
                                <p className="sih-rp-card-desc">Full editable test report for laboratory archiving</p>
                              </div>
                            </div>
                          </div>

                          <div className="sih-rp-card-actions">
                            <button
                              type="button"
                              className="sih-rp-btn primary"
                              disabled={busySessionId === selectedSessionId}
                              onClick={() => handleDownloadDocxReport(selectedSessionId)}
                            >
                              Download DOCX
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Status & Error Banners */}
                    {busySessionId === selectedSessionId && (
                      <div className="sih-report-status-banner loading">
                        <i className="sih-spinner" />
                        <span>Generating report… Please wait while PDF/DOCX documents are compiled.</span>
                      </div>
                    )}

                    {error && (
                      <div className="sih-report-status-banner error">
                        <strong>Report Generation Alert:</strong>
                        <span>{error}</span>
                      </div>
                    )}

                    <div className="sih-report-document">
                      <header className="sih-report-document-header">
                        <div>
                          <div className="sih-report-brand">OIMLENSE</div>
                          <div className="sih-report-brand-sub">
                            Digital NAWI Testing & Compliance System
                          </div>
                        </div>

                        <div className="sih-report-standard">
                          <strong>OIML R 76-1:2006</strong>
                          <span>TEST & VERIFICATION REPORT</span>
                        </div>
                      </header>

                      <div className="sih-report-title-row">
                        <div>
                          <span>OFFICIAL TEST RECORD</span>
                          <h1>NAWI TEST REPORT</h1>
                        </div>

                        <div className={`sih-report-result ${
                          selectedSession?.status === 'approved' ||
                          selectedSession?.status === 'completed'
                            ? 'pass'
                            : selectedSession?.status === 'rejected' ||
                              selectedSession?.status === 'failed'
                              ? 'fail'
                              : 'review'
                        }`}>
                          <small>RESULT STATUS</small>
                          <strong>
                            {selectedSession?.status === 'approved' ||
                            selectedSession?.status === 'completed'
                              ? 'PASS'
                              : selectedSession?.status === 'rejected' ||
                                selectedSession?.status === 'failed'
                                ? 'FAIL'
                                : 'REVIEW'}
                          </strong>
                        </div>
                      </div>

                      <section className="sih-report-section">
                        <div className="sih-report-section-heading">
                          <span>01</span>
                          <div>
                            <strong>Report Information</strong>
                            <small>Identification and inspection details</small>
                          </div>
                        </div>

                        <div className="sih-report-info-grid">
                          <div>
                            <span>REPORT NUMBER</span>
                            <strong>
                              {selectedSession?.report_id ||
                                selectedSession?.session_number ||
                                selectedSession?.id ||
                                'N/A'}
                            </strong>
                          </div>
                          <div>
                            <span>SESSION NUMBER</span>
                            <strong>{selectedSession?.session_number || 'N/A'}</strong>
                          </div>
                          <div>
                            <span>INSPECTION DATE</span>
                            <strong>
                              {selectedSession?.started_at
                                ? new Date(selectedSession.started_at).toLocaleDateString('en-GB', {
                                    day: '2-digit',
                                    month: 'long',
                                    year: 'numeric',
                                  })
                                : 'N/A'}
                            </strong>
                          </div>
                          <div>
                            <span>TEST TYPE</span>
                            <strong>
                              {(selectedSession?.test_type || 'Initial Verification')
                                .replace(/_/g, ' ')}
                            </strong>
                          </div>
                          <div>
                            <span>TEST LOCATION</span>
                            <strong>{selectedSession?.test_location || 'Laboratory'}</strong>
                          </div>
                          <div>
                            <span>VERIFICATION STAGE</span>
                            <strong>
                              {(selectedSession?.verification_stage || 'Standard')
                                .replace(/_/g, ' ')}
                            </strong>
                          </div>
                        </div>
                      </section>

                      <section className="sih-report-section">
                        <div className="sih-report-section-heading">
                          <span>02</span>
                          <div>
                            <strong>Instrument Under Test</strong>
                            <small>Registered weighing instrument details</small>
                          </div>
                        </div>

                        <div className="sih-report-instrument-grid">
                          <div className="sih-report-instrument-main">
                            <span>MANUFACTURER / MODEL</span>
                            <strong>
                              {selectedInstrument
                                ? `${selectedInstrument.manufacturer || ''} ${selectedInstrument.model || ''}`.trim()
                                : 'N/A'}
                            </strong>
                          </div>

                          <div>
                            <span>SERIAL NUMBER</span>
                            <strong>{selectedInstrument?.serial_number || 'N/A'}</strong>
                          </div>

                          <div>
                            <span>ACCURACY CLASS</span>
                            <strong>Class {selectedInstrument?.accuracy_class || 'III'}</strong>
                          </div>

                          <div>
                            <span>MAXIMUM CAPACITY</span>
                            <strong>
                              {selectedInstrument?.max_capacity || 'N/A'} {selectedInstrument?.unit || 'kg'}
                            </strong>
                          </div>

                          <div>
                            <span>VERIFICATION SCALE interval (e)</span>
                            <strong>
                              {selectedInstrument?.e || 'N/A'} {selectedInstrument?.unit || 'kg'}
                            </strong>
                          </div>

                          <div>
                            <span>ACTUAL SCALE interval (d)</span>
                            <strong>
                              {selectedInstrument?.d || selectedInstrument?.e || 'N/A'} {selectedInstrument?.unit || 'kg'}
                            </strong>
                          </div>
                        </div>
                      </section>

                      <section className="sih-report-section">
                        <div className="sih-report-section-heading">
                          <span>03</span>
                          <div>
                            <strong>Compliance Summary</strong>
                            <small>Deterministic evaluation of recorded procedures</small>
                          </div>
                        </div>

                        <div className="sih-report-summary-grid">
                          <div>
                            <span>TOTAL TESTS</span>
                            <strong>{results.length}</strong>
                          </div>
                          <div className="pass">
                            <span>PASSED</span>
                            <strong>
                              {results.filter(r =>
                                ['PASS', 'PASSED', 'COMPLIANT'].includes(
                                  String(r.result_status || '').toUpperCase()
                                )
                              ).length}
                            </strong>
                          </div>
                          <div className="fail">
                            <span>FAILED</span>
                            <strong>
                              {results.filter(r =>
                                ['FAIL', 'FAILED', 'NON_COMPLIANT'].includes(
                                  String(r.result_status || '').toUpperCase()
                                )
                              ).length}
                            </strong>
                          </div>
                          <div>
                            <span>RECORDED</span>
                            <strong>{results.length}</strong>
                          </div>
                        </div>
                      </section>

                      <section className="sih-report-section">
                        <div className="sih-report-section-heading">
                          <span>04</span>
                          <div>
                            <strong>Procedure Evaluation</strong>
                            <small>Recorded OIML R 76 test results</small>
                          </div>
                        </div>

                        {results.length > 0 ? (
                          <div className="sih-report-results-table-wrap">
                            <table className="sih-report-results-table">
                              <thead>
                                <tr>
                                  <th>#</th>
                                  <th>Test / Procedure</th>
                                  <th>Result</th>
                                  <th>Measured Value</th>
                                  <th>MPE</th>
                                </tr>
                              </thead>
                              <tbody>
                                {results.map((result, index) => {
                                  const resultValue = String(
                                    result.result_status || 'PENDING'
                                  ).toUpperCase()

                                  const isPass = ['PASS', 'PASSED', 'COMPLIANT'].includes(resultValue)
                                  const isFail = ['FAIL', 'FAILED', 'NON_COMPLIANT'].includes(resultValue)

                                  return (
                                    <tr key={result.id || index}>
                                      <td>{String(index + 1).padStart(2, '0')}</td>
                                      <td>
                                        <strong>
                                          {result.test_definition_id || 'R76 Test'}
                                        </strong>
                                        {result.test_definition_id && (
                                          <small>{result.test_definition_id}</small>
                                        )}
                                      </td>
                                      <td>
                                        <span className={`sih-report-table-result ${
                                          isPass ? 'pass' : isFail ? 'fail' : 'review'
                                        }`}>
                                          {isPass ? 'PASS' : isFail ? 'FAIL' : 'REVIEW'}
                                        </span>
                                      </td>
                                      <td>
                                        {result.measured_error ?? '—'}
                                      </td>
                                      <td>
                                        {result.mpe_value ?? '—'}
                                      </td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="sih-report-no-results">
                            No test results have been recorded for this session.
                          </div>
                        )}
                      </section>

                      <footer className="sih-report-document-footer">
                        <div>
                          <strong>OIMLense</strong>
                          <span>Digital NAWI Testing & Compliance System</span>
                        </div>
                        <div>
                          <span>STANDARD</span>
                          <strong>OIML R 76-1:2006</strong>
                        </div>
                        <div>
                          <span>REPORT ID</span>
                          <strong>
                            {selectedSession?.report_id ||
                              selectedSession?.session_number ||
                              selectedSession?.id ||
                              'N/A'}
                          </strong>
                        </div>
                      </footer>
                    </div>
                  </div>
                ) : showCompletionScreen ? (
                  <div className="sih-completion-page-container">
                    {/* Top Completion Banner & Status */}
                    <div className="sih-completion-hero-card">
                      <div className={`sih-completion-icon-ring ${failedTests > 0 ? 'fail' : 'pass'}`}>
                        {failedTests > 0 ? '!' : '✓'}
                      </div>

                      <h2 className="sih-completion-main-title">
                        {completedTests >= catalogProcedures.length
                          ? failedTests > 0
                            ? 'Inspection Completed — Results Require Attention'
                            : 'Inspection Completed'
                          : 'Inspection Incomplete'}
                      </h2>

                      <p className="sih-completion-subtitle">
                        {completedTests >= catalogProcedures.length
                          ? 'All selected procedures have been processed.'
                          : `${completedTests} of ${catalogProcedures.length} procedures processed. ${catalogProcedures.length - completedTests} procedures remaining.`}
                      </p>

                      <div className="sih-completion-count-pill">
                        <strong>{completedTests} / {catalogProcedures.length} Completed</strong>
                      </div>
                    </div>

                    {/* Instrument Summary Card */}
                    <div className="sih-completion-section-card">
                      <div className="sih-completion-card-header">
                        <span className="sih-completion-section-label">INSTRUMENT SUMMARY</span>
                      </div>

                      <div className="sih-completion-inst-body">
                        <div className="sih-inst-title-block">
                          <h4 className="sih-inst-name">
                            {selectedInstrument ? `${selectedInstrument.manufacturer || ''} ${selectedInstrument.model || ''}`.trim() : 'Standard Instrument'}
                          </h4>
                          <span className="sih-inst-serial font-mono">
                            {selectedInstrument?.serial_number ? `Serial ${selectedInstrument.serial_number}` : 'Serial N/A'}
                          </span>
                        </div>

                        <div className="sih-inst-specs-grid">
                          <div className="sih-spec-chip">
                            <span className="spec-label">ACCURACY CLASS</span>
                            <strong className="spec-val">Class {selectedInstrument?.accuracy_class || 'III'}</strong>
                          </div>
                          <div className="sih-spec-chip">
                            <span className="spec-label">MAX CAPACITY</span>
                            <strong className="spec-val">Max {selectedInstrument?.max_capacity ?? 30} {selectedInstrument?.unit || 'kg'}</strong>
                          </div>
                          {selectedInstrument?.min_capacity !== undefined && (
                            <div className="sih-spec-chip">
                              <span className="spec-label">MIN CAPACITY</span>
                              <strong className="spec-val">Min {selectedInstrument.min_capacity} {selectedInstrument.unit || 'kg'}</strong>
                            </div>
                          )}
                          <div className="sih-spec-chip">
                            <span className="spec-label">VERIFICATION SCALE e</span>
                            <strong className="spec-val">e = {selectedInstrument?.e ?? 0.01} {selectedInstrument?.unit || 'kg'}</strong>
                          </div>
                          <div className="sih-spec-chip">
                            <span className="spec-label">SCALE INTERVAL d</span>
                            <strong className="spec-val">d = {selectedInstrument?.d ?? selectedInstrument?.e ?? 0.01} {selectedInstrument?.unit || 'kg'}</strong>
                          </div>
                          <div className="sih-spec-chip">
                            <span className="spec-label">INTERVALS n</span>
                            <strong className="spec-val">
                              n = {selectedInstrument?.n ?? (selectedInstrument?.e && selectedInstrument?.max_capacity ? Math.round(selectedInstrument.max_capacity / selectedInstrument.e) : 3000)}
                            </strong>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Result Summary Metrics Row */}
                    <div className="sih-completion-section-card" style={{ padding: '16px 20px' }}>
                      <div className="sih-completion-card-header" style={{ marginBottom: '12px' }}>
                        <span className="sih-completion-section-label">RESULTS SUMMARY</span>
                      </div>

                      <div className="sih-completion-metrics-row">
                        <div className="sih-completion-metric-card">
                          <span className="sih-cm-label">TOTAL</span>
                          <strong className="sih-cm-val">{catalogProcedures.length}</strong>
                          <small className="sih-cm-sub">catalog procedures</small>
                        </div>

                        <div className="sih-completion-metric-card completed">
                          <span className="sih-cm-label">COMPLETED</span>
                          <strong className="sih-cm-val">{completedTests}</strong>
                          <small className="sih-cm-sub">runs executed</small>
                        </div>

                        <div className="sih-completion-metric-card pass">
                          <span className="sih-cm-label">PASS</span>
                          <strong className="sih-cm-val">{passedTests}</strong>
                          <small className="sih-cm-sub">passed compliance</small>
                        </div>

                        <div className={`sih-completion-metric-card ${failedTests > 0 ? 'fail' : ''}`}>
                          <span className="sih-cm-label">FAIL</span>
                          <strong className="sih-cm-val">{failedTests}</strong>
                          <small className="sih-cm-sub">{failedTests > 0 ? 'exceeds MPE limit' : '0 failures'}</small>
                        </div>

                        {testPlan?.counts?.review_required ? (
                          <div className="sih-completion-metric-card review">
                            <span className="sih-cm-label">REVIEW REQUIRED</span>
                            <strong className="sih-cm-val">{testPlan.counts.review_required}</strong>
                            <small className="sih-cm-sub">needs officer check</small>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    {/* Review Required Section if applicable */}
                    {testPlan?.tests?.some(t => t.status === 'review_required' || t.status === 'conditional') && (
                      <div className="sih-completion-section-card review-border">
                        <div className="sih-completion-card-header">
                          <span className="sih-completion-section-label review-text">REQUIRES REVIEW</span>
                          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#92400e' }}>
                            The following procedures require manual officer verification or conditional configuration checks:
                          </p>
                        </div>

                        <div className="sih-review-procs-list" style={{ marginTop: '12px' }}>
                          {testPlan.tests.filter(t => t.status === 'review_required' || t.status === 'conditional').map(proc => (
                            <div key={proc.test_code} className="sih-review-proc-item">
                              <span className="sih-comp-status-icon review">!</span>
                              <div className="sih-comp-proc-info">
                                <strong className="proc-name">{proc.test_name}</strong>
                                <code className="proc-id font-mono">{proc.test_code}</code>
                              </div>
                              <span className="sih-clause-tag font-mono">{proc.source_clause || '—'}</span>
                              <span className="sih-review-reason-text">{proc.reason || 'Officer verification required'}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Procedure Results List Section */}
                    <div className="sih-completion-section-card">
                      <div className="sih-completion-card-header flex-between">
                        <div>
                          <span className="sih-completion-section-label">PROCEDURE RESULTS</span>
                          <h4 className="sih-completion-results-headline" style={{ margin: '4px 0 0 0', fontSize: '15px', color: '#111827' }}>
                            {passedTests} of {completedTests} completed procedures passed
                          </h4>
                        </div>
                        {failedTests > 0 && (
                          <span className="sih-results-attention-badge">
                            ! {failedTests} {failedTests === 1 ? 'procedure requires' : 'procedures require'} attention
                          </span>
                        )}
                      </div>

                      <div className="sih-completion-table-wrap" style={{ marginTop: '14px' }}>
                        <table className="sih-completion-results-table">
                          <thead>
                            <tr>
                              <th style={{ width: '40px' }}></th>
                              <th>Procedure</th>
                              <th>Clause</th>
                              <th>Status</th>
                              <th style={{ textAlign: 'right' }}>Result</th>
                            </tr>
                          </thead>
                          <tbody>
                            {catalogProcedures.map((proc) => {
                              const res = results.find(
                                (r) => r.test_definition_id === proc.id || r.rule_id === proc.test_code
                              )
                              const isFailed = res && res.pass_fail === false
                              const isPassed = res && res.pass_fail === true
                              const isExpanded = expandedFailureCode === proc.test_code

                              return (
                                <Fragment key={proc.test_code}>
                                  <tr className={`sih-completion-row ${isFailed ? 'has-fail' : isPassed ? 'has-pass' : 'has-pending'}`}>
                                    <td className="status-col">
                                      {isPassed ? (
                                        <span className="sih-comp-status-icon pass">✓</span>
                                      ) : isFailed ? (
                                        <span className="sih-comp-status-icon fail">!</span>
                                      ) : (
                                        <span className="sih-comp-status-icon pending">○</span>
                                      )}
                                    </td>
                                    <td className="proc-col">
                                      <div className="sih-comp-proc-info">
                                        <strong className="proc-name">{proc.test_name}</strong>
                                        <code className="proc-id font-mono">{proc.test_code}</code>
                                      </div>
                                    </td>
                                    <td className="clause-col">
                                      <span className="sih-clause-tag font-mono">{proc.source_clause || '—'}</span>
                                    </td>
                                    <td className="status-badge-col">
                                      {res ? (
                                        <span className={`sih-comp-badge ${isPassed ? 'pass' : 'fail'}`}>
                                          {isPassed ? 'PASS' : 'FAIL'}
                                        </span>
                                      ) : (
                                        <span className="sih-comp-badge pending">NOT STARTED</span>
                                      )}
                                    </td>
                                    <td className="action-col" style={{ textAlign: 'right' }}>
                                      {isFailed && (
                                        <button
                                          type="button"
                                          className="sih-fail-details-btn"
                                          onClick={() => setExpandedFailureCode(isExpanded ? null : proc.test_code)}
                                        >
                                          {isExpanded ? 'Hide Details ▲' : 'View Diagnostic ▼'}
                                        </button>
                                      )}
                                    </td>
                                  </tr>

                                  {/* Failure Diagnostic Box */}
                                  {isFailed && (isExpanded || failedTests <= 3) && (
                                    <tr className="sih-failure-diag-row">
                                      <td colSpan={5}>
                                        <div className="sih-failure-diag-box">
                                          <strong className="diag-title">! Evaluation Diagnostic:</strong>
                                          <p className="diag-text" style={{ margin: '4px 0 0 0' }}>
                                            {res.failure_reason || (
                                              res.measured_error !== undefined
                                                ? `Measured error (${res.measured_error} ${selectedInstrument?.unit || 'kg'}) exceeds permitted MPE limit (${res.mpe_value ?? '—'} ${selectedInstrument?.unit || 'kg'}).`
                                                : 'Procedure measurement exceeded applicable OIML R 76 maximum permissible error limits.'
                                            )}
                                          </p>
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </Fragment>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Action Area */}
                    <div className="sih-completion-action-bar">
                      <div className="action-bar-left">
                        <button
                          type="button"
                          className="sih-secondary-action-btn"
                          onClick={() => setShowCompletionScreen(false)}
                        >
                          ← Review Results / Back to Tests
                        </button>
                      </div>

                      <div className="action-bar-right">
                        {selectedSession && (selectedSession.status === 'draft' || selectedSession.status === 'in_progress' || selectedSession.status === 'rejected') && (
                          <button
                            type="button"
                            className="sih-secondary-action-btn"
                            disabled={busySessionId === selectedSession.id}
                            onClick={() => handleSessionWorkflow(selectedSession, 'submit')}
                          >
                            Submit for Review
                          </button>
                        )}

                        <button
                          type="button"
                          className="sih-primary-action-btn"
                          disabled={busySessionId === selectedSessionId}
                          onClick={() => {
                            setShowReportPreview(true)
                            handlePreviewReport(selectedSessionId)
                          }}
                        >
                          {busySessionId === selectedSessionId ? 'Generating...' : 'Report Preview & Export →'}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Automatic OIML R 76 Test Plan */}
                <div className="sih-panel" style={{ marginTop: '18px' }}>
                  <div className="sih-test-plan-header">
                    <div className="sih-tp-header-main">
                      <div className="sih-tp-title-row">
                        <h3 className="sih-tp-title">Generated OIML R 76 Test Plan</h3>
                        <span className="sih-tp-auto-badge">AUTO-GENERATED</span>
                      </div>
                      <p className="sih-tp-subtitle">
                        Procedures are selected automatically from the instrument configuration and OIML R 76 rulepack.
                      </p>
                    </div>
                    <div className="sih-tp-standard-badge">
                      <span className="sih-tp-std-label">STANDARD</span>
                      <strong className="sih-tp-std-val">{testPlan?.standard || 'OIML R 76-1:2006'}</strong>
                    </div>
                  </div>

                  {testPlanLoading ? (
                    <div className="sih-empty">
                      <strong>Generating test plan...</strong>
                      <span>Evaluating instrument parameters against the OIML R 76 procedure rules.</span>
                    </div>
                  ) : testPlan ? (
                    <>
                      <div className="sih-test-plan-metrics">
                        <div className="sih-tp-card required">
                          <span className="sih-tp-label">REQUIRED</span>
                          <strong className="sih-tp-val">{testPlan.counts.required}</strong>
                          <span className="sih-tp-desc">Must be performed</span>
                        </div>
                        <div className="sih-tp-card conditional">
                          <span className="sih-tp-label">CONDITIONAL</span>
                          <strong className="sih-tp-val">{testPlan.counts.conditional}</strong>
                          <span className="sih-tp-desc">Depends on configuration</span>
                        </div>
                        <div className="sih-tp-card review-required">
                          <span className="sih-tp-label">REVIEW REQUIRED</span>
                          <strong className="sih-tp-val">{testPlan.counts.review_required}</strong>
                          <span className="sih-tp-desc">Needs officer confirmation</span>
                        </div>
                        <div className="sih-tp-card not-applicable">
                          <span className="sih-tp-label">NOT APPLICABLE</span>
                          <strong className="sih-tp-val">{testPlan.counts.not_applicable}</strong>
                          <span className="sih-tp-desc">Excluded automatically</span>
                        </div>
                      </div>

                      {/* Dynamic Test Plan Coverage Indicator */}
                      {(() => {
                        const reqCount = testPlan.counts.required || 0
                        const condCount = testPlan.counts.conditional || 0
                        const revCount = testPlan.counts.review_required || 0
                        const naCount = testPlan.counts.not_applicable || 0
                        const totalProcs = reqCount + condCount + revCount + naCount

                        const reqPct = totalProcs > 0 ? (reqCount / totalProcs) * 100 : 0
                        const condPct = totalProcs > 0 ? (condCount / totalProcs) * 100 : 0
                        const revPct = totalProcs > 0 ? (revCount / totalProcs) * 100 : 0
                        const naPct = totalProcs > 0 ? (naCount / totalProcs) * 100 : 0

                        return (
                          <div className="sih-coverage-container">
                            <div className="sih-coverage-header">
                              <div className="sih-coverage-title-group">
                                <strong className="sih-coverage-title">Test Plan Coverage</strong>
                                <span className="sih-coverage-total-badge">
                                  {totalProcs} {totalProcs === 1 ? 'procedure' : 'procedures'} generated
                                </span>
                              </div>
                              <div className="sih-coverage-legend-inline">
                                <span className="legend-item required">{reqCount} Required</span>
                                <span className="legend-sep">·</span>
                                <span className="legend-item conditional">{condCount} Conditional</span>
                                <span className="legend-sep">·</span>
                                <span className="legend-item review">{revCount} Review Required</span>
                                <span className="legend-sep">·</span>
                                <span className="legend-item na">{naCount} Not Applicable</span>
                              </div>
                            </div>

                            <div className="sih-coverage-bar-track">
                              {totalProcs > 0 ? (
                                <>
                                  {reqPct > 0 && (
                                    <div
                                      className="sih-coverage-seg required"
                                      style={{ width: `${reqPct}%` }}
                                      title={`Required: ${reqCount} (${reqPct.toFixed(1)}%)`}
                                    />
                                  )}
                                  {condPct > 0 && (
                                    <div
                                      className="sih-coverage-seg conditional"
                                      style={{ width: `${condPct}%` }}
                                      title={`Conditional: ${condCount} (${condPct.toFixed(1)}%)`}
                                    />
                                  )}
                                  {revPct > 0 && (
                                    <div
                                      className="sih-coverage-seg review"
                                      style={{ width: `${revPct}%` }}
                                      title={`Review Required: ${revCount} (${revPct.toFixed(1)}%)`}
                                    />
                                  )}
                                  {naPct > 0 && (
                                    <div
                                      className="sih-coverage-seg na"
                                      style={{ width: `${naPct}%` }}
                                      title={`Not Applicable: ${naCount} (${naPct.toFixed(1)}%)`}
                                    />
                                  )}
                                </>
                              ) : (
                                <div className="sih-coverage-seg empty" style={{ width: '100%' }} />
                              )}
                            </div>
                          </div>
                        )
                      })()}

                      <div className="sih-table-wrap" style={{ marginTop: '0px' }}>
                        <table className="sih-table">
                          <thead>
                            <tr>
                              <th className="sih-col-procedure">Procedure</th>
                              <th className="sih-col-category">Category</th>
                              <th className="sih-col-clause">Clause</th>
                              <th className="sih-col-status">Status</th>
                              <th className="sih-col-reason">Reason</th>
                            </tr>
                          </thead>
                          <tbody>
                            {testPlan.tests.map((test) => (
                              <tr key={test.test_code}>
                                <td className="sih-col-procedure">
                                  <div className="sih-tp-proc-cell">
                                    <span className="sih-tp-accent-marker" />
                                    <div className="sih-tp-proc-meta">
                                      <strong className="sih-tp-proc-name">{test.test_name}</strong>
                                      <code className="sih-tp-proc-id">{test.test_code}</code>
                                    </div>
                                  </div>
                                </td>
                                <td className="sih-col-category">
                                  <span className="sih-category-pill">
                                    {test.category
                                      ? test.category.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
                                      : '—'}
                                  </span>
                                </td>
                                <td className="sih-col-clause">
                                  <span className="sih-clause-tag">
                                    {test.source_clause || '—'}
                                  </span>
                                </td>
                                <td className="sih-col-status" style={{ minWidth: '160px', whiteSpace: 'nowrap' }}>
                                  <span className={`sih-status-pill ${test.status}`}>
                                    {test.status.replace('_', ' ').toUpperCase()}
                                  </span>
                                </td>
                                <td className="sih-col-reason reason-cell">
                                  <span className="sih-reason-text" style={{ color: '#374151', fontSize: '13px', lineHeight: 1.5, display: 'block', wordBreak: 'normal', overflowWrap: 'break-word' }}>
                                    {test.reason || '—'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Next Steps / Test Plan Footer */}
                      <div className="sih-test-plan-footer">
                        <div className="sih-tp-footer-info">
                          <div className="sih-tp-footer-status">
                            <span className="sih-tp-check-icon">✓</span>
                            <strong className="sih-tp-footer-title">Test plan generated successfully</strong>
                          </div>
                          <p className="sih-tp-footer-sub">
                            Review the selected procedures before starting test execution.
                          </p>
                        </div>
                        <div className="sih-tp-footer-actions">
                          <button
                            type="button"
                            className="sih-tp-start-btn"
                            onClick={() => {
                              const firstRequired = testPlan?.tests?.find(t => t.status === 'required' || t.status === 'conditional' || t.status === 'review_required')?.test_code || testPlan?.tests?.[0]?.test_code
                              if (firstRequired) {
                                setSelectedTestCode(firstRequired)
                              }
                              document.querySelector('.sih-test-layout')?.scrollIntoView({ behavior: 'smooth' })
                            }}
                          >
                            Start Testing →
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="sih-empty">
                      <strong>No automatic test plan available.</strong>
                      <span>Select an instrument to generate the OIML R 76 test plan.</span>
                    </div>
                  )}
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

                        let icon = '○'
                        let iconClass = 'pending'

                        if (existing) {
                          if (existing.pass_fail === false) {
                            icon = '!'
                            iconClass = 'fail'
                          } else {
                            icon = '✓'
                            iconClass = 'completed'
                          }
                        } else if (selected) {
                          icon = '●'
                          iconClass = 'current'
                        }

                        return (
                          <button
                            type="button"
                            key={definition.test_code}
                            className={`sih-test-nav-item ${selected ? 'is-current' : ''} ${existing ? (existing.pass_fail ? 'is-completed' : 'is-failed') : ''}`}
                            onClick={() => {
                              setSelectedTestCode(definition.test_code)
                              setShowMobileProcDropdown(false)
                            }}
                          >
                            <span className={`sih-proc-status-icon ${iconClass}`}>{icon}</span>
                            <div className="sih-proc-content">
                              <span className="sih-proc-name">{definition.test_name}</span>
                              <span className="sih-proc-id">{definition.test_code}</span>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>

                <div className="sih-test-layout">
                  <aside className="sih-test-sidebar">
                    <div className="sih-test-sidebar-header">
                      <strong className="sih-sidebar-title">TEST PROCEDURES</strong>
                      <span className="sih-sidebar-subtitle">{filteredProcedures.length} procedures</span>
                    </div>

                    <div className="sih-procedure-list">
                      {filteredProcedures.map((definition) => {
                        const existing = results.find(
                          (result) => result.test_definition_id === definition.id || result.rule_id === definition.test_code
                        )
                        const selected = selectedTestCode === definition.test_code

                        let icon = '○'
                        let iconClass = 'pending'

                        if (existing) {
                          if (existing.pass_fail === false) {
                            icon = '!'
                            iconClass = 'fail'
                          } else {
                            icon = '✓'
                            iconClass = 'completed'
                          }
                        } else if (selected) {
                          icon = '●'
                          iconClass = 'current'
                        }

                        return (
                          <button
                            type="button"
                            key={definition.test_code}
                            className={`sih-test-nav-item ${selected ? 'is-current' : ''} ${existing ? (existing.pass_fail ? 'is-completed' : 'is-failed') : ''}`}
                            onClick={() => setSelectedTestCode(definition.test_code)}
                          >
                            <span className={`sih-proc-status-icon ${iconClass}`}>{icon}</span>
                            <div className="sih-proc-content">
                              <span className="sih-proc-name">{definition.test_name}</span>
                              <span className="sih-proc-id">{definition.test_code}</span>
                            </div>
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
                            <div className="sih-test-heading-badges">
                              <span className="sih-clause-tag font-mono">CLAUSE {selectedDefinition.source_clause || '—'}</span>
                              <span className="sih-standard-ref-badge">OIML R 76-1:2006</span>
                            </div>
                            <span className="sih-test-pos-tag">
                              PROCEDURE {String(R76_78_TEST_PROCEDURES.findIndex(p => p.test_code === selectedDefinition.test_code) + 1).padStart(2, '0')} OF 78
                            </span>
                          </div>
                          <h4>{selectedDefinition.test_code}: {selectedDefinition.test_name}</h4>
                          <p className="sih-test-heading-desc">{selectedDefinition.description || 'OIML R 76 standard test procedure for non-automatic weighing instruments.'}</p>
                          <div className="sih-source-row">
                            <span className="sih-source-item">
                              <strong>Category</strong>{' '}
                              <span className="sih-category-pill">
                                {(selectedDefinition.category || 'weighing').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                              </span>
                            </span>
                            <span className="sih-source-item">
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
                            } else if (currIdx === catalogProcedures.length - 1) {
                              setShowCompletionScreen(true)
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
              </>
            )}
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
                        navigateToView('tests')
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

        {showReportDetail && selectedSessionId && (
          <>
                {showReportDetail ? (
                  <section className="sih-report-detail">
                    <div className="sih-report-detail-toolbar">
                      <div>
                        <span className="sih-eyebrow">REPORT REPOSITORY</span>
                        <h2>Test Report</h2>
                        <p>OIML R 76-1:2006 • Non-Automatic Weighing Instrument</p>
                      </div>

                      <div className="sih-report-detail-actions">
                        <button
                          type="button"
                          className="sih-secondary-action"
                          onClick={() => setShowReportDetail(false)}
                        >
                          ← Back to Reports
                        </button>
                        {selectedSessionId && (
                          <>
                            <button
                              type="button"
                              className="sih-secondary-action"
                              disabled={busySessionId === selectedSessionId}
                              onClick={() => handleDownloadReport(selectedSessionId)}
                            >
                              PDF
                            </button>
                            <button
                              type="button"
                              className="sih-primary-action"
                              disabled={busySessionId === selectedSessionId}
                              onClick={() => handleDownloadDocxReport(selectedSessionId)}
                            >
                              DOCX
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="sih-report-document">
                      <header className="sih-report-document-header">
                        <div>
                          <div className="sih-report-brand">OIMLENSE</div>
                          <div className="sih-report-brand-sub">
                            Digital NAWI Testing & Compliance System
                          </div>
                        </div>

                        <div className="sih-report-standard">
                          <strong>OIML R 76-1:2006</strong>
                          <span>TEST & VERIFICATION REPORT</span>
                        </div>
                      </header>

                      <div className="sih-report-title-row">
                        <div>
                          <span>OFFICIAL TEST RECORD</span>
                          <h1>NAWI TEST REPORT</h1>
                        </div>

                        <div className={`sih-report-result ${
                          selectedSession?.status === 'approved' ||
                          selectedSession?.status === 'completed'
                            ? 'pass'
                            : selectedSession?.status === 'rejected' ||
                              selectedSession?.status === 'failed'
                              ? 'fail'
                              : 'review'
                        }`}>
                          <small>RESULT STATUS</small>
                          <strong>
                            {selectedSession?.status === 'approved' ||
                            selectedSession?.status === 'completed'
                              ? 'PASS'
                              : selectedSession?.status === 'rejected' ||
                                selectedSession?.status === 'failed'
                                ? 'FAIL'
                                : 'REVIEW'}
                          </strong>
                        </div>
                      </div>

                      <section className="sih-report-section">
                        <div className="sih-report-section-heading">
                          <span>01</span>
                          <div>
                            <strong>Report Information</strong>
                            <small>Identification and inspection details</small>
                          </div>
                        </div>

                        <div className="sih-report-info-grid">
                          <div>
                            <span>REPORT NUMBER</span>
                            <strong>
                              {selectedSession?.report_id ||
                                selectedSession?.session_number ||
                                selectedSession?.id ||
                                'N/A'}
                            </strong>
                          </div>
                          <div>
                            <span>SESSION NUMBER</span>
                            <strong>{selectedSession?.session_number || 'N/A'}</strong>
                          </div>
                          <div>
                            <span>INSPECTION DATE</span>
                            <strong>
                              {selectedSession?.started_at
                                ? new Date(selectedSession.started_at).toLocaleDateString('en-GB', {
                                    day: '2-digit',
                                    month: 'long',
                                    year: 'numeric',
                                  })
                                : 'N/A'}
                            </strong>
                          </div>
                          <div>
                            <span>TEST TYPE</span>
                            <strong>
                              {(selectedSession?.test_type || 'Initial Verification')
                                .replace(/_/g, ' ')}
                            </strong>
                          </div>
                          <div>
                            <span>TEST LOCATION</span>
                            <strong>{selectedSession?.test_location || 'Laboratory'}</strong>
                          </div>
                          <div>
                            <span>VERIFICATION STAGE</span>
                            <strong>
                              {(selectedSession?.verification_stage || 'Standard')
                                .replace(/_/g, ' ')}
                            </strong>
                          </div>
                        </div>
                      </section>

                      <section className="sih-report-section">
                        <div className="sih-report-section-heading">
                          <span>02</span>
                          <div>
                            <strong>Instrument Under Test</strong>
                            <small>Registered weighing instrument details</small>
                          </div>
                        </div>

                        <div className="sih-report-instrument-grid">
                          <div className="sih-report-instrument-main">
                            <span>MANUFACTURER / MODEL</span>
                            <strong>
                              {selectedInstrument
                                ? `${selectedInstrument.manufacturer || ''} ${selectedInstrument.model || ''}`.trim()
                                : 'N/A'}
                            </strong>
                          </div>

                          <div>
                            <span>SERIAL NUMBER</span>
                            <strong>{selectedInstrument?.serial_number || 'N/A'}</strong>
                          </div>

                          <div>
                            <span>ACCURACY CLASS</span>
                            <strong>Class {selectedInstrument?.accuracy_class || 'III'}</strong>
                          </div>

                          <div>
                            <span>MAXIMUM CAPACITY</span>
                            <strong>
                              {selectedInstrument?.max_capacity || 'N/A'} {selectedInstrument?.unit || 'kg'}
                            </strong>
                          </div>

                          <div>
                            <span>VERIFICATION SCALE interval (e)</span>
                            <strong>
                              {selectedInstrument?.e || 'N/A'} {selectedInstrument?.unit || 'kg'}
                            </strong>
                          </div>

                          <div>
                            <span>ACTUAL SCALE interval (d)</span>
                            <strong>
                              {selectedInstrument?.d || selectedInstrument?.e || 'N/A'} {selectedInstrument?.unit || 'kg'}
                            </strong>
                          </div>
                        </div>
                      </section>

                      <section className="sih-report-section">
                        <div className="sih-report-section-heading">
                          <span>03</span>
                          <div>
                            <strong>Compliance Summary</strong>
                            <small>Deterministic evaluation of recorded procedures</small>
                          </div>
                        </div>

                        <div className="sih-report-summary-grid">
                          <div>
                            <span>TOTAL TESTS</span>
                            <strong>{results.length}</strong>
                          </div>
                          <div className="pass">
                            <span>PASSED</span>
                            <strong>
                              {results.filter(r =>
                                ['PASS', 'PASSED', 'COMPLIANT'].includes(
                                  String(r.result_status || '').toUpperCase()
                                )
                              ).length}
                            </strong>
                          </div>
                          <div className="fail">
                            <span>FAILED</span>
                            <strong>
                              {results.filter(r =>
                                ['FAIL', 'FAILED', 'NON_COMPLIANT'].includes(
                                  String(r.result_status || '').toUpperCase()
                                )
                              ).length}
                            </strong>
                          </div>
                          <div>
                            <span>RECORDED</span>
                            <strong>{results.length}</strong>
                          </div>
                        </div>
                      </section>

                      <section className="sih-report-section">
                        <div className="sih-report-section-heading">
                          <span>04</span>
                          <div>
                            <strong>Procedure Evaluation</strong>
                            <small>Recorded OIML R 76 test results</small>
                          </div>
                        </div>

                        {results.length > 0 ? (
                          <div className="sih-report-results-table-wrap">
                            <table className="sih-report-results-table">
                              <thead>
                                <tr>
                                  <th>#</th>
                                  <th>Test / Procedure</th>
                                  <th>Result</th>
                                  <th>Measured Value</th>
                                  <th>MPE</th>
                                </tr>
                              </thead>
                              <tbody>
                                {results.map((result, index) => {
                                  const resultValue = String(
                                    result.result_status || 'PENDING'
                                  ).toUpperCase()

                                  const isPass = ['PASS', 'PASSED', 'COMPLIANT'].includes(resultValue)
                                  const isFail = ['FAIL', 'FAILED', 'NON_COMPLIANT'].includes(resultValue)

                                  return (
                                    <tr key={result.id || index}>
                                      <td>{String(index + 1).padStart(2, '0')}</td>
                                      <td>
                                        <strong>
                                          {result.test_definition_id || 'R76 Test'}
                                        </strong>
                                        {result.test_definition_id && (
                                          <small>{result.test_definition_id}</small>
                                        )}
                                      </td>
                                      <td>
                                        <span className={`sih-report-table-result ${
                                          isPass ? 'pass' : isFail ? 'fail' : 'review'
                                        }`}>
                                          {isPass ? 'PASS' : isFail ? 'FAIL' : 'REVIEW'}
                                        </span>
                                      </td>
                                      <td>
                                        {result.measured_error ?? '—'}
                                      </td>
                                      <td>
                                        {result.mpe_value ?? '—'}
                                      </td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="sih-report-no-results">
                            No test results have been recorded for this session.
                          </div>
                        )}
                      </section>

                      <footer className="sih-report-document-footer">
                        <div>
                          <strong>OIMLense</strong>
                          <span>Digital NAWI Testing & Compliance System</span>
                        </div>
                        <div>
                          <span>STANDARD</span>
                          <strong>OIML R 76-1:2006</strong>
                        </div>
                        <div>
                          <span>REPORT ID</span>
                          <strong>
                            {selectedSession?.report_id ||
                              selectedSession?.session_number ||
                              selectedSession?.id ||
                              'N/A'}
                          </strong>
                        </div>
                      </footer>
                    </div>
                  </section>
                ) : null}
          </>
        )}

        {activeView === 'reports' && !showReportDetail && (
          <section className="sih-panel sih-repo-panel">
            {/* Header */}
            <div className="sih-panel-header sih-repo-header">
              <div>
                <span className="sih-eyebrow">REPORT REPOSITORY</span>
                <h3 className="sih-repo-title">Report Repository</h3>
                <p className="sih-repo-subtitle">
                  View and manage previous OIML R 76 inspections and generated reports.
                </p>
              </div>
            </div>

            {/* Dynamic Summary Metrics */}
            <div className="sih-repo-summary-grid">
              <div className="sih-repo-summary-card">
                <span className="sih-rsc-label">TOTAL REPORTS</span>
                <strong className="sih-rsc-val">{sessions.length}</strong>
                <small className="sih-rsc-sub">Inspections recorded</small>
              </div>

              <div className="sih-repo-summary-card completed">
                <span className="sih-rsc-label">COMPLETED</span>
                <strong className="sih-rsc-val">
                  {sessions.filter(s => s.status === 'completed' || s.status === 'approved' || s.status === 'submitted').length}
                </strong>
                <small className="sih-rsc-sub">Processed runs</small>
              </div>

              <div className="sih-repo-summary-card pass">
                <span className="sih-rsc-label">PASS</span>
                <strong className="sih-rsc-val">
                  {sessions.filter(s => s.status === 'approved' || s.status === 'completed').length}
                </strong>
                <small className="sih-rsc-sub">Compliant inspections</small>
              </div>

              <div className="sih-repo-summary-card fail">
                <span className="sih-rsc-label">FAIL</span>
                <strong className="sih-rsc-val">
                  {sessions.filter(s => s.status === 'rejected' || s.status === 'failed').length}
                </strong>
                <small className="sih-rsc-sub">Requires attention</small>
              </div>
            </div>

            {/* Search & Filters */}
            <div className="sih-repo-controls-bar">
              <div className="sih-search-box sih-repo-search font-sans">
                <span className="sih-search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search reports by model, serial number, report ID, or inspection number..."
                  value={reportSearch}
                  onChange={(event) => setReportSearch(event.target.value)}
                  className="sih-search-input"
                />
                {reportSearch && (
                  <button
                    type="button"
                    className="sih-search-clear"
                    onClick={() => setReportSearch('')}
                  >
                    ×
                  </button>
                )}
              </div>

              <div className="sih-repo-filters font-sans">
                <select
                  className="sih-repo-select"
                  value={reportStatusFilter}
                  onChange={(event) => setReportStatusFilter(event.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="draft">Draft</option>
                  <option value="in_progress">In Progress</option>
                  <option value="submitted">Submitted</option>
                  <option value="under_review">Under Review</option>
                  <option value="approved">Approved</option>
                  <option value="completed">Completed</option>
                  <option value="rejected">Rejected / Failed</option>
                </select>

                <select
                  className="sih-repo-select"
                  value={reportTypeFilter}
                  onChange={(event) => setReportTypeFilter(event.target.value)}
                >
                  <option value="">All Verification Types</option>
                  <option value="type_evaluation">Type evaluation</option>
                  <option value="initial_verification">Initial verification</option>
                  <option value="in_service">In-service</option>
                </select>
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="sih-report-status-banner error" style={{ margin: '14px 0' }}>
                <strong>Unable to load reports:</strong>
                <span>{error}</span>
                <button
                  type="button"
                  className="sih-secondary-action-btn"
                  style={{ marginLeft: 'auto', padding: '4px 10px', fontSize: '12px' }}
                  onClick={() => setError('')}
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Empty State */}
            {sessions.length === 0 ? (
              <div className="sih-empty large sih-repo-empty">
                <div className="sih-repo-empty-icon font-mono">▤</div>
                <strong className="sih-repo-empty-title">No reports yet</strong>
                <span className="sih-repo-empty-desc">Completed inspections and generated reports will appear here.</span>
                <button
                  type="button"
                  className="sih-primary-action-btn"
                  style={{ marginTop: '16px' }}
                  onClick={() => navigateToView('sessions')}
                >
                  + Start New Test Session
                </button>
              </div>
            ) : filteredReportSessions.length === 0 ? (
              <div className="sih-empty large sih-repo-empty">
                <strong>No reports match search criteria</strong>
                <span>Try adjusting your search query or status filter.</span>
                <button
                  type="button"
                  className="sih-secondary-action-btn"
                  style={{ marginTop: '12px' }}
                  onClick={() => {
                    setReportSearch('')
                    setReportStatusFilter('')
                    setReportTypeFilter('')
                  }}
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              /* Report Table Surface */
              <div className="sih-repo-table-wrap">
                <table className="sih-repo-table">
                  <thead>
                    <tr>
                      <th>Report</th>
                      <th>Instrument</th>
                      <th>Serial</th>
                      <th>Date</th>
                      <th>Result</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReportSessions.map((session) => {
                      const inst = instrumentById.get(session.instrument_id)
                      const reportId = session.report_id || session.session_number || session.id
                      const instName = inst
                        ? `${inst.manufacturer || ''} ${inst.model || ''}`.trim()
                        : (session.test_type || 'NAWI Instrument')
                      const instSerial = inst?.serial_number || 'N/A'
                      const createdDate = session.created_at || session.started_at
                        ? new Date(session.created_at || session.started_at!).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '02 Oct 2026'

                      let resultTag = { label: 'PENDING', class: 'pending' }
                      if (session.status === 'approved' || session.status === 'completed') {
                        resultTag = { label: 'PASS', class: 'pass' }
                      } else if (session.status === 'rejected' || session.status === 'failed') {
                        resultTag = { label: 'FAIL', class: 'fail' }
                      } else if (session.status === 'submitted' || session.status === 'under_review') {
                        resultTag = { label: 'REVIEW', class: 'review' }
                      }

                      return (
                        <tr key={session.id} className="sih-repo-row">
                          <td className="sih-repo-cell-report">
                            <strong className="repo-report-num font-mono">{reportId}</strong>
                            <small className="repo-session-id font-mono">ID: {session.session_number || session.id}</small>
                          </td>

                          <td className="sih-repo-cell-inst">
                            <strong className="repo-inst-name">{instName}</strong>
                            <small className="repo-inst-type">{session.test_type || session.verification_stage || 'Initial Verification'}</small>
                          </td>

                          <td className="sih-repo-cell-serial font-mono">
                            {instSerial}
                          </td>

                          <td className="sih-repo-cell-date">
                            {createdDate}
                          </td>

                          <td className="sih-repo-cell-result">
                            <span className={`sih-result-pill ${resultTag.class}`}>
                              {resultTag.label}
                            </span>
                          </td>

                          <td className="sih-repo-cell-status">
                            <span className={`sih-status-pill ${String(session.status || 'draft').toLowerCase().replace(/\s+/g, '_')}`}>
                              {(session.status || 'draft').toUpperCase().replace(/_/g, ' ')}
                            </span>
                          </td>

                          <td className="sih-repo-cell-actions" style={{ textAlign: 'right' }}>
                            <div className="sih-repo-actions-group">
                              <button
                                type="button"
                                className="sih-repo-action-btn view"
                                onClick={() => {
                                  setSelectedSessionId(session.id)
                                  setShowReportDetail(true)
                                }}
                                title="View report preview & compliance details"
                              >
                                View
                              </button>

                              <button
                                type="button"
                                className="sih-repo-action-btn pdf"
                                disabled={busySessionId === session.id}
                                onClick={() => handleDownloadReport(session.id)}
                                title="Download PDF document"
                              >
                                {busySessionId === session.id ? '...' : 'PDF'}
                              </button>

                              <button
                                type="button"
                                className="sih-repo-action-btn docx"
                                disabled={busySessionId === session.id}
                                onClick={() => handleDownloadDocxReport(session.id)}
                                title="Download DOCX document"
                              >
                                DOCX
                              </button>

                              {(session.status === 'draft' ||
                                session.status === 'in_progress' ||
                                session.status === 'rejected') && (
                                <button
                                  type="button"
                                  className="sih-repo-action-btn workflow"
                                  disabled={busySessionId === session.id}
                                  onClick={() => handleSessionWorkflow(session, 'submit')}
                                >
                                  Submit
                                </button>
                              )}

                              {session.status === 'submitted' && (
                                <button
                                  type="button"
                                  className="sih-repo-action-btn workflow"
                                  disabled={busySessionId === session.id}
                                  onClick={() => handleSessionWorkflow(session, 'review')}
                                >
                                  Review
                                </button>
                              )}

                              {session.status === 'under_review' && (
                                <>
                                  <button
                                    type="button"
                                    className="sih-repo-action-btn approve"
                                    disabled={busySessionId === session.id}
                                    onClick={() => handleSessionWorkflow(session, 'approve')}
                                  >
                                    Approve
                                  </button>
                                  <button
                                    type="button"
                                    className="sih-repo-action-btn reject"
                                    disabled={busySessionId === session.id}
                                    onClick={() => handleSessionWorkflow(session, 'reject')}
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      {previewPdfUrl && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="PDF preview"
          className="sih-pdf-modal-overlay"
          onClick={closePdfPreview}
        >
          <div
            className="sih-pdf-modal-container"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sih-pdf-modal-header">
              <div className="sih-pdf-modal-title-group">
                <span className="sih-pdf-badge font-mono">PDF</span>
                <div>
                  <strong className="sih-pdf-modal-title">OIMLense — PDF Report Preview</strong>
                  <span className="sih-pdf-modal-sub">
                    {selectedSession?.session_number || 'Verification Report'} · OIML R 76-1:2006
                  </span>
                </div>
              </div>

              <div className="sih-pdf-modal-actions">
                {selectedSessionId && (
                  <>
                    <button
                      type="button"
                      className="sih-pdf-action-btn secondary"
                      onClick={() => handleDownloadReport(selectedSessionId)}
                    >
                      Download PDF
                    </button>
                    <button
                      type="button"
                      className="sih-pdf-action-btn secondary"
                      onClick={() => handleDownloadDocxReport(selectedSessionId)}
                    >
                      Download DOCX
                    </button>
                  </>
                )}
                <button
                  type="button"
                  className="sih-pdf-action-btn close"
                  onClick={closePdfPreview}
                >
                  Close ×
                </button>
              </div>
            </div>

            <iframe
              title="OIMLense PDF Preview"
              src={previewPdfUrl}
              className="sih-pdf-iframe"
            />
          </div>
        </div>
      )}

      </main>
    </div>
  )


}
