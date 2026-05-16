'use client'

import { useState, useEffect, useCallback, Component, type ReactNode, type ErrorInfo } from 'react'
import { Loader2 } from 'lucide-react'
import type { PageName } from '@/components/app-sidebar'
import type { SessionData } from '@/components/login-form'

import LoginForm from '@/components/login-form'
import AppSidebar from '@/components/app-sidebar'
import SuperAdminDashboard from '@/components/super-admin-dashboard'
import SuperAdminCentres from '@/components/super-admin-centres'
import CentreDashboard from '@/components/centre-dashboard'
import StudentsPage from '@/components/students-page'
import TeachersPage from '@/components/teachers-page'
import GroupsPage from '@/components/groups-page'
import PaymentsPage from '@/components/payments-page'
import SettingsPage from '@/components/settings-page'

// Error boundary to prevent the whole app from crashing
class ErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Page error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }
    return this.props.children
  }
}

export default function Home() {
  const [session, setSession] = useState<SessionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState<PageName>('login')

  const checkSession = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/session', {
        credentials: 'include',
      })
      if (res.ok) {
        const data = await res.json()
        if (data?.user) {
          setSession(data)
          setCurrentPage(data.user.role === 'SUPER_ADMIN' ? 'super-admin' : 'dashboard')
        }
      }
    } catch (err) {
      console.error('Failed to check session:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    checkSession()
  }, [checkSession])

  const handleLogin = (newSession: SessionData) => {
    setSession(newSession)
    setCurrentPage(newSession.user.role === 'SUPER_ADMIN' ? 'super-admin' : 'dashboard')
  }

  const handleLogout = async () => {
    try {
      // Get CSRF token for signout
      const csrfRes = await fetch('/api/auth/csrf', { credentials: 'include' })
      if (csrfRes.ok) {
        const { csrfToken } = await csrfRes.json()
        await fetch('/api/auth/signout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ csrfToken }),
          credentials: 'include',
        })
      }
    } catch {
      // Ignore errors
    }
    setSession(null)
    setCurrentPage('login')
  }

  const handleNavigate = (page: string) => {
    setCurrentPage(page as PageName)
  }

  // Loading screen
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-amber-50/30 to-emerald-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  // Login screen
  if (!session) {
    return <LoginForm onLogin={handleLogin} />
  }

  // Authenticated app
  const user = session.user
  const isSuperAdmin = user.role === 'SUPER_ADMIN'

  const renderPage = () => {
    try {
      switch (currentPage) {
        case 'super-admin':
          return <SuperAdminDashboard onNavigate={handleNavigate} />
        case 'super-admin-centres':
          return <SuperAdminCentres />
        case 'dashboard':
          return <CentreDashboard centreId={user.centreId || ''} />
        case 'students':
          return <StudentsPage />
        case 'teachers':
          return <TeachersPage />
        case 'groups':
          return <GroupsPage />
        case 'payments':
          return <PaymentsPage />
        case 'settings':
          return (
            <SettingsPage
              centreId={user.centreId || ''}
              user={{
                name: user.name,
                email: user.email,
                centreName: user.centreName || null,
              }}
            />
          )
        default:
          return null
      }
    } catch (error) {
      console.error('Error rendering page:', error)
      return (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <p>حدث خطأ في تحميل هذه الصفحة</p>
        </div>
      )
    }
  }

  const errorFallback = (
    <div className="flex items-center justify-center py-20">
      <div className="text-center space-y-3">
        <p className="text-muted-foreground">حدث خطأ غير متوقع</p>
        <button
          onClick={() => window.location.reload()}
          className="text-primary text-sm underline"
        >
          إعادة تحميل الصفحة
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar */}
        <ErrorBoundary fallback={<div />}>
          <AppSidebar
            currentPage={currentPage}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
            user={{
              name: user.name,
              email: user.email,
              role: user.role,
              centreName: user.centreName || null,
            }}
          />
        </ErrorBoundary>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            <ErrorBoundary fallback={errorFallback}>
              {renderPage()}
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  )
}
