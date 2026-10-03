import { useEffect, useState } from 'react'

import { AuthModal } from './components/auth/AuthModal'
import { SIH26035DashboardPage } from './pages/SIH26035DashboardPage'
import { SIH26035LandingPage } from './pages/SIH26035LandingPage'
import { R76VerificationPage } from './pages/R76VerificationPage'
import { getMe } from './services/auth'
import type { AuthMode, User } from './types/auth'

function App() {
  const [mode, setMode] = useState<'landing' | 'auth' | 'workspace' | 'verification'>('landing')
  const [authInitialMode, setAuthInitialMode] = useState<AuthMode>('login')
  const [user, setUser] = useState<User | null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const verificationMatch = window.location.pathname.match(/^\/verify\/([^/]+)\/?$/)
  const verificationReportId = verificationMatch ? decodeURIComponent(verificationMatch[1]) : ''

  useEffect(() => {
    if (verificationReportId) {
      document.title = 'OIMLense — Report Verification'
      setMode('verification')
      setAuthChecked(true)
      return
    }

    document.title = 'OIMLense — SIH26035'

    getMe().then((u) => {
      setUser(u)
      setAuthChecked(true)

      const params = new URLSearchParams(window.location.search)
      const qMode = params.get('mode')
      const path = window.location.pathname

      if (qMode === 'forgot' || qMode === 'login' || qMode === 'register') {
        setAuthInitialMode(qMode as AuthMode)
        setMode('auth')
        return
      }

      // Restore the correct application surface after a browser refresh.
      // Protected workspace pages require an authenticated user.
      if (u && (
        path === '/dashboard' ||
        path === '/instruments' ||
        path === '/sessions' ||
        path === '/tests' ||
        path === '/history' ||
        path === '/reports'
      )) {
        setMode('workspace')
      } else {
        setMode('landing')
      }
    })
  }, [])

  function startWorkspaceTransition(targetUser: User) {
    setUser(targetUser)
    setMode('workspace')

    const currentPath = window.location.pathname
    const workspacePaths = [
      '/dashboard',
      '/instruments',
      '/sessions',
      '/tests',
      '/history',
      '/reports',
    ]

    if (!workspacePaths.includes(currentPath)) {
      window.history.replaceState({}, '', '/dashboard')
    }

    window.scrollTo(0, 0)
  }

  function openLogin() {
    if (user) {
      startWorkspaceTransition(user)
      return
    }

    setAuthInitialMode('login')
    setMode('auth')
    window.scrollTo(0, 0)
  }

  function handleAuthSuccess(loggedInUser: User) {
    startWorkspaceTransition(loggedInUser)
  }

  function handleLogout() {
    setUser(null)
    setMode('landing')
    window.scrollTo(0, 0)
  }

  // The public landing page does not need to wait for authentication.
  // This prevents a loading/blank transition when refreshing `/`.
  if (!authChecked && window.location.pathname === '/') {
    return (
      <SIH26035LandingPage
        onLogin={() => {
          setAuthInitialMode('login')
          setMode('auth')
        }}
        onStartTesting={() => {
          setAuthInitialMode('login')
          setMode('auth')
        }}
      />
    )
  }

  if (!authChecked) {
    return null
  }

  if (mode === 'verification' && verificationReportId) {
    return <R76VerificationPage reportId={verificationReportId} />
  }

  return (
    <>
      {mode === 'landing' && (
        <SIH26035LandingPage
          onLogin={openLogin}
          onStartTesting={openLogin}
        />
      )}

      {mode === 'auth' && (
        <AuthModal
          initialMode={authInitialMode}
          onSuccess={handleAuthSuccess}
          onClose={() => {
            setMode(user ? 'workspace' : 'landing')
          }}
        />
      )}

      {mode === 'workspace' && user && (
        <SIH26035DashboardPage
          user={user}
          onLogout={handleLogout}
          onGoToLanding={() => {
            setMode('landing')
            window.history.pushState({}, '', '/')
            window.scrollTo(0, 0)
          }}
        />
      )}
    </>
  )
}

export default App
