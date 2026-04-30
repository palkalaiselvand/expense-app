import { useState } from 'react'
import Box from '@mui/material/Box'
import Fab from '@mui/material/Fab'
import AddIcon from '@mui/icons-material/Add'
import AppLayout from './components/layout/AppLayout'
import ExpenseFormPage from './components/expense/ExpenseFormPage'
import AdminSettingsPage from './components/settings/AdminSettingsPage'
import DashboardPage from './components/dashboard/DashboardPage'

export type PageName = 'Dashboard' | 'Expenses' | 'Reports' | 'Insights' | 'Settings'

export default function App() {
  const [activePage, setActivePage] = useState<PageName>('Dashboard')

  return (
    <AppLayout activePage={activePage} onNavigate={(p) => setActivePage(p as PageName)}>
      {activePage === 'Settings' ? (
        <AdminSettingsPage />
      ) : activePage === 'Dashboard' || activePage === 'Insights' ? (
        <DashboardPage />
      ) : (
        <ExpenseFormPage />
      )}

      {/* Global FAB — navigate to New Expense */}
      {activePage !== 'Expenses' && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 28,
            right: 28,
            zIndex: 1200,
          }}
        >
          <Fab
            color="primary"
            aria-label="New Expense"
            onClick={() => setActivePage('Expenses')}
            sx={{
              backgroundColor: '#10b981',
              '&:hover': { backgroundColor: '#059669' },
              boxShadow: '0 4px 20px rgba(16,185,129,0.4)',
            }}
          >
            <AddIcon />
          </Fab>
        </Box>
      )}
    </AppLayout>
  )
}
