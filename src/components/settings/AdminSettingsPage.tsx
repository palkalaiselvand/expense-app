import { useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'
import Tooltip from '@mui/material/Tooltip'
import Divider from '@mui/material/Divider'
import InputAdornment from '@mui/material/InputAdornment'
import Collapse from '@mui/material/Collapse'
import Alert from '@mui/material/Alert'
import AddIcon from '@mui/icons-material/Add'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff'
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar'
import RestaurantIcon from '@mui/icons-material/Restaurant'
import HotelIcon from '@mui/icons-material/Hotel'
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid'
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined'
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined'
import TuneIcon from '@mui/icons-material/Tune'
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { loadSettings, saveSettings } from '../../utils/settings'
import type { AppSettings, CategorySetting } from '../../types/settings'

// ── Color palette for new categories ─────────────────────────────────────────
const COLOR_PALETTE = [
  '#0ea5e9', '#8b5cf6', '#f59e0b', '#10b981',
  '#ec4899', '#f97316', '#06b6d4', '#84cc16',
]

function getCategoryIcon(key: string, label: string): React.ReactNode {
  const t = (key + ' ' + label).toLowerCase()
  if (t.includes('air') || t.includes('flight') || t.includes('plane'))
    return <FlightTakeoffIcon sx={{ fontSize: 16 }} />
  if (t.includes('car') || t.includes('drive') || t.includes('vehicle') || t.includes('mileage'))
    return <DirectionsCarIcon sx={{ fontSize: 16 }} />
  if (t.includes('food') || t.includes('meal') || t.includes('restaurant') || t.includes('dine'))
    return <RestaurantIcon sx={{ fontSize: 16 }} />
  if (t.includes('hotel') || t.includes('lodge') || t.includes('stay') || t.includes('accommodation'))
    return <HotelIcon sx={{ fontSize: 16 }} />
  if (t.includes('mobile') || t.includes('phone') || t.includes('cell'))
    return <PhoneAndroidIcon sx={{ fontSize: 16 }} />
  if (t.includes('supply') || t.includes('supplies') || t.includes('office'))
    return <ShoppingBagOutlinedIcon sx={{ fontSize: 16 }} />
  return <CategoryOutlinedIcon sx={{ fontSize: 16 }} />
}

function formatDate(iso?: string): string {
  if (!iso) return ''
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

// ── Component ─────────────────────────────────────────────────────────────────
export default function AdminSettingsPage() {
  const [draft, setDraft] = useState<AppSettings>(() => loadSettings())
  const [lastSaved, setLastSaved] = useState<AppSettings>(() => loadSettings())
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const [editLimit, setEditLimit] = useState('')
  const [editError, setEditError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)

  // ── Category editing ──────────────────────────────────────────────────────
  const startEdit = (cat: CategorySetting) => {
    setEditingKey(cat.key)
    setEditLabel(cat.label)
    setEditLimit(String(cat.limit))
    setEditError('')
  }

  const confirmEdit = () => {
    if (!editingKey) return
    if (!editLabel.trim()) {
      setEditError('Category name is required.')
      return
    }
    const num = parseFloat(editLimit)
    if (!Number.isFinite(num) || num < 0) {
      setEditError('Enter a valid non-negative limit.')
      return
    }
    setDraft((prev) => ({
      ...prev,
      categories: prev.categories.map((c) =>
        c.key === editingKey
          ? { ...c, label: editLabel.trim(), limit: Math.round(num * 100) / 100 }
          : c,
      ),
    }))
    setEditingKey(null)
    setEditError('')
  }

  const cancelEdit = () => {
    // Remove the row if it was a brand-new unsaved entry
    const isNew =
      draft.categories.find((c) => c.key === editingKey)?.label === '' &&
      draft.categories.find((c) => c.key === editingKey)?.limit === 0
    if (isNew) {
      setDraft((prev) => ({
        ...prev,
        categories: prev.categories.filter((c) => c.key !== editingKey),
      }))
    }
    setEditingKey(null)
    setEditError('')
  }

  const addCategory = () => {
    const newKey = `cat-${Date.now()}`
    const nextColor = COLOR_PALETTE[draft.categories.length % COLOR_PALETTE.length]
    setDraft((prev) => ({
      ...prev,
      categories: [
        ...prev.categories,
        { key: newKey, label: '', limit: 0, color: nextColor },
      ],
    }))
    setEditingKey(newKey)
    setEditLabel('')
    setEditLimit('0')
    setEditError('')
  }

  const deleteCategory = (key: string) => {
    if (draft.categories.length <= 1) return
    setDraft((prev) => ({
      ...prev,
      categories: prev.categories.filter((c) => c.key !== key),
    }))
    if (editingKey === key) setEditingKey(null)
  }

  // ── Save / cancel ─────────────────────────────────────────────────────────
  const handleSave = () => {
    // Auto-confirm any open edit row
    if (editingKey) {
      if (!editLabel.trim()) {
        setEditError('Finish editing the category name before saving.')
        return
      }
      confirmEdit()
    }
    const withTimestamp: AppSettings = { ...draft, lastEditedAt: new Date().toISOString() }
    saveSettings(withTimestamp)
    setDraft(withTimestamp)
    setLastSaved(withTimestamp)
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 3500)
  }

  const handleCancel = () => {
    setDraft(lastSaved)
    setEditingKey(null)
    setEditError('')
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1120, mx: 'auto' }}>
      {/* ── Page heading ───────────────────────────────────────────────── */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h5"
          sx={{ fontWeight: 700, color: '#0f172a', mb: 0.5, letterSpacing: '-0.01em' }}
        >
          Admin Settings
        </Typography>
        <Typography sx={{ color: '#64748b', fontSize: '0.875rem' }}>
          Manage global configurations for the FinCorp Expense Manager ecosystem.
        </Typography>
      </Box>

      {/* ── Success alert ──────────────────────────────────────────────── */}
      <Collapse in={saveSuccess}>
        <Alert
          icon={<CheckCircleIcon fontSize="small" />}
          severity="success"
          onClose={() => setSaveSuccess(false)}
          sx={{ mb: 2.5, borderRadius: '10px' }}
        >
          <strong>Settings saved.</strong> All expense forms will reflect these values immediately.
        </Alert>
      </Collapse>

      {/* ── Two-column layout ──────────────────────────────────────────── */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1fr 380px' },
          gap: 2.5,
          alignItems: 'start',
        }}
      >
        {/* ── LEFT: Expense Categories ──────────────────────────────────── */}
        <Paper
          elevation={0}
          sx={{ border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden' }}
        >
          {/* Header */}
          <Box
            sx={{
              px: 3,
              pt: 2.5,
              pb: 2,
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 2,
            }}
          >
            <Box>
              <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem' }}>
                Expense Categories
              </Typography>
              <Typography sx={{ fontSize: '0.8125rem', color: '#64748b', mt: 0.25 }}>
                Define active categories and their monthly spending limits.
              </Typography>
            </Box>
            <Button
              size="small"
              startIcon={<AddIcon sx={{ fontSize: '16px !important' }} />}
              onClick={addCategory}
              sx={{
                color: '#10b981',
                fontWeight: 600,
                fontSize: '0.8125rem',
                textTransform: 'none',
                flexShrink: 0,
                '&:hover': { backgroundColor: 'rgba(16,185,129,0.08)' },
              }}
            >
              Add New
            </Button>
          </Box>

          <Divider />

          {/* Validation error for open edit */}
          <Collapse in={Boolean(editError)}>
            <Alert severity="error" sx={{ mx: 2, my: 1, borderRadius: '8px', py: 0.5 }}>
              {editError}
            </Alert>
          </Collapse>

          {/* Categories table */}
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 52, pl: 3 }} />
                <TableCell>Category Name</TableCell>
                <TableCell>Cap Limit (USD)</TableCell>
                <TableCell sx={{ width: 130, pr: 2 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {draft.categories.map((cat) => {
                const isEditing = editingKey === cat.key
                return (
                  <TableRow
                    key={cat.key}
                    sx={{
                      '&:last-child td': { borderBottom: 'none' },
                      backgroundColor: isEditing ? 'rgba(16,185,129,0.03)' : 'transparent',
                      transition: 'background-color 0.15s',
                    }}
                  >
                    {/* Icon */}
                    <TableCell sx={{ pl: 3, py: '10px !important' }}>
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: '8px',
                          backgroundColor: cat.color + '1a',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: cat.color,
                          flexShrink: 0,
                        }}
                      >
                        {getCategoryIcon(cat.key, cat.label)}
                      </Box>
                    </TableCell>

                    {/* Name */}
                    <TableCell sx={{ py: '8px !important' }}>
                      {isEditing ? (
                        <TextField
                          size="small"
                          value={editLabel}
                          onChange={(e) => setEditLabel(e.target.value)}
                          placeholder="e.g. Travel – Air"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') confirmEdit()
                            if (e.key === 'Escape') cancelEdit()
                          }}
                          autoFocus
                          error={Boolean(editError && !editLabel.trim())}
                          sx={{ '& .MuiOutlinedInput-root': { fontSize: '0.875rem' } }}
                        />
                      ) : (
                        <Typography
                          sx={{
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            color: cat.label ? '#1e293b' : '#94a3b8',
                            fontStyle: cat.label ? 'normal' : 'italic',
                          }}
                        >
                          {cat.label || 'Unnamed'}
                        </Typography>
                      )}
                    </TableCell>

                    {/* Limit */}
                    <TableCell sx={{ py: '8px !important' }}>
                      {isEditing ? (
                        <TextField
                          size="small"
                          type="number"
                          value={editLimit}
                          onChange={(e) => setEditLimit(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') confirmEdit()
                            if (e.key === 'Escape') cancelEdit()
                          }}
                          inputProps={{ min: 0, step: '0.01' }}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Typography sx={{ color: '#64748b', fontSize: '0.875rem' }}>
                                  $
                                </Typography>
                              </InputAdornment>
                            ),
                          }}
                          sx={{
                            width: 150,
                            '& .MuiOutlinedInput-root': { fontSize: '0.875rem' },
                          }}
                        />
                      ) : (
                        <Typography sx={{ fontSize: '0.875rem', color: '#475569' }}>
                          {cat.limit.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </Typography>
                      )}
                    </TableCell>

                    {/* Actions */}
                    <TableCell sx={{ py: '8px !important', pr: 2 }}>
                      {isEditing ? (
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title="Save" placement="top" arrow>
                            <IconButton
                              size="small"
                              onClick={confirmEdit}
                              sx={{
                                color: '#10b981',
                                '&:hover': { backgroundColor: 'rgba(16,185,129,0.1)' },
                              }}
                            >
                              <CheckIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Cancel" placement="top" arrow>
                            <IconButton
                              size="small"
                              onClick={cancelEdit}
                              sx={{ color: '#94a3b8', '&:hover': { color: '#475569' } }}
                            >
                              <CloseIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                          <Button
                            size="small"
                            onClick={() => startEdit(cat)}
                            startIcon={<EditOutlinedIcon sx={{ fontSize: '14px !important' }} />}
                            sx={{
                              color: '#10b981',
                              fontWeight: 600,
                              textTransform: 'none',
                              fontSize: '0.8125rem',
                              minWidth: 0,
                              px: 1,
                              '&:hover': { backgroundColor: 'rgba(16,185,129,0.08)' },
                            }}
                          >
                            Edit
                          </Button>
                          <Tooltip
                            title={
                              draft.categories.length <= 1
                                ? 'At least one category is required'
                                : 'Delete category'
                            }
                            placement="top"
                            arrow
                          >
                            <span>
                              <IconButton
                                size="small"
                                onClick={() => deleteCategory(cat.key)}
                                disabled={draft.categories.length <= 1}
                                sx={{
                                  color: '#cbd5e1',
                                  '&:hover': {
                                    color: '#ef4444',
                                    backgroundColor: 'rgba(239,68,68,0.08)',
                                  },
                                  '&.Mui-disabled': { color: '#e2e8f0' },
                                }}
                              >
                                <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Box>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Paper>

        {/* ── RIGHT column ────────────────────────────────────────────────── */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* Submission Policies */}
          <Paper
            elevation={0}
            sx={{ border: '1px solid #e2e8f0', borderRadius: '14px', p: 2.5 }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 2.25 }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '8px',
                  backgroundColor: 'rgba(16,185,129,0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ScheduleOutlinedIcon sx={{ fontSize: 18, color: '#10b981' }} />
              </Box>
              <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9375rem' }}>
                Submission Policies
              </Typography>
            </Box>

            <Typography
              sx={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#64748b',
                mb: 1,
              }}
            >
              Submission Window
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <TextField
                size="small"
                type="number"
                value={draft.submissionWindowDays}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10)
                  if (Number.isFinite(val) && val > 0) {
                    setDraft((prev) => ({ ...prev, submissionWindowDays: val }))
                  }
                }}
                inputProps={{ min: 1, max: 730, 'aria-label': 'Submission window in days' }}
                sx={{ width: 90, '& .MuiOutlinedInput-root': { fontSize: '0.875rem' } }}
              />
              <Typography sx={{ color: '#475569', fontSize: '0.875rem', fontWeight: 500 }}>
                Days Back
              </Typography>
            </Box>

            <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8', mb: 2, lineHeight: 1.5 }}>
              Employees cannot submit expenses older than this window.
            </Typography>

            <Divider sx={{ mb: 2 }} />

            <FormControlLabel
              control={
                <Switch
                  checked={draft.allowLateSubmissions}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, allowLateSubmissions: e.target.checked }))
                  }
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': { color: '#10b981' },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: '#10b981',
                    },
                  }}
                />
              }
              label={
                <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: '#1e293b' }}>
                  Allow Late
                  <br />
                  Submission Requests
                </Typography>
              }
              labelPlacement="start"
              sx={{ ml: 0, width: '100%', justifyContent: 'space-between' }}
            />
          </Paper>

          {/* Report Constraints (dark card) */}
          <Paper
            elevation={0}
            sx={{
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              p: 2.5,
              color: '#ffffff',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 2.25 }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '8px',
                  backgroundColor: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <TuneIcon sx={{ fontSize: 18, color: '#ffffff' }} />
              </Box>
              <Typography sx={{ fontWeight: 700, color: '#ffffff', fontSize: '0.9375rem' }}>
                Report Constraints
              </Typography>
            </Box>

            {/* Max items */}
            <Typography
              sx={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#94a3b8',
                mb: 1,
              }}
            >
              Maximum Items Per Report
            </Typography>
            <TextField
              size="small"
              fullWidth
              type="number"
              value={draft.maxItemsPerReport}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10)
                if (Number.isFinite(val) && val > 0) {
                  setDraft((prev) => ({ ...prev, maxItemsPerReport: val }))
                }
              }}
              inputProps={{ min: 1, max: 200, 'aria-label': 'Maximum items per report' }}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  color: '#ffffff',
                  fontSize: '0.875rem',
                  backgroundColor: 'rgba(255,255,255,0.07)',
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.15)' },
                  '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                  '&.Mui-focused fieldset': { borderColor: '#10b981' },
                },
              }}
            />

            {/* Max amount */}
            <Typography
              sx={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#94a3b8',
                mb: 1,
              }}
            >
              Maximum Amount Per Report
            </Typography>
            <TextField
              size="small"
              fullWidth
              type="number"
              value={draft.maxAmountPerReport}
              onChange={(e) => {
                const val = parseFloat(e.target.value)
                if (Number.isFinite(val) && val > 0) {
                  setDraft((prev) => ({ ...prev, maxAmountPerReport: val }))
                }
              }}
              inputProps={{ min: 1, step: 100, 'aria-label': 'Maximum report amount in USD' }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Typography sx={{ color: '#94a3b8', fontSize: '0.875rem' }}>$</Typography>
                  </InputAdornment>
                ),
              }}
              sx={{
                mb: 2.5,
                '& .MuiOutlinedInput-root': {
                  color: '#ffffff',
                  fontSize: '0.875rem',
                  backgroundColor: 'rgba(255,255,255,0.07)',
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.15)' },
                  '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                  '&.Mui-focused fieldset': { borderColor: '#10b981' },
                },
                '& .MuiInputAdornment-root p': { color: '#94a3b8' },
              }}
            />

            <Box
              sx={{
                backgroundColor: 'rgba(16,185,129,0.12)',
                borderRadius: '8px',
                p: 1.5,
              }}
            >
              <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.6 }}>
                System-wide limits applied to all corporate users. Changes will trigger
                a notification to team leads.
              </Typography>
            </Box>
          </Paper>
        </Box>
      </Box>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <Box
        sx={{
          mt: 3,
          pt: 2.5,
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Typography sx={{ fontSize: '0.8125rem', color: '#94a3b8' }}>
          {lastSaved.lastEditedAt
            ? `\u00a9 Last edited by Admin on ${formatDate(lastSaved.lastEditedAt)}`
            : '\u00a9 No configuration saved yet'}
        </Typography>

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="outlined"
            onClick={handleCancel}
            sx={{
              borderColor: '#d1d5db',
              color: '#374151',
              px: 2.5,
              py: 1,
              fontSize: '0.875rem',
              '&:hover': { borderColor: '#9ca3af', backgroundColor: '#f9fafb' },
            }}
          >
            Cancel Changes
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
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
            Save All Configurations
          </Button>
        </Box>
      </Box>
    </Box>
  )
}
