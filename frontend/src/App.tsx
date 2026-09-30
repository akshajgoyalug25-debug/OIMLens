import { useEffect, useState } from 'react'

import { AuthModal } from './components/auth/AuthModal'
import { SIH26035DashboardPage } from './pages/SIH26035DashboardPage'
import { SIH26035LandingPage } from './pages/SIH26035LandingPage'
import { R76VerificationPage } from './pages/R76VerificationPage'
import { getMe } from './services/auth'
import { useI18n } from './i18n/I18nContext'
import type { AuthMode, User } from './types/auth'

function App() {
  const { language, setLanguage } = useI18n()

  const [mode, setMode] = useState<'landing' | 'auth' | 'workspace' | 'verification'>('landing')
  const [authInitialMode, setAuthInitialMode] = useState<AuthMode>('login')
  const [user, setUser] = useState<User | null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

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

      if (qMode === 'forgot' || qMode === 'login' || qMode === 'register') {
        setAuthInitialMode(qMode as AuthMode)
        setMode('auth')
      } else {
        setMode('landing')
      }
    })
  }, [])

  function startWorkspaceTransition(targetUser: User) {
    setUser(targetUser)
    setMode('workspace')
    window.history.replaceState({}, '', window.location.pathname)
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

  if (!authChecked) {
    return null
  }

  if (mode === 'verification' && verificationReportId) {
    return <R76VerificationPage reportId={verificationReportId} />
  }

  return (
    <>
      <div
        className={`global-language-switcher ${scrolled ? 'scrolled' : ''}`}
        aria-label="Language"
      >
        <button
          type="button"
          className={language === 'en' ? 'active' : ''}
          onClick={() => setLanguage('en')}
        >
          EN
        </button>

        <button
          type="button"
          className={language === 'hi' ? 'active' : ''}
          onClick={() => setLanguage('hi')}
        >
          हिन्दी
        </button>
      </div>

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
            window.scrollTo(0, 0)
          }}
        />
      )}
    </>
  )
}

export default App
