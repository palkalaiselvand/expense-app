import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Avatar from '@mui/material/Avatar'
import Divider from '@mui/material/Divider'
import Button from '@mui/material/Button'
import GridViewIcon from '@mui/icons-material/GridView'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'
import InsightsIcon from '@mui/icons-material/Insights'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import AddIcon from '@mui/icons-material/Add'

const NAV_ITEMS = [
  { label: 'Dashboard', icon: <GridViewIcon fontSize="small" /> },
  { label: 'Expenses',  icon: <ReceiptLongIcon fontSize="small" /> },
  { label: 'Reports',   icon: <AssessmentOutlinedIcon fontSize="small" /> },
  { label: 'Insights',  icon: <InsightsIcon fontSize="small" /> },
  { label: 'Settings',  icon: <SettingsOutlinedIcon fontSize="small" /> },
]

interface SidebarProps {
  activePage: string
  onNavigate: (page: string) => void
}

export default function Sidebar({ activePage, onNavigate }: SidebarProps) {
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
        {NAV_ITEMS.map((item) => {
          const isActive = item.label === activePage
          return (
          <ListItem key={item.label} disablePadding sx={{ mb: 0.25 }}>
            <ListItemButton
              onClick={() => onNavigate(item.label)}
              sx={{
                borderRadius: '8px',
                backgroundColor: isActive ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                color: isActive ? '#10b981' : '#94a3b8',
                py: 1.1,
                px: 1.5,
                '&:hover': {
                  backgroundColor: isActive
                    ? 'rgba(16, 185, 129, 0.2)'
                    : 'rgba(255,255,255,0.05)',
                  color: isActive ? '#10b981' : '#e2e8f0',
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
                  fontWeight: isActive ? 600 : 400,
                  color: 'inherit',
                }}
              />
              {isActive && (
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
        )})
        }
      </List>

      {/* ── Actions ──────────────────────────────────────────────────────── */}
      <Box sx={{ px: 2, pb: 1.5 }}>
        <Button
          fullWidth
          variant="contained"
          startIcon={<AddIcon sx={{ fontSize: '16px !important' }} />}
          onClick={() => onNavigate('Expenses')}
          sx={{
            backgroundColor: '#10b981',
            color: '#ffffff',
            fontWeight: 600,
            fontSize: '0.8125rem',
            textTransform: 'none',
            borderRadius: '8px',
            py: 1,
            mb: 1,
            '&:hover': { backgroundColor: '#059669' },
          }}
        >
          New Expense
        </Button>
        <Button
          fullWidth
          startIcon={<HelpOutlineIcon sx={{ fontSize: '15px !important' }} />}
          sx={{
            color: '#64748b',
            fontSize: '0.8125rem',
            textTransform: 'none',
            borderRadius: '8px',
            py: 0.75,
            justifyContent: 'flex-start',
            '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)', color: '#94a3b8' },
          }}
        >
          Help Center
        </Button>
      </Box>

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
