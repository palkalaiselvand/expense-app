import { useState } from 'react'
import Box from '@mui/material/Box'
import Drawer from '@mui/material/Drawer'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import Sidebar from './Sidebar'
import Header from './Header'

interface AppLayoutProps {
  children: React.ReactNode
}

const SIDEBAR_WIDTH = 240

export default function AppLayout({ children }: AppLayoutProps) {
  const muiTheme = useTheme()
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'))
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleToggle = () => setMobileOpen((prev) => !prev)
  const handleClose = () => setMobileOpen(false)

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* ── Sidebar: permanent on desktop, temporary drawer on mobile ── */}
      {isMobile ? (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleClose}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': {
              width: SIDEBAR_WIDTH,
              border: 'none',
              boxShadow: '4px 0 24px rgba(0,0,0,0.15)',
            },
          }}
        >
          <Sidebar />
        </Drawer>
      ) : (
        <Box
          component="nav"
          sx={{ width: SIDEBAR_WIDTH, flexShrink: 0 }}
          aria-label="Main navigation"
        >
          {/* Sticky sidebar so it stays visible on scroll */}
          <Box
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: SIDEBAR_WIDTH,
              height: '100vh',
              overflow: 'auto',
              zIndex: (theme) => theme.zIndex.drawer,
            }}
          >
            <Sidebar />
          </Box>
        </Box>
      )}

      {/* ── Main content area ─────────────────────────────────────────── */}
      <Box
        component="main"
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          // On desktop, offset main content past sidebar
          ml: isMobile ? 0 : 0,
        }}
      >
        <Header onMenuToggle={handleToggle} isMobile={isMobile} />

        {/* Page content */}
        <Box
          sx={{
            flex: 1,
            overflow: 'auto',
            backgroundColor: '#f8fafc',
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  )
}
