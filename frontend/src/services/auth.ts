import type { User } from '../types/auth'

const API = '/api'

/** Check if there's an active session. Returns null if not authenticated. */
export async function getMe(): Promise<User | null> {
  try {
    const res = await fetch(`${API}/me`, { credentials: 'include' })
    if (!res.ok) return null
    return (await res.json()) as User
  } catch {
    return null
  }
}

export interface LoginInput {
  officer_id?: string
  email?: string
  password: string
}

export interface RegisterInput {
  full_name: string
  officer_id: string
  email: string
  password: string
  confirm_password: string
  department: string
  role: string
}

export interface AuthSuccess {
  success: true
  email: string
  officer_id?: string
}

export interface AuthNotice {
  notice: string
}

export interface AuthError {
  error: string
}

export type LoginResult = AuthSuccess | AuthError
export type RegisterResult = AuthSuccess | AuthNotice | AuthError

/** Login with officer ID + password. */
export async function login(input: LoginInput): Promise<LoginResult> {
  const maxRetries = 2
  const retryDelay = 2000

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(`${API}/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })

      const data = await res.json().catch(() => null)

      // Retry temporary server/proxy errors during Render cold starts.
      if (
        (res.status === 502 || res.status === 503 || res.status === 504) &&
        attempt < maxRetries
      ) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay))
        continue
      }

      if (!res.ok) {
        return {
          error:
            data?.error ||
            data?.detail ||
            data?.message ||
            (res.status === 502 || res.status === 503 || res.status === 504
              ? 'The OIMLense server is starting up. Please try again in a few seconds.'
              : `Login failed (${res.status}). Please try again.`),
        }
      }

      return data as LoginResult
    } catch (err: any) {
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay))
        continue
      }

      return {
        error:
          'Unable to connect to the OIMLense server. Please try again in a few seconds.',
      }
    }
  }

  return {
    error: 'The OIMLense server is temporarily unavailable. Please try again.',
  }
}
/** Register a new account. */
export async function register(input: RegisterInput): Promise<RegisterResult> {
  try {
    const res = await fetch(`${API}/register`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    const data = await res.json().catch(() => null)
    if (!res.ok) {
      return {
        error:
          data?.error ||
          data?.detail ||
          data?.message ||
          `Registration failed (${res.status}). Please try again.`,
      }
    }
    return data as RegisterResult
  } catch (err: any) {
    return {
      error:
        err?.message ||
        'Unable to connect to authentication server. Please check your connection.',
    }
  }
}

/** Log out. Clears session cookies. */
export async function logout(): Promise<void> {
  try {
    await fetch(`${API}/logout`, {
      method: 'POST',
      credentials: 'include',
    })
  } catch {
    // Ignore logout network errors
  }
}

export interface ForgotPasswordResult {
  success?: boolean
  message?: string
  error?: string
}

/** Request password reset link for an Officer ID. */
export async function forgotPassword(officer_id: string): Promise<ForgotPasswordResult> {
  try {
    const res = await fetch(`${API}/forgot-password`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ officer_id }),
    })
    const data = await res.json().catch(() => null)
    if (!res.ok) {
      return {
        error:
          data?.error ||
          data?.detail ||
          data?.message ||
          `Password reset request failed (${res.status}). Please try again.`,
      }
    }
    return data as ForgotPasswordResult
  } catch (err: any) {
    return {
      error:
        err?.message ||
        'Unable to connect to authentication server. Please check your connection.',
    }
  }
}
