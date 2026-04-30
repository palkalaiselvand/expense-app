import { useState, useEffect, useMemo, useCallback } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TablePagination from '@mui/material/TablePagination'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Divider from '@mui/material/Divider'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import InputBase from '@mui/material/InputBase'
import InputAdornment from '@mui/material/InputAdornment'
import Avatar from '@mui/material/Avatar'
import AvatarGroup from '@mui/material/AvatarGroup'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import AddIcon from '@mui/icons-material/Add'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined'
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined'
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined'
import FilterListIcon from '@mui/icons-material/FilterList'
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import SearchIcon from '@mui/icons-material/Search'
import CloseIcon from '@mui/icons-material/Close'
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import { loadSubmissions } from '../../utils/storage'
import { loadSettings } from '../../utils/settings'
import type { Submission } from '../../types/expense'
import type { CategorySetting } from '../../types/settings'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type ReportStatus = 'Draft' | 'Pending Review' | 'Approved' | 'Rejected'
type TabValue = 'all' | 'draft' | 'pending' | 'approved' | 'rejected'

interface ReportRow {
  id: string
  name: string
  submittedAt: string
  itemCount: number
  totalAmount: number
  status: ReportStatus
  billableToClient: boolean
}

// ---------------------------------------------------------------------------
// Constants / helpers
// ---------------------------------------------------------------------------
const PAGE_SIZE = 10
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function fmt(val: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', minimumFractionDigits: 2,
  }).format(val)
}

function fmtDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    }).format(new Date(iso))
  } catch { return iso }
}

function totalAmount(sub: Submission): number {
  return sub.lineItems.reduce((s, li) => s + li.amount, 0)
}

function getCategoryLabel(key: string, cats: CategorySetting[]): string {
  const FALLBACK: Record<string, string> = {
    'Travel-Air': 'Air Travel', 'Travel-Car': 'Ground Transport',
    Food: 'Meals & Dining', Hotel: 'Accommodation', Mobile: 'Mobile & Tech',
  }
  return cats.find((c) => c.key === key)?.label ?? FALLBACK[key] ?? key
}

function deriveStatus(sub: Submission): ReportStatus {
  const ageDays = (Date.now() - new Date(sub.submittedAt).getTime()) / 86400000
  if (ageDays < 0.5) return 'Draft'
  if (ageDays < 3) return 'Pending Review'
  const nibble = parseInt(sub.id.slice(-1), 16)
  if (nibble === 0) return 'Rejected'
  return 'Approved'
}

function generateReportName(sub: Submission, index: number, cats: CategorySetting[]): string {
  if (sub.lineItems.length === 0) return `Expense Report #${String(index + 1).padStart(3, '0')}`
  const counts: Record<string, number> = {}
  sub.lineItems.forEach((li) => { counts[li.category] = (counts[li.category] ?? 0) + 1 })
  const topCat = Object.entries(counts).sort(([, a], [, b]) => b - a)[0][0]
  const label = getCategoryLabel(topCat, cats)
  const d = new Date(sub.submittedAt)
  const stamp = `${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`
  return sub.billableToClient ? `Client ${label} - ${stamp}` : `${label} Report - ${stamp}`
}

const STATUS_CFG: Record<ReportStatus, { label: string; color: string; bg: string }> = {
  Approved:         { label: 'Approved',       color: '#059669', bg: 'rgba(5,150,105,0.1)'   },
  'Pending Review': { label: 'Pending Review', color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
  Rejected:         { label: 'Rejected',       color: '#dc2626', bg: 'rgba(220,38,38,0.1)'  },
  Draft:            { label: 'Draft',           color: '#64748b', bg: 'rgba(100,116,139,0.1)'},
}

const TAB_STATUS: Record<TabValue, ReportStatus | null> = {
  all: null, draft: 'Draft', pending: 'Pending Review',
  approved: 'Approved', rejected: 'Rejected',
}

// Seed rows used when localStorage has no submissions
const SEED: ReportRow[] = [
  { id:'s1', name:'Q3 Client Travel - London',       submittedAt:'2023-10-24T10:00:00Z', itemCount:12, totalAmount:2450.80,  status:'Approved',       billableToClient:true  },
  { id:'s2', name:'Tech Summit 2023 Sponsorship',     submittedAt:'2023-10-22T09:00:00Z', itemCount:3,  totalAmount:15000.00, status:'Pending Review', billableToClient:false },
  { id:'s3', name:'Monthly Office Supplies - HQ',     submittedAt:'2023-10-18T08:00:00Z', itemCount:8,  totalAmount:842.15,   status:'Rejected',       billableToClient:false },
  { id:'s4', name:'Developer Cloud Infrastructure',   submittedAt:'2023-10-15T14:00:00Z', itemCount:1,  totalAmount:3200.00,  status:'Approved',       billableToClient:false },
  { id:'s5', name:'Employee Wellness Program',        submittedAt:'2023-10-12T11:00:00Z', itemCount:5,  totalAmount:2100.00,  status:'Draft',          billableToClient:false },
  { id:'s6', name:'Air Travel - NY Conference',       submittedAt:'2023-10-09T13:00:00Z', itemCount:4,  totalAmount:1875.40,  status:'Approved',       billableToClient:true  },
  { id:'s7', name:'Client Entertainment Q4',          submittedAt:'2023-10-05T09:30:00Z', itemCount:6,  totalAmount:980.00,   status:'Pending Review', billableToClient:true  },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
interface ReportsPageProps {
  onNavigate: (page: string) => void
}

export default function ReportsPage({ onNavigate }: ReportsPageProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const settings = useMemo(() => loadSettings(), [])
  const today = useMemo(() => new Date(), [])

  useEffect(() => { setSubmissions(loadSubmissions()) }, [])

  // ── real rows from localStorage ──────────────────────────────────────────
  const allRealRows: ReportRow[] = useMemo(
    () =>
      [...submissions]
        .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
        .map((sub, i) => ({
          id: sub.id,
          name: generateReportName(sub, i, settings.categories),
          submittedAt: sub.submittedAt,
          itemCount: sub.lineItems.length,
          totalAmount: totalAmount(sub),
          status: deriveStatus(sub),
          billableToClient: sub.billableToClient,
        })),
    [submissions, settings.categories],
  )

  const useSeed = allRealRows.length === 0
  const baseRows: ReportRow[] = useSeed ? SEED : allRealRows

  // ── date range filter (one month selector) ────────────────────────────────
  const [filterYear, setFilterYear] = useState(today.getFullYear())
  const [filterMonth, setFilterMonth] = useState(today.getMonth())

  const [tabValue, setTabValue] = useState<TabValue>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(0)
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)
  const [bannerVisible, setBannerVisible] = useState(true)

  const handleSearchChange = useCallback((val: string) => { setSearchQuery(val); setPage(0) }, [])

  const prevMonth = () => {
    if (filterMonth === 0) { setFilterYear((y) => y - 1); setFilterMonth(11) }
    else setFilterMonth((m) => m - 1)
    setPage(0)
  }
  const nextMonth = () => {
    if (filterMonth === 11) { setFilterYear((y) => y + 1); setFilterMonth(0) }
    else setFilterMonth((m) => m + 1)
    setPage(0)
  }

  // ── filtered rows ─────────────────────────────────────────────────────────
  const filteredRows = useMemo(() => {
    let rows = baseRows

    if (!useSeed) {
      rows = rows.filter((r) => {
        const d = new Date(r.submittedAt)
        return d.getFullYear() === filterYear && d.getMonth() === filterMonth
      })
    }

    const statusFilter = TAB_STATUS[tabValue]
    if (statusFilter) rows = rows.filter((r) => r.status === statusFilter)

    const q = searchQuery.trim().toLowerCase()
    if (q) {
      rows = rows.filter((r) =>
        r.name.toLowerCase().includes(q) ||
        r.status.toLowerCase().includes(q) ||
        fmt(r.totalAmount).toLowerCase().includes(q) ||
        fmtDate(r.submittedAt).toLowerCase().includes(q),
      )
    }

    return rows
  }, [baseRows, useSeed, filterYear, filterMonth, tabValue, searchQuery])

  const paginatedRows = filteredRows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  // ── stats ─────────────────────────────────────────────────────────────────
  const ytdApproved = useMemo(
    () =>
      baseRows
        .filter((r) => r.status === 'Approved' && new Date(r.submittedAt).getFullYear() === today.getFullYear())
        .reduce((s, r) => s + r.totalAmount, 0),
    [baseRows, today],
  )
  const activeCount = baseRows.filter((r) => r.status === 'Pending Review' || r.status === 'Draft').length
  const pendingCount = baseRows.filter((r) => r.status === 'Pending Review').length

  const tabCounts: Record<TabValue, number> = useMemo(
    () => ({
      all:      baseRows.length,
      draft:    baseRows.filter((r) => r.status === 'Draft').length,
      pending:  baseRows.filter((r) => r.status === 'Pending Review').length,
      approved: baseRows.filter((r) => r.status === 'Approved').length,
      rejected: baseRows.filter((r) => r.status === 'Rejected').length,
    }),
    [baseRows],
  )

  // ── CSV export ────────────────────────────────────────────────────────────
  const handleExportCSV = useCallback(() => {
    const rows = [
      ['Report Name', 'Date Submitted', 'Items', 'Total Amount (USD)', 'Status', 'Billable'],
      ...filteredRows.map((r) => [
        r.name, fmtDate(r.submittedAt), String(r.itemCount),
        r.totalAmount.toFixed(2), r.status, r.billableToClient ? 'Yes' : 'No',
      ]),
    ]
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'expense-reports.csv'; a.click()
    URL.revokeObjectURL(url)
  }, [filteredRows])

  const daysInMonth = new Date(filterYear, filterMonth + 1, 0).getDate()
  const dateRangeLabel = useSeed
    ? 'Oct 1 - Oct 31, 2023'
    : `${MONTHS_SHORT[filterMonth]} 1 - ${MONTHS_SHORT[filterMonth]} ${daysInMonth}, ${filterYear}`

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1280, mx: 'auto', pb: bannerVisible && pendingCount > 0 ? 11 : 3 }}>

      {/* ── Breadcrumb + page header ───────────────────────────────────── */}
      <Box
        sx={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'flex-start', gap: 2, mb: 3, flexWrap: 'wrap',
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
            <Typography sx={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.08em',
                              textTransform: 'uppercase', color: '#94a3b8' }}>
              Finance
            </Typography>
            <NavigateNextIcon sx={{ fontSize: 14, color: '#cbd5e1' }} />
            <Typography sx={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.08em',
                              textTransform: 'uppercase', color: '#10b981' }}>
              Reports History
            </Typography>
          </Box>
          <Typography sx={{ fontWeight: 800, fontSize: '1.375rem', color: '#0f172a', lineHeight: 1.2 }}>
            Expense Reports
          </Typography>
          <Typography sx={{ fontSize: '0.875rem', color: '#64748b', mt: 0.25 }}>
            Manage and track your corporate spending cycles.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => onNavigate('Expenses')}
          sx={{
            backgroundColor: '#10b981', fontWeight: 700, fontSize: '0.875rem',
            textTransform: 'none', borderRadius: '10px', px: 2.5, py: 1.1,
            flexShrink: 0, boxShadow: '0 2px 8px rgba(16,185,129,0.3)',
            '&:hover': { backgroundColor: '#059669' },
          }}
        >
          Create New Report
        </Button>
      </Box>

      {/* ── Stat cards ────────────────────────────────────────────────────── */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
          gap: 2, mb: 3,
        }}
      >
        {/* Total Reimbursed YTD */}
        <Paper
          elevation={0}
          sx={{
            border: '1px solid #e2e8f0', borderRadius: '14px', p: 2.5,
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          }}
        >
          <Box>
            <Typography sx={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.08em',
                              textTransform: 'uppercase', color: '#94a3b8', mb: 1 }}>
              Total Reimbursed YTD
            </Typography>
            <Typography sx={{ fontSize: '1.875rem', fontWeight: 800, color: '#0f172a',
                              lineHeight: 1.1, letterSpacing: '-0.02em', mb: 0.75 }}>
              {fmt(useSeed ? 142580 : ytdApproved)}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <TrendingUpIcon sx={{ fontSize: 14, color: '#10b981' }} />
              <Typography sx={{ fontSize: '0.8125rem', color: '#10b981', fontWeight: 600 }}>
                12% vs last year
              </Typography>
            </Box>
          </Box>
          <Box sx={{ width: 44, height: 44, borderRadius: '12px', flexShrink: 0,
                     backgroundColor: 'rgba(16,185,129,0.1)', display: 'flex',
                     alignItems: 'center', justifyContent: 'center' }}>
            <PaymentsOutlinedIcon sx={{ fontSize: 22, color: '#10b981' }} />
          </Box>
        </Paper>

        {/* Active Reports */}
        <Paper
          elevation={0}
          sx={{
            border: '1px solid #e2e8f0', borderRadius: '14px', p: 2.5,
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          }}
        >
          <Box>
            <Typography sx={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.08em',
                              textTransform: 'uppercase', color: '#94a3b8', mb: 1 }}>
              Active Reports
            </Typography>
            <Typography sx={{ fontSize: '2.5rem', fontWeight: 800, color: '#0f172a',
                              lineHeight: 1, letterSpacing: '-0.02em', mb: 0.75 }}>
              {useSeed ? 24 : activeCount}
            </Typography>
            <Typography sx={{ fontSize: '0.8125rem', color: '#64748b' }}>
              Awaiting approval or action
            </Typography>
          </Box>
          <Box sx={{ width: 44, height: 44, borderRadius: '12px', flexShrink: 0,
                     backgroundColor: 'rgba(99,102,241,0.1)', display: 'flex',
                     alignItems: 'center', justifyContent: 'center' }}>
            <AssignmentOutlinedIcon sx={{ fontSize: 22, color: '#6366f1' }} />
          </Box>
        </Paper>

        {/* Quick Action */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: '14px', p: 2.5, position: 'relative', overflow: 'hidden',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 65%, #134e4a 100%)',
            border: '1px solid #1e293b',
          }}
        >
          <Typography sx={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.08em',
                            textTransform: 'uppercase', color: '#10b981', mb: 0.75 }}>
            Quick Action
          </Typography>
          <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#ffffff', mb: 0.5 }}>
            Download Audit Pack
          </Typography>
          <Typography sx={{ fontSize: '0.8125rem', color: '#94a3b8', mb: 1.5, lineHeight: 1.4 }}>
            Export all approved reports for Q{Math.ceil((today.getMonth() + 1) / 3)}.
          </Typography>
          <Button
            size="small"
            endIcon={<ArrowForwardIcon sx={{ fontSize: '13px !important' }} />}
            onClick={handleExportCSV}
            sx={{
              color: '#10b981', fontWeight: 700, fontSize: '0.8125rem',
              textTransform: 'none', p: 0, minWidth: 0,
              '&:hover': { backgroundColor: 'transparent', color: '#34d399' },
            }}
          >
            Get Started
          </Button>
          {/* Decorative rings */}
          <Box sx={{ position: 'absolute', width: 130, height: 130, borderRadius: '50%',
                     border: '1px solid rgba(16,185,129,0.15)', top: -35, right: -35, pointerEvents: 'none' }} />
          <Box sx={{ position: 'absolute', width: 80, height: 80, borderRadius: '50%',
                     border: '1px solid rgba(16,185,129,0.1)', top: 8, right: 8, pointerEvents: 'none' }} />
        </Paper>
      </Box>

      {/* ── Reports table ─────────────────────────────────────────────────── */}
      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden' }}>

        {/* Tabs + controls bar */}
        <Box
          sx={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: 1, px: 2, pt: 0.5,
            borderBottom: '1px solid #f1f5f9',
          }}
        >
          <Tabs
            value={tabValue}
            onChange={(_e, v: TabValue) => { setTabValue(v); setPage(0) }}
            sx={{
              minHeight: 46,
              '& .MuiTab-root': {
                minHeight: 46, fontSize: '0.8125rem', textTransform: 'none',
                fontWeight: 500, color: '#64748b', py: 1, px: 1.5,
              },
              '& .Mui-selected': { color: '#0f172a', fontWeight: 700 },
              '& .MuiTabs-indicator': { backgroundColor: '#10b981', height: 2 },
            }}
          >
            {([ ['all','All Reports'], ['draft','Drafts'], ['pending','Pending'],
                ['approved','Approved'], ['rejected','Rejected'] ] as [TabValue, string][])
              .map(([val, lbl]) => (
                <Tab
                  key={val}
                  value={val}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      {lbl}
                      {tabCounts[val] > 0 && (
                        <Box component="span" sx={{
                          fontSize: '0.6875rem', fontWeight: 700, lineHeight: '18px',
                          px: 0.75, py: 0.1, borderRadius: '10px',
                          backgroundColor: tabValue === val ? 'rgba(16,185,129,0.12)' : '#f1f5f9',
                          color: tabValue === val ? '#10b981' : '#64748b',
                        }}>
                          {tabCounts[val]}
                        </Box>
                      )}
                    </Box>
                  }
                />
              ))}
          </Tabs>

          {/* Right controls */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 0.5 }}>
            {/* Search */}
            <Box sx={{
              display: { xs: 'none', sm: 'flex' }, alignItems: 'center',
              backgroundColor: '#f8fafc', border: '1px solid #e2e8f0',
              borderRadius: '8px', px: 1.25, height: 34, gap: 0.5, minWidth: 180,
            }}>
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 15, color: '#94a3b8' }} />
              </InputAdornment>
              <InputBase
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search reports…"
                sx={{ fontSize: '0.8125rem', color: '#475569', flex: 1 }}
                inputProps={{ 'aria-label': 'Search reports' }}
              />
              {searchQuery && (
                <IconButton size="small" onClick={() => handleSearchChange('')}
                  sx={{ p: 0.25, color: '#94a3b8' }} aria-label="Clear search">
                  <CloseIcon sx={{ fontSize: 13 }} />
                </IconButton>
              )}
            </Box>

            {/* Date range navigator */}
            <Box sx={{
              display: 'flex', alignItems: 'center', gap: 0.25,
              border: '1px solid #e2e8f0', borderRadius: '8px',
              height: 34, px: 0.75, backgroundColor: '#ffffff',
            }}>
              <Tooltip title="Previous month">
                <IconButton size="small" onClick={prevMonth} sx={{ p: 0.25, color: '#64748b' }}>
                  <ChevronLeftIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mx: 0.5 }}>
                <CalendarTodayOutlinedIcon sx={{ fontSize: 13, color: '#94a3b8' }} />
                <Typography sx={{ fontSize: '0.8125rem', color: '#475569', whiteSpace: 'nowrap', fontWeight: 500 }}>
                  {dateRangeLabel}
                </Typography>
              </Box>
              <Tooltip title="Next month">
                <IconButton size="small" onClick={nextMonth} sx={{ p: 0.25, color: '#64748b' }}>
                  <ChevronRightIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            </Box>

            {/* Advanced filter */}
            <Button
              size="small"
              startIcon={<FilterListIcon sx={{ fontSize: '15px !important' }} />}
              variant="outlined"
              sx={{
                borderColor: '#e2e8f0', color: '#475569', fontSize: '0.8125rem',
                textTransform: 'none', height: 34, px: 1.5, whiteSpace: 'nowrap',
                '&:hover': { borderColor: '#cbd5e1', backgroundColor: '#f8fafc' },
              }}
            >
              Advanced
            </Button>
          </Box>
        </Box>

        {/* Table content */}
        {filteredRows.length === 0 ? (
          <Box sx={{ py: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
            <InboxOutlinedIcon sx={{ fontSize: 48, color: '#e2e8f0' }} />
            <Typography sx={{ fontWeight: 600, color: '#94a3b8', fontSize: '0.9375rem' }}>
              {searchQuery
                ? `No reports matching "${searchQuery}"`
                : 'No reports found for this period'}
            </Typography>
            {searchQuery && (
              <Button size="small" onClick={() => handleSearchChange('')}
                sx={{ color: '#10b981', textTransform: 'none', fontSize: '0.8125rem' }}>
                Clear search
              </Button>
            )}
          </Box>
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow sx={{
                  '& th': {
                    fontWeight: 700, color: '#64748b', fontSize: '0.75rem',
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                    borderBottom: '1px solid #f1f5f9', backgroundColor: '#fafbfc',
                    py: 1.5, whiteSpace: 'nowrap',
                  },
                }}>
                  <TableCell sx={{ pl: 3 }}>Report Name</TableCell>
                  <TableCell>Date Submitted</TableCell>
                  <TableCell>Items</TableCell>
                  <TableCell>Total Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell sx={{ pr: 2.5, textAlign: 'right' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedRows.map((row) => {
                  const cfg = STATUS_CFG[row.status]
                  return (
                    <TableRow
                      key={row.id}
                      sx={{
                        '&:last-child td': { borderBottom: 'none' },
                        '&:hover': { backgroundColor: '#fafbfc' },
                      }}
                    >
                      <TableCell sx={{ pl: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box sx={{
                            width: 34, height: 34, borderRadius: '8px', flexShrink: 0,
                            backgroundColor: '#f1f5f9', display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                          }}>
                            <DescriptionOutlinedIcon sx={{ fontSize: 17, color: '#64748b' }} />
                          </Box>
                          <Box>
                            <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a', lineHeight: 1.3 }}>
                              {row.name}
                            </Typography>
                            {row.billableToClient && (
                              <Typography sx={{ fontSize: '0.6875rem', color: '#10b981', fontWeight: 600 }}>
                                Client Billable
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Typography sx={{ fontSize: '0.875rem', color: '#475569' }}>
                          {fmtDate(row.submittedAt)}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Typography sx={{ fontSize: '0.875rem', color: '#475569' }}>
                          {row.itemCount}
                        </Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                          receipt{row.itemCount !== 1 ? 's' : ''}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Typography sx={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a' }}>
                          {fmt(row.totalAmount)}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={cfg.label}
                          size="small"
                          sx={{
                            height: 24, fontSize: '0.75rem', fontWeight: 700,
                            backgroundColor: cfg.bg, color: cfg.color,
                            '& .MuiChip-label': { px: 1.25 },
                          }}
                        />
                      </TableCell>

                      <TableCell sx={{ pr: 2.5, textAlign: 'right' }}>
                        <Tooltip title="Actions">
                          <IconButton
                            size="small"
                            onClick={(e) => { setMenuAnchor(e.currentTarget) }}
                            sx={{ color: '#94a3b8', '&:hover': { color: '#475569', backgroundColor: '#f1f5f9' } }}
                          >
                            <MoreVertIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>

            {filteredRows.length > PAGE_SIZE && (
              <TablePagination
                component="div"
                count={filteredRows.length}
                page={page}
                onPageChange={(_e, p) => setPage(p)}
                rowsPerPage={PAGE_SIZE}
                rowsPerPageOptions={[PAGE_SIZE]}
                sx={{
                  borderTop: '1px solid #f1f5f9',
                  '& .MuiTablePagination-toolbar': { minHeight: 48, px: 2 },
                  '& .MuiTablePagination-displayedRows': { fontSize: '0.8125rem', color: '#64748b' },
                }}
              />
            )}
          </>
        )}
      </Paper>

      {/* Context menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          elevation: 2,
          sx: { borderRadius: '10px', minWidth: 160, border: '1px solid #f1f5f9' },
        }}
      >
        <MenuItem onClick={() => setMenuAnchor(null)} sx={{ fontSize: '0.875rem', gap: 1.5, py: 1 }}>
          <OpenInNewIcon sx={{ fontSize: 16, color: '#64748b' }} />
          View Report
        </MenuItem>
        <MenuItem onClick={() => { handleExportCSV(); setMenuAnchor(null) }} sx={{ fontSize: '0.875rem', gap: 1.5, py: 1 }}>
          <DownloadOutlinedIcon sx={{ fontSize: 16, color: '#64748b' }} />
          Download PDF
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => setMenuAnchor(null)} sx={{ fontSize: '0.875rem', gap: 1.5, py: 1, color: '#dc2626' }}>
          Delete Report
        </MenuItem>
      </Menu>

      {/* ── Pending approvals sticky banner ─────────────────────────────── */}
      {bannerVisible && pendingCount > 0 && (
        <Box sx={{
          position: 'fixed', bottom: 0,
          left: { xs: 0, md: 240 }, right: 0,
          zIndex: 1100, backgroundColor: '#0f172a',
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          px: { xs: 2, sm: 4 }, py: 1.25, gap: 2,
          flexWrap: 'wrap',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <AvatarGroup max={3} sx={{
              '& .MuiAvatar-root': { width: 28, height: 28, fontSize: '0.75rem', border: '2px solid #0f172a' },
            }}>
              <Avatar sx={{ backgroundColor: '#10b981' }}>A</Avatar>
              <Avatar sx={{ backgroundColor: '#6366f1' }}>M</Avatar>
              <Avatar sx={{ backgroundColor: '#f59e0b' }}>S</Avatar>
            </AvatarGroup>
            <Box>
              <Typography sx={{ fontSize: '0.6875rem', fontWeight: 700, color: '#10b981',
                                letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Pending Approvals
              </Typography>
              <Typography sx={{ fontSize: '0.875rem', color: '#e2e8f0', fontWeight: 500 }}>
                {pendingCount} Report{pendingCount !== 1 ? 's' : ''} need{pendingCount === 1 ? 's' : ''} your signature
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              variant="contained"
              size="small"
              onClick={() => { setTabValue('pending'); setPage(0) }}
              sx={{
                backgroundColor: '#10b981', fontWeight: 700, fontSize: '0.8125rem',
                textTransform: 'none', borderRadius: '8px', px: 2.5,
                '&:hover': { backgroundColor: '#059669' },
              }}
            >
              Review All
            </Button>
            <IconButton
              size="small"
              onClick={() => setBannerVisible(false)}
              sx={{ color: '#64748b', '&:hover': { color: '#94a3b8' } }}
              aria-label="Dismiss banner"
            >
              <CloseIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>
        </Box>
      )}
    </Box>
  )
}
