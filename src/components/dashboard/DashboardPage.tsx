import { useState, useEffect, useMemo, useCallback } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import LinearProgress from '@mui/material/LinearProgress'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TablePagination from '@mui/material/TablePagination'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import InputBase from '@mui/material/InputBase'
import Tooltip from '@mui/material/Tooltip'
import Divider from '@mui/material/Divider'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined'
import PendingActionsOutlinedIcon from '@mui/icons-material/PendingActionsOutlined'
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined'
import BarChartIcon from '@mui/icons-material/BarChart'
import SearchIcon from '@mui/icons-material/Search'
import CloseIcon from '@mui/icons-material/Close'
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { loadSubmissions } from '../../utils/storage'
import { loadSettings } from '../../utils/settings'
import type { Submission } from '../../types/expense'
import type { CategorySetting } from '../../types/settings'

// -- constants -----------------------------------------------------------------
const PAGE_SIZE = 10
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// -- helpers -------------------------------------------------------------------
function fmt(val: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(val)
}

function fmtDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

function lastNMonths(n: number): { monthKey: string; label: string }[] {
  const result = []
  const now = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    result.push({
      monthKey: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: MONTHS[d.getMonth()],
    })
  }
  return result
}

function getCategoryColor(key: string, cats: CategorySetting[]): string {
  return cats.find((c) => c.key === key)?.color ?? '#94a3b8'
}

function getCategoryLabel(key: string, cats: CategorySetting[]): string {
  return cats.find((c) => c.key === key)?.label ?? key
}

function totalAmount(subs: Submission[]): number {
  return subs.reduce((sum, s) => sum + s.lineItems.reduce((a, li) => a + li.amount, 0), 0)
}

// -- status helpers ------------------------------------------------------------
type StatusType = 'approved' | 'pending'

function getStatus(sub: Submission): StatusType {
  const ageMs = Date.now() - new Date(sub.submittedAt).getTime()
  return ageMs < 2 * 86400000 ? 'pending' : 'approved'
}

const STATUS_CONFIG: Record<StatusType, { label: string; color: string; dot: string }> = {
  approved: { label: 'Approved', color: '#10b981', dot: '#10b981' },
  pending:  { label: 'Pending',  color: '#f59e0b', dot: '#f59e0b' },
}

// -- component -----------------------------------------------------------------
export default function DashboardPage() {
  // Load real data from localStorage each time the component mounts
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const settings = useMemo(() => loadSettings(), [])

  useEffect(() => {
    setSubmissions(loadSubmissions())
  }, [])

  // search + pagination state
  const [searchQuery, setSearchQuery] = useState('')
  const [activityPage, setActivityPage] = useState(0)

  const handleSearchChange = useCallback((val: string) => {
    setSearchQuery(val)
    setActivityPage(0)
  }, [])

  // stat metrics
  const now = useMemo(() => new Date(), [])
  const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const lastMonthKey = (() => {
    const d = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })()

  const totalThisMonth = useMemo(
    () => totalAmount(submissions.filter((s) => s.submittedAt.slice(0, 7) === thisMonthKey)),
    [submissions, thisMonthKey],
  )
  const totalLastMonth = useMemo(
    () => totalAmount(submissions.filter((s) => s.submittedAt.slice(0, 7) === lastMonthKey)),
    [submissions, lastMonthKey],
  )
  const monthPctChange =
    totalLastMonth > 0
      ? Math.round(((totalThisMonth - totalLastMonth) / totalLastMonth) * 100)
      : null

  const thirtyDaysAgo = Date.now() - 30 * 86400000
  const recentSubs = submissions.filter(
    (s) => new Date(s.submittedAt).getTime() > thirtyDaysAgo,
  )
  const pendingReimbursement = totalAmount(recentSubs)
  const pendingClaims = recentSubs.length

  const sevenDaysAgo = Date.now() - 7 * 86400000
  const reportsInReview = submissions.filter(
    (s) => new Date(s.submittedAt).getTime() > sevenDaysAgo,
  ).length

  // spending trends chart (last 6 months, real data only)
  const chartData = useMemo(() => {
    const months6 = lastNMonths(6)
    const currentLabel = MONTHS[now.getMonth()]
    return months6.map(({ monthKey, label }) => ({
      month: label,
      amount: totalAmount(
        submissions.filter((s) => s.submittedAt.slice(0, 7) === monthKey),
      ),
      isCurrent: label === currentLabel,
    }))
  }, [submissions, now])

  // category distribution
  const categoryRows = useMemo(() => {
    const totals: Record<string, number> = {}
    submissions.forEach((s) =>
      s.lineItems.forEach((li) => {
        totals[li.category] = (totals[li.category] ?? 0) + li.amount
      }),
    )
    const grand = Object.values(totals).reduce((a, b) => a + b, 0)
    return Object.entries(totals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([key, total]) => ({
        key,
        label: getCategoryLabel(key, settings.categories),
        color: getCategoryColor(key, settings.categories),
        pct: grand > 0 ? Math.round((total / grand) * 100) : 0,
      }))
  }, [submissions, settings.categories])

  // all activity rows (every line item, no hard cap)
  const allActivity = useMemo(
    () =>
      [...submissions]
        .sort(
          (a, b) =>
            new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
        )
        .flatMap((s) =>
          s.lineItems.map((li) => ({
            id: `${s.id}-${li.id}`,
            date: li.date || s.submittedAt.slice(0, 10),
            merchant: li.merchant || 'Unknown merchant',
            category: li.category,
            amount: li.amount,
            status: getStatus(s),
          })),
        ),
    [submissions],
  )

  // filtered by search query
  const filteredActivity = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return allActivity
    return allActivity.filter((row) => {
      const catLabel = getCategoryLabel(row.category, settings.categories).toLowerCase()
      const statusLabel = STATUS_CONFIG[row.status].label.toLowerCase()
      return (
        row.merchant.toLowerCase().includes(q) ||
        catLabel.includes(q) ||
        row.date.includes(q) ||
        fmt(row.amount).toLowerCase().includes(q) ||
        statusLabel.includes(q)
      )
    })
  }, [allActivity, searchQuery, settings.categories])

  // paginated slice
  const paginatedActivity = useMemo(() => {
    const start = activityPage * PAGE_SIZE
    return filteredActivity.slice(start, start + PAGE_SIZE)
  }, [filteredActivity, activityPage])

  const hasNoData = submissions.length === 0

  // CSV download
  const handleDownloadCSV = useCallback(() => {
    const rows = [
      ['Month', 'Total (USD)'],
      ...chartData.map((d) => [d.month, d.amount.toFixed(2)]),
    ]
    const csv = rows.map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'spending-trends.csv'
    a.click()
    URL.revokeObjectURL(url)
  }, [chartData])

  // -- render ------------------------------------------------------------------
  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1280, mx: 'auto' }}>

      {/* Stat cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
          gap: 2,
          mb: 3,
        }}
      >
        <StatCard
          icon={<PaymentsOutlinedIcon sx={{ fontSize: 22, color: '#10b981' }} />}
          iconBg="rgba(16,185,129,0.1)"
          label="Total Spent This Month"
          value={fmt(totalThisMonth)}
          sub={
            monthPctChange !== null ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {monthPctChange >= 0 ? (
                  <TrendingUpIcon sx={{ fontSize: 14, color: '#10b981' }} />
                ) : (
                  <TrendingDownIcon sx={{ fontSize: 14, color: '#ef4444' }} />
                )}
                <Typography
                  sx={{
                    fontSize: '0.75rem',
                    color: monthPctChange >= 0 ? '#10b981' : '#ef4444',
                    fontWeight: 600,
                  }}
                >
                  {Math.abs(monthPctChange)}% vs last month
                </Typography>
              </Box>
            ) : (
              <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                {hasNoData ? 'No submissions yet' : 'No data for last month'}
              </Typography>
            )
          }
        />

        <StatCard
          icon={<PendingActionsOutlinedIcon sx={{ fontSize: 22, color: '#6366f1' }} />}
          iconBg="rgba(99,102,241,0.1)"
          label="Pending Reimbursement"
          value={fmt(pendingReimbursement)}
          sub={
            <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
              {pendingClaims === 0
                ? 'No pending claims'
                : `${pendingClaims} pending claim${pendingClaims !== 1 ? 's' : ''}`}
            </Typography>
          }
        />

        <StatCard
          icon={<AssignmentOutlinedIcon sx={{ fontSize: 22, color: '#f59e0b' }} />}
          iconBg="rgba(245,158,11,0.1)"
          label="Reports in Review"
          value={String(reportsInReview)}
          valueSx={{ fontSize: '2.25rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}
          sub={
            <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
              {reportsInReview === 0 ? 'Nothing pending approval' : 'Awaiting manager approval'}
            </Typography>
          }
        />
      </Box>

      {/* Spending Trends + Categories */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1fr 300px' },
          gap: 2,
          mb: 3,
        }}
      >
        {/* Spending Trends */}
        <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '14px', p: 2.5 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              mb: 0.5,
            }}
          >
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>
                Spending Trends
              </Typography>
              <Typography sx={{ fontSize: '0.8125rem', color: '#64748b', mt: 0.25 }}>
                Monthly breakdown for the last 6 months
              </Typography>
            </Box>
            <Tooltip title="Download CSV" placement="top" arrow>
              <span>
                <Button
                  size="small"
                  startIcon={<DownloadOutlinedIcon sx={{ fontSize: '15px !important' }} />}
                  onClick={handleDownloadCSV}
                  variant="outlined"
                  disabled={hasNoData}
                  sx={{
                    borderColor: '#e2e8f0',
                    color: '#475569',
                    fontSize: '0.8125rem',
                    textTransform: 'none',
                    flexShrink: 0,
                    '&:hover': { borderColor: '#cbd5e1', backgroundColor: '#f8fafc' },
                  }}
                >
                  Download CSV
                </Button>
              </span>
            </Tooltip>
          </Box>

          <Box sx={{ height: 220, mt: 2, position: 'relative' }}>
            {hasNoData && (
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1,
                  zIndex: 1,
                }}
              >
                <BarChartIcon sx={{ fontSize: 36, color: '#e2e8f0' }} />
                <Typography sx={{ fontSize: '0.875rem', color: '#94a3b8' }}>
                  No spending data yet
                </Typography>
              </Box>
            )}
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                barCategoryGap="30%"
                margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
              >
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#94a3b8' }}
                />
                <YAxis hide />
                <RechartsTooltip
                  cursor={{ fill: 'rgba(16,185,129,0.04)' }}
                  contentStyle={{
                    border: '1px solid #e2e8f0',
                    borderRadius: 8,
                    fontSize: 12,
                    color: '#0f172a',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  }}
                  formatter={(value) => [fmt(Number(value)), 'Spent']}
                />
                <Bar dataKey="amount" radius={[6, 6, 0, 0]} minPointSize={2}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.isCurrent ? '#10b981' : entry.amount > 0 ? '#cbd5e1' : '#f1f5f9'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Paper>

        {/* Categories */}
        <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '14px', p: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <BarChartIcon sx={{ fontSize: 18, color: '#10b981' }} />
            <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>
              Categories
            </Typography>
          </Box>
          <Typography sx={{ fontSize: '0.8125rem', color: '#64748b', mb: 2.5 }}>
            Expense distribution
          </Typography>

          {categoryRows.length === 0 ? (
            <Box
              sx={{
                py: 4,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <InboxOutlinedIcon sx={{ fontSize: 32, color: '#e2e8f0' }} />
              <Typography sx={{ fontSize: '0.8125rem', color: '#94a3b8', textAlign: 'center' }}>
                Submit expenses to see category breakdown
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {categoryRows.map((cat) => (
                <Box key={cat.key}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.625 }}>
                    <Typography sx={{ fontSize: '0.875rem', color: '#1e293b', fontWeight: 500 }}>
                      {cat.label}
                    </Typography>
                    <Typography sx={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 600 }}>
                      {cat.pct}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={cat.pct}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: '#f1f5f9',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 3,
                        backgroundColor: cat.color,
                      },
                    }}
                  />
                </Box>
              ))}
            </Box>
          )}

          {categoryRows.length > 0 && (
            <>
              <Divider sx={{ mt: 2.5, mb: 2 }} />
              <Button
                fullWidth
                sx={{
                  color: '#10b981',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  textTransform: 'none',
                  '&:hover': { backgroundColor: 'rgba(16,185,129,0.06)' },
                }}
              >
                View Detailed Analysis
              </Button>
            </>
          )}
        </Paper>
      </Box>

      {/* Recent Activity */}
      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden' }}>
        {/* Card header with search */}
        <Box
          sx={{
            px: 3,
            pt: 2.5,
            pb: 2,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1.5,
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>
              Recent Activity
            </Typography>
            <Typography sx={{ fontSize: '0.8125rem', color: '#64748b', mt: 0.25 }}>
              {allActivity.length === 0
                ? 'No expense submissions yet'
                : `${filteredActivity.length} of ${allActivity.length} record${allActivity.length !== 1 ? 's' : ''}${searchQuery ? ' matched' : ''}`}
            </Typography>
          </Box>

          {/* Search input */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              px: 1.25,
              height: 36,
              gap: 0.5,
              flex: '1 1 220px',
              maxWidth: 340,
            }}
          >
            <InputAdornment position="start">
              <SearchIcon sx={{ fontSize: 16, color: '#94a3b8' }} />
            </InputAdornment>
            <InputBase
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search by merchant, category, status…"
              sx={{ fontSize: '0.8125rem', color: '#475569', flex: 1 }}
              inputProps={{ 'aria-label': 'Search recent activity' }}
            />
            {searchQuery && (
              <IconButton
                size="small"
                onClick={() => handleSearchChange('')}
                sx={{ p: 0.25, color: '#94a3b8', '&:hover': { color: '#475569' } }}
                aria-label="Clear search"
              >
                <CloseIcon sx={{ fontSize: 14 }} />
              </IconButton>
            )}
          </Box>
        </Box>

        <Divider />

        {allActivity.length === 0 ? (
          <Box
            sx={{
              py: 8,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1.5,
            }}
          >
            <InboxOutlinedIcon sx={{ fontSize: 48, color: '#e2e8f0' }} />
            <Typography sx={{ fontWeight: 600, color: '#94a3b8', fontSize: '0.9375rem' }}>
              No expense submissions yet
            </Typography>
            <Typography
              sx={{
                fontSize: '0.8125rem',
                color: '#b4c0cc',
                textAlign: 'center',
                maxWidth: 280,
              }}
            >
              Submit your first expense report and it will appear here.
            </Typography>
          </Box>
        ) : filteredActivity.length === 0 ? (
          <Box
            sx={{
              py: 6,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <SearchIcon sx={{ fontSize: 36, color: '#e2e8f0' }} />
            <Typography sx={{ fontWeight: 600, color: '#94a3b8', fontSize: '0.9375rem' }}>
              No results for &ldquo;{searchQuery}&rdquo;
            </Typography>
            <Button
              size="small"
              onClick={() => handleSearchChange('')}
              sx={{ color: '#10b981', textTransform: 'none', fontSize: '0.8125rem' }}
            >
              Clear search
            </Button>
          </Box>
        ) : (
          <>
            <Table size="small">
              <TableHead>
                <TableRow
                  sx={{
                    '& th': {
                      fontWeight: 700,
                      color: '#475569',
                      fontSize: '0.75rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      borderBottom: '1px solid #f1f5f9',
                      backgroundColor: '#fafbfc',
                    },
                  }}
                >
                  <TableCell>Date</TableCell>
                  <TableCell>Merchant</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell sx={{ width: 48 }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedActivity.map((row) => {
                  const cfg = STATUS_CONFIG[row.status]
                  const catColor = getCategoryColor(row.category, settings.categories)
                  const catLabel = getCategoryLabel(row.category, settings.categories)
                  return (
                    <TableRow
                      key={row.id}
                      sx={{
                        '&:last-child td': { borderBottom: 'none' },
                        '&:hover': { backgroundColor: '#fafbfc' },
                      }}
                    >
                      <TableCell>
                        <Typography sx={{ fontSize: '0.875rem', color: '#475569' }}>
                          {fmtDate(row.date)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a' }}
                        >
                          {row.merchant}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={catLabel.toUpperCase()}
                          size="small"
                          sx={{
                            height: 22,
                            fontSize: '0.6875rem',
                            fontWeight: 700,
                            letterSpacing: '0.04em',
                            backgroundColor: catColor + '1a',
                            color: catColor,
                            border: `1px solid ${catColor}33`,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography
                          sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a' }}
                        >
                          {fmt(row.amount)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                          <Box
                            sx={{
                              width: 7,
                              height: 7,
                              borderRadius: '50%',
                              backgroundColor: cfg.dot,
                              flexShrink: 0,
                            }}
                          />
                          <Typography
                            sx={{ fontSize: '0.8125rem', color: cfg.color, fontWeight: 500 }}
                          >
                            {cfg.label}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <IconButton size="small" sx={{ color: '#94a3b8' }}>
                          <MoreVertIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>

            {filteredActivity.length > PAGE_SIZE && (
              <TablePagination
                component="div"
                count={filteredActivity.length}
                page={activityPage}
                onPageChange={(_e, newPage) => setActivityPage(newPage)}
                rowsPerPage={PAGE_SIZE}
                rowsPerPageOptions={[PAGE_SIZE]}
                sx={{
                  borderTop: '1px solid #f1f5f9',
                  '& .MuiTablePagination-toolbar': { minHeight: 48, px: 2 },
                  '& .MuiTablePagination-displayedRows': {
                    fontSize: '0.8125rem',
                    color: '#64748b',
                  },
                  '& .MuiTablePagination-actions': { ml: 1 },
                }}
              />
            )}
          </>
        )}
      </Paper>
    </Box>
  )
}

// -- StatCard ------------------------------------------------------------------
interface StatCardProps {
  icon: React.ReactNode
  iconBg: string
  label: string
  value: string
  sub: React.ReactNode
  valueSx?: object
}

function StatCard({ icon, iconBg, label, value, sub, valueSx }: StatCardProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        border: '1px solid #e2e8f0',
        borderRadius: '14px',
        p: 2.5,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 2,
      }}
    >
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: '12px',
          backgroundColor: iconBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          sx={{
            fontSize: '0.6875rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#64748b',
            mb: 0.5,
          }}
        >
          {label}
        </Typography>
        <Typography
          sx={{
            fontSize: '1.625rem',
            fontWeight: 800,
            color: '#0f172a',
            lineHeight: 1.1,
            letterSpacing: '-0.01em',
            mb: 0.5,
            ...valueSx,
          }}
        >
          {value}
        </Typography>
        {sub}
      </Box>
    </Paper>
  )
}
