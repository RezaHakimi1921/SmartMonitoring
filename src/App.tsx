import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom'
import { Box, LoadingSpinner, Typography } from '@smartx/design-system'
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
import { FeedbackDetailPage } from './pages/FeedbackDetailPage'
import { FeedbackNewPage } from './pages/FeedbackNewPage'
import { FeedbackPage } from './pages/FeedbackPage'
import { ProfilePage } from './pages/ProfilePage'

function RequireAuth() {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          gap: 2,
        }}
      >
        <LoadingSpinner size="medium" />
        <Typography variant="bodyMedium" color="text.secondary">
          در حال بررسی نشست…
        </Typography>
      </Box>
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
              <Route path="reports" element={<ReportsDashboardPage />} />
              <Route
                path="reports-admin"
                element={<Navigate to="/reports" replace />}
              />
              <Route path="feedback" element={<FeedbackPage />} />
              <Route path="feedback/new" element={<FeedbackNewPage />} />
              <Route
                path="feedback/:id/edit"
                element={<FeedbackDetailPage />}
              />
              <Route path="feedback/:id" element={<FeedbackPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route
                path="metric-sources"
                element={<Navigate to="/admin?tab=metrics" replace />}
              />
              <Route path="history" element={<HistoryPage />} />
              <Route path="help" element={<HelpPage />} />
              <Route element={<RequireAdmin />}>
                <Route path="admin" element={<AdminPage />} />
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
