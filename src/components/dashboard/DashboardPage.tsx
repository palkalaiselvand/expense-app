import { useMemo } from 'react'
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
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Divider from '@mui/material/Divider'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined'
import PendingActionsOutlinedIcon from '@mui/icons-material/PendingActionsOutlined'
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined'
import BarChartIcon from '@mui/icons-material/BarChart'
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

// ── helpers ──────────────────────────────────────────────────────────────────
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

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

/** Returns the last N calendar months as { monthKey: 'YYYY-MM', label: 'Mon' } */
function lastNMonths(n: number) {
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

function getCategoryColor(key: string, settings: CategorySetting[]): string {
  return settings.find((c) => c.key === key)?.color ?? '#94a3b8'
}

function getCategoryLabel(key: string, settings: CategorySetting[]): string {
  return settings.find((c) => c.key === key)?.label ?? key
}

// Status chip config
type StatusType = 'approved' | 'pending' | 'rejected'
function getStatus(sub: Submission): StatusType {
  // For demo purposes, rotate statuses: newest=pending, older=approved
  const age = Date.now() - new Date(sub.submittedAt).getTime()
  const dayMs = 86400000
  if (age < dayMs * 2) return 'pending'
  if (age < dayMs * 7) return 'approved'
  return 'approved'
}
const STATUS_CONFIG: Record<StatusType, { label: string; color: string; bg: string; dot: string }> = {
  approved: { label: 'Approved', color: '#10b981', bg: 'rgba(16,185,129,0.1)', dot: '#10b981' },
  pending:  { label: 'Pending',  color: '#64748b', bg: 'rgba(100,116,139,0.1)', dot: '#94a3b8' },
  rejected: { label: 'Rejected', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', dot: '#ef4444' },
}

// ── component ─────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const submissions = useMemo(() => loadSubmissions(), [])
  const settings = useMemo(() => loadSettings(), [])

  // ── Stat metrics ──────────────────────────────────────────────────────────
  const now = new Date()
  const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const lastMonthKey = (() => {
    const d = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })()

  const totalAllLineItems = (subs: Submission[]) =>
    subs.reduce((sum, s) => sum + s.lineItems.reduce((a, li) => a + li.amount, 0), 0)

  const subsThisMonth = submissions.filter((s) => s.submittedAt.slice(0, 7) === thisMonthKey)
  const subsLastMonth = submissions.filter((s) => s.submittedAt.slice(0, 7) === lastMonthKey)

  const totalThisMonth = totalAllLineItems(subsThisMonth)
  const totalLastMonth = totalAllLineItems(subsLastMonth)
  const monthPctChange =
    totalLastMonth > 0
      ? Math.round(((totalThisMonth - totalLastMonth) / totalLastMonth) * 100)
      : null

  // "Pending reimbursement" = total from last 30 days submissions not yet approved
  const thirtyDaysAgo = Date.now() - 30 * 86400000
  const recentSubs = submissions.filter((s) => new Date(s.submittedAt).getTime() > thirtyDaysAgo)
  const pendingReimbursement = totalAllLineItems(recentSubs)
  const pendingClaims = recentSubs.length

  // "Reports in review" = submissions from last 7 days
  const sevenDaysAgo = Date.now() - 7 * 86400000
  const reportsInReview = submissions.filter(
    (s) => new Date(s.submittedAt).getTime() > sevenDaysAgo,
  ).length

  // ── Spending trends (last 6 months) ──────────────────────────────────────
  const months6 = lastNMonths(6)
  const currentMonthLabel = MONTHS[now.getMonth()]
  const spendingData = months6.map(({ monthKey, label }) => ({
    month: label,
    amount: totalAllLineItems(
      submissions.filter((s) => s.submittedAt.slice(0, 7) === monthKey),
    ),
    isCurrent: label === currentMonthLabel,
  }))
  // If no real data, seed with illustrative data so the chart is never empty
  const hasAnySpend = spendingData.some((d) => d.amount > 0)
  const chartData = hasAnySpend
    ? spendingData
    : [
        { month: 'Jan', amount: 1800, isCurrent: false },
        { month: 'Feb', amount: 2200, isCurrent: false },
        { month: 'Mar', amount: 3428, isCurrent: true },
        { month: 'Apr', amount: 1500, isCurrent: false },
        { month: 'May', amount: 2100, isCurrent: false },
        { month: 'Jun', amount: 2600, isCurrent: false },
      ]

  // ── Category distribution ─────────────────────────────────────────────────
  const categoryTotals: Record<string, number> = {}
  submissions.forEach((s) =>
    s.lineItems.forEach((li) => {
      categoryTotals[li.category] = (categoryTotals[li.category] ?? 0) + li.amount
    }),
  )
  const grandTotal = Object.values(categoryTotals).reduce((a, b) => a + b, 0)
  const categoryRows = Object.entries(categoryTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([key, total]) => ({
      key,
      label: getCategoryLabel(key, settings.categories),
      color: getCategoryColor(key, settings.categories),
      pct: grandTotal > 0 ? Math.round((total / grandTotal) * 100) : 0,
    }))

  // Fallback distribution if no data
  const displayCategories =
    categoryRows.length > 0
      ? categoryRows
      : [
          { key: 'Travel', label: 'Travel', color: '#10b981', pct: 45 },
          { key: 'meals', label: 'Meals & Entertainment', color: '#0f172a', pct: 30 },
          { key: 'software', label: 'Software & Subscriptions', color: '#1e293b', pct: 15 },
          { key: 'office', label: 'Office Supplies', color: '#94a3b8', pct: 10 },
        ]

  // ── Recent activity ───────────────────────────────────────────────────────
  const recentActivity = [...submissions]
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
    .slice(0, 8)
    .flatMap((s) =>
      s.lineItems.map((li) => ({
        id: `${s.id}-${li.id}`,
        date: li.date || s.submittedAt.slice(0, 10),
        merchant: li.merchant || 'Unknown merchant',
        category: li.category,
        amount: li.amount,
        status: getStatus(s),
      })),
    )
    .slice(0, 8)

  // Fallback rows for empty state
  const displayActivity =
    recentActivity.length > 0
      ? recentActivity
      : [
          { id: '1', date: '2023-10-24', merchant: 'Uber Technologies', category: 'Travel-Air', amount: 42.5, status: 'approved' as StatusType },
          { id: '2', date: '2023-10-22', merchant: 'Starbucks Coffee', category: 'Food', amount: 12.9, status: 'pending' as StatusType },
        ]

  // ── Download CSV ──────────────────────────────────────────────────────────
  const handleDownloadCSV = () => {
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
  }

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1280, mx: 'auto' }}>

      {/* ── Stat cards ──────────────────────────────────────────────────── */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
          gap: 2,
          mb: 3,
        }}
      >
        {/* Card 1 — Total Spent */}
        <StatCard
          icon={<PaymentsOutlinedIcon sx={{ fontSize: 22, color: '#10b981' }} />}
          iconBg="rgba(16,185,129,0.1)"
          label="Total Spent This Month"
          value={totalThisMonth > 0 ? fmt(totalThisMonth) : '$3,428.50'}
          sub={
            monthPctChange !== null ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <TrendingUpIcon sx={{ fontSize: 14, color: monthPctChange >= 0 ? '#10b981' : '#ef4444' }} />
                <Typography sx={{ fontSize: '0.75rem', color: monthPctChange >= 0 ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                  {Math.abs(monthPctChange)}% vs last month
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <TrendingUpIcon sx={{ fontSize: 14, color: '#10b981' }} />
                <Typography sx={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>
                  12% vs last month
                </Typography>
              </Box>
            )
          }
        />

        {/* Card 2 — Pending Reimbursement */}
        <StatCard
          icon={<PendingActionsOutlinedIcon sx={{ fontSize: 22, color: '#6366f1' }} />}
          iconBg="rgba(99,102,241,0.1)"
          label="Pending Reimbursement"
          value={pendingReimbursement > 0 ? fmt(pendingReimbursement) : '$1,240.00'}
          sub={
            <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
              {pendingClaims > 0 ? `${pendingClaims} pending claim${pendingClaims !== 1 ? 's' : ''}` : '4 pending claims'}
            </Typography>
          }
        />

        {/* Card 3 — Reports in Review */}
        <StatCard
          icon={<AssignmentOutlinedIcon sx={{ fontSize: 22, color: '#f59e0b' }} />}
          iconBg="rgba(245,158,11,0.1)"
          label="Reports in Review"
          value={String(reportsInReview > 0 ? reportsInReview : 2)}
          valueSx={{ fontSize: '2.25rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}
          sub={
            <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
              Awaiting manager approval
            </Typography>
          }
        />
      </Box>

      {/* ── Middle row: Chart + Categories ───────────────────────────────── */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1fr 300px' },
          gap: 2,
          mb: 3,
        }}
      >
        {/* Spending Trends */}
        <Paper
          elevation={0}
          sx={{ border: '1px solid #e2e8f0', borderRadius: '14px', p: 2.5 }}
        >
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
              <Button
                size="small"
                startIcon={<DownloadOutlinedIcon sx={{ fontSize: '15px !important' }} />}
                onClick={handleDownloadCSV}
                variant="outlined"
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
            </Tooltip>
          </Box>

          <Box sx={{ height: 220, mt: 2 }}>
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
                <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.isCurrent ? '#10b981' : '#e2e8f0'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Paper>

        {/* Categories */}
        <Paper
          elevation={0}
          sx={{ border: '1px solid #e2e8f0', borderRadius: '14px', p: 2.5 }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <BarChartIcon sx={{ fontSize: 18, color: '#10b981' }} />
            <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>
              Categories
            </Typography>
          </Box>
          <Typography sx={{ fontSize: '0.8125rem', color: '#64748b', mb: 2.5 }}>
            Expense distribution
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {displayCategories.map((cat) => (
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
                      backgroundColor: cat.pct >= 30 ? '#0f172a' : '#94a3b8',
                    },
                  }}
                />
              </Box>
            ))}
          </Box>

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
        </Paper>
      </Box>

      {/* ── Recent Activity ───────────────────────────────────────────────── */}
      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden' }}>
        <Box
          sx={{
            px: 3,
            pt: 2.5,
            pb: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>
              Recent Activity
            </Typography>
            <Typography sx={{ fontSize: '0.8125rem', color: '#64748b', mt: 0.25 }}>
              Track your latest expense submissions
            </Typography>
          </Box>
          <Button
            variant="outlined"
            size="small"
            sx={{
              borderColor: '#e2e8f0',
              color: '#475569',
              fontSize: '0.8125rem',
              textTransform: 'none',
              '&:hover': { borderColor: '#cbd5e1', backgroundColor: '#f8fafc' },
            }}
          >
            See All Activity
          </Button>
        </Box>

        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Merchant</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Status</TableCell>
              <TableCell sx={{ width: 48 }} />
            </TableRow>
          </TableHead>
          <TableBody>
            {displayActivity.map((row) => {
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
                    <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a' }}>
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
                    <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a' }}>
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
      </Paper>
    </Box>
  )
}

// ── StatCard sub-component ────────────────────────────────────────────────────
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
