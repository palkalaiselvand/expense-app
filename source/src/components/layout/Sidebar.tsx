import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Avatar from '@mui/material/Avatar'
import Divider from '@mui/material/Divider'
import GridViewIcon from '@mui/icons-material/GridView'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'

const NAV_ITEMS = [
  { label: 'Dashboard', icon: <GridViewIcon fontSize="small" />, active: false },
  { label: 'Expenses', icon: <ReceiptLongIcon fontSize="small" />, active: true },
  { label: 'Reports', icon: <AssessmentOutlinedIcon fontSize="small" />, active: false },
  { label: 'Settings', icon: <SettingsOutlinedIcon fontSize="small" />, active: false },
]

export default function Sidebar() {
  return (
    <Box
      sx={{
        width: 240,
        minHeight: '100vh',
        backgroundColor: '#0f172a',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid #1e293b',
      }}
    >
      {/* ── Logo ─────────────────────────────────────────────────────────── */}
      <Box sx={{ px: 2.5, py: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          sx={{
            width: 38,
            height: 38,
            backgroundColor: '#10b981',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <AccountBalanceWalletIcon sx={{ color: '#ffffff', fontSize: 20 }} />
        </Box>
        <Box>
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: '0.9375rem',
              color: '#ffffff',
              lineHeight: 1.25,
              letterSpacing: '-0.01em',
            }}
          >
            FinCorp
          </Typography>
          <Typography sx={{ fontSize: '0.6875rem', color: '#64748b', lineHeight: 1.25 }}>
            Expense Manager
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: '#1e293b', mx: 2, mb: 1 }} />

      {/* ── Navigation ───────────────────────────────────────────────────── */}
      <List sx={{ px: 1.5, flexGrow: 1, pt: 0.5 }}>
        {NAV_ITEMS.map((item) => (
          <ListItem key={item.label} disablePadding sx={{ mb: 0.25 }}>
            <ListItemButton
              sx={{
                borderRadius: '8px',
                backgroundColor: item.active ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                color: item.active ? '#10b981' : '#94a3b8',
                py: 1.1,
                px: 1.5,
                '&:hover': {
                  backgroundColor: item.active
                    ? 'rgba(16, 185, 129, 0.2)'
                    : 'rgba(255,255,255,0.05)',
                  color: item.active ? '#10b981' : '#e2e8f0',
                },
                transition: 'all 0.15s',
              }}
            >
              <ListItemIcon
                sx={{ color: 'inherit', minWidth: 34 }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontSize: '0.875rem',
                  fontWeight: item.active ? 600 : 400,
                  color: 'inherit',
                }}
              />
              {item.active && (
                <Box
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    backgroundColor: '#10b981',
                  }}
                />
              )}
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider sx={{ borderColor: '#1e293b', mx: 2 }} />

      {/* ── User Profile ─────────────────────────────────────────────────── */}
      <Box
        sx={{
          px: 2.5,
          py: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <Avatar
          sx={{
            width: 34,
            height: 34,
            backgroundColor: '#10b981',
            fontSize: '0.8rem',
            fontWeight: 600,
          }}
        >
          AC
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: '#e2e8f0',
              lineHeight: 1.3,
            }}
            noWrap
          >
            Alex Chen
          </Typography>
          <Typography sx={{ fontSize: '0.6875rem', color: '#64748b', lineHeight: 1.3 }}>
            Dept. Head
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}
