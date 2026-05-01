import { useState, useCallback, useMemo } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import Alert from '@mui/material/Alert'
import Divider from '@mui/material/Divider'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import Link from '@mui/material/Link'
import Collapse from '@mui/material/Collapse'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined'
import type { LineItem, LineItemErrors } from '../../types/expense'
import { validateAllLineItems } from '../../utils/validator'
import { saveSubmission } from '../../utils/storage'
import { loadSettings } from '../../utils/settings'
import LineItemsTable from './LineItemsTable'
import GlobalReceiptUpload from './GlobalReceiptUpload'
import PolicyReminder from './PolicyReminder'

// ── helpers ──────────────────────────────────────────────────────────────────
function createEmptyItem(): LineItem {
  const rand = Math.random().toString(36).slice(2, 7)
  return {
    id: `item-${Date.now()}-${rand}`,
    date: '',
    category: '',
    merchant: '',
    description: '',
    amount: '',
    attachmentFile: null,
    attachmentFileName: null,
  }
}

const FIELD_TO_ERROR_KEY: Partial<Record<keyof LineItem, keyof LineItemErrors>> = {
  date: 'date',
  category: 'category',
  merchant: 'merchant',
  description: 'description',
  amount: 'amount',
  attachmentFile: 'attachment',
}

// ── component ─────────────────────────────────────────────────────────────────
export default function ExpenseFormPage() {
  // Load settings once on mount; re-reads on each page navigation
  const [settings] = useState(() => loadSettings())
  const validKeys = useMemo(() => settings.categories.map((c) => c.key), [settings])
  const limitsMap = useMemo(
    () => Object.fromEntries(settings.categories.map((c) => [c.key, c.limit])),
    [settings],
  )

  const [lineItems, setLineItems] = useState<LineItem[]>([createEmptyItem()])
  const [globalFiles, setGlobalFiles] = useState<File[]>([])
  const [billableToClient, setBillableToClient] = useState(false)
  const [errors, setErrors] = useState<Record<string, LineItemErrors>>({})
  const [successId, setSuccessId] = useState<string | null>(null)
  const [storageError, setStorageError] = useState<string | null>(null)

  // Live running total
  const runningTotal = useMemo(
    () =>
      lineItems.reduce((sum, item) => {
        const val = parseFloat(item.amount)
        return sum + (Number.isFinite(val) && val > 0 ? val : 0)
      }, 0),
    [lineItems],
  )

  const hasErrors = Object.keys(errors).length > 0

  // ── handlers ───────────────────────────────────────────────────────────────
  const handleUpdate = useCallback((id: string, field: keyof LineItem, value: unknown) => {
    setLineItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    )
    // Clear only the affected field's error
    const errorKey = FIELD_TO_ERROR_KEY[field]
    if (errorKey) {
      setErrors((prev) => {
        const itemErrors = prev[id]
        if (!itemErrors) return prev
        const updated: LineItemErrors = { ...itemErrors }
        delete updated[errorKey]
        if (Object.keys(updated).length === 0) {
          const { [id]: _removed, ...rest } = prev
          return rest
        }
        return { ...prev, [id]: updated }
      })
    }
  }, [])

  const handleAdd = useCallback(() => {
    setLineItems((prev) => {
      if (prev.length >= settings.maxItemsPerReport) return prev
      return [...prev, createEmptyItem()]
    })
  }, [settings.maxItemsPerReport])

  const handleRemove = useCallback((id: string) => {
    setLineItems((prev) => prev.filter((item) => item.id !== id))
    setErrors((prev) => {
      const { [id]: _removed, ...rest } = prev
      return rest
    })
  }, [])

  const doSave = (validate: boolean) => {
    if (validate) {
      const { valid, errors: newErrors } = validateAllLineItems(lineItems, { validKeys, limitsMap })
      if (!valid) {
        setErrors(newErrors)
        return
      }
      if (runningTotal > settings.maxAmountPerReport) {
        setStorageError(
          `Total amount $${fmt(runningTotal)} exceeds the report maximum of $${fmt(settings.maxAmountPerReport)}.`,
        )
        return
      }
    }
    const result = saveSubmission(lineItems, billableToClient)
    if (result.success) {
      setSuccessId(result.id)
      setLineItems([createEmptyItem()])
      setGlobalFiles([])
      setBillableToClient(false)
      setErrors({})
      setStorageError(null)
    } else {
      setStorageError(result.error)
    }
  }

  // ── currency formatter ──────────────────────────────────────────────────────
  const fmt = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val)

  // ── print to PDF (FinCorp styled reimbursement form) ──────────────────────
  const handlePrint = useCallback(() => {
    const catMap = Object.fromEntries(settings.categories.map((c) => [c.key, c.label]))
    const reportId = `EXP-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}-AC`
    const submissionDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    const auditRef = `#FC-${String(Date.now()).slice(-6, -3)}-${new Date().getFullYear().toString().slice(-2)}`
    const totalItems = lineItems.length

    const catColors: Record<string, string> = Object.fromEntries(
      settings.categories.map((c) => [c.key, c.color])
    )

    const itemRows = lineItems.map((item, i) => {
      const amount = parseFloat(item.amount)
      const catLabel = catMap[item.category] ?? item.category ?? '—'
      const catColor = catColors[item.category] ?? '#64748b'
      const rcId = item.attachmentFileName
        ? `#RC-${String(i + 1).padStart(5, '9')}${(i * 7 + 22) % 10}`
        : '—'
      const formattedDate = item.date
        ? new Date(item.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : '—'
      return `<tr>
        <td class="td-date">${formattedDate}</td>
        <td><span class="cat-chip" style="background:${catColor}22;color:${catColor};border:1px solid ${catColor}44">${catLabel.toUpperCase()}</span></td>
        <td class="td-merchant">${item.merchant || '—'}</td>
        <td class="td-desc" style="color:#10b981">${item.description || '—'}</td>
        <td class="td-amount">${Number.isFinite(amount) && amount > 0 ? fmt(amount) : '—'}</td>
        <td class="td-rc">${rcId}</td>
      </tr>`
    }).join('')

    const receiptItems = lineItems.filter((li) => li.attachmentFileName)
    const extraCount = Math.max(0, receiptItems.length - 2)
    const receiptPreview = receiptItems.length === 0
      ? '<p style="color:#94a3b8;font-size:13px">No receipts attached to this report.</p>'
      : `<div class="receipt-grid">
          ${receiptItems.slice(0, 2).map((li, i) => `
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
<title>Expense Reimbursement Form – ${reportId}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Arial',sans-serif;background:#fff;color:#1e293b;font-size:13px;padding:32px 40px}
  /* ── Header ── */
  .page-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px}
  .logo-row{display:flex;align-items:center;gap:10px}
  .logo-box{width:34px;height:34px;background:#0f172a;border-radius:8px;display:flex;align-items:center;justify-content:center}
  .logo-box svg{display:block}
  .company-name{font-size:15px;font-weight:700;color:#0f172a}
  .report-meta{text-align:right}
  .report-meta .label{font-size:9px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8}
  .report-meta .value{font-size:13px;font-weight:700;color:#0f172a;font-family:monospace}
  .doc-title{font-size:26px;font-weight:800;color:#0f172a;letter-spacing:-.5px;margin:10px 0 2px}
  .doc-subtitle{font-size:11px;color:#64748b}
  .doc-subtitle a{color:#10b981}
  hr{border:none;border-top:2px solid #e2e8f0;margin:14px 0}
  /* ── Info grid ── */
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
  .ready-badge{background:#10b981;color:#fff;font-size:9px;font-weight:800;letter-spacing:.05em;padding:3px 9px;border-radius:20px;text-transform:uppercase}
  .summary-amount{font-size:36px;font-weight:800;color:#fff;letter-spacing:-1px;line-height:1;margin-bottom:4px}
  .summary-sub{font-size:10px;color:#a7f3d0;margin-bottom:14px}
  .summary-pills{display:flex;gap:20px}
  .summary-pill .pl{font-size:9px;color:#6ee7b7;font-weight:700;text-transform:uppercase;letter-spacing:.06em;margin-bottom:2px}
  .summary-pill .pv{font-size:14px;font-weight:800;color:#fff}
  /* ── Expense table ── */
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
  /* ── Receipts preview ── */
  .receipts-section{margin-top:24px}
  .receipt-grid{display:flex;gap:12px;flex-wrap:wrap;margin-top:10px}
  .receipt-thumb{width:130px;border-radius:8px;overflow:hidden;border:1px solid #e2e8f0}
  .receipt-img-placeholder{height:100px;background:#f8fafc;display:flex;align-items:center;justify-content:center}
  .more-placeholder{background:#f1f5f9;flex-direction:column;gap:4px}
  .receipt-label{background:#0f172a;color:#fff;font-size:10px;font-weight:700;padding:4px 8px;font-family:monospace}
  /* ── Signatures ── */
  .sig-section{display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-top:28px}
  .sig-block .sig-heading{font-size:9px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#64748b;margin-bottom:16px}
  .sig-line{border-bottom:1px solid #1e293b;margin-bottom:6px;height:32px;display:flex;align-items:flex-end;padding-bottom:4px;font-style:italic;font-size:13px;color:#475569}
  .sig-name{font-size:13px;font-weight:700;color:#0f172a}
  .sig-date-row{display:flex;gap:40px;margin-top:4px}
  .sig-date-row span{font-size:12px;color:#475569}
  .sig-date-blank{border-bottom:1px solid #94a3b8;display:inline-block;width:120px}
  .attestation-text{font-size:10px;color:#475569;line-height:1.5;margin-top:10px}
  /* ── Page footer ── */
  .page-footer{display:flex;justify-content:space-between;align-items:center;margin-top:28px;padding-top:12px;border-top:1px solid #e2e8f0}
  .page-footer span{font-size:9px;color:#94a3b8;font-weight:600;letter-spacing:.05em;text-transform:uppercase}
  .page-num{display:flex;align-items:center;gap:6px}
  .page-num::before{content:'';width:8px;height:8px;border-radius:50%;background:#10b981;display:inline-block}
  @media print{
    body{padding:20px 28px}
    @page{margin:0}
  }
</style>
</head>
<body>
  <!-- Header -->
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
  <div class="doc-subtitle">Official Document for <a>Financial Audit</a> and <a>Payroll Processing</a>${billableToClient ? ' &nbsp;●&nbsp; <strong style="color:#10b981">Client Billable</strong>' : ''}</div>
  <hr/>

  <!-- Info Grid -->
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
        <span class="ready-badge">Ready for Print</span>
      </div>
      <div class="summary-amount">${fmt(runningTotal)}</div>
      <div class="summary-sub">Total Reimbursement Amount</div>
      <div class="summary-pills">
        <div class="summary-pill"><div class="pl">Items</div><div class="pv">${totalItems} Total</div></div>
        <div class="summary-pill"><div class="pl">Currency</div><div class="pv">USD ($)</div></div>
      </div>
    </div>
  </div>

  <!-- Expense Details -->
  <div class="section-heading">Expense Details</div>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Category</th>
        <th>Merchant</th>
        <th>Description</th>
        <th style="text-align:right">Amount</th>
        <th style="text-align:right">Receipt ID</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
    <tr class="subtotal-row">
      <td colspan="4" class="subtotal-label">Subtotal Reimbursement Amount</td>
      <td class="subtotal-amount">${fmt(runningTotal)}</td>
      <td></td>
    </tr>
  </table>

  <!-- Receipts Preview -->
  <div class="receipts-section">
    <div class="section-heading" style="margin-top:0">Attached Receipts Preview</div>
    ${receiptPreview}
  </div>

  <!-- Signatures -->
  <div class="sig-section">
    <div class="sig-block">
      <div class="sig-heading">1. Employee Attestation</div>
      <div class="sig-line">Alex Thompson (Digital Signature)</div>
      <div class="sig-name">Alex Thompson</div>
      <div class="sig-date-row">
        <span>Date: ${new Date().toLocaleDateString('en-US')}</span>
      </div>
      <div class="attestation-text">I certify that the above expenses were incurred while on official company business and that they are accurate and comply with the corporate expense policy.</div>
    </div>
    <div class="sig-block">
      <div class="sig-heading">2. Department Head Approval</div>
      <div class="sig-line">&nbsp;</div>
      <div class="sig-name">Name: <span class="sig-date-blank"></span></div>
      <div class="sig-date-row">
        <span>Date: <span class="sig-date-blank" style="width:80px"></span></span>
      </div>
      <div class="attestation-text">I have reviewed these expenses and confirm they are necessary and appropriate for the departmental budget as specified in current fiscal guidelines.</div>
    </div>
  </div>

  <!-- Footer -->
  <div class="page-footer">
    <span>Confidential – For Internal Use Only</span>
    <span class="page-num">Page 1 of 1</span>
    <span>FinCoreAudit Control: ${auditRef}</span>
  </div>
</body>
</html>`
    const w = window.open('', '_blank')
    if (w) { w.document.write(html); w.document.close(); w.print() }
  }, [lineItems, billableToClient, runningTotal, fmt, settings.categories])

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <Box
      sx={{
        p: { xs: 2, sm: 3 },
        maxWidth: 1280,
        mx: 'auto',
      }}
    >
      {/* ── Success alert ──────────────────────────────────────────────── */}
      <Collapse in={Boolean(successId)}>
        <Alert
          icon={<CheckCircleIcon fontSize="small" />}
          severity="success"
          onClose={() => setSuccessId(null)}
          sx={{ mb: 2.5, borderRadius: '10px' }}
        >
          <strong>Submitted!</strong> Your expense report has been recorded.
          {successId && (
            <Box
              component="span"
              sx={{ ml: 1, fontSize: '0.75rem', color: 'success.dark', opacity: 0.8 }}
            >
              ID: <strong>{successId.slice(0, 20)}</strong>
            </Box>
          )}
        </Alert>
      </Collapse>

      {/* ── Storage error ──────────────────────────────────────────────── */}
      <Collapse in={Boolean(storageError)}>
        <Alert severity="error" onClose={() => setStorageError(null)} sx={{ mb: 2.5, borderRadius: '10px' }}>
          {storageError}
        </Alert>
      </Collapse>

      {/* ── Validation summary ─────────────────────────────────────────── */}
      <Collapse in={hasErrors}>
        <Alert
          icon={<WarningAmberIcon fontSize="small" />}
          severity="warning"
          sx={{ mb: 2.5, borderRadius: '10px' }}
        >
          Please fill in all required fields highlighted in red before submitting.
        </Alert>
      </Collapse>

      {/* ── Main card ──────────────────────────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          border: '1px solid #e2e8f0',
          borderRadius: '14px',
          overflow: 'hidden',
        }}
      >
        {/* ── Card header ────────────────────────────────────────────── */}
        <Box
          sx={{
            px: { xs: 2.5, sm: 3 },
            pt: 3,
            pb: 2.5,
            borderBottom: '1px solid #f1f5f9',
          }}
        >
          {/* Breadcrumb */}
          <Breadcrumbs sx={{ mb: 1.5 }}>
            <Link
              href="#"
              underline="hover"
              sx={{
                fontSize: '0.8125rem',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
              }}
            >
              <ReceiptLongIcon sx={{ fontSize: 15 }} />
              Expenses
            </Link>
            <Typography sx={{ fontSize: '0.8125rem', color: '#475569' }}>New Report</Typography>
          </Breadcrumbs>

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: { xs: 'flex-start', sm: 'flex-end' },
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2,
            }}
          >
            <Box>
              <Typography
                variant="h5"
                sx={{ fontWeight: 700, color: '#0f172a', mb: 0.5, lineHeight: 1.3 }}
              >
                Submit Expense Report
              </Typography>
              <Typography sx={{ color: '#64748b', fontSize: '0.875rem' }}>
                Bundle multiple transactions into a single submission for faster approval.
              </Typography>
            </Box>

            {/* Running total */}
            <Box
              sx={{
                textAlign: { xs: 'left', sm: 'right' },
                flexShrink: 0,
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                px: 2.5,
                py: 1.5,
              }}
            >
              <Typography
                sx={{
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#64748b',
                  mb: 0.25,
                }}
              >
                Total Amount
              </Typography>
              <Typography
                sx={{
                  fontSize: '1.75rem',
                  fontWeight: 800,
                  color: runningTotal > 0 ? '#0f172a' : '#94a3b8',
                  lineHeight: 1.1,
                  letterSpacing: '-0.01em',
                  transition: 'color 0.2s',
                }}
              >
                {fmt(runningTotal)}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* ── Form body ──────────────────────────────────────────────────── */}
        <Box sx={{ px: { xs: 2.5, sm: 3 }, pt: 3, pb: 3 }}>
          {/* Line items table */}
          <LineItemsTable
            items={lineItems}
            errors={errors}
            categories={settings.categories}
            maxItems={settings.maxItemsPerReport}
            onUpdate={handleUpdate}
            onAdd={handleAdd}
            onRemove={handleRemove}
          />

          {/* Receipts upload */}
          <Box sx={{ mt: 3.5 }}>
            <GlobalReceiptUpload files={globalFiles} onFilesChange={setGlobalFiles} />
          </Box>

          <Divider sx={{ mt: 3.5, mb: 2.5, borderColor: '#f1f5f9' }} />

          {/* ── Action bar ────────────────────────────────────────────── */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 2,
            }}
          >
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={billableToClient}
                  onChange={(e) => setBillableToClient(e.target.checked)}
                  sx={{
                    color: '#cbd5e1',
                    '&.Mui-checked': { color: '#10b981' },
                  }}
                />
              }
              label={
                <Typography sx={{ fontSize: '0.875rem', color: '#475569', userSelect: 'none' }}>
                  Flag as billable to client
                </Typography>
              }
            />

            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                startIcon={<PrintOutlinedIcon sx={{ fontSize: '16px !important' }} />}
                onClick={handlePrint}
                sx={{
                  borderColor: '#d1d5db',
                  color: '#374151',
                  px: 2.5,
                  py: 1,
                  fontSize: '0.875rem',
                  textTransform: 'none',
                  '&:hover': { borderColor: '#9ca3af', backgroundColor: '#f9fafb' },
                }}
              >
                Print PDF
              </Button>
              <Button
                variant="outlined"
                onClick={() => doSave(false)}
                sx={{
                  borderColor: '#d1d5db',
                  color: '#374151',
                  px: 2.5,
                  py: 1,
                  fontSize: '0.875rem',
                  '&:hover': { borderColor: '#9ca3af', backgroundColor: '#f9fafb' },
                }}
              >
                Save Draft
              </Button>
              <Button
                variant="contained"
                onClick={() => doSave(true)}
                startIcon={
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: '#4ade80',
                      flexShrink: 0,
                    }}
                  />
                }
                sx={{
                  backgroundColor: '#064e3b',
                  px: 2.5,
                  py: 1,
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  boxShadow: 'none',
                  '&:hover': {
                    backgroundColor: '#065f46',
                    boxShadow: '0 4px 12px rgba(6,78,59,0.3)',
                  },
                }}
              >
                Submit Report
              </Button>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* ── Policy reminder cards ─────────────────────────────────────── */}
      <Box sx={{ mt: 2.5 }}>
        <PolicyReminder />
      </Box>
    </Box>
  )
}
