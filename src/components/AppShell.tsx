import { useEffect, useMemo, useState } from 'react'
import { Link as RouterLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useTheme as useMuiTheme } from '@mui/material/styles'
import {
  AppBar,
  Box,
  Button,
  Chip,
  IconButton,
  Navigation,
  Typography,
  LogoutBulk,
  HomeBulk,
  ChartBulk,
  InfoCircleOutline,
  Setting2Bulk,
  UserBulk,
  ClipboardTextBulk,
} from '@smartx/design-system'
import { isStaff, roleLabel, useAuth } from '../lib/authContext'
import { formatJalaliLong, todayJalali } from '../lib/jalali'

function titleFor(pathname: string) {
  if (pathname.startsWith('/users')) return 'مدیریت کاربران'
  if (pathname.startsWith('/reports')) return 'صندوق گزارش‌ها'
  if (pathname.startsWith('/feedback/new')) return 'ثبت پیشنهاد'
  if (pathname.match(/^\/feedback\/[^/]+$/)) return 'جزئیات پیشنهاد'
  if (pathname.startsWith('/feedback')) return 'صندوق پیشنهادات'
  if (pathname.startsWith('/profile')) return 'حساب من'
  if (pathname.startsWith('/admin')) return 'تنظیمات انواع بررسی'
  if (pathname.startsWith('/history')) return 'گزارش‌های این مرورگر'
  if (pathname.startsWith('/help')) return 'راهنمای استفاده'
  if (pathname.startsWith('/setup')) return 'تنظیم بررسی'
  if (pathname.startsWith('/report')) return 'گزارش تجربه مشتری'
  return 'نمای کلی بررسی'
}

function subtitleFor(pathname: string) {
  if (pathname.startsWith('/report')) {
    return 'نمایی سریع از وضعیت عملکرد و بازخورد مشتریان'
  }
  if (pathname.startsWith('/admin')) {
    return 'ویژگی‌ها، آستانه‌ها و قالب پیام روی سرور'
  }
  if (pathname.startsWith('/reports')) {
    return 'همه گزارش‌های تیم · فیلتر کاربر و مرحله'
  }
  if (pathname.startsWith('/feedback')) {
    return 'لیست مشترک تیم · جزئیات، کامنت و ویرایش'
  }
  if (pathname.startsWith('/history')) {
    return 'گزارش‌های ذخیره‌شده روی این مرورگر'
  }
  return 'پنل کنترل کیفیت اسمارت · دیدبان'
}

function activeId(pathname: string) {
  if (pathname.startsWith('/reports')) return 'reports'
  if (pathname.startsWith('/feedback')) return 'feedback'
  if (pathname.startsWith('/profile')) return 'profile'
  if (pathname.startsWith('/help')) return 'help'
  if (pathname.startsWith('/admin')) return 'admin'
  if (pathname.startsWith('/users')) return 'users'
  if (pathname.startsWith('/setup') || pathname.startsWith('/report')) return 'home'
  return 'home'
}

export function AppShell() {
  const theme = useMuiTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [navOpen, setNavOpen] = useState(false)
  const iconColor = theme.palette.primary.main
  const pageBg =
    (theme.palette as { surfaceDim?: string }).surfaceDim ||
    theme.palette.grey[100]

  useEffect(() => {
    setNavOpen(false)
  }, [location.pathname])

  const title = useMemo(() => titleFor(location.pathname), [location.pathname])
  const subtitle = useMemo(
    () => subtitleFor(location.pathname),
    [location.pathname],
  )

  const navigationItems = useMemo(() => {
    const items = [
      {
        id: 'home',
        label: 'بررسی جدید',
        href: '/',
        icon: <HomeBulk size={22} color={iconColor} />,
      },
      {
        id: 'reports',
        label: 'گزارش‌ها',
        href: '/reports',
        icon: <ChartBulk size={22} color={iconColor} />,
      },
      {
        id: 'feedback',
        label: 'پیشنهادات',
        href: '/feedback',
        icon: <ClipboardTextBulk size={22} color={iconColor} />,
      },
      {
        id: 'help',
        label: 'راهنما',
        href: '/help',
        icon: <InfoCircleOutline size={22} color={iconColor} />,
      },
      {
        id: 'profile',
        label: 'حساب من',
        href: '/profile',
        icon: <UserBulk size={22} color={iconColor} />,
      },
    ]
    if (isStaff(user?.role)) {
      items.push(
        {
          id: 'admin',
          label: 'تنظیمات بررسی',
          href: '/admin',
          icon: <Setting2Bulk size={22} color={iconColor} />,
        },
        {
          id: 'users',
          label: 'کاربران',
          href: '/users',
          icon: <UserBulk size={22} color={iconColor} />,
        },
      )
    }
    return items
  }, [user?.role, iconColor])

  const onLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const onItemClick = (itemId: string) => {
    const item = navigationItems.find((i) => i.id === itemId)
    if (item?.href) navigate(item.href)
    setNavOpen(false)
  }

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        bgcolor: pageBg,
      }}
    >
      <Navigation
        open={navOpen}
        onClose={() => setNavOpen(false)}
        activeItem={activeId(location.pathname)}
        onItemClick={onItemClick}
        navigationItems={navigationItems}
        linkComponent={RouterLink}
        title="دیدبان"
        headerSection={(collapsed) =>
          collapsed ? null : (
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography variant="titleMedium" color="primary">
                دیدبان
              </Typography>
              <Typography variant="bodySmall" color="text.secondary">
                صدای مشتری
              </Typography>
            </Box>
          )
        }
        showHelpCenterBanner={false}
      />

      <Box
        component="main"
        sx={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          px: { xs: 1.5, md: 3 },
          py: { xs: 1.5, md: 2 },
          gap: 2,
        }}
      >
        <AppBar
          leftSection={
            <Box>
              <Typography variant="headlineSmall" component="h1">
                {title}
              </Typography>
              <Typography variant="bodySmall" color="text.secondary">
                {subtitle}
              </Typography>
            </Box>
          }
          rightSection={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography
                variant="labelMedium"
                color="text.secondary"
                sx={{ display: { xs: 'none', sm: 'block' } }}
              >
                {formatJalaliLong(todayJalali())}
              </Typography>
              {location.pathname.startsWith('/report') ? (
                <Chip label="گزارش زنده" color="primary" size="small" />
              ) : null}
              <Chip
                size="small"
                variant="outlined"
                label={roleLabel(user?.role)}
                icon={<UserBulk size={16} color={iconColor} />}
              />
              <IconButton
                aria-label="خروج"
                onClick={() => void onLogout()}
                buttonSize="small"
                buttonVariant="text"
              >
                <LogoutBulk size={20} color={theme.palette.text.secondary} />
              </IconButton>
            </Box>
          }
        />

        <Box
          sx={{
            flex: 1,
            bgcolor: 'background.paper',
            borderRadius: 3,
            p: { xs: 2, md: 3 },
            boxShadow: 1,
            minHeight: 0,
          }}
        >
          <Outlet />
        </Box>

        <Box
          sx={{
            display: { xs: 'flex', md: 'none' },
            justifyContent: 'center',
            pb: 1,
          }}
        >
          <Button buttonVariant="tonal" onClick={() => setNavOpen(true)}>
            منو
          </Button>
        </Box>
      </Box>
    </Box>
  )
}
