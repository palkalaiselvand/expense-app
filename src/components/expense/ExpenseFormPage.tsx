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

  // ── print to PDF ───────────────────────────────────────────────────────────
  const handlePrint = useCallback(() => {
    const rows = lineItems.map((item) => {
      const amount = parseFloat(item.amount)
      return `<tr>
        <td>${item.date || '—'}</td>
        <td>${item.category || '—'}</td>
        <td>${item.merchant || '—'}</td>
        <td>${item.description || '—'}</td>
        <td style="text-align:right">${Number.isFinite(amount) ? fmt(amount) : '—'}</td>
      </tr>`
    }).join('')
    const html = `<!DOCTYPE html><html><head><title>Expense Report</title>
<style>body{font-family:Arial,sans-serif;margin:32px;color:#333}
h1{font-size:1.25rem;color:#0f172a;margin-bottom:4px}
.meta{color:#64748b;font-size:13px;margin-bottom:20px}
table{width:100%;border-collapse:collapse;margin-top:16px}
th,td{padding:9px 12px;border:1px solid #e2e8f0;font-size:13px;text-align:left}
th{background:#f8fafc;font-weight:700;color:#475569}
tfoot td{font-weight:700;color:#0f172a}
.footer{margin-top:28px;font-size:11px;color:#94a3b8}
@media print{body{margin:0}}</style></head><body>
<h1>Expense Report</h1>
<p class="meta">Date: ${new Date().toLocaleDateString('en-US', { dateStyle: 'long' })}${
  billableToClient ? ' &nbsp;●&nbsp; <strong>Client Billable</strong>' : ''}
</p>
<table>
<thead><tr><th>Date</th><th>Category</th><th>Merchant</th><th>Description</th><th style="text-align:right">Amount</th></tr></thead>
<tbody>${rows}</tbody>
<tfoot><tr><td colspan="4" style="text-align:right">Total</td><td style="text-align:right">${fmt(runningTotal)}</td></tr></tfoot>
</table>
<p class="footer">Generated by FincOrp Expense Manager</p>
</body></html>`
    const w = window.open('', '_blank')
    if (w) { w.document.write(html); w.document.close(); w.print() }
  }, [lineItems, billableToClient, runningTotal, fmt])

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
