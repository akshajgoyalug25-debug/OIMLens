export interface R76Instrument {
  id: string
  manufacturer: string
  model: string
  serial_number?: string
  instrument_type?: string
  accuracy_class?: string
  indication_type?: string
  weighing_principle?: string
  max_capacity?: number
  min_capacity?: number
  e?: number
  d?: number
  n?: number
  tare_type?: string
  unit?: string
  type_approval_number?: string
  software_version?: string
  year_of_manufacture?: number
  markings?: string
  documentation_reference?: string
  remarks?: string
}

export interface R76TestDefinition {
  id: string
  test_code: string
  test_name: string
  description?: string
  applicable_accuracy_classes?: string[]
  applicable_instrument_types?: string[]
  source_document?: string
  source_clause?: string
  report_standard?: string
  report_section?: string
  rule_version?: string
  enabled?: boolean
}

export interface R76TestSession {
  id: string
  instrument_id: string
  officer_id?: string
  session_number?: string
  test_type?: string
  verification_stage?: string
  test_location?: string
  status?: string
  final_result?: boolean | null
  report_id?: string | null
  created_at?: string
  updated_at?: string
  started_at?: string
  completed_at?: string
}

export interface R76TestResult {
  id: string
  test_session_id: string
  test_definition_id: string
  result_status?: string
  calculated_values?: Record<string, unknown>
  mpe_value?: number
  measured_error?: number
  uncertainty?: number
  pass_fail?: boolean
  failure_reason?: string
  rule_id?: string
  source_document?: string
  source_clause?: string
  rule_version?: string
  calculation_trace?: Record<string, unknown>
}

async function readBody(response: Response): Promise<unknown> {
  const text = await response.text()

  if (!text) return null

  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

async function request<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })

  const body = await readBody(response)

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`

    if (body && typeof body === 'object') {
      const data = body as Record<string, unknown>

      if (typeof data.detail === 'string') {
        message = data.detail
      } else if (typeof data.error === 'string') {
        message = data.error
      }
    }

    throw new Error(message)
  }

  return body as T
}

function numberValue(
  object: Record<string, unknown>,
  ...keys: string[]
): number | undefined {
  for (const key of keys) {
    const value = object[key]

    if (typeof value === 'number' && Number.isFinite(value)) {
      return value
    }

    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = Number(value)

      if (Number.isFinite(parsed)) {
        return parsed
      }
    }
  }

  return undefined
}

function stringValue(
  object: Record<string, unknown>,
  ...keys: string[]
): string | undefined {
  for (const key of keys) {
    const value = object[key]

    if (typeof value === 'string' && value.trim() !== '') {
      return value
    }
  }

  return undefined
}

function normalizeInstrument(
  raw: Record<string, unknown>,
): R76Instrument {
  const max = numberValue(
    raw,
    'max_capacity',
    'max',
    'maximum_capacity',
  )

  const min = numberValue(
    raw,
    'min_capacity',
    'min',
    'minimum_capacity',
  )

  const e = numberValue(
    raw,
    'e',
    'scale_interval_e',
    'verification_scale_interval_e',
    'verification_scale_interval',
    'verification_interval',
  )

  const d = numberValue(
    raw,
    'd',
    'scale_interval_d',
    'actual_scale_interval_d',
    'actual_scale_interval',
    'display_scale_interval',
  )

  let n = numberValue(
    raw,
    'n',
    'number_of_verification_scale_intervals_n',
    'number_of_intervals',
    'number_of_verification_intervals',
  )

  if (
    n === undefined &&
    max !== undefined &&
    e !== undefined &&
    e > 0
  ) {
    n = max / e
  }

  return {
    id: String(raw.id ?? ''),
    manufacturer: String(raw.manufacturer ?? ''),
    model: String(raw.model ?? ''),
    serial_number: stringValue(
      raw,
      'serial_number',
      'serial',
    ),
    instrument_type: stringValue(
      raw,
      'instrument_type',
      'type',
    ),
    accuracy_class: stringValue(
      raw,
      'accuracy_class',
      'class',
    ),
    indication_type: stringValue(
      raw,
      'indication_type',
      'indication',
    ),
    weighing_principle: stringValue(
      raw,
      'weighing_principle',
      'principle',
    ),
    max_capacity: max,
    min_capacity: min,
    e,
    d,
    n,
    tare_type: stringValue(
      raw,
      'tare_type',
      'tare',
    ),
    unit: stringValue(raw, 'unit'),
    type_approval_number: stringValue(
      raw,
      'type_approval_number',
      'type_approval',
    ),
    software_version: stringValue(
      raw,
      'software_version',
    ),
    year_of_manufacture: numberValue(
      raw,
      'year_of_manufacture',
      'manufacturing_year',
    ),
    markings: stringValue(raw, 'markings'),
    documentation_reference: stringValue(
      raw,
      'documentation_reference',
      'document_reference',
    ),
    remarks: stringValue(raw, 'remarks'),
  }
}



export interface R76VerificationResponse {
  success: boolean
  verified: boolean
  report: {
    report_id?: string
    session_number?: string
    test_type?: string
    status?: string
    final_result?: boolean | null
    created_at?: string
    instrument?: {
      instrument_type?: string
      manufacturer?: string
      model?: string
      serial_number?: string
    }
  }
}

export async function verifyR76Report(
  reportId: string,
): Promise<R76VerificationResponse> {
  return request<R76VerificationResponse>(
    `/api/r76/verify/${encodeURIComponent(reportId)}`,
  )
}
export async function getR76Health() {
  return request<{
    status: string
    standard?: string
  }>('/api/r76/health')
}

export async function getR76Instruments(): Promise<R76Instrument[]> {
  const body = await request<{
    success?: boolean
    items?: Record<string, unknown>[]
  }>('/api/r76/instruments')

  return (body.items || []).map(normalizeInstrument)
}

export async function createR76Instrument(
  instrument: Record<string, unknown>,
): Promise<R76Instrument> {
  const body = await request<{
    success?: boolean
    item?: Record<string, unknown>
    instrument?: Record<string, unknown>
  }>('/api/r76/instruments', {
    method: 'POST',
    body: JSON.stringify(instrument),
  })

  const rawItem = body.item || body.instrument
  if (!rawItem) {
    throw new Error('Instrument was not returned by the server.')
  }

  return normalizeInstrument(rawItem)
}

export interface R76TestPlanItem {
  test_code: string
  test_name: string
  category?: string
  source_clause?: string
  report_clause?: string
  source_document?: string
  status: 'required' | 'conditional' | 'review_required' | 'not_applicable'
  reason?: string
}

export interface R76TestPlan {
  standard: string
  report_standard: string
  instrument: {
    manufacturer?: string
    model?: string
    serial_number?: string
    instrument_type?: string
    accuracy_class?: string
    indication_type?: string
    max_capacity?: number
    min_capacity?: number
    e?: number
    d?: number
  }
  counts: {
    required: number
    conditional: number
    review_required: number
    not_applicable: number
  }
  tests: R76TestPlanItem[]
}

export async function getR76InstrumentTestPlan(
  instrumentId: string,
): Promise<R76TestPlan> {
  const body = await request<{
    success?: boolean
    instrument_id?: string
    plan?: R76TestPlan
  }>(`/api/r76/instruments/${encodeURIComponent(instrumentId)}/test-plan`)

  if (!body.plan) {
    throw new Error('Test plan was not returned by the server.')
  }

  return body.plan
}

export async function getR76TestDefinitions(): Promise<R76TestDefinition[]> {
  const body = await request<{
    success?: boolean
    items?: R76TestDefinition[]
  }>('/api/r76/test-definitions')

  return body.items || []
}

export async function getR76TestSessions(
  filters?: {
    search?: string
    status?: string
    test_type?: string
  },
): Promise<R76TestSession[]> {
  const params = new URLSearchParams()

  if (filters?.search?.trim()) {
    params.set('search', filters.search.trim())
  }

  if (filters?.status?.trim()) {
    params.set('status', filters.status.trim())
  }

  if (filters?.test_type?.trim()) {
    params.set('test_type', filters.test_type.trim())
  }

  const query = params.toString()

  const body = await request<{
    success?: boolean
    items?: R76TestSession[]
  }>(`/api/r76/test-sessions${query ? `?${query}` : ''}`)

  return body.items || []
}

export async function createR76TestSession(
  session: Record<string, unknown>,
): Promise<R76TestSession> {
  const body = await request<{
    success?: boolean
    item?: R76TestSession
    session?: R76TestSession
  }>('/api/r76/test-sessions', {
    method: 'POST',
    body: JSON.stringify(session),
  })

  const created = body.item || body.session
  if (!created) {
    throw new Error('Test session was not returned by the server.')
  }

  return created
}

export async function updateR76Session(
  sessionId: string,
  updates: Record<string, unknown>,
) {
  return request<{
    success?: boolean
    session?: Record<string, unknown>
  }>(`/api/r76/test-sessions/${sessionId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  })
}

export async function addR76Environment(
  sessionId: string,
  environment: Record<string, unknown>,
) {
  return request<{
    success?: boolean
    item?: Record<string, unknown>
  }>(`/api/r76/test-sessions/${sessionId}/environment`, {
    method: 'POST',
    body: JSON.stringify(environment),
  })
}

export async function createR76Equipment(
  equipment: Record<string, unknown>,
) {
  return request<{
    success?: boolean
    item?: Record<string, unknown>
  }>('/api/r76/equipment', {
    method: 'POST',
    body: JSON.stringify(equipment),
  })
}

export async function attachR76Equipment(
  sessionId: string,
  equipmentId: string,
  purpose?: string,
) {
  return request<{
    success?: boolean
    item?: Record<string, unknown>
  }>(`/api/r76/test-sessions/${sessionId}/equipment`, {
    method: 'POST',
    body: JSON.stringify({
      equipment_id: equipmentId,
      purpose,
    }),
  })
}

export async function createR76Observation(
  sessionId: string,
  observation: Record<string, unknown>,
) {
  return request<{
    success?: boolean
    item?: Record<string, unknown>
  }>(`/api/r76/test-sessions/${sessionId}/observations`, {
    method: 'POST',
    body: JSON.stringify(observation),
  })
}

export async function getR76Observations(sessionId: string) {
  const body = await request<{
    success?: boolean
    items?: Record<string, unknown>[]
  }>(`/api/r76/test-sessions/${sessionId}/observations`)

  return body.items || []
}

export async function executeR76Test(
  sessionId: string,
  testCode: string,
  inputs: Record<string, unknown>,
) {
  return request<{
    success: boolean
    test: Record<string, unknown>
    result: Record<string, unknown>
    stored_result: R76TestResult
  }>(`/api/r76/test-sessions/${sessionId}/execute`, {
    method: 'POST',
    body: JSON.stringify({
      test_code: testCode,
      inputs,
    }),
  })
}

export async function getR76Results(
  sessionId: string,
): Promise<R76TestResult[]> {
  const body = await request<{
    success?: boolean
    items?: R76TestResult[]
  }>(`/api/r76/test-sessions/${sessionId}/results`)

  return body.items || []
}

export async function downloadR76Report(
  sessionId: string,
): Promise<Blob> {
  const response = await fetch(
    `/api/r76/test-sessions/${sessionId}/report`,
    {
      method: 'GET',
      credentials: 'include',
    },
  )

  if (!response.ok) {
    const text = await response.text()

    let message = `Report generation failed (${response.status})`

    try {
      const data = JSON.parse(text)

      if (typeof data.detail === 'string') {
        message = data.detail
      }
    } catch {
      if (text) {
        message = text
      }
    }

    throw new Error(message)
  }

  return response.blob()
}

export async function downloadR76DocxReport(
  sessionId: string,
): Promise<Blob> {
  const response = await fetch(
    `/api/r76/test-sessions/${sessionId}/report-docx`,
    {
      method: 'GET',
      credentials: 'include',
    },
  )

  if (!response.ok) {
    const text = await response.text()

    let message = `DOCX report generation failed (${response.status})`

    try {
      const data = JSON.parse(text)

      if (typeof data.detail === 'string') {
        message = data.detail
      }
    } catch {
      if (text) {
        message = text
      }
    }

    throw new Error(message)
  }

  return response.blob()
}
