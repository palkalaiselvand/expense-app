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
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import { loadSubmissions, deleteSubmission } from '../../utils/storage'
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

  const baseRows: ReportRow[] = allRealRows

  // ── date range filter (one month selector, opt-in) ───────────────────────
  const [filterYear, setFilterYear] = useState(today.getFullYear())
  const [filterMonth, setFilterMonth] = useState(today.getMonth())
  const [filterActive, setFilterActive] = useState(false)

  const [tabValue, setTabValue] = useState<TabValue>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(0)
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)
  const [menuRowId, setMenuRowId] = useState<string | null>(null)
  const [deleteDlgOpen, setDeleteDlgOpen] = useState(false)
  const [bannerVisible, setBannerVisible] = useState(true)

  const handleSearchChange = useCallback((val: string) => { setSearchQuery(val); setPage(0) }, [])

  const prevMonth = () => {
    setFilterActive(true)
    if (filterMonth === 0) { setFilterYear((y) => y - 1); setFilterMonth(11) }
    else setFilterMonth((m) => m - 1)
    setPage(0)
  }
  const nextMonth = () => {
    setFilterActive(true)
    if (filterMonth === 11) { setFilterYear((y) => y + 1); setFilterMonth(0) }
    else setFilterMonth((m) => m + 1)
    setPage(0)
  }

  // ── filtered rows ─────────────────────────────────────────────────────────
  const filteredRows = useMemo(() => {
    let rows = baseRows

    if (filterActive) {
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
  }, [baseRows, filterActive, filterYear, filterMonth, tabValue, searchQuery])

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

  // ── CSV export ───────────────────────────────────────────────────────────────
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

  // ── print report (FinCorp styled reimbursement form) ─────────────────────
  const handlePrintReport = useCallback((row: ReportRow) => {
    const sub = submissions.find((s) => s.id === row.id)
    const catMap = Object.fromEntries(settings.categories.map((c) => [c.key, c.label]))
    const catColors: Record<string, string> = Object.fromEntries(settings.categories.map((c) => [c.key, c.color]))
    const reportId = `EXP-${new Date(row.submittedAt).getFullYear()}-${row.id.slice(-4).toUpperCase()}-AC`
    const submissionDate = fmtDate(row.submittedAt)
    const auditRef = `#FC-${row.id.slice(-6, -3).toUpperCase()}-${new Date(row.submittedAt).getFullYear().toString().slice(-2)}`
    const statusStyle = row.status === 'Approved'
      ? 'background:#dcfce7;color:#059669'
      : row.status === 'Rejected'
        ? 'background:#fee2e2;color:#dc2626'
        : row.status === 'Pending Review'
          ? 'background:#e0e7ff;color:#6366f1'
          : 'background:#f1f5f9;color:#64748b'

    const itemRows = (sub?.lineItems ?? []).map((li, i) => {
      const catLabel = catMap[li.category] ?? li.category ?? '—'
      const catColor = catColors[li.category] ?? '#64748b'
      const rcId = li.attachmentFileName ? `#RC-${String(i + 1).padStart(5, '9')}${(i * 7 + 22) % 10}` : '—'
      const formattedDate = li.date
        ? new Date(li.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : '—'
      return `<tr>
        <td class="td-date">${formattedDate}</td>
        <td><span class="cat-chip" style="background:${catColor}22;color:${catColor};border:1px solid ${catColor}44">${catLabel.toUpperCase()}</span></td>
        <td class="td-merchant">${li.merchant || '—'}</td>
        <td class="td-desc" style="color:#10b981">${li.description || '—'}</td>
        <td class="td-amount">${fmt(li.amount)}</td>
        <td class="td-rc">${rcId}</td>
      </tr>`
    }).join('')

    const receiptItems = (sub?.lineItems ?? []).filter((li) => li.attachmentFileName)
    const extraCount = Math.max(0, receiptItems.length - 2)
    const receiptPreview = receiptItems.length === 0
      ? '<p style="color:#94a3b8;font-size:13px">No receipts attached to this report.</p>'
      : `<div class="receipt-grid">
          ${receiptItems.slice(0, 2).map((_li, i) => `
            <div class="receipt-thumb">
              <div class="receipt-img-placeholder">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke="#94a3b8" stroke-width="1.5"/><path d="M3 9h18M9 21V9" stroke="#94a3b8" stroke-width="1.5"/></svg>
              </div>
              <div class="receipt-label">#RC-${String(i + 1).padStart(5, '9')}${(i * 7 + 22) % 10}</div>
            </div>`).join('')}
          ${extraCount > 0 ? `<div class="receipt-thumb receipt-more">
            <div class="receipt-img-placeholder more-placeholder">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none"><path d="M4 16l4-4 4 4 4-8 4 4" stroke="#94a3b8" stroke-width="1.5" stroke-linejoin="round"/></svg>
            </div>
            <div class="receipt-label">+ ${extraCount} More</div>
          </div>` : ''}
        </div>`

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>${row.name} – ${reportId}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Arial',sans-serif;background:#fff;color:#1e293b;font-size:13px;padding:32px 40px}
  .page-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px}
  .logo-row{display:flex;align-items:center;gap:10px}
  .logo-box{width:34px;height:34px;background:#0f172a;border-radius:8px;display:flex;align-items:center;justify-content:center}
  .company-name{font-size:15px;font-weight:700;color:#0f172a}
  .report-meta{text-align:right}
  .report-meta .label{font-size:9px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8}
  .report-meta .value{font-size:13px;font-weight:700;color:#0f172a;font-family:monospace}
  .doc-title{font-size:26px;font-weight:800;color:#0f172a;letter-spacing:-.5px;margin:10px 0 2px}
  .doc-subtitle{font-size:11px;color:#64748b}
  hr{border:none;border-top:2px solid #e2e8f0;margin:14px 0}
  .info-grid{display:grid;grid-template-columns:1fr 300px;gap:16px;margin-bottom:24px}
  .employee-box{border:1px solid #e2e8f0;border-radius:10px;padding:16px}
  .employee-box .section-label{font-size:9px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#64748b;margin-bottom:12px}
  .emp-fields{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .emp-field .fl{font-size:9px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:.06em;margin-bottom:2px}
  .emp-field .fv{font-size:13px;font-weight:700;color:#0f172a}
  .summary-box{background:#064e3b;border-radius:10px;padding:16px;color:#fff;position:relative;overflow:hidden}
  .summary-box::after{content:'';position:absolute;width:160px;height:160px;border-radius:50%;border:1px solid rgba(255,255,255,.08);top:-60px;right:-60px}
  .summary-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}
  .summary-header .sl{font-size:9px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#6ee7b7}
  .status-badge{font-size:9px;font-weight:800;letter-spacing:.05em;padding:3px 9px;border-radius:20px;text-transform:uppercase;${statusStyle}}
  .summary-amount{font-size:36px;font-weight:800;color:#fff;letter-spacing:-1px;line-height:1;margin-bottom:4px}
  .summary-sub{font-size:10px;color:#a7f3d0;margin-bottom:14px}
  .summary-pills{display:flex;gap:20px}
  .summary-pill .pl{font-size:9px;color:#6ee7b7;font-weight:700;text-transform:uppercase;letter-spacing:.06em;margin-bottom:2px}
  .summary-pill .pv{font-size:14px;font-weight:800;color:#fff}
  .section-heading{font-size:15px;font-weight:700;color:#0f172a;border-left:4px solid #10b981;padding-left:10px;margin-bottom:12px}
  table{width:100%;border-collapse:collapse}
  thead tr{background:#f8fafc}
  th{font-size:9px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#64748b;padding:10px 12px;text-align:left;border-bottom:2px solid #e2e8f0}
  td{padding:10px 12px;border-bottom:1px solid #f1f5f9;vertical-align:top}
  tr:last-child td{border-bottom:none}
  .td-date{color:#475569;white-space:nowrap;font-size:12px}
  .td-merchant{font-weight:700;color:#0f172a}
  .td-desc{color:#10b981;font-size:12px}
  .td-amount{font-weight:700;color:#0f172a;text-align:right;white-space:nowrap}
  .td-rc{color:#94a3b8;font-size:11px;font-family:monospace;text-align:right;white-space:nowrap}
  .cat-chip{display:inline-block;padding:2px 8px;border-radius:4px;font-size:9px;font-weight:800;letter-spacing:.05em;white-space:nowrap}
  .subtotal-row td{background:#f8fafc;font-weight:700;color:#0f172a;border-top:2px solid #e2e8f0;padding:12px}
  .subtotal-label{text-align:right;font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#475569}
  .subtotal-amount{text-align:right;font-size:18px;font-weight:800;color:#0f172a}
  .receipts-section{margin-top:24px}
  .receipt-grid{display:flex;gap:12px;flex-wrap:wrap;margin-top:10px}
  .receipt-thumb{width:130px;border-radius:8px;overflow:hidden;border:1px solid #e2e8f0}
  .receipt-img-placeholder{height:100px;background:#f8fafc;display:flex;align-items:center;justify-content:center}
  .more-placeholder{background:#f1f5f9;flex-direction:column;gap:4px}
  .receipt-label{background:#0f172a;color:#fff;font-size:10px;font-weight:700;padding:4px 8px;font-family:monospace}
  .sig-section{display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-top:28px}
  .sig-block .sig-heading{font-size:9px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#64748b;margin-bottom:16px}
  .sig-line{border-bottom:1px solid #1e293b;margin-bottom:6px;height:32px;display:flex;align-items:flex-end;padding-bottom:4px;font-style:italic;font-size:13px;color:#475569}
  .sig-name{font-size:13px;font-weight:700;color:#0f172a}
  .sig-date-blank{border-bottom:1px solid #94a3b8;display:inline-block;width:120px}
  .attestation-text{font-size:10px;color:#475569;line-height:1.5;margin-top:10px}
  .page-footer{display:flex;justify-content:space-between;align-items:center;margin-top:28px;padding-top:12px;border-top:1px solid #e2e8f0}
  .page-footer span{font-size:9px;color:#94a3b8;font-weight:600;letter-spacing:.05em;text-transform:uppercase}
  .page-num{display:flex;align-items:center;gap:6px}
  .page-num::before{content:'';width:8px;height:8px;border-radius:50%;background:#10b981;display:inline-block}
  @media print{body{padding:20px 28px}@page{margin:0}}
</style>
</head>
<body>
  <div class="page-header">
    <div>
      <div class="logo-row">
        <div class="logo-box">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#10b981" stroke-width="2" stroke-linejoin="round"/>
          </svg>
        </div>
        <span class="company-name">FinCorp</span>
      </div>
    </div>
    <div class="report-meta">
      <div class="label">Report ID</div>
      <div class="value">${reportId}</div>
      <div class="label" style="margin-top:8px">Submission Date</div>
      <div class="value" style="font-family:Arial;font-size:12px">${submissionDate}</div>
    </div>
  </div>
  <div class="doc-title">EXPENSE REIMBURSEMENT FORM</div>
  <div class="doc-subtitle">Official Document for <span style="color:#10b981">Financial Audit</span> and <span style="color:#10b981">Payroll Processing</span>${row.billableToClient ? ' &nbsp;●&nbsp; <strong style="color:#10b981">Client Billable</strong>' : ''}</div>
  <hr/>
  <div class="info-grid">
    <div class="employee-box">
      <div class="section-label">Employee Information</div>
      <div class="emp-fields">
        <div class="emp-field"><div class="fl">Name</div><div class="fv">Alex Thompson</div></div>
        <div class="emp-field"><div class="fl">Department</div><div class="fv">Product</div></div>
        <div class="emp-field"><div class="fl">Employee ID</div><div class="fv">EMP-0001</div></div>
        <div class="emp-field"><div class="fl">Email</div><div class="fv">a.thompson@fincorp.com</div></div>
      </div>
    </div>
    <div class="summary-box">
      <div class="summary-header">
        <span class="sl">Report Summary</span>
        <span class="status-badge">${row.status}</span>
      </div>
      <div class="summary-amount">${fmt(row.totalAmount)}</div>
      <div class="summary-sub">Total Reimbursement Amount</div>
      <div class="summary-pills">
        <div class="summary-pill"><div class="pl">Items</div><div class="pv">${row.itemCount} Total</div></div>
        <div class="summary-pill"><div class="pl">Currency</div><div class="pv">USD ($)</div></div>
      </div>
    </div>
  </div>
  <div class="section-heading">Expense Details</div>
  <table>
    <thead>
      <tr>
        <th>Date</th><th>Category</th><th>Merchant</th><th>Description</th>
        <th style="text-align:right">Amount</th><th style="text-align:right">Receipt ID</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
    <tr class="subtotal-row">
      <td colspan="4" class="subtotal-label">Subtotal Reimbursement Amount</td>
      <td class="subtotal-amount">${fmt(row.totalAmount)}</td>
      <td></td>
    </tr>
  </table>
  <div class="receipts-section">
    <div class="section-heading" style="margin-top:0">Attached Receipts Preview</div>
    ${receiptPreview}
  </div>
  <div class="sig-section">
    <div class="sig-block">
      <div class="sig-heading">1. Employee Attestation</div>
      <div class="sig-line">Alex Thompson (Digital Signature)</div>
      <div class="sig-name">Alex Thompson</div>
      <div style="margin-top:4px;font-size:12px;color:#475569">Date: ${new Date(row.submittedAt).toLocaleDateString('en-US')}</div>
      <div class="attestation-text">I certify that the above expenses were incurred while on official company business and that they are accurate and comply with the corporate expense policy.</div>
    </div>
    <div class="sig-block">
      <div class="sig-heading">2. Department Head Approval</div>
      <div class="sig-line">&nbsp;</div>
      <div class="sig-name">Name: <span class="sig-date-blank"></span></div>
      <div style="margin-top:4px;font-size:12px;color:#475569">Date: <span class="sig-date-blank" style="width:80px"></span></div>
      <div class="attestation-text">I have reviewed these expenses and confirm they are necessary and appropriate for the departmental budget as specified in current fiscal guidelines.</div>
    </div>
  </div>
  <div class="page-footer">
    <span>Confidential – For Internal Use Only</span>
    <span class="page-num">Page 1 of 1</span>
    <span>FinCoreAudit Control: ${auditRef}</span>
  </div>
</body>
</html>`
    const w = window.open('', '_blank')
    if (w) { w.document.write(html); w.document.close(); w.print() }
  }, [submissions, settings.categories])

  // ── delete report ──────────────────────────────────────────────────────────────
  const handleDeleteConfirm = useCallback(() => {
    if (!menuRowId) return
    deleteSubmission(menuRowId)
    setSubmissions(loadSubmissions())
    setDeleteDlgOpen(false)
    setMenuRowId(null)
  }, [menuRowId])

  const daysInMonth = new Date(filterYear, filterMonth + 1, 0).getDate()
  const dateRangeLabel = filterActive
    ? `${MONTHS_SHORT[filterMonth]} 1 – ${MONTHS_SHORT[filterMonth]} ${daysInMonth}, ${filterYear}`
    : 'All Periods'

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
              {fmt(ytdApproved)}
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
              {activeCount}
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
              <Tooltip title={filterActive ? 'Showing previous month' : 'Filter by month (go back)'}>
                <IconButton size="small" onClick={prevMonth} sx={{ p: 0.25, color: '#64748b' }}>
                  <ChevronLeftIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mx: 0.5 }}>
                <CalendarTodayOutlinedIcon sx={{ fontSize: 13, color: '#94a3b8' }} />
                <Typography sx={{ fontSize: '0.8125rem', color: '#475569', whiteSpace: 'nowrap', fontWeight: 500 }}>
                  {dateRangeLabel}
                </Typography>
                {filterActive && (
                  <Tooltip title="Show all periods">
                    <IconButton size="small" onClick={() => { setFilterActive(false); setPage(0) }}
                      sx={{ p: 0.25, color: '#10b981', ml: 0.25 }}>
                      <CloseIcon sx={{ fontSize: 12 }} />
                    </IconButton>
                  </Tooltip>
                )}
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
                            onClick={(e) => { e.stopPropagation(); setMenuAnchor(e.currentTarget); setMenuRowId(row.id) }}
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

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => { setMenuAnchor(null) }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          elevation: 2,
          sx: { borderRadius: '10px', minWidth: 170, border: '1px solid #f1f5f9' },
        }}
      >
        {(() => {
          const activeRow = baseRows.find((r) => r.id === menuRowId)
          return [
            <MenuItem key="view" onClick={() => { if (activeRow) handlePrintReport(activeRow); setMenuAnchor(null) }}
              sx={{ fontSize: '0.875rem', gap: 1.5, py: 1 }}>
              <PrintOutlinedIcon sx={{ fontSize: 16, color: '#64748b' }} />
              View / Print Report
            </MenuItem>,
            <MenuItem key="csv" onClick={() => { handleExportCSV(); setMenuAnchor(null) }}
              sx={{ fontSize: '0.875rem', gap: 1.5, py: 1 }}>
              <DownloadOutlinedIcon sx={{ fontSize: 16, color: '#64748b' }} />
              Download CSV
            </MenuItem>,
            <Divider key="divider" />,
            <MenuItem key="delete" onClick={() => { setMenuAnchor(null); setDeleteDlgOpen(true) }}
              sx={{ fontSize: '0.875rem', gap: 1.5, py: 1, color: '#dc2626' }}>
              <DeleteOutlineIcon sx={{ fontSize: 16 }} />
              Delete Report
            </MenuItem>,
          ]
        })()}
      </Menu>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDlgOpen} onClose={() => setDeleteDlgOpen(false)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: '14px' } }}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a', pb: 1 }}>
          Delete Report?
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: '0.875rem', color: '#475569' }}>
            {(() => {
              const r = baseRows.find((row) => row.id === menuRowId)
              return r
                ? <>Permanently delete <strong>{r.name}</strong> ({fmt(r.totalAmount)})? This action cannot be undone.</>
                : 'This action cannot be undone.'
            })()}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setDeleteDlgOpen(false)}
            sx={{ textTransform: 'none', color: '#64748b', fontWeight: 600 }}>Cancel</Button>
          <Button variant="contained" onClick={handleDeleteConfirm}
            sx={{ textTransform: 'none', fontWeight: 700, backgroundColor: '#dc2626',
              '&:hover': { backgroundColor: '#b91c1c' } }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

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
