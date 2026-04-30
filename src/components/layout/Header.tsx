import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import InputBase from '@mui/material/InputBase'
import IconButton from '@mui/material/IconButton'
import Box from '@mui/material/Box'
import Avatar from '@mui/material/Avatar'
import MenuIcon from '@mui/icons-material/Menu'
import SearchIcon from '@mui/icons-material/Search'
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined'

const PAGE_TITLES: Record<string, string> = {
  Dashboard: 'Employee Dashboard',
  Expenses: 'Expense Report',
  Reports: 'Reports History',
  Insights: 'Analytics & Insights',
  Settings: 'Admin Settings',
}

interface HeaderProps {
  onMenuToggle: () => void
  isMobile: boolean
  activePage: string
}

export default function Header({ onMenuToggle, isMobile, activePage }: HeaderProps) {
  const pageTitle = PAGE_TITLES[activePage] ?? activePage

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        color: '#0f172a',
        zIndex: (theme) => theme.zIndex.drawer - 1,
      }}
    >
      <Toolbar
        sx={{
          justifyContent: 'space-between',
          minHeight: '56px !important',
          px: { xs: 2, md: 3 },
          gap: 2,
        }}
      >
        {/* ── Left: hamburger (mobile) + page title ─────────────────────── */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
          {isMobile && (
            <IconButton
              size="small"
              onClick={onMenuToggle}
              sx={{ color: '#475569' }}
              aria-label="Open navigation menu"
            >
              <MenuIcon fontSize="small" />
            </IconButton>
          )}
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: '1rem',
              letterSpacing: '-0.01em',
              color: '#0f172a',
              whiteSpace: 'nowrap',
            }}
          >
            {pageTitle}
          </Typography>
        </Box>

        {/* ── Center: search ─────────────────────────────────────────────── */}
        <Box
          sx={{
            display: { xs: 'none', sm: 'flex' },
            alignItems: 'center',
            backgroundColor: '#f1f5f9',
            borderRadius: '8px',
            px: 1.5,
            py: 0.75,
            gap: 1,
            flex: 1,
            maxWidth: 320,
          }}
        >
          <SearchIcon sx={{ fontSize: 16, color: '#94a3b8', flexShrink: 0 }} />
          <InputBase
            placeholder="Find transactions..."
            sx={{ fontSize: '0.8125rem', color: '#475569', flex: 1 }}
            inputProps={{ 'aria-label': 'Search transactions' }}
          />
        </Box>

        {/* ── Right: notification + user profile ────────────────────────── */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
          <IconButton
            size="small"
            sx={{
              color: '#64748b',
              borderRadius: '8px',
              '&:hover': { backgroundColor: '#f1f5f9' },
            }}
            aria-label="Notifications"
          >
            <NotificationsOutlinedIcon sx={{ fontSize: 20 }} />
          </IconButton>

          {/* User profile */}
          <Box
            sx={{
              display: { xs: 'none', sm: 'flex' },
              alignItems: 'center',
              gap: 1,
              ml: 0.5,
              pl: 1.5,
              borderLeft: '1px solid #e2e8f0',
            }}
          >
            <Box sx={{ textAlign: 'right' }}>
              <Typography
                sx={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a', lineHeight: 1.25 }}
              >
                Alex Thompson
              </Typography>
              <Typography sx={{ fontSize: '0.6875rem', color: '#64748b', lineHeight: 1.25 }}>
                Product Designer
              </Typography>
            </Box>
            <Avatar
              sx={{
                width: 32,
                height: 32,
                backgroundColor: '#10b981',
                fontSize: '0.75rem',
                fontWeight: 700,
              }}
            >
              AT
            </Avatar>
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  )
}
