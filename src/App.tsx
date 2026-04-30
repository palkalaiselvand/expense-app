import { useState } from 'react'
import AppLayout from './components/layout/AppLayout'
import ExpenseFormPage from './components/expense/ExpenseFormPage'
import AdminSettingsPage from './components/settings/AdminSettingsPage'

export type PageName = 'Dashboard' | 'Expenses' | 'Reports' | 'Settings'

export default function App() {
  const [activePage, setActivePage] = useState<PageName>('Expenses')

  return (
    <AppLayout activePage={activePage} onNavigate={(p) => setActivePage(p as PageName)}>
      {activePage === 'Settings' ? (
        <AdminSettingsPage />
      ) : (
        <ExpenseFormPage />
      )}
    </AppLayout>
  )
}
