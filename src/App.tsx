import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { isStaff, AuthProvider, useAuth } from './lib/authContext'
import { AdminPage } from './pages/AdminPage'
import { HelpPage } from './pages/HelpPage'
import { HistoryPage } from './pages/HistoryPage'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { ReportPage } from './pages/ReportPage'
import { ReportsDashboardPage } from './pages/ReportsDashboardPage'
import { SetupPage } from './pages/SetupPage'
import { UsersPage } from './pages/UsersPage'

function RequireAuth() {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) {
    return (
      <div className="login-page">
        <p className="muted">در حال بررسی نشست…</p>
      </div>
    )
  }
  if (!user) {
    return (
      <Navigate to="/login" replace state={{ from: location.pathname }} />
    )
  }
  return <Outlet />
}

function RequireAdmin() {
  const { user } = useAuth()
  if (!isStaff(user?.role)) {
    return <Navigate to="/" replace />
  }
  return <Outlet />
}

export default function App() {
  const basename =
    import.meta.env.BASE_URL.replace(/\/+$/, '') || undefined

  return (
    <AuthProvider>
      <BrowserRouter basename={basename}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<RequireAuth />}>
            <Route element={<AppShell />}>
              <Route index element={<HomePage />} />
              <Route path="setup/:typeId" element={<SetupPage />} />
              <Route
                path="report/:typeId/:branchId"
                element={<ReportPage />}
              />
              <Route path="history" element={<HistoryPage />} />
              <Route path="help" element={<HelpPage />} />
              <Route element={<RequireAdmin />}>
                <Route path="admin" element={<AdminPage />} />
                <Route path="reports-admin" element={<ReportsDashboardPage />} />
                <Route path="users" element={<UsersPage />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
